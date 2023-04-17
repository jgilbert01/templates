const _ = require('highland');
const aws = require('aws-sdk')
aws.config.setPromisesDependency(require('bluebird'));

const client = new aws.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-west-2',
  httpOptions: { timeout: 1000 },
  logger: console,
});
const table = `template-bff-service-${process.env.STAGE || 'stg'}-entities`;

const main = () => {
  const data = require('./things.json');

  _(data)
    .map(save)
    .parallel(4)
    .each(console.log);
};

const save = ({ pk, discriminator, ...rec }) => {
  const params = {
    TableName: table,
    Item: {
      pk,
      sk: discriminator,
      discriminator,
      ...rec,
      timestamp: Date.now(),
      lastModifiedBy: 'system',
      awsregion: process.env.AWS_REGION || 'us-west-2',
    }
  };

  return _(client.put(params).promise());
};

main();
