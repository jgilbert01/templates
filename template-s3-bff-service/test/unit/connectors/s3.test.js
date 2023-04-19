import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import debug from 'debug';
import AWS from 'aws-sdk-mock';

import Connector from '../../../src/connectors/s3';

describe('connectors/s3.js', () => {
  afterEach(() => {
    AWS.restore('S3');
  });

  it('should get a signed url', async () => {
    const spy = sinon.spy((op, params, cb) => cb(null, 'https://123/456'));

    AWS.mock('S3', 'getSignedUrl', spy);
    const data = await new Connector(debug('s3'), 'b1')
      .getSignedUrl('putObject', '1/2');
    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith('putObject', {
      Bucket: 'b1',
      Key: '1/2',
    });
    expect(data).to.equal('https://123/456');
  });

  it('should get a signed url for putObject', async () => {
    const spy = sinon.spy((op, params, cb) => cb(null, 'https://123/456'));

    AWS.mock('S3', 'getSignedUrl', spy);

    const data = await new Connector(debug('s3'), 'b1')
      .getSignedUrl('putObject', '1/2');

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith('putObject', {
      Bucket: 'b1',
      Key: '1/2',
      // ContentType: 'application/pdf',
      // ACL: 'private',
    });
    expect(data).to.equal('https://123/456');
  });

  it('should get a signed url for getObject', async () => {
    const spy = sinon.spy((op, params, cb) => cb(null, 'https://123/456'));

    AWS.mock('S3', 'getSignedUrl', spy);

    const data = await new Connector(debug('s3'), 'b1')
      .getSignedUrl('getObject', '1/2');

    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith('getObject', {
      Bucket: 'b1',
      Key: '1/2',
    });
    expect(data).to.equal('https://123/456');
  });

  it('should get object head', async () => {
    const spy = sinon.spy((params, cb) => cb(null, { Body: 'b' }));
    AWS.mock('S3', 'headObject', spy);

    const inputParams = {
      Key: 'k1',
    };

    const data = await new Connector(debug('s3'), 'b1')
      .headObject(inputParams);

    expect(spy).to.have.been.calledWith({
      Bucket: 'b1',
      Key: 'k1',
      VersionId: undefined,
    });
    expect(data).to.deep.equal({ Body: 'b' });
  });

  it('should list object versions', async () => {
    const spy = sinon.spy((params, cb) => cb(null, [{ VersionId: 'v1' }]));
    AWS.mock('S3', 'listObjectVersions', spy);

    const inputParams = {
      Prefix: 'k1',
      limit: 20,
    };

    const data = await new Connector(debug('s3'), 'b1')
      .listObjectVersions(inputParams);

    expect(spy).to.have.been.calledWith({
      Bucket: 'b1',
      Prefix: 'k1',
      MaxKeys: 20,
    });
    expect(data).to.deep.equal({
      last: undefined,
      data: [{ VersionId: 'v1' }],
    });
  });

  it('should list objects', async () => {
    const spy = sinon.spy((params, cb) => cb(null, {
      IsTruncated: false,
      NextContinuationToken: '',
      Contents: [
        {
          Key: 'p1/2021/03/26/19/1234',
          LastModified: '2021-03-26T19:17:15.000Z',
          ETag: '"a192b6e6886f117cd4fa64168f6ec378"',
          Size: 1271,
          StorageClass: 'STANDARD',
          Owner: {},
        },
      ],
      Name: 'b1',
      Prefix: 'p1',
      MaxKeys: 1000,
      CommonPrefixes: [],
    }));
    AWS.mock('S3', 'listObjectsV2', spy);

    const inputParams = {
      Prefix: 'p1',
    };

    const data = await new Connector(debug('s3'), 'b1')
      .listObjects(inputParams);

    expect(spy).to.have.been.calledWith({
      Bucket: 'b1',
      Prefix: 'p1',
      Delimiter: undefined,
      MaxKeys: undefined,
      ContinuationToken: undefined,
    });

    expect(data).to.deep.equal({
      last: undefined,
      data: {
        IsTruncated: false,
        NextContinuationToken: '',
        Contents: [
          {
            Key: 'p1/2021/03/26/19/1234',
            LastModified: '2021-03-26T19:17:15.000Z',
            ETag: '"a192b6e6886f117cd4fa64168f6ec378"',
            Size: 1271,
            StorageClass: 'STANDARD',
            Owner: {},
          },
        ],
        Name: 'b1',
        Prefix: 'p1',
        MaxKeys: 1000,
        CommonPrefixes: [],
      },
    });
  });

  it('should delete object', async () => {
    const spy = sinon.spy((params, cb) => cb(null, { DeleteMarker: false }));
    AWS.mock('S3', 'deleteObject', spy);

    const inputParams = {
      Key: 'k1',
    };

    const data = await new Connector(debug('s3'), 'b1')
      .deleteObject(inputParams);

    expect(spy).to.have.been.calledWith({
      Bucket: 'b1',
      Key: 'k1',
      VersionId: undefined,
    });
    expect(data).to.deep.equal({ DeleteMarker: false });
  });
});
