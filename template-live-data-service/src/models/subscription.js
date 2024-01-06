import Promise from 'bluebird';

class Model {
  constructor(
    debug,
    sqs,
    sns,
    claims,
    partition = process.env.AWS_PARTITION,
    account = process.env.AWS_ACCOUNT_NUMBER,
    region = process.env.AWS_REGION,
    stage = process.env.STAGE,
    topic = process.env.TOPIC_ARN,
  ) {
    this.debug = debug;
    this.sqs = sqs;
    this.sns = sns;
    this.claims = claims;

    this.partition = partition;
    this.account = account;
    this.region = region;
    this.stage = stage;

    this.topic = topic;
    this.queueUrl = `https://sqs.${this.region}.amazonaws.com/${this.account}/lvd-${this.stage}-${this.claims.sub}`;
    this.queueArn = `arn:${this.partition}:sqs:${this.region}:${this.account}:lvd-${this.stage}-${this.claims.sub}`;
  }

  subscribe({ FilterPolicy }) {
    return this.sqs.createQueue({
      QueueName: `lvd-${this.stage}-${this.claims.sub}`,
      Attributes: {
        MessageRetentionPeriod: `${60 * 60 * 2}`, // 2 hours
        Policy: JSON.stringify({
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'sns.amazonaws.com',
              },
              Action: 'sqs:SendMessage',
              Resource: this.queueArn,
              Condition: {
                ArnEquals: {
                  'aws:SourceArn': this.topic,
                },
              },
            },
          ],
        }),
      },
    })
      .then(() => this.sns.subscribe({
        Protocol: 'sqs',
        TopicArn: this.topic,
        Endpoint: this.queueArn,
        ReturnSubscriptionArn: true,
        Attributes: {
          RawMessageDelivery: 'true',
          FilterPolicyScope: FilterPolicy ? 'MessageBody' : /* istanbul ignore next */ undefined,
          FilterPolicy: FilterPolicy ? JSON.stringify(FilterPolicy) :/* istanbul ignore next */ undefined,
        },
      }));
  }

  unsubscribe({ SubscriptionArn }) {
    // we can also clean up subscriptions based on the age of messages in queues
    return this.sns.unsubscribe({
      SubscriptionArn,
    })
      // we could remove queues periodically if they have been empty for a long time
      .then(() => this.sqs.deleteQueue({
        QueueUrl: this.queueUrl,
      }));
  }

  // TODO replace with straight apig to sqs
  // but may need to split out ack and control on client side
  longPoll({ ack }) {
    // TODO in parallel ???
    return (ack.length
      ? this.sqs.deleteMessageBatch({
        QueueUrl: this.queueUrl,
        Entries: ack,
      })
      : /* istanbul ignore next */ Promise.resolve())
      .then(() => this.sqs.receiveMessage({
        QueueUrl: this.queueUrl,
        WaitTimeSeconds: 20, // long poll
        // VisibilityTimeout: 5,
      }))
      .then((data) => ({
        // we will return this as the next ack
        messages: data.Messages.map((m) => ({
          Id: m.MessageId,
          ReceiptHandle: m.ReceiptHandle,
        })),
        data: data.Messages.map((m) => JSON.parse(m.Body)),
      }));
  }
}

export default Model;
