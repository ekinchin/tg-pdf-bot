import type { Connection, ConsumeMessage } from 'amqplib'

export type QueueOptions = {
  exchange: string;
  type: "topic" | "direct" | "fanout";
};

export type ConsumerOptions = {};

export type PublisherOptions = {
  pattern: string;
};

export type ConsumerQueueOptions = QueueOptions & ConsumerOptions;
export type PublisherQueueOptions = QueueOptions & PublisherOptions;

export type WorkerBaseOptions = {
  conection: Connection;
};

export type AssertOptions = {
  consumerOptions: ConsumerQueueOptions,
  publisherOptions: PublisherQueueOptions,
  errorOptions: PublisherQueueOptions
}


export type WorkerResult = {
  data: Buffer | string;
  error?: Error;
};

export type RegisterOptions = {
  name: string;
  pattern: string;
  handler: (msg: ConsumeMessage) => Promise<WorkerResult>;
};

export class WorkerBase {
  constructor({ conection }: {
    conection: Bluebird<amqp.Connection>;
  });
  assert(options:AssertOptions): Promise<void>;
  register(registerOptions: RegisterOptions): Promise<void>;
}
