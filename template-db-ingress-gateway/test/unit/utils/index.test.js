import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  mapper, aggregateMapper, DEFAULT_OMIT_FIELDS, sortKeyTransform, deletedFilter, updateExpression, toTimestamp, formatDates,
} from '../../../src/utils';

describe('utils/index.js', () => {
  afterEach(sinon.restore);

  it('dates', () => {
    expect(toTimestamp('ord', { ORD_UPDATE_DT: '2021-07-02T16:00:34Z' })).to.be.equal(1625241634000);
    expect(toTimestamp('ord', { ORD_CREATE_DT: '2021-07-02T12:00:27Z' })).to.be.equal(1625227227000); // 1625241627000

    expect(toTimestamp(
      'ord',
      {
        CST_UPDATE_DT: '2021-07-27T12:03:09Z',
        CST_CREATE_DT: '2021-07-27T11:50:24Z',
      },
      {
        timestamp: '2021-07-27T16:03:12.398461Z',
        operation: 'delete',
      },
    )).to.be.equal(1627401792398);
  });

  it('should formatDates', () => {
    expect(formatDates({
      ORD_UPDATE_DT: new Date('2021-07-02T16:00:34Z'),
    })).to.deep.equal({
      ORD_UPDATE_DT: '2021-07-02T16:00:34Z',
    });
  });

  it('should filter out soft deleted items', async () => {
    const items = [
      {
      },
      {
        deleted: undefined,
      },
      {
        deleted: null,
      },
      {
        deleted: true,
      },
      {
        deleted: false,
      },
    ]
      .filter(deletedFilter);
    expect(items.length).to.equal(4);
    expect(items).to.deep.equal([
      {
      },
      {
        deleted: undefined,
      },
      {
        deleted: null,
      },
      {
        deleted: false,
      },
    ]);
  });

  it('should map an object', async () => {
    const mappings = mapper({
      defaults: { f9: true },
      omit: [...DEFAULT_OMIT_FIELDS, 'f1'],
      rename: {
        pk: 'id',
        data: 'name',
        f1: 'f2',
        x1: 'else-coverage',
      },
      transform: {
        f1: async (v) => v.toUpperCase(),
        f9: (v) => 'else-coverage',
      },
    });

    expect(await mappings({
      pk: '1',
      sk: 'thing',
      data: 'thing0',
      f1: 'v1',
    })).to.deep.equal({
      id: '1',
      name: 'thing0',
      f2: 'V1',
      f9: true,
    });
  });

  it('should map an aggregate object', async () => {
    const mapper1 = mapper({
      rename: {
        pk: 'id',
        data: 'name',
      },
    });

    const mapper2 = mapper({
      rename: {
        sk: 'id',
        data: 'name',
      },
      transform: { sk: sortKeyTransform },
    });

    const mappings = aggregateMapper({
      aggregate: 'thing', // top level discriminator
      cardinality: { // per relationship
        one2many: 999,
        many2many: 999,
        one2one: 1,
      },
      mappers: { // per discriminator
        thing: mapper1,
        child: mapper2,
        peer: mapper2,
        associate: mapper2,
      },
    });

    const mapped = await mappings([
      {
        pk: '1',
        sk: 'many2many|1', // relationship name is 1st segment of sk
        discriminator: 'associate',
        data: 'associate1',
      },
      {
        pk: '1',
        sk: 'many2many|2',
        discriminator: 'associate',
        data: 'associate2',
      },
      {
        pk: '1',
        sk: 'one2many|1',
        discriminator: 'child',
        data: 'child1',
      },
      {
        pk: '1',
        sk: 'one2many|2',
        discriminator: 'child',
        data: 'child2',
      },
      {
        pk: '1',
        sk: 'one2many|3',
        discriminator: 'child',
        deleted: true,
      },
      {
        pk: '1',
        sk: 'one2one|1',
        discriminator: 'peer',
        data: 'peer',
      },
      {
        pk: '1',
        sk: 'thing',
        discriminator: 'thing',
        data: 'thing0',
        f1: 'v1',
      },
    ]);

    // console.log('mapped: %s', JSON.stringify(mapped, null, 2));

    expect(mapped).to.deep.equal({
      id: '1',
      name: 'thing0',
      f1: 'v1',
      one2many: [
        {
          id: '1',
          name: 'child1',
        },
        {
          id: '2',
          name: 'child2',
        },
      ],
      one2one: {
        id: '1',
        name: 'peer',
      },
      many2many: [
        {
          id: '1',
          name: 'associate1',
        },
        {
          id: '2',
          name: 'associate2',
        },
      ],
    });
  });

  it('should calculate updateExpression', () => {
    expect(updateExpression({
      pk: '1',
      sk: '2',
      name: 'Thing One',
      description: 'This is thing one.',
      status: undefined,
      status2: null,
      discriminator: 'thing',
      latched: true,
      ttl: 1543046400,
      timestamp: 1540454400000,
    })).to.deep.equal({
      ExpressionAttributeNames: {
        '#description': 'description',
        '#discriminator': 'discriminator',
        '#latched': 'latched',
        '#name': 'name',
        '#status2': 'status2',
        '#timestamp': 'timestamp',
        '#ttl': 'ttl',
      },
      ExpressionAttributeValues: {
        ':description': 'This is thing one.',
        ':discriminator': 'thing',
        ':latched': true,
        ':name': 'Thing One',
        ':timestamp': 1540454400000,
        ':ttl': 1543046400,
      },
      UpdateExpression: 'SET #name = :name, #description = :description, #discriminator = :discriminator, #latched = :latched, #ttl = :ttl, #timestamp = :timestamp REMOVE #status2',
      ReturnValues: 'ALL_NEW',
    });
  });
});
