import 'mocha';
import { expect } from 'chai';

const supertest = require('supertest');

const endpoint = process.env.ENDPOINT ? process.env.ENDPOINT : 'http://localhost:3001';
const client = supertest(endpoint);

describe('rest/index.js', () => {
  it('should check', () => client.get('/check')
    .set('x-api-key', 'test-int-api-key-123456')
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      // expect(JSON.parse(res.text)).to.deep.equal({
      //   id: '00000000-0000-0000-0000-000000000000',
      //   lastModifiedBy: 'offlineContext_authorizer_principalId',
      //   timestamp: 1653877763001,
      //   ...THING,
      // });
    }));
});
