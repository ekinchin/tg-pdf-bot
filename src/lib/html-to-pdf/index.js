import pdf from 'html-pdf';

const htmlToPdf = async (html, assets) => new Promise((resolve, reject) => {
  if (!html || !assets) reject(new Error('html or assets path not provided'));
  pdf
    .create(html, {
      base: assets,
    })
    .toBuffer((err, buffer) => {
      if (err) {
        reject(err);
      }
      resolve(buffer);
    });
});

export default { htmlToPdf };
