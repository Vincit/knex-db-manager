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

## install

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
databaseName|string&#124; undefined| Name of the database to create, if not given the name is read from config.knex.connection.database .

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Promise the will be resolved on success and rejected on any error.

### dropDb

Drops database described in `knex` configuration or by given name.

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
databaseName|string&#124; undefined| Name of the database to create, if not given the name is read from config.knex.connection.database .

#### Return value

Type|Description
----|-----------------------------
[`Promise<void>`](http://bluebirdjs.com/docs/getting-started.html)|Promise the will be resolved on success and rejected on any error.

### copyDb

### truncateDb

### updateIdSequences

### populateDb

### migrateDb

### dbVersion

### close

### knexInstance
