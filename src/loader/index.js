import { connect } from 'amqplib';
import { WorkerBase } from '../lib/worker-base/index.js';
import { pipeline } from '../pipeline/index.js';

async function bootstrap() {
  const worker = new WorkerBase({
    connection: await connect({
      hostname: 'localhost',
      port: 5671,
      vhost: 'exporter',
      username: 'exporter-admin',
      password: 'exporter',
    }),
  });
  await worker.assert({
    consumerOptions: {
      exchange: 'loader',
      type: 'topic',
    },
    publisherOptions: {
      exchange: 'prettier',
      type: 'topic',
      pattern: pipeline.prettier,
    },
    errorOptions: {
      exchange: 'errors',
      type: 'topic',
      pattern: 'html.loader.error',
    },
  });
  await worker.register({
    name: 'loader',
    pattern: pipeline.loader,
    handler: async (message) => {
      const response = await fetch(message.content.toString());
      if (response.ok) {
        const html = await response.text();
        return { data: html };
      }
      throw new Error(response.statusText);
    },
  });
}

export default bootstrap;
