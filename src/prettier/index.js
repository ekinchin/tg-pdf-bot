import amqplib from 'amqplib';
import { readability } from '../lib/readability/index.js';
import { WorkerBase } from '../lib/worker-base/index.js';
import { pipeline } from '../pipeline/index.js';

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
      exchange: 'prettier',
      type: 'topic',
    },
    publisherOptions: {
      exchange: 'converter',
      type: 'topic',
      pattern: pipeline.converter,
    },
    errorOptions: {
      exchange: 'errors',
      type: 'topic',
      pattern: 'html.prettier.error',
    },
  });
  await worker.register({
    name: 'prettier',
    pattern: pipeline.prettier,
    handler: async (message) => {
      const prettier = readability(message.content.toString());
      if (!prettier?.content) throw new Error('Cannot get readability view');
      return {
        data: prettier?.content,
      };
    },
  });
}

export default bootstrap;
