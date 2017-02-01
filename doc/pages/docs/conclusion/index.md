---
title: knex-db-manager Tools to initialize your knex database
---

[![Build Status](https://travis-ci.org/Vincit/knex-db-manager.svg?branch=master)](https://travis-ci.org/Vincit/knex-db-manager)
[![Coverage Status](https://coveralls.io/repos/github/Vincit/knex-db-manager/badge.svg?branch=master)](https://coveralls.io/github/Vincit/knex-db-manager?branch=master)

# Tool to create / drop / truncate databases and to run knex migration / populate scripts

Pretty useful when writing scripts to initialize database for fresh install or dropping / creating
new database when running tests and for truncating database between tests.

Library uses knex connection for non administrative queries, but also creates priviliged connection
directly with driver with superuser privileges for creating and dropping databases / roles.

## Supported databases

* PostgreSQL
* ~~MySQL (TBD)~~
* ~~SQLite3 (TBD even though most of the functions won't make sense with this)~~
* ~~Oracle DB Express (TBD)~~
* ~~MSSQL (TBD if we can get integration tests to run automatically)~~

## Install

You need to install `knex`, database driver and `knex-db-manager`

```
npm install knex-db-manager knex pg
```

## API & Usage

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

let dbManager = require('knex-db-manager')(config);
```

## DatabaseManager

### createDbOwnerIfNotExist

Creates the user, which is described in `knex` configuration. This user is used as
the database owner when creating new databases.

```js
let promise = dbManager.createDbOwnerIfNotExist();
```

#### Arguments

None

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Promise will be resolved on success and rejected on unexpected error.

### createDb

Creates database described in `knex` configuration or by given name.

> Read database from `config.knex.connection.database`:

```js
let promise = dbManager.createDb();
```

> By given name:

```js
let promise = dbManager.createDb('brave-new-db');
```

#### Arguments

Argument|Type|Description
--------|----|--------------------
databaseName|string&#124; undefined| Name of the database, if not given the name is read from `config.knex.connection.database`.

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Promise the will be resolved on success and rejected on any error.

### dropDb

Drops database described in `knex` configuration or by given name. Remember that if DB has active
connections trying to drop DB may fail.

> Drop database `config.knex.connection.database`:

```js
let promise = dbManager.dropDb();
```

> By specific name:

```js
let promise = dbManager.dropDb('brave-new-db');
```

#### Arguments

Argument|Type|Description
--------|----|--------------------
databaseName|string&#124; undefined| Name of the database, if not given the name is read from `config.knex.connection.database`.

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Promise the will be resolved on success and rejected on any error.

### copyDb

Clones database to another name remotely on db serverside (may be useful e.g. to make backup before running migrations).

> Making copy of DB:

```js
let promise = dbManager.copyDb('brave-new-db', 'brave-new-db-copy');
```

#### Arguments

Argument|Type|Description
--------|----|--------------------
fromDatabaseName|string| Source database name.
toDatabaseName|string| Name of the new database which will be created.

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Promise the will be resolved on success and rejected on any error.

### truncateDb

Truncate tables of the database and reset corresponding id sequences.

> Truncate database `config.knex.connection.database`:

```js
let promise = dbManager.truncateDb();
```

> ignore certain tables:

```js
let promise = dbManager.truncateDb(['migrations']);
```

#### Arguments

Argument|Type|Description
--------|----|--------------------
ignoreTables|Array.&lt;string.&gt; &#124; undefined| List of tables names which should not be truncated.

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Promise the will be resolved on success and rejected on any error.

### updateIdSequences

Updates all primary key id sequences to be biggest id in table + 1. So after running this next
`INSERT` to table will get valid id for the row from the sequence.

This was motivated by some people who liked to create test data with hard coded ids, 
so this helps them to make app to work normally after adding rows to tables, which has 
not used id sequence to get ids.

The function assumes that the primary key for each table is called `id`.

> Reset sequence of database `config.knex.connection.database`:

```js
let promise = dbManager.updateIdSequences();
```

#### Arguments

None

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Promise the will be resolved on success and rejected on any error.

### populateDb

Finds `knex` seed files by pattern and populate database with them.

> Get database from `config.knex.connection.database` and pattern from `config.dbManager.populatePathPattern`:

```js
let promise = dbManager.populateDb();
```

> with pattern:

```js
let promise = dbManager.populateDb(path.join(__dirname, 'seeds', 'test-*'));
```

#### Arguments

Argument|Type|Description
--------|----|--------------------
pattern|string&#124; undefined| Pattern to match files to be ran, if not given the name is read from `config.dbManager.populatePathPattern`.

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Promise the will be resolved on success and rejected on any error.

### migrateDb

Runs `knex` migrations configured in knex config.

> Get database from `config.knex.connection.database`:

```js
let promise = dbManager.migrateDb();
```

#### Arguments

None

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Promise the will be resolved on success and rejected on any error.

### dbVersion

Checks which migrations has been ran to database.

Expects that migration name starts with timestamp.

> Get database from `config.knex.connection.database`:

```js
let promise = dbManager.dbVersion();
```

#### Arguments

None

#### Return value

Type|Description
----|-----------------------------
[`Promise<string>`](http://bluebirdjs.com/docs/getting-started.html)|
If no migrations run resolves `'none'`. Otherwise resolves to first numbers of latest migration 
file ran e.g. for `20141024070315_test_schema.js` version will be `'20141024070315'`.

### close

Closes connection to database server. 

> Kill database connection:

```js
let promise = dbManager.close();
```

#### Arguments

None

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Resolves after connection is closed.

### closeKnex

Closes knex connection which is made to the database for unprivileged queries. Sometimes this is needed e.g. 
for being able to drop database.

> Close knex connection

```js
let promise = dbManager.closeKnex();
```

#### Arguments

None

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Resolves after connection is closed.


### knexInstance

Returns `knex` query builder bound to configured database.

> Get database from `config.knex.connection.database`:

```js
let knex = dbManager.knexInstance();
knex('table').where('id', 1).then(rows => console.log('Query was ran with db owner privileges', rows));
```

#### Arguments

None

#### Return value

Type|Description
----|-----------------------------
[`QueryBuilder`](http://knexjs.org/#Builder)|Knex query builder bound to given database.
