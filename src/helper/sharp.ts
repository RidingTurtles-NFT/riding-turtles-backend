import log from 'loglevel';
import Sharp from 'sharp';

export async function composeImages(compositionImages: Buffer[]): Promise<Buffer> {
  log.info('compose images');

  const imagesToCompose = compositionImages.map(buffer => ({ input: buffer }));

  return Sharp(imagesToCompose[0].input).composite(imagesToCompose.slice(1)).toBuffer();
}
