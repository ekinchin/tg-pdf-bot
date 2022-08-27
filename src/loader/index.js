import amqplib from 'amqplib';
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
      exchange: 'html.loader.request',
      type: 'topic'
    },
    publisherOptions: {
      exchange: 'html.prettier.request',
      type: 'topic',
      pattern: 'html.prettier.request'
    },
    errorOptions: {
      exchange: 'errors',
      type: 'topic',
      pattern: 'html.loader.error'
    }
  });
  await worker.register({
    name: 'loader', pattern: 'html.loader.request', handler: async (message) => {
      console.log('loader: ' + message.content.toString());
      return { data: message.content }
    }
  });
}

export default bootstrap
