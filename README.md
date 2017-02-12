---
title: Tool to create / drop / truncate / copy SQL database
---

[![Build Status](https://travis-ci.org/Vincit/knex-db-manager.svg?branch=master)](https://travis-ci.org/Vincit/knex-db-manager)
[![Coverage Status](https://coveralls.io/repos/github/Vincit/knex-db-manager/badge.svg?branch=master)](https://coveralls.io/github/Vincit/knex-db-manager?branch=master)

Pretty useful when writing scripts to initialize database for fresh install or
dropping / creating new database when running tests and for truncating database
between tests.

Library uses knex connection for non administrative queries, but also creates
priviliged connection directly with driver with superuser privileges for creating
and dropping databases / roles.

## Supported Databases {#SupportedDatabases}

* PostgreSQL
* ~~MySQL (TBD)~~
* ~~SQLite3 (TBD even though most of the functions won't make sense with this)~~
* ~~Oracle DB Express (TBD)~~
* ~~MSSQL (TBD if we can get integration tests to run automatically)~~

## Install {#install}

You need to install `knex`, database driver and `knex-db-manager`

```
npm install knex-db-manager knex pg pg-escape
```

## API & Usage {#apiAndUsage}

Database manager is initialized with normal `knex` configuration and with
superuser account which should be able to create / drop roles and databases.

> Initialization:

```js
let config = {
  knex: {
    // just the usual knex configuration
    client: 'postgres',
    connection: {
      host: 'localhost',
      database: 'appdb',
      user: 'dbowneruser',
      password: 'dbownerpassword'
    },
    pool: {
      min: 0,
      max: 10
    },
    migrations: {
      directory: __dirname + '/migrations'
    }
  },
  dbManager: {
    // db manager related configuration
    collate: ['fi_FI.UTF-8', 'Finnish_Finland.1252'],
    superUser: 'userwithrightstocreateusersanddatabases',
    superPassword: 'privilegeduserpassword'
  }
};

let dbManager = require('knex-db-manager').databaseManagerFactory(config);
```

### `createDbOwnerIfNotExist(): Promise<void>` {#createDbOwnerIfNotExist}

Creates the user, which is described in `knex` configuration. This user is used as
the database owner when creating new databases.

```js
let promise = dbManager.createDbOwnerIfNotExist();
```


### `createDb(dbName?: string): Promise<void>` {#createDb}

Creates database described in `knex` configuration or by given name. Owner of the
created database is set to be the `config.knex.connection.user`.

`dbName` is the name of the database to be created, if not given the name is read
from `config.knex.connection.database`.

> Read database from `config.knex.connection.database`:

```js
let promise = dbManager.createDb();
```

> By given name:

```js
let promise = dbManager.createDb('brave-new-db');
```


### `dropDb(dbName?: string): Promise<void>` {#dropDb}

Drops database described in `knex` configuration or by given name. Note
that if there are any active connections to the database that is being
dropped, the drop command might fail.

`dbName` is the name of the database to be dropped, if not given the name
is read from `config.knex.connection.database`.

> Drop database `config.knex.connection.database`:

```js
let promise = dbManager.dropDb();
```

> By specific name:

```js
let promise = dbManager.dropDb('brave-new-db');
```


### `copyDb(fromDbName: string, toDbName: string): Promise<void>` {#copyDb}

Clones database to another name remotely on db serverside (may be useful e.g.
to make backup before running migrations).

New database `toDatabaseName` will be created containing a copy of `fromDbName`.

> Making copy of DB:

```js
let promise = dbManager.copyDb('brave-new-db', 'brave-new-db-copy');
```


### `truncateDb(ignoreTables?: string[]): Promise<void>` {#truncateDb}

Truncate tables of the database and reset corresponding id sequences.

`ignoreTables` list of tables names which should not be truncated.

> Truncate database `config.knex.connection.database`:

```js
let promise = dbManager.truncateDb();
```

> ignore certain tables:

```js
let promise = dbManager.truncateDb(['migrations']);
```


### `updateIdSequences(): Promise<void>` {#updateIdSequences}

Updates all primary key id sequences to be biggest id in table + 1.
So after running this next `INSERT` to table will get valid id for
the row from the sequence.

This was motivated by some people who liked to create test data with
hard coded ids, so this helps them to make app to work normally after
adding rows to tables, which has not used id sequence to get ids.

The function assumes that the primary key for each table is called `id`.

> Reset sequence of database `config.knex.connection.database`:

```js
let promise = dbManager.updateIdSequences();
```


### `populateDb(glob: string): Promise<void>` {#populateDb}

Finds `knex` seed files by pattern and populate database with them.

`glob` is a pattern to match files to be ran, if not given the name is
read from `config.dbManager.populatePathPattern`.

> Get database from `config.knex.connection.database` and pattern
> from `config.dbManager.populatePathPattern`:

```js
let promise = dbManager.populateDb();
```

> with pattern:

```js
let promise = dbManager.populateDb(
    path.join(__dirname, 'seeds', 'test-*')
  );
```


### `migrateDb(): Promise<void>` {#migrateDb}

Runs `knex` migrations configured in knex config.

> Get database from `config.knex.connection.database`:

```js
let promise = dbManager.migrateDb();
```


### `dbVersion(): Promise<string>` {#dbVersion}

Checks which migrations has been ran to database.

Expects that migration name starts with timestamp.

If no migrations has been run, promise resolves to `'none'`. Otherwise
resolves to first numbers of latest migration file ran e.g. for
`20141024070315_test_schema.js` version will be `'20141024070315'`.

> Get database from `config.knex.connection.database`:

```js
let promise = dbManager.dbVersion();
```


### `close(): Promise<void>` {#close}

Closes the single privileged connection to database server.

> Kill database connection:

```js
let promise = dbManager.close();
```


### `closeKnex(): Promise<void>` {#closeKnex}

Closes knex connection which is made to the database for unprivileged
queries. Sometimes this is needed e.g. for being able to drop database.

> Close knex connection

```js
let promise = dbManager.closeKnex();
```


### `knexInstance(): QueryBuilder` {#knexInstance}

Returns `knex` query builder bound to configured database.

> Get database from `config.knex.connection.database`:

```js
let knex = dbManager.knexInstance();
knex('table').where('id', 1)
  .then(rows => {
    console.log('Query was ran with db owner privileges', rows);
  });
```
