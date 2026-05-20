import load from './select';

import { tablesByName } from '../models/tables';

const rules = Object.values(tablesByName)
  .filter((t) => t.load)
  .map((t) => ({
    id: `${t.discriminator}-load`,
    eventType: t.discriminator,
    flavor: load,
    table: t,
  }));

// console.log('rules: ', rules);

export default rules;
