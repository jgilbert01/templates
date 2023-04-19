import 'mocha';
import { expect } from 'chai';

const supertest = require('supertest');

const endpoint = process.env.ENDPOINT ? process.env.ENDPOINT : 'http://localhost:3001';
const client = supertest(endpoint);

describe('rest/index.js', () => {
  it('should save', () => client.put('/files/files/123/cover.jpg')
    .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(JSON.parse(res.text), null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        signedUrl: 'https://123/456',
        headers: {
          'Content-Disposition': 'inline; filename="cover.jpg"',
          'Cache-Control': 'private, max-age=300',
          'x-amz-meta-discriminator': 'files',
          'x-amz-meta-entityid': '123',
          'x-amz-meta-fileid': 'cover.jpg',
          'x-amz-meta-lastmodifiedby': 'john.gilbert@example.com',
          'x-amz-meta-awsregion': 'us-west-2',
          'x-amz-acl': 'private',
        },
      });
    }));

  it('should query root', () => client.get('/files')
    .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(JSON.parse(res.text), null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        data: [
          {
            Key: 'files/',
            Type: 'folder',
          },
        ],
      });
    }));

  it('should query discriminator', () => client.get('/files/files')
    .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(JSON.parse(res.text), null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        data: [
          {
            Key: 'files/123/',
            Type: 'folder',
          },
        ],
      });
    }));

  it('should query discriminator and entity id', () => client.get('/files/files/123')
    .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(JSON.parse(res.text), null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        data: [
          {
            Key: 'files/123/cover.jpg',
            LastModified: '2022-06-22T20:35:53.000Z',
            Size: 399863,
            Type: 'jpg',
            SignedUrl: 'https://123/456',
            AcceptRanges: 'bytes',
            ContentLength: 399863,
            ETag: 'fcc9de154ef0217f8e5644b5dd8a7a19',
            CacheControl: 'private, max-age=300',
            ContentDisposition: 'inline; filename="cover.jpg"',
            ContentType: 'image/jpeg',
            ServerSideEncryption: 'AES256',
            Metadata: {
              awsregion: 'us-west-2',
              discriminator: 'files',
              fileid: 'cover.jpg',
              entityid: '123',
              lastmodifiedby: 'f50e821f-3327-4aac-9298-5ef79f0e29c5',
            },
          },
          {
            Key: 'files/123/test.txt',
            LastModified: '2022-06-22T20:35:53.000Z',
            Size: 5,
            Type: 'txt',
            SignedUrl: 'https://123/456',
            AcceptRanges: 'bytes',
            ContentLength: 399863,
            ETag: 'fcc9de154ef0217f8e5644b5dd8a7a19',
            CacheControl: 'private, max-age=300',
            ContentDisposition: 'inline; filename="test.txt"',
            ContentType: 'txt',
            ServerSideEncryption: 'AES256',
            Metadata: {
              awsregion: 'us-west-2',
              discriminator: 'files',
              fileid: 'test.txt',
              entityid: '123',
              lastmodifiedby: 'f50e821f-3327-4aac-9298-5ef79f0e29c5',
            },
          },
        ],
      });
    }));

  it('should get signed url', () => client.get('/files/files/123/cover.jpg')
    .set('Authorization', JWT)
    .expect(303)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(res.header.location).to.have.string('https://123/456');
    }));

  it('should get history', () => client.get('/files/files/123/cover.jpg/versions?limit=2')
    .set('Authorization', JWT)
    .expect('cache-control', 'private, max-age=300')
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(JSON.parse(res.text), null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({
        last: 'eyJLZXlNYXJrZXIiOiJ0aGluZ3MvMTIzL2NvdmVyLmpwZyIsIlZlcnNpb25JZE1hcmtlciI6IlpjeUFWT3Q2R2VWaFJELnpGQmU4OXV1NmdwUS43eU5WIn0=',
        data: [
          {
            Key: 'files/123/cover.jpg',
            VersionId: 'I1oXE.DoH9632dqhWPsTFHh4azifjuw.',
            LastModified: '2022-06-22T20:35:53.000Z',
            Size: 399863,
            SignedUrl: 'https://123/456',
            Type: 'jpg',
            AcceptRanges: 'bytes',
            ContentLength: 399863,
            ETag: 'fcc9de154ef0217f8e5644b5dd8a7a19',
            CacheControl: 'private, max-age=300',
            ContentDisposition: 'inline; filename="cover.jpg"',
            ContentType: 'image/jpeg',
            ServerSideEncryption: 'AES256',
            Metadata: {
              awsregion: 'us-west-2',
              discriminator: 'files',
              fileid: 'cover.jpg',
              entityid: '123',
              lastmodifiedby: 'f50e821f-3327-4aac-9298-5ef79f0e29c5',
            },
          },
          {
            Key: 'files/123/cover.jpg',
            VersionId: 'ZcyAVOt6GeVhRD.zFBe89uu6gpQ.7yNV',
            LastModified: '2022-06-22T20:33:53.000Z',
            Size: 399863,
            SignedUrl: 'https://123/456',
            Type: 'jpg',
            AcceptRanges: 'bytes',
            ContentLength: 399863,
            ETag: 'fcc9de154ef0217f8e5644b5dd8a7a19',
            CacheControl: 'private, max-age=300',
            ContentDisposition: 'inline; filename="cover.jpg"',
            ContentType: 'image/jpeg',
            ServerSideEncryption: 'AES256',
            Metadata: {
              awsregion: 'us-west-2',
              discriminator: 'files',
              fileid: 'cover.jpg',
              entityid: '123',
              lastmodifiedby: 'f50e821f-3327-4aac-9298-5ef79f0e29c5',
            },
          },
        ],
      });
    }));

  it('should delete', () => client.delete('/files/files/123/cover.jpg')
    .set('Authorization', JWT)
    .expect(200)
    .expect((res) => {
      // console.log('RES: %s', JSON.stringify(res, null, 2));
      expect(JSON.parse(res.text)).to.deep.equal({});
    }));
});

