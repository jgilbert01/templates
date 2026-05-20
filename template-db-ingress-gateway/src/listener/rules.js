import { materialize } from 'aws-lambda-stream';

import { tablesByName } from '../models/tables';

const rules = Object.values(tablesByName)
  .filter((t) => t.collect)
  .map((t) => ({
    id: t.discriminator,
    flavor: materialize,
    ...t.collect,
    table: t,
    tablesByName,
  }));

// console.log('rules: ', rules);

export default rules;
