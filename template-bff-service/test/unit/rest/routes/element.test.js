import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import ElementModel from '../../../../src/models/element';
import {
  saveElement, deleteElement,
} from '../../../../src/rest/routes/element';

class Response {
  constructor() {
    this.status = sinon.stub().returns(this);
    this.json = sinon.spy((data) => data);
  }
}

describe('rest/routes/element.js', () => {
  afterEach(sinon.restore);

  it('should save', async () => {
    const stub = sinon.stub(ElementModel.prototype, 'save').resolves({});

    const request = {
      namespace: {
        models: {
          element: new ElementModel(),
        },
      },
      params: {
        id: '00000000-0000-0000-0000-000000000000',
        elementId: '00000000-0000-0000-0000-000000000001',
      },
      body: {
        text: 'a element',
      },
    };
    const response = new Response();

    const data = await saveElement(request, response);

    expect(stub).to.have.been.calledWith({
      id: '00000000-0000-0000-0000-000000000000',
      elementId: '00000000-0000-0000-0000-000000000001',
    }, {
      text: 'a element',
    });

    expect(response.status).to.have.been.calledWith(200);
    expect(response.json).to.have.been.calledWith({});
    expect(data).to.deep.equal({});
  });

  it('should delete', async () => {
    const stub = sinon.stub(ElementModel.prototype, 'delete').resolves({});

    const request = {
      namespace: {
        models: {
          element: new ElementModel(),
        },
      },
      params: {
        id: '00000000-0000-0000-0000-000000000000',
        elementId: '00000000-0000-0000-0000-000000000001',
      },
    };
    const response = new Response();

    const data = await deleteElement(request, response);

    expect(stub).to.have.been.calledWith({
      id: '00000000-0000-0000-0000-000000000000',
      elementId: '00000000-0000-0000-0000-000000000001',
    });

    expect(response.status).to.have.been.calledWith(200);
    expect(response.json).to.have.been.calledWith({});
    expect(data).to.deep.equal({});
  });
});
