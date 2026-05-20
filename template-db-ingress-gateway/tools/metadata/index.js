const _ = require('highland');
const fs = require('fs');
const oracledb = require('oracledb');
const dbConfig = {
  user: process.env.NODE_ORACLEDB_USER,
  password: process.env.NODE_ORACLEDB_PASSWORD,
  connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING,
};;

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const tables = require('./input');
// console.log('tables: ', tables);

const more = () => {
  return _((push, next) => {
    const r = Object.values(tables)
      .filter((t) => !t.columns);

    if (r.length === 0) {
      push(null, _.nil);
    } else {
      r.forEach((t) => {
        push(null, { t });
      });
      next();
    }
  })
};

const describe = (tableName) => {
  return `select owner, table_name, column_name, data_type, data_length, data_precision
  from all_tab_columns
 where table_name = '${tableName}' order by column_name`
};

const references = (tableName) => {
  return `SELECT a.table_name, a.column_name, 
-- referenced pk
c.r_owner, c_pk.table_name r_table_name, c_pk.constraint_name r_pk
FROM all_cons_columns a
JOIN all_constraints c ON a.owner = c.owner
                 AND a.constraint_name = c.constraint_name
JOIN all_constraints c_pk ON c.r_owner = c_pk.owner
                    AND c.r_constraint_name = c_pk.constraint_name
WHERE c.constraint_type = 'R'
AND a.table_name = '${tableName}'`
};

const referenced = (owner, tableName) => {
  return `select table_name, constraint_name, status, owner
  from all_constraints
  where r_owner = '${owner}'
  and constraint_type = 'R'
  and r_constraint_name in
   (
     select constraint_name from all_constraints
     where constraint_type in ('P', 'U')
     and table_name = '${tableName}'
     and owner = '${owner}'
   )
  order by table_name, constraint_name`
};

const execute = async (sql) => {
  // console.log('sql: ', sql);
  let connection;
  let result;

  try {
    connection = await oracledb.getConnection(dbConfig);
    // console.log('connection:', connection);

    result = await connection.execute(sql);
    // console.log('results:', result);
  } finally {
    /* istanbul ignore else */
    if (connection) {
      await connection.close();
      // console.log('closed');
    }
  }

  // console.log('returning: ', result.rows.length);
  return result;
};

const columns = (t, rows) => {
  t.prefix = rows[0].COLUMN_NAME.split('_')[0];
  t.discriminator = t.prefix.toLowerCase();
  t.idColumn = `${t.prefix}_ID`; // TODO may not be accurate
  t.load = `select * from ${t.schema}.${t.tableName} where ${t.prefix}_DELETED_DT IS NULL and ${t.prefix}_CLOSE_DT IS NULL and ${t.idColumn} > :offset  order by ${t.idColumn} fetch first :max rows only`

  t.columns = rows.reduce((a, r) => {
    return {
      ...a,
      [r.COLUMN_NAME]: {
        // name: r.COLUMN_NAME,
        type: r.DATA_TYPE,
      }
    }
  }, {});
  return t;
};

const m2o = (t, rows) => {
  rows.forEach((r) => {
    if (!tables[r.R_TABLE_NAME]) {
      tables[r.R_TABLE_NAME] = {
        schema: r.R_OWNER,
        tableName: r.R_TABLE_NAME,
        columns: true,
      }
    }

    t.columns[r.COLUMN_NAME].fk = {
      tableName: r.R_TABLE_NAME,
    }
  });
  return t;
};

const o2m = (t, rows) => {
  t.o2m = rows.reduce((a, r) => {
    // TOO MUCH - manually add tables to list
    if (!tables[r.TABLE_NAME]) {
      tables[r.TABLE_NAME] = {
        schema: r.OWNER,
        tableName: r.TABLE_NAME,
        sequenceName: `${r.TABLE_NAME}_SEQ`, // TODO remove plural
        columns: true,
      }
    }

    return {
      ...a,
      [r.TABLE_NAME]: {
        // name: r.TABLE_NAME,
        fk: r.CONSTRAINT_NAME, // x.replace('FK', 'ID'),
      }
    };
  }, {});
  return t;
};

const metadata = (uow) => {
  console.log('uow: ', uow);

  return _(Promise.all([
    execute(describe(uow.t.tableName)),
    execute(references(uow.t.tableName)),
    execute(referenced(uow.t.schema, uow.t.tableName)),
  ])
    .then(async (results) => {
      // console.log('results: ', JSON.stringify(results, null, 2));
      columns(uow.t, results[0].rows);
      m2o(uow.t, results[1].rows);
      o2m(uow.t, results[2].rows);

      // console.log(JSON.stringify(uow.t, null, 2));
      return uow;
    }));
};

const run = () => {
  more()
    .flatMap(metadata)
    // .tap(console.log)
    .done(() => {
      fs.writeFileSync('./output.json', JSON.stringify(tables, null, 2));
    });
};

run();
