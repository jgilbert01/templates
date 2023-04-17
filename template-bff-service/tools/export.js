const _ = require('highland');
const aws = require('aws-sdk')
aws.config.setPromisesDependency(require('bluebird'));

const main = () => {
  console.log('[');

  listEntities()
    // .filter(data => data.sk === 'subject')
    .each(collected => console.log(JSON.stringify(collected), ','))
    .done(() => console.log(']'));

};

const listEntities = () => {
  const client = new aws.DynamoDB.DocumentClient({
    region: 'us-west-2',
    httpOptions: { timeout: 1000 },
    // logger: console,
  });

  let marker = undefined;

  return _((push, next) => {
    const params = {
      TableName: 'template-bff-service-stg-entities',
      ExclusiveStartKey: marker
    };

    client.scan(params).promise()
      .then(data => {
        if (data.LastEvaluatedKey) {
          marker = data.LastEvaluatedKey;;
        } else {
          marker = undefined;
        }

        data.Items.forEach(obj => {
          push(null, obj);
        })
      })
      .catch(err => {
        push(err, null);
      })
      .finally(() => {
        if (marker) {
          next();
        } else {
          push(null, _.nil);
        }
      })
  });
};

main();