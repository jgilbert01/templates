import 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import debug from 'debug';

import * as utils from '../../../src/utils';
import Connector from '../../../src/connectors/dynamodb';
import Model, { toEvent, toUpdateRequest } from '../../../src/models/thing';

describe('models/thing.js', () => {
  afterEach(sinon.restore);

  it('should save', async () => {
    sinon.stub(utils, 'now').returns(1600349040394);
    const stub = sinon.stub(Connector.prototype, 'update')
      .resolves({});

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
      claims: {
        username: 'user1',
      },
    });

    const data = await model.save(
      '00000000-0000-0000-0000-000000000000',
      {
        name: 'thing0',
      },
    );

    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith({
      pk: '00000000-0000-0000-0000-000000000000',
      sk: 'thing',
    }, {
      deleted: null,
      discriminator: 'thing',
      lastModifiedBy: 'user1',
      latched: null,
      name: 'thing0',
      timestamp: 1600349040394,
      ttl: 1603200240,
      awsregion: 'us-west-2',
    });
    expect(data).to.deep.equal([{}]);
  });

  it('should save with elements', async () => {
    sinon.stub(utils, 'now').returns(1600349040394);
    const stub = sinon.stub(Connector.prototype, 'update')
      .resolves({});

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
      claims: {
        username: 'user1',
      },
    });

    const data = await model.save(
      '00000000-0000-0000-0000-000000000000',
      {
        name: 'thing0',
        elements: [{
          id: '00000000-0000-0000-0000-000000000001',
          description: 'a element',
          lastModifiedBy: 'user1',
          timestamp: 1657220357394,
        }],
      },
    );

    expect(stub).to.have.been.calledWith({
      pk: '00000000-0000-0000-0000-000000000000',
      sk: 'thing',
    }, {
      name: 'thing0',
      deleted: null,
      discriminator: 'thing',
      lastModifiedBy: 'user1',
      latched: null,
      timestamp: 1600349040394,
      ttl: 1603200240,
      awsregion: 'us-west-2',
    });
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
      ttl: 1603200240,
      awsregion: 'us-west-2',
    });
    expect(data).to.deep.equal([{}, {}]);
  });

  it('should get by id', async () => {
    const stub = sinon.stub(Connector.prototype, 'get')
      .resolves([
        {
          pk: '00000000-0000-0000-0000-000000000000',
          sk: 'thing',
          discriminator: 'thing',
          name: 'thing0',
          timestamp: 1600144863435,
        },
        {
          pk: '00000000-0000-0000-0000-000000000000',
          sk: 'elements|00000000-0000-0000-0000-000000000001',
          discriminator: 'element',
          description: 'a element',
          lastModifiedBy: 'user1',
          timestamp: 1657220357394,
        },
      ]);

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.get(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith('00000000-0000-0000-0000-000000000000');
    expect(data).to.deep.equal({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'thing0',
      timestamp: 1600144863435,
      elements: [{
        id: '00000000-0000-0000-0000-000000000001',
        description: 'a element',
        lastModifiedBy: 'user1',
        timestamp: 1657220357394,
      }],
    });
  });

  it('should query', async () => {
    const stub = sinon.stub(Connector.prototype, 'query')
      .resolves({
        last: undefined,
        data: [{
          pk: '00000000-0000-0000-0000-000000000000',
          sk: 'thing',
          discriminator: 'thing',
          name: 'thing0',
          timestamp: 1600144863435,
        }],
      });

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.query({});

    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith({
      index: 'gsi1',
      keyName: 'discriminator',
      keyValue: 'thing',
      last: undefined,
      limit: undefined,
    });
    expect(data).to.deep.equal({
      last: undefined,
      data: [{
        id: '00000000-0000-0000-0000-000000000000',
        name: 'thing0',
        timestamp: 1600144863435,
      }],
    });
  });

  it('should delete', async () => {
    sinon.stub(utils, 'now').returns(1600349040394);
    const stub = sinon.stub(Connector.prototype, 'update')
      .resolves({});

    const connector = new Connector(
      debug('db'),
      't1',
    );

    const model = new Model({
      debug: debug('model'),
      connector,
    });

    const data = await model.delete(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(stub).to.have.been.calledOnce;
    expect(stub).to.have.been.calledWith({
      pk: '00000000-0000-0000-0000-000000000000',
      sk: 'thing',
    }, {
      deleted: true,
      discriminator: 'thing',
      lastModifiedBy: 'system',
      latched: null,
      timestamp: 1600349040394,
      ttl: 1601299440,
      awsregion: 'us-west-2',
    });
    expect(data).to.deep.equal({});
  });

  it('should map to update request', () => {
    const uow = {
      event: {
        timestamp: 1634177773001,
        type: 'thing-deleted',
        thing: {
          id: '00000000-0000-0000-0000-000000000000',
          name: 'thing0',
        },
      },
    };

    // console.log(toUpdateRequest(uow));

    expect(toUpdateRequest(uow)).to.deep.equal({
      Key: { pk: '00000000-0000-0000-0000-000000000000', sk: 'thing' },
      ExpressionAttributeNames: {
        '#id': 'id',
        '#name': 'name',
        '#discriminator': 'discriminator',
        '#lastModifiedBy': 'lastModifiedBy',
        '#timestamp': 'timestamp',
        '#deleted': 'deleted',
        '#latched': 'latched',
        '#ttl': 'ttl',
        '#awsregion': 'awsregion',
      },
      ExpressionAttributeValues: {
        ':id': '00000000-0000-0000-0000-000000000000',
        ':name': 'thing0',
        ':discriminator': 'thing',
        ':lastModifiedBy': 'system',
        ':timestamp': 1634177773001,
        ':deleted': true,
        ':latched': true,
        ':ttl': 1637028973,
        ':awsregion': 'us-west-2',
      },
      UpdateExpression: 'SET #id = :id, #name = :name, #discriminator = :discriminator, #lastModifiedBy = :lastModifiedBy, #timestamp = :timestamp, #deleted = :deleted, #latched = :latched, #ttl = :ttl, #awsregion = :awsregion',
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_not_exists(#timestamp) OR #timestamp < :timestamp',
    });
  });

  it('should map to event', async () => {
    const uow = {
      event: {
        timestamp: 1634177773001,
        raw: {
          new: {
            pk: '00000000-0000-0000-0000-000000000000',
            sk: 'thing',
            discriminator: 'thing',
            name: 'thing0',
            status: 'APPROVED',
            ttl: 1551818222,
          },
        },
      },
      queryResponse: [{
        pk: '00000000-0000-0000-0000-000000000000',
        discriminator: 'thing',
      }],
    };

    expect(await toEvent(uow)).to.deep.equal({
      type: 'thing-approved',
      timestamp: 1634177773001,
      thing: {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'thing0',
        status: 'APPROVED',
      },
      raw: undefined, // removing data from the default event
    });
  });
});
