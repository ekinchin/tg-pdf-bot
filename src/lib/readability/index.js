import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

const readability = (html) => {
  const doc = new JSDOM(html);
  const reader = new Readability(doc.window.document, { keepClasses: true });
  return reader.parse();
};

export default { readability };
