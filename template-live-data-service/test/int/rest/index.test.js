import 'mocha';
import { expect } from 'chai';
import debug from 'debug';

import { SnsConnector } from 'aws-lambda-stream';

const supertest = require('supertest');

const endpoint = process.env.ENDPOINT ? process.env.ENDPOINT : 'http://localhost:3001';
const client = supertest(endpoint);

describe('rest/index.js', () => {
  it('should subscribe', () => client.put('/subscriptions')
    .set('Authorization', 'sub1') // TODO JWT
    .send({
      FilterPolicy: {
        tags: {
          source: ['template-task-service'],
        },
      },
    })
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        ResponseMetadata: {
          RequestId: '50fd9e93-fc64-5934-9f86-c3fea5b2e0a5',
        },
        SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:334b60e8-4ccc-4080-af78-9d92588c5761',
      });
    }));

  // not being recorded currently
  it.skip('should publish', async () => {
    const connector = new SnsConnector({
      debug: debug('handler'),
      topicArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg',
    });

    const data = await connector.publish({
      Message: JSON.stringify({
        id: '1',
        type: 'task-updated',
        tags: {
          source: 'template-task-service',
        },
        raw: {
          new: {
            id: '1',
            type: 't0',
            status: 's1',
            timestamp: 1693236475001,
          },
        },
      }),
    });

    expect(data).to.deep.equal({
      MessageId: 'f4d7e67b-1bbd-5310-af57-bb17d4c55c5b',
      ResponseMetadata: { RequestId: 'b5d368f6-1d56-5c6a-98b6-359ad22ee321' },
    });
  });

  it('should long poll', () => client.post('/events')
    .set('Authorization', 'sub1') // TODO JWT
    .send({
      ack: [{
        Id: 'e9fd559d-ca23-4515-b24a-4adf471799f1',
        ReceiptHandle: 'AQEBvi77N8ma7KK8ad+oJZeyPeVmZTo8/5nTUEOk5KoJGloQFZwYaREST9w8pC2syAxi/6GL1T6wdhjq+2gHKhVnTkz6m54qS7sZoSqkoqhpkJj4s1kNLyqztaGYzf7eE1cmDOTWukYiJ/Tz1F5m00iDBH3wPG4pR1OQcBpDFp/UTAy8xGnX5yx9rGZ2HNk2d+myRhFQh0TE0uazP5XSBJAdnpid/XuibpuMso1LVGnOxbNh+8uivX6SqsWGGT/Kndx8z3JwdOjLxv18VdvjGWe4s8K5IXo4eZYlm/+kUhMlQRzd7Te8zXIKC1P/YM2Cal4uJ9gurtAYk7gu17Puq4iQqxBS1FB8UHChzbQ/j7E9A+hurDi+RU3Z40vmC4p9+6m3tuKY8/3sLCvea8D+gSygNQ==',
      }],
    })
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        data: [
          {
            id: '1',
            type: 'task-updated',
            tags: {
              source: 'template-task-service',
            },
            raw: {
              new: {
                id: '1',
                type: 't0',
                status: 's1',
                timestamp: 1693236475001,
              },
            },
          },
        ],
        messages: [
          {
            Id: 'e9fd559d-ca23-4515-b24a-4adf471799f1',
            ReceiptHandle: 'AQEBvi77N8ma7KK8ad+oJZeyPeVmZTo8/5nTUEOk5KoJGloQFZwYaREST9w8pC2syAxi/6GL1T6wdhjq+2gHKhVnTkz6m54qS7sZoSqkoqhpkJj4s1kNLyqztaGYzf7eE1cmDOTWukYiJ/Tz1F5m00iDBH3wPG4pR1OQcBpDFp/UTAy8xGnX5yx9rGZ2HNk2d+myRhFQh0TE0uazP5XSBJAdnpid/XuibpuMso1LVGnOxbNh+8uivX6SqsWGGT/Kndx8z3JwdOjLxv18VdvjGWe4s8K5IXo4eZYlm/+kUhMlQRzd7Te8zXIKC1P/YM2Cal4uJ9gurtAYk7gu17Puq4iQqxBS1FB8UHChzbQ/j7E9A+hurDi+RU3Z40vmC4p9+6m3tuKY8/3sLCvea8D+gSygNQ==',
          },
        ],
      });
    })).timeout(22000);

  it('should unsubscribe', () => client.delete('/subscriptions')
    .set('Authorization', 'sub1') // TODO JWT
    .send({
      SubscriptionArn: 'arn:aws:sns:us-west-2:123456789012:template-live-data-service-stg:a21b9690-7190-5b0b-860e-cbfd3cdb5567',
    })
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        ResponseMetadata: {
          RequestId: 'a6924889-88c3-5f98-a1fc-15e558bd9bcd',
        },
      });
    }));
});
