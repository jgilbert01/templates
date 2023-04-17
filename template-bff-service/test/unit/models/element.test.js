import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import debug from 'debug';

import * as utils from '../../../src/utils';
import Connector from '../../../src/connectors/dynamodb';
import Model from '../../../src/models/element';

describe('models/element.js', () => {
  afterEach(sinon.restore);

  it('should save', async () => {
    sinon.stub(utils, 'now').returns(1657220357394);
    const stub = sinon.stub(Connector.prototype, 'update')
      .resolves({});

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('mdl'),
      connector,
      claims: {
        username: 'user1',
      },
    });

    const data = await model.save(
      {
        id: '00000000-0000-0000-0000-000000000000',
        elementId: '00000000-0000-0000-0000-000000000001',
      },
      {
        description: 'a element',
      },
    );

    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith({
      pk: '00000000-0000-0000-0000-000000000000',
      sk: 'elements|00000000-0000-0000-0000-000000000001',
    }, {
      description: 'a element',

      deleted: null,
      discriminator: 'element',
      lastModifiedBy: 'user1',
      latched: null,
      timestamp: 1657220357394,
      ttl: 1662922757,
      awsregion: 'us-west-2',
    });
    expect(data).to.deep.equal({});
  });

  it('should delete', async () => {
    sinon.stub(utils, 'now').returns(1657220357394);
    const stub = sinon.stub(Connector.prototype, 'update')
      .resolves({});

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('mdl'),
      connector,
      claims: {
        username: 'user1',
      },
    });

    const data = await model.delete({
      id: '00000000-0000-0000-0000-000000000000',
      elementId: '00000000-0000-0000-0000-000000000001',
    });

    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith({
      pk: '00000000-0000-0000-0000-000000000000',
      sk: 'elements|00000000-0000-0000-0000-000000000001',
    }, {
      deleted: true,
      discriminator: 'element',
      lastModifiedBy: 'user1',
      latched: null,
      timestamp: 1657220357394,
      ttl: 1658170757,
      awsregion: 'us-west-2',
    });
    expect(data).to.deep.equal({});
  });
});
