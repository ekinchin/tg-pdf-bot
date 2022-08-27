import amqplib from 'amqplib';
import { htmlToPdf } from '../lib/html-to-pdf/index.js';
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
      exchange: 'html.converter.request',
      type: 'topic',
    },
    publisherOptions: {
      exchange: 'result',
      type: 'topic',
      pattern: 'pdf.output.result',
    },
    errorOptions: {
      exchange: 'errors',
      type: 'topic',
      pattern: 'html.converter.error',
    },
  });
  await worker.register({
    name: 'converter',
    pattern: 'html.converter.request',
    handler: async (message) => {
      console.log('converter: ' + message.content.toString());
      const pdf = await htmlToPdf(message.content.toString(), './');
      return {
        data: pdf,
      };
    },
  });
}

export default bootstrap;
