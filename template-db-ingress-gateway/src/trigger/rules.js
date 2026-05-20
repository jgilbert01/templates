import { update } from 'aws-lambda-stream';

import { tablesByName } from '../models/tables';

const rules = Object.values(tablesByName)
  .filter((t) => t.update)
  .reduce((a, t) => [...a, ...t.update.map((u) => ({ ...t, update: u }))], [])
  .map((t) => ({
    id: t.update.id || t.update.discriminator,
    flavor: update,
    ...t.update,
    table: t,
    tablesByName,
  }));

// console.log('rules: ', rules);

export default [
  ...rules,
  // other rules can go here

  // TODO cdc rules ???
];
