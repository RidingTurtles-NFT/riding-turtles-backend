import { MetaData } from "../interfaces/meta-data";
import AWS from "aws-sdk";
import log from "loglevel";

let s3: AWS.S3 | null = null;

export function getS3Singleton(): AWS.S3 {
  if (!s3) {
    log.info('set up s3 client instance');

    s3 = new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    });
  }
  return s3;
}

export async function uploadMetaDataToBucket(tokenId: number, metaData: MetaData): Promise<AWS.S3.PutObjectOutput> {
  const s3Singleton = getS3Singleton();

  const result = await s3Singleton.putObject({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    ContentType: "application/json",
    Key: tokenId.toString(),
    Body: JSON.stringify(metaData),
  }).promise()
    .catch(err => {
      log.error(`error while uploading meta data for token id ${tokenId} to s3`, err);
      throw err;
    });

  log.info(`uploaded meta data for token id ${tokenId} to s3`);

  return result;
}