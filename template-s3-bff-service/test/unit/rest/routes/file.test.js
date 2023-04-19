import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import Model from '../../../../src/models/file';
import {
  queryFiles, getHistory, getFileSignedUrl, saveFile, deleteFile,
} from '../../../../src/rest/routes/file';

class Response {
  constructor() {
    this.status = sinon.stub().returns(this);
    this.header = sinon.stub().returns(this);
    this.json = sinon.spy((data) => data);
    this.send = sinon.spy((data) => data);
    this.redirect = sinon.spy((data) => data);
  }
}

describe('rest/routes/file.js', () => {
  afterEach(sinon.restore);

  it('should save', async () => {
    const stub = sinon.stub(Model.prototype, 'save').resolves({});

    const request = {
      isBase64Encoded: false,
      namespace: {
        models: {
          file: new Model(),
        },
      },
      params: {
        discriminator: 'files',
        entityId: '123',
        fileId: 'test.txt',
      },
      headers: { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryDP6Z1qHQSzB6Pf8c' },
      rawBody: ['------WebKitFormBoundaryDP6Z1qHQSzB6Pf8c',
        'Content-Disposition: form-data; name="uploadFile1"; filename="test.txt"',
        'Content-Type: text/plain',
        '',
        'Hello World!',
        '------WebKitFormBoundaryDP6Z1qHQSzB6Pf8c--',
      ].join('\r\n'),
    };
    const response = new Response();

    const data = await saveFile(request, response);

    expect(stub).to.have.been.calledWith({
      discriminator: 'files',
      entityId: '123',
      fileId: 'test.txt',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryDP6Z1qHQSzB6Pf8c',
      },
      body: '------WebKitFormBoundaryDP6Z1qHQSzB6Pf8c\r\n'
        + 'Content-Disposition: form-data; name="uploadFile1"; filename="test.txt"\r\n'
        + 'Content-Type: text/plain\r\n'
        + '\r\n'
        + 'Hello World!\r\n'
        + '------WebKitFormBoundaryDP6Z1qHQSzB6Pf8c--',
      isBase64Encoded: false,
    });

    expect(response.status).to.have.been.calledWith(200);
    expect(response.json).to.have.been.calledWith({});
    expect(data).to.deep.equal({});
  });

  it('should get history by id', async () => {
    const stub = sinon.stub(Model.prototype, 'get').resolves({
      signedUrl: 'https://123/456',
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    });

    const request = {
      namespace: {
        models: {
          file: new Model(),
        },
      },
      params: {
        discriminator: 'files',
        entityId: '123',
        fileId: 'test.txt',
      },
    };
    const response = new Response();

    const data = await getHistory(request, response);

    expect(stub).to.have.been.calledWith({
      discriminator: 'files',
      entityId: '123',
      fileId: 'test.txt',
    });

    expect(response.status).to.have.been.calledWith(200);
    expect(data).to.deep.equal({
      signedUrl: 'https://123/456',
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    });
  });

  it('should get signed url by id', async () => {
    const stub = sinon.stub(Model.prototype, 'getSignedUrl').resolves(
      'https://123/456',
    );

    const request = {
      namespace: {
        models: {
          file: new Model(),
        },
      },
      params: {
        discriminator: 'files',
        entityId: '123',
        fileId: 'test.txt',
      },
    };
    const response = new Response();

    await getFileSignedUrl(request, response);

    expect(stub).to.have.been.calledWith({
      discriminator: 'files',
      entityId: '123',
      fileId: 'test.txt',
    });

    expect(response.redirect).to.have.been.calledWith(303, 'https://123/456');
  });

  it('should query', async () => {
    const stub = sinon.stub(Model.prototype, 'query').resolves({
      last: undefined,
      data: [{
        Key: 'files/123/test.txt',
        CacheControl: 'private, max-age=300',
        ContentDisposition: 'inline; filename="test.txt"',
        ContentType: 'text/plain',
      }],
    });

    const request = {
      namespace: {
        models: {
          file: new Model(),
        },
      },
      params: {
        discriminator: 'files',
        entityId: '123',
      },
    };
    const response = new Response();

    const data = await queryFiles(request, response);

    expect(stub).to.have.been.calledWith({
      discriminator: 'files',
      entityId: '123',
    });

    expect(response.status).to.have.been.calledWith(200);
    expect(response.json).to.have.been.calledWith({
      last: undefined,
      data: [{
        Key: 'files/123/test.txt',
        CacheControl: 'private, max-age=300',
        ContentDisposition: 'inline; filename="test.txt"',
        ContentType: 'text/plain',
      }],
    });
    expect(data).to.deep.equal({
      last: undefined,
      data: [{
        Key: 'files/123/test.txt',
        CacheControl: 'private, max-age=300',
        ContentDisposition: 'inline; filename="test.txt"',
        ContentType: 'text/plain',
      }],
    });
  });

  it('should delete', async () => {
    const stub = sinon.stub(Model.prototype, 'delete').resolves({});

    const request = {
      namespace: {
        models: {
          file: new Model(),
        },
      },
      params: {
        discriminator: 'files',
        entityId: '123',
        fileId: 'test.txt',
      },
    };
    const response = new Response();

    const data = await deleteFile(request, response);

    expect(stub).to.have.been.calledWith({
      discriminator: 'files',
      entityId: '123',
      fileId: 'test.txt',
    });

    expect(response.status).to.have.been.calledWith(200);
    expect(response.json).to.have.been.calledWith({});
    expect(data).to.deep.equal({});
  });
});
