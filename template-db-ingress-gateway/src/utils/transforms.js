export const transformString = ({ value }) => {
  /* istanbul ignore else */
  if (value) {
    return `${value}`;
  } else {
    return null;
  }
};

export const transformBoolean = ({ value }) => value === 'Y';

export const transformReference = ({
  rule, uow, value, metadata, mapObject,
}) => {
  /* istanbul ignore else */
  if (value) {
    const table = rule.tablesByName[metadata.fk.tableName];
    // console.log(JSON.stringify({ table, fk: metadata.fk }, null, 2));
    const pk = `${table.discriminator}|${value}`;
    const ref = uow.batchGetResponse.Responses[rule.tableName].find((i) => i.pk === pk);

    /* istanbul ignore else */
    if (ref) {
      return mapObject(rule, uow, table, ref);
    }
  }
  /* istanbul ignore next */
  return null;
};
