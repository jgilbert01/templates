import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import debug from 'debug';

import Connector from '../../../src/connectors/s3';
import Model from '../../../src/models/file';

describe('models/file.js', () => {
  afterEach(sinon.restore);

  it('should create save signed url', async () => {
    const stub = sinon.stub(Connector.prototype, 'getSignedUrl')
      .resolves('https://123/456');

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.save({
      discriminator: 'files',
      entityId: '123',
      fileId: 'test.txt',
      headers: { 'content-type': 'text/plain' },
    });

    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith(
      'putObject',
      'files/123/test.txt',
      {
        ACL: 'private',
        CacheControl: 'private, max-age=300',
        ContentDisposition: 'inline; filename="test.txt"',
        ContentType: 'text/plain',
        Metadata: {
          discriminator: 'files',
          entityId: '123',
          fileId: 'test.txt',
          lastmodifiedby: 'system',
          awsregion: 'us-west-2',
        },
      },
    );

    expect(data).to.deep.equal({
      signedUrl: 'https://123/456',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'inline; filename="test.txt"',
        'Cache-Control': 'private, max-age=300',
        'x-amz-meta-discriminator': 'files',
        'x-amz-meta-entityid': '123',
        'x-amz-meta-fileid': 'test.txt',
        'x-amz-meta-lastmodifiedby': 'system',
        'x-amz-meta-awsregion': 'us-west-2',
        'x-amz-acl': 'private',
      },
    });
  });

  it('should get history by id', async () => {
    const stub1 = sinon.stub(Connector.prototype, 'listObjectVersions')
      .resolves({
        last: undefined,
        data: {
          Versions: [{
            Key: 'files/123/test.txt',
            LastModified: '2022-06-22T13:10:33.000Z',
            Size: 399863,
            VersionId: '1',
          }],
        },
      });

    const stub2 = sinon.stub(Connector.prototype, 'headObject')
      .resolves({
        Key: 'files/123/test.txt',
        CacheControl: 'private, max-age=300',
        ContentDisposition: 'inline; filename="test.txt"',
        ContentType: 'text/plain',
        Metadata: {
          discriminator: 'files',
          entityId: '123',
          fileId: 'test.txt',
          lastmodifiedby: 'system',
          awsregion: 'us-west-2',
        },
      });
    const stub3 = sinon.stub(Connector.prototype, 'getSignedUrl')
      .resolves('https://123/456');

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.get({
      discriminator: 'files',
      entityId: '123',
      fileId: 'test.txt',
    });

    expect(stub1).to.have.been.calledOnce;
    expect(stub1).to.have.been.calledWith({
      Prefix: 'files/123/test.txt',
      last: undefined,
      limit: undefined,
    });
    expect(stub2).to.have.been.calledOnce;
    expect(stub2).to.have.been.calledWith({
      Key: 'files/123/test.txt',
      VersionId: '1',
    });
    expect(stub3).to.have.been.calledOnce;
    expect(stub3).to.have.been.calledWith(
      'getObject',
      'files/123/test.txt',
      {
        VersionId: '1',
      },
    );

    expect(data).to.deep.equal({
      last: undefined,
      data: [
        {
          Key: 'files/123/test.txt',
          VersionId: '1',
          LastModified: '2022-06-22T13:10:33.000Z',
          Size: 399863,
          SignedUrl: 'https://123/456',
          Type: 'txt',
          CacheControl: 'private, max-age=300',
          ContentDisposition: 'inline; filename="test.txt"',
          ContentType: 'text/plain',
          Metadata: {
            discriminator: 'files',
            entityId: '123',
            fileId: 'test.txt',
            lastmodifiedby: 'system',
            awsregion: 'us-west-2',
          },
        },
      ],
    });
  });

  it('should get signed url by id', async () => {
    const stub3 = sinon.stub(Connector.prototype, 'getSignedUrl')
      .resolves('https://123/456');

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.getSignedUrl({
      discriminator: 'files',
      entityId: '123',
      fileId: 'test.txt',
    });

    expect(stub3).to.have.been.calledOnce;
    expect(stub3).to.have.been.calledWith(
      'getObject',
      'files/123/test.txt',
    );

    expect(data).to.equal('https://123/456');
  });

  it('should query by discriminator and entity id', async () => {
    const stub = sinon.stub(Connector.prototype, 'listObjects')
      .resolves({
        last: undefined,
        data: {
          Contents: [{
            Key: 'files/123/test.txt',
            LastModified: '2022-06-22T13:10:33.000Z',
            Size: 399863,
          }],
        },
      });

    const stub2 = sinon.stub(Connector.prototype, 'headObject')
      .resolves({
        Key: 'files/123/test.txt',
        CacheControl: 'private, max-age=300',
        ContentDisposition: 'inline; filename="test.txt"',
        ContentType: 'text/plain',
        Metadata: {
          discriminator: 'files',
          entityId: '123',
          fileId: 'test.txt',
          lastmodifiedby: 'system',
          awsregion: 'us-west-2',
        },
      });

    sinon.stub(Connector.prototype, 'getSignedUrl')
      .resolves('https://123/456');

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.query({
      discriminator: 'files',
      entityId: '123',
    });

    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith({
      Delimiter: '/',
      Prefix: 'files/123/',
      last: undefined,
      limit: undefined,
    });
    expect(stub2).to.have.been.calledOnce;
    expect(stub2).to.have.been.calledWith({
      Key: 'files/123/test.txt',
    });
    expect(data).to.deep.equal({
      last: undefined,
      data: [{
        Key: 'files/123/test.txt',
        LastModified: '2022-06-22T13:10:33.000Z',
        Size: 399863,
        Type: 'txt',
        SignedUrl: 'https://123/456',
        CacheControl: 'private, max-age=300',
        ContentDisposition: 'inline; filename="test.txt"',
        ContentType: 'text/plain',
        Metadata: {
          discriminator: 'files',
          entityId: '123',
          fileId: 'test.txt',
          lastmodifiedby: 'system',
          awsregion: 'us-west-2',
        },
      }],
    });
  });

  it('should query by discriminator', async () => {
    const stub = sinon.stub(Connector.prototype, 'listObjects')
      .resolves({
        last: undefined,
        data: {
          CommonPrefixes: [{
            Prefix: 'files/123/',
          }],
        },
      });

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.query({
      discriminator: 'files',
    });

    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith({
      Delimiter: '/',
      Prefix: 'files/',
      last: undefined,
      limit: undefined,
    });
    expect(data).to.deep.equal({
      last: undefined,
      data: [{
        Key: 'files/123/',
        Type: 'folder',
      }],
    });
  });

  it('should delete', async () => {
    const stub = sinon.stub(Connector.prototype, 'deleteObject')
      .resolves({});

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.delete({
      discriminator: 'files',
      entityId: '123',
      fileId: 'test.txt',
    });

    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith({
      Key: 'files/123/test.txt',
      VersionId: undefined,
    });
    expect(data).to.deep.equal({});
  });
});
