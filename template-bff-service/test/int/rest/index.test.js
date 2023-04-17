import 'mocha';
import { expect } from 'chai';

const supertest = require('supertest');

const endpoint = process.env.ENDPOINT ? process.env.ENDPOINT : 'http://localhost:3001';
const client = supertest(endpoint);

const THING = {
  name: 'thing0',
  description: 'This is thing zero.',
};

describe('rest/index.js', () => {
  it('should save', () => client.put('/things/00000000-0000-0000-0000-000000000000')
    .send(THING)
    // .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({});
    }));

  it('should get', () => client.get('/things/00000000-0000-0000-0000-000000000000')
    // .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        id: '00000000-0000-0000-0000-000000000000',
        lastModifiedBy: 'offlineContext_authorizer_principalId',
        timestamp: 1653877763001,
        ...THING,
      });
    }));

  it('should query', () => client.get('/things')
    // .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        data: [{
          id: '00000000-0000-0000-0000-000000000000',
          lastModifiedBy: 'offlineContext_authorizer_principalId',
          timestamp: 1653877763001,
          ...THING,
        }],
      });
    }));

  it('should delete', () => client.delete('/things/00000000-0000-0000-0000-000000000000')
    // .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({});
    }));
});

const JWT = 'eyJraWQiOiJtM1AxMERWOThoMzJMK2poQW8zQjhRVU1vMlAwXC82c1lUQXUxRUhFNHRIaz0iLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiY2ZhY2I5MmdzTHZfbDEwMTdCdUxkZyIsInN1YiI6ImY1MGU4MjFmLTMzMjctNGFhYy05Mjk4LTVlZjc5ZjBlMjljNSIsImNvZ25pdG86Z3JvdXBzIjpbIlVzZXIiXSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLXdlc3QtMi5hbWF6b25hd3MuY29tXC91cy13ZXN0LTJfRkI1T0VrdEFmIiwiY29nbml0bzp1c2VybmFtZSI6ImY1MGU4MjFmLTMzMjctNGFhYy05Mjk4LTVlZjc5ZjBlMjljNSIsImdpdmVuX25hbWUiOiJKb2huIiwib3JpZ2luX2p0aSI6IjgxY2EzZGNmLWEyMDItNDA3Yy04NTI1LWE0NzcxYzc2OWVhZSIsImF1ZCI6IjJhZDBxaTJpY3J0a292dHNqa2l2MzUzaTNrIiwiZXZlbnRfaWQiOiJjNzRmZDkzOS00Mjg4LTQzOTQtYWU4MS1mMmM0OWI1MjkwOWQiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTY1NDEzOTMyOSwiZXhwIjoxNjU0MTQyOTI5LCJpYXQiOjE2NTQxMzkzMjksImZhbWlseV9uYW1lIjoiR2lsYmVydCIsImp0aSI6IjAxNzUyNWYxLTNmOGItNDJmMi1iMWJhLWZiNDhkNTdkNDBiOSIsImVtYWlsIjoiam9obi5naWxiZXJ0QGRldnRlY2hub2xvZ3kuY29tIn0.MjZnui6m1KUpyCzC5yjnGeREetxoUsRIt8GwdG0KN5148kRxs0yjMCtK7BiXAtehq-tJaSPjRcHWkTQXrkemCkevEMFNlcVFm3fvi-QDVKLdhTOMOh4SFQAMA0Qvwor0Hha5bqaAAHCA6tzRiFzextsmGA4Lol4qi61ZVh0djkYKMaqd2Mg96E6WpiE9Rj160EJtVEntYQsZuvcypepEU_0h9ODH9DRGks_ZZkpikW8D-asmQqx8Ojt0CY33MutGTuvnwYu-8bh7gQrIP_yoTP1I_rD7A8it_r1I46mtY2D0mvRqFoxNADmSZbKS17kM8lFXrf5Iu88OHqc66nPA1w';
