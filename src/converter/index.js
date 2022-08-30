import amqplib from 'amqplib';
import { htmlToPdf } from '../lib/html-to-pdf/index.js';
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
      exchange: 'converter',
      type: 'topic',
    },
    publisherOptions: {
      exchange: 'result',
      type: 'topic',
      pattern: pipeline.result,
    },
    errorOptions: {
      exchange: 'errors',
      type: 'topic',
      pattern: 'html.converter.error',
    },
  });
  await worker.register({
    name: 'converter',
    pattern: pipeline.converter,
    handler: async (message) => {
      const html = message.content.toString();
      const pdf = await htmlToPdf(html, './');
      return {
        data: pdf,
      };
    },
  });
}

export default bootstrap;
