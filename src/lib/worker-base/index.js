// @ts-check

import Logger from '../logger/index.js';

/**
 * @type {import("./index").WorkerBase}
 */
export class WorkerBase {
  #connection;

  /**
   * @type {import('amqplib').Channel | undefined}
   */
  #publisherCh

    /**
   * @type {import('amqplib').Channel | undefined}
   */
  #consumerCh

    /**
   * @type {Map<string, string>}
   */
  #registers = new Map();

  /**
   * type {string}
   */
  #publisherExchange = ''

    /**
   * type {string}
   */
  #consumerExchange = ''

  /**
   * @param {import('./index').WorkerBaseOptions} options
   */
  constructor({ conection }) {
    this.#connection = conection;
  }

  /**
   * @param {import('./index').AssertOptions} options
   * @returns {Promise<void>}
   */
  async assert({ consumerOptions, publisherOptions }) {
    Logger.log({message:`assert`})
    const publisherCh = await this.#connection.createChannel()
    await publisherCh.assertExchange(publisherOptions.exchange, publisherOptions.type)
    this.#publisherCh = publisherCh;
    this.#publisherExchange = publisherOptions.exchange

    const consumerCh = await this.#connection.createChannel();
    await consumerCh.assertExchange(consumerOptions.exchange, consumerOptions.type)
    this.#consumerCh = consumerCh;
    this.#consumerExchange = consumerOptions.exchange
  }

    /**
   * @param {import('./index').RegisterOptions} options
   * @returns {Promise<void>}
   */
  async register({ handler, name, pattern }) {
    Logger.log({message:`register ${name}`})
    if (this.#registers.has(name)) {
      throw new Error(`Already registered handler name: ${name}`);
    }
    if (!this.#consumerCh || !this.#publisherCh) {
      throw new Error('Consumer and/or publisher not asserted')
    }
    const queue = await this.#consumerCh?.assertQueue(name, {durable: true})
    await this.#consumerCh?.bindQueue(queue.queue, this.#consumerExchange , pattern)
    this.#consumerCh.consume(queue.queue, async (message) => {
      Logger.log({message:`consume ${name}`})
      if(!message) return
      try {
        const result = await handler(message);
        this.#consumerCh?.ack(message);
      } catch (error) {
        if(error instanceof Error) Logger.log({message: error?.message})
      }
    })

  }

  async detach() {
    this.#connection.close();
  }
}
