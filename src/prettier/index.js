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
      exchange: 'html.loader.request',
      type: 'topic'
    }
  });
  await worker.register({name: 'prettier', pattern:'worker', handler: (message) => console.log('prettier')});
}

export default bootstrap
