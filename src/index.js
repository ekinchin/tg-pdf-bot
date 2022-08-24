import { saveBuffer, htmlToPdf, readability } from './exporter/index.js';
import { source } from './source.js';

const exp = async () => {
  const compact = readability(source);
  if (!compact) throw new Error('');
  const buf = await htmlToPdf(compact.content, './');
  await saveBuffer(buf, './');
};

exp();