const JWT = 'eyJraWQiOiJtM1AxMERWOThoMzJMK2poQW8zQjhRVU1vMlAwXC82c1lUQXUxRUhFNHRIaz0iLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoiY2ZhY2I5MmdzTHZfbDEwMTdCdUxkZyIsInN1YiI6ImY1MGU4MjFmLTMzMjctNGFhYy05Mjk4LTVlZjc5ZjBlMjljNSIsImNvZ25pdG86Z3JvdXBzIjpbIlVzZXIiXSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLXdlc3QtMi5hbWF6b25hd3MuY29tXC91cy13ZXN0LTJfRkI1T0VrdEFmIiwiY29nbml0bzp1c2VybmFtZSI6ImY1MGU4MjFmLTMzMjctNGFhYy05Mjk4LTVlZjc5ZjBlMjljNSIsImdpdmVuX25hbWUiOiJKb2huIiwib3JpZ2luX2p0aSI6IjgxY2EzZGNmLWEyMDItNDA3Yy04NTI1LWE0NzcxYzc2OWVhZSIsImF1ZCI6IjJhZDBxaTJpY3J0a292dHNqa2l2MzUzaTNrIiwiZXZlbnRfaWQiOiJjNzRmZDkzOS00Mjg4LTQzOTQtYWU4MS1mMmM0OWI1MjkwOWQiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTY1NDEzOTMyOSwiZXhwIjoxNjU0MTQyOTI5LCJpYXQiOjE2NTQxMzkzMjksImZhbWlseV9uYW1lIjoiR2lsYmVydCIsImp0aSI6IjAxNzUyNWYxLTNmOGItNDJmMi1iMWJhLWZiNDhkNTdkNDBiOSIsImVtYWlsIjoiam9obi5naWxiZXJ0QGRldnRlY2hub2xvZ3kuY29tIn0.MjZnui6m1KUpyCzC5yjnGeREetxoUsRIt8GwdG0KN5148kRxs0yjMCtK7BiXAtehq-tJaSPjRcHWkTQXrkemCkevEMFNlcVFm3fvi-QDVKLdhTOMOh4SFQAMA0Qvwor0Hha5bqaAAHCA6tzRiFzextsmGA4Lol4qi61ZVh0djkYKMaqd2Mg96E6WpiE9Rj160EJtVEntYQsZuvcypepEU_0h9ODH9DRGks_ZZkpikW8D-asmQqx8Ojt0CY33MutGTuvnwYu-8bh7gQrIP_yoTP1I_rD7A8it_r1I46mtY2D0mvRqFoxNADmSZbKS17kM8lFXrf5Iu88OHqc66nPA1w';
