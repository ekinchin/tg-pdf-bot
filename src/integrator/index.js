import amqplib from 'amqplib';
import { WorkerBase } from '../lib/worker-base/index.js';
import { pipeline } from '../pipeline/index.js';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

async function bootstrap() {
  const worker = new WorkerBase({
    connection: await amqplib.connect({
      hostname: 'localhost',
      port: 5671,
      vhost: 'exporter',
      username: 'exporter-admin',
      password: 'exporter',
    }),
  });
  await worker.assert({
    consumerOptions: {
      exchange: 'result',
      type: 'topic',
    },
    publisherOptions: {
      exchange: 'integrator',
      type: 'topic',
      pattern: 'integrator.result',
    },
    errorOptions: {
      exchange: 'errors',
      type: 'topic',
      pattern: 'integrator.error',
    },
  });
  await worker.register({
    name: 'integrator-worker',
    pattern: pipeline.result,
    handler: async (message) => {
      console.log(message.content);
      writeFile(`${randomUUID()}.pdf`, message.content);
      return { data: message.content };
    },
  });

  const error = new WorkerBase({
    connection: await amqplib.connect({
      hostname: 'localhost',
      port: 5671,
      vhost: 'exporter',
      username: 'exporter-admin',
      password: 'exporter',
    }),
  });
  await error.assert({
    consumerOptions: {
      exchange: 'errors',
      type: 'topic',
    },
    publisherOptions: {
      exchange: 'integrator',
      type: 'topic',
      pattern: 'integrator.result',
    },
    errorOptions: {
      exchange: 'errors',
      type: 'topic',
      pattern: 'integrator.error',
    },
  });
  await error.register({
    name: 'integrator-errors',
    pattern: 'html.*.error',
    handler: async (message) => {
      return { data: message.content };
    },
  });
}

export default bootstrap;
