// @ts-check

import Logger from '../logger/index.js';
import { Buffer } from 'buffer';

/**
 * @typedef {import('./index').IWorkerBase} IWorkerBase
 * @implements {IWorkerBase}
 */
export class WorkerBase {
  #connection;

  /**
   * @type {import('amqplib').Channel | undefined}
   */
  #publisherCh;

  /**
   * @type {import('amqplib').Channel | undefined}
   */
  #consumerCh;

  /**
   * @type {import('amqplib').Channel | undefined}
   */
  #errorCh;

  /**
   * type {string}
   */
  #consumerExchange = '';

  /**
   * @type {Map<string, string>}
   */
  #registers = new Map();

  /**
   * type {string}
   */
  #publisherExchange = '';

  /**
   * type {string}
   */
  #publisherRoutingKey = '';

  /**
   * type {string}
   */
  #errorExchange = '';

  /**
   * type {string}
   */
  #errorRoutingKey = '';

  /**
   * @constructor
   * @param {import('./index').WorkerBaseOptions} options
   */
  constructor({ connection }) {
    this.#connection = connection;
  }

  /**
   * @param {Parameters<import('./index').IWorkerBase['assert']>[0]} options
   * @returns {Promise<void>}
   */
  async assert({ consumerOptions, publisherOptions, errorOptions }) {
    Logger.log({
      message: `assert consumer: ${consumerOptions.exchange}, publisher: ${publisherOptions.exchange}`,
    });
    const publisherCh = await this.#connection.createChannel();
    await publisherCh.assertExchange(
      publisherOptions.exchange,
      publisherOptions.type
    );
    this.#publisherCh = publisherCh;
    this.#publisherExchange = publisherOptions.exchange;
    this.#publisherRoutingKey = publisherOptions.pattern;

    const consumerCh = await this.#connection.createChannel();
    await consumerCh.assertExchange(
      consumerOptions.exchange,
      consumerOptions.type
    );
    this.#consumerCh = consumerCh;
    this.#consumerExchange = consumerOptions.exchange;

    const errorCh = await this.#connection.createChannel();
    await errorCh.assertExchange(errorOptions.exchange, errorOptions.type);
    this.#errorCh = errorCh;
    this.#errorExchange = errorOptions.exchange;
    this.#errorRoutingKey = errorOptions.pattern;
  }

  /**
   * @param {Parameters<import('./index').IWorkerBase['register']>[0]} options
   * @returns {Promise<void>}
   */
  async register({ handler, name, pattern }) {
    Logger.log({ message: `register name: ${name}, pattern: ${pattern}` });
    if (this.#registers.has(name)) {
      throw new Error(`Already registered handler name: ${name}`);
    }
    this.#registers.set(name, name);

    if (!this.#consumerCh || !this.#publisherCh) {
      throw new Error('Consumer and/or publisher not asserted');
    }

    const queue = await this.#consumerCh?.assertQueue(name, { durable: true });
    await this.#consumerCh?.bindQueue(
      queue.queue,
      this.#consumerExchange,
      pattern
    );

    await this.#consumerCh.consume(queue.queue, async (message) => {
      Logger.log({ message: `consume ${handler.name}` });
      if (!message) return;
      try {
        const result = await handler(message);
        const data =
          result.data instanceof Buffer
            ? result.data
            : Buffer.from(result.data);
        this.#publisherCh?.publish(
          this.#publisherExchange,
          this.#publisherRoutingKey,
          data,
          { correlationId: message.properties.correlationId }
        );
        this.#consumerCh?.ack(message);
      } catch (error) {
        const errMessage =
          error instanceof Error ? error.message : JSON.stringify(error);
        if (error instanceof Error) Logger.log({ message: errMessage });
        this.#errorCh?.publish(
          this.#errorExchange,
          this.#errorRoutingKey,
          Buffer.from(errMessage),
          { correlationId: message.properties.correlationId }
        );
        this.#consumerCh?.ack(message);
      }
    });
  }
}
