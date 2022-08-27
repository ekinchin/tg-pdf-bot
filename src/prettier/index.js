import amqplib from 'amqplib';
import {readability} from '../lib/readability/index.js';
import { WorkerBase } from '../lib/worker-base/index.js';

async function bootstrap() {
  const worker = new WorkerBase({
    conection: await amqplib.connect({
      hostname: 'localhost',
      port: 5671,
      vhost: 'exporter',
      username: 'exporter-admin',
      password: 'exporter',
    }),
  });
  await worker.assert({
    consumerOptions: {
      exchange: 'html.prettier.request',
      type: 'topic'
    },
    publisherOptions: {
      exchange: 'html.converter.request',
      type: 'topic',
      pattern: 'html.converter.request'
    },
    errorOptions: {
      exchange: 'errors',
      type: 'topic',
      pattern: 'html.prettier.error'
    }
  });
  await worker.register({
    name: 'prettier', pattern: 'html.prettier.request', handler: async (message) => {
      const prettier = readability(message.content.toString());
      console.log('prettier: ' + prettier);
      return {
        data: prettier
      }
    }
  });
}

export default bootstrap
