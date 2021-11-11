import log from "loglevel";
import AWS from "aws-sdk";
import { StateTableEntry } from "../interfaces/state-table-entry";

let dynamoDb: AWS.DynamoDB.DocumentClient | null = null;

function getDynamoDbSingleton(): AWS.DynamoDB.DocumentClient {
  if (!dynamoDb) {
    log.info('set up dynamo db client instance');

    dynamoDb = new AWS.DynamoDB.DocumentClient({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    });
  }
  return dynamoDb;
}

export async function addStateTableEntry(stateTableEntry: StateTableEntry): Promise<AWS.DynamoDB.DocumentClient.PutItemOutput> {
  const dynamoDbSingleton = getDynamoDbSingleton();

  const result = await dynamoDbSingleton.put({
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: stateTableEntry,
  }).promise()
    .catch(err => {
      log.error(`error while saving state table entry for token id ${stateTableEntry.tokenId}`, err);
      throw err;
    });

  log.info(`saved state table entry for token id ${stateTableEntry.tokenId}`);

  return result;
}

export async function getAllStateTableEntries(): Promise<StateTableEntry[]> {
  const dynamoDbSingleton = getDynamoDbSingleton();
  let res: StateTableEntry[] = [];
  let lastEvaluatedKey;
  let goOnScanning = true;
  let loops = 0;

  while(goOnScanning) {
    loops ++;
    const result = await dynamoDbSingleton.scan({
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      ExclusiveStartKey: lastEvaluatedKey,
    }).promise()
      .catch(err => {
        log.error('error while getting all state table entries', err);
        throw err;
      });
    res.push(...result.Items as StateTableEntry[])
    goOnScanning = typeof result.LastEvaluatedKey !== "undefined"
    lastEvaluatedKey = result.LastEvaluatedKey;
  }
  log.info(`received all state table entries, needed ${loops} scan operations`);
  return res;
}
