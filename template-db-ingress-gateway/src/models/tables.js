import { cdc } from 'aws-lambda-stream';
import {
  getField, toTableUpdateRequest, toDomainUpdateRequest, toTableGetRequest, toDomainEvent,
} from './generic';
import {
  transformString, transformBoolean, transformReference,
} from '../utils/transforms';

const metadata = {
  CUSTOMERS: {
    collect: {
      eventType: /my-customers-(created|updated|deleted)/,
      toUpdateRequest: toTableUpdateRequest,
    },
    update: [
      {
        id: 'cst',
        eventType: /^cst-(created|updated|deleted)/,
        pkColumn: 'CST_ID',
        pkPrefix: 'cst',
        discriminator: 'customer',
        ttl: -1,
        toUpdateRequest: toDomainUpdateRequest,
      },
    ],
    schema: 'MY',
    tableName: 'CUSTOMERS',
    prefix: 'CST',
    discriminator: 'cst',
    idColumn: 'CST_ID',
    // ttl: false,
    // load: 'select * from MY.LINE_ITEM where LI_ID > :offset  order by LI_ID fetch first :max rows only',
    columns: {
      CST_ID: {
        type: 'NUMBER',
        attribute: 'id',
      },
      CST_NM: {
        type: 'VARCHAR2',
        attribute: 'name',
      },
    },
  },
  PRODUCTS: {
    collect: {
      eventType: /my-products-(created|updated|deleted)/,
      toUpdateRequest: toTableUpdateRequest,
    },
    update: [
      {
        id: 'prd',
        eventType: /^prd-(created|updated|deleted)/,
        pkColumn: 'PRD_ID',
        pkPrefix: 'prd',
        discriminator: 'product',
        ttl: -1,
        toUpdateRequest: toDomainUpdateRequest,
      },
    ],
    schema: 'MY',
    tableName: 'PRODUCT',
    prefix: 'PRD',
    discriminator: 'prd',
    idColumn: 'PRD_ID',
    // ttl: false,
    // load: 'select * from MY.LINE_ITEM where LI_ID > :offset  order by LI_ID fetch first :max rows only',
    columns: {
      PRD_ID: {
        type: 'NUMBER',
        attribute: 'id',
      },
      PRD_NM: {
        type: 'VARCHAR2',
        attribute: 'name',
      },
    },
  },
  ORDERS: {
    collect: {
      eventType: /my-orders-(created|updated|deleted)/,
      toUpdateRequest: toTableUpdateRequest,
    },
    update: [
      {
        id: 'ord',
        eventType: /^ord-(created|updated|deleted)/,
        pkColumn: 'ORD_ID',
        pkPrefix: 'ord',
        discriminator: 'order',
        ttl: -1,
        toGetRequest: toTableGetRequest,
        toUpdateRequest: toDomainUpdateRequest,
      },
    ],
    schema: 'MY',
    tableName: 'ORDER',
    prefix: 'ORD',
    discriminator: 'ord',
    idColumn: 'ORD_ID',
    // ttl: false,
    load: 'select * from MY.LINE_ITEM where LI_ID > :offset  order by LI_ID fetch first :max rows only',
    columns: {
      ORD_ID: {
        type: 'NUMBER',
        attribute: 'id',
      },
      ORD_NBR: {
        type: 'VARCHAR2',
        attribute: 'number',
      },
      ORD_CUST_ID: {
        type: 'VARCHAR2',
        attribute: 'customer',
        transform: transformReference,
        fk: {
          tableName: 'CUSTOMERS',
        },
      },
    },
  },
  LINE_ITEMS: {
    collect: {
      eventType: /my-line-items-(created|updated|deleted)/,
      toUpdateRequest: toTableUpdateRequest,
    },
    update: [
      {
        eventType: /li-(created|updated|deleted)/,
        pkColumn: 'LI_ORD_ID',
        alias: 'lineItems',
        discriminator: 'line-item',
        ttl: 33,
        toGetRequest: toTableGetRequest,
        toUpdateRequest: toDomainUpdateRequest,
      },
    ],
    schema: 'MY',
    tableName: 'LINE_ITEM',
    prefix: 'LI',
    discriminator: 'li',
    idColumn: 'LI_ID',
    // ttl: false,
    // load: 'select * from MY.LINE_ITEM where LI_ID > :offset  order by LI_ID fetch first :max rows only',
    columns: {
      LI_ID: {
        type: 'NUMBER',
        attribute: 'id',
      },
      LI_QTY: {
        type: 'NUMBER',
        attribute: 'quantity',
      },
      LI_PRD_ID: {
        type: 'NUMBER',
        attribute: 'product',
        transform: transformReference,
        fk: {
          tableName: 'PRODUCTS',
        },
      },
    },
  },
};

export const tablesByDiscriminator = Object.values(metadata).reduce((a, t) => ({
  ...a,
  [t.discriminator]: t,
}), {});

export const tablesByName = metadata;
