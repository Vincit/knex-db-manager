var _ = require('lodash')
  , expect = require('chai').expect
  , dbManagerFactory = require('../lib').databaseManagerFactory
  , Bluebird = require('bluebird')
  , Knex = require('knex');

Bluebird.longStackTraces();

var connection = {
  host: 'localhost',
  database: 'dbmanger-test-database-deleteme',
  user: 'knexdbmanagerdbowneruser',
  password: 'knexdbmanagerdbowneruserpassword'
};

var pool = {
  min: 0,
  max: 10
};

var migrations = {
  directory: __dirname + '/migrations',
  tableName: 'testmigrations'
};

var postgresConf = {
  knex: {
    client: 'postgres',
    connection: _.assign({}, connection, {
      port: 15432
    }),
    pool: pool,
    migrations: migrations
  },
  dbManager: {
    collate: ['fi_FI.UTF-8', 'Finnish_Finland.1252', 'en_US.utf8', 'C.UTF-8'],
    superUser: process.env.POSTGRES_SUPERUSER || 'postgres',
    superPassword: process.env.POSTGRES_SUPERUSER_PW || 'postgresrootpassword'
  }
};

var mySqlConf = {
  knex: {
    client: 'mysql',
    connection: _.assign({}, connection, {
      port: 13306
    }),
    pool: pool,
    migrations: migrations
  },
  dbManager: {
    collate: ['utf8_swedish_ci'],
    superUser: 'root',
    superPassword: 'mysqlrootpassword'
  }
};

var sqliteConf = {
  knex: {
    client: 'sqlite',
    connection: connection,
    pool: pool,
    migrations: migrations
  },
  dbManager: {
  }
};

/**
  wnameless/oracle-xe-11g
  hostname: localhost
  port: 11521
  sid: xe
  username: system
  password: oracle
  Password for SYS & SYSTEM
 */
var oracleConf = {
  knex: {
    client: 'oracledb',
    connection: _.assign({}, connection, {
      port: 1521,
      connectString: 'localhost/XE',
      stmtCacheSize : 0
    }),
    pool: pool,
    migrations: migrations
  },
  dbManager: {
    collate: ['fi_FI.UTF-8', 'Finnish_Finland.1252', 'en_US.utf8', 'C.UTF-8'],
    superUser: process.env.ORACLE_SUPERUSER || 'sys',
    superPassword: process.env.ORACLE_SUPERUSER_PW || 'oracle'
  }
};

var mssqlConf = {
  knex: {
    client: 'mssql',
    connection: _.assign({}, connection, {
      port: 11433
    }),
    pool: pool,
    migrations: migrations
  },
  dbManager: {
    collate: ['fi_FI.UTF-8', 'Finnish_Finland.1252', 'en_US.utf8', 'C.UTF-8'],
    superUser: process.env.MSSQL_SUPERUSER || 'sa',
    superPassword: process.env.MSSQL_SUPERUSER_PW || 'mssqlpassword'
  }
};

function knexWithCustomDb(dbManager, dbName) {
  var tempKnex = _.cloneDeep(dbManager.config.knex);
  tempKnex.client.database = dbName;
  return Knex(tempKnex);
}

/**
 * All tests depends that the ones ran earlier were success.
 */
var availableDatabases = [
  // TBD: dbManagerFactory(sqliteConf),
  dbManagerFactory(postgresConf),
  dbManagerFactory(mySqlConf),
  // dbManagerFactory(oracleConf),
  // dbManagerFactory(mssqlConf),
];

var dbCopyName = 'dbmanger-test-database-copy-deleteme';

_.map(availableDatabases, function (dbManager) {

  describe('Testing ' + dbManager.config.knex.client, function() {

    before(function () {
      // Make sure that database does not exist
      return dbManager.createDbOwnerIfNotExist().then(function () {
        return Bluebird.all([
          dbManager.dropDb(dbManager.config.knex.connection.database),
          dbManager.dropDb(dbCopyName)
        ]);
      });
    });

    it("#knexInstance should fail to create an instance with non existing db", function () {
      var knex = dbManager.knexInstance();
      return knex.raw('SELECT 1')
        .then(function () {
          expect("Expected error from DB").to.fail();
        }).catch(function () {
          expect("All good!").to.be.string;
        });
    });

    it("#createDb should create a database", function () {
      return dbManager.createDb(dbManager.config.knex.connection.database)
        .then(function () {
          // connecting db should work
          var knex = dbManager.knexInstance();
          return knex.raw('SELECT 1');
        });
    });

    it("#migrateDb should update version and run migrations", function () {
      return dbManager.dbVersion(dbManager.config.knex.connection.database)
        .then(function (originalVersionInfo) {
          expect(originalVersionInfo).to.equal('none');
          return dbManager.migrateDb(dbManager.config.knex.connection.database);
        })
        .then(function (migrateResponse) {
          expect(migrateResponse[0]).to.equal(1);
          return dbManager.dbVersion(dbManager.config.knex.connection.database);
        })
        .then(function (versionInfo) {
          expect(versionInfo).to.equal('20150623130922');
          return dbManager.migrateDb(dbManager.config.knex.connection.database);
        })
        .then(function (migrateResponse) {
          expect(migrateResponse[0]).to.equal(2);
          return dbManager.migrateDb(dbManager.config.knex.connection.database);
        })
        .then(function (migrateResponse) {
          expect(migrateResponse[0]).to.equal(2);
          return dbManager.dbVersion(dbManager.config.knex.connection.database);
        })
        .then(function (versionInfo) {
          expect(versionInfo).to.equal('20150623130922');
          return dbManager.migrateDb(dbManager.config.knex.connection.database);
        });
    });

    it("#populateDb should populate data from given directory", function () {
      return dbManager.populateDb(__dirname + '/populate/*.js')
        .then(function () {
          var knex = dbManager.knexInstance();
          return knex.select().from('User').then(function (result) {
            expect(parseInt(result[0].id)).to.equal(1);
          });
        });
    });

    it("#copyDb should copy a database", function () {
      // CopyDB not implemented on MySqlDatabaseManager yet...
      if (dbManager.config.knex.client === 'mysql') {
        return;
      }
      return dbManager.copyDb(dbManager.config.knex.connection.database, dbCopyName)
        .then(function () {
          var knex = knexWithCustomDb(dbManager, dbCopyName);
          return knex.select().from('User')
            .then(function (result) {
              expect(result[0].id).to.equal('1');
            })
            .finally(function () {
              knex.destroy();
            });
        });
    });

    it("#truncateDb should truncate a database", function () {
      return dbManager.truncateDb([migrations.tableName, 'Ignoreme'])
        .then(function (result) {
          var knex = dbManager.knexInstance();

          return Bluebird.all([
            knex.select().from('User').then(function (result) {
              expect(result.length).to.equal(0);
            }),
            knex.select().from('Ignoreme').then(function (result) {
              expect(result.length).to.equal(1);
            }),
            dbManager.dbVersion(dbManager.config.knex.connection.database).then(function (ver) {
              expect(ver).to.equal('20150623130922');
            }),
            knex('User').insert({
              username: 'new',
              email: 'imtadmin@fake.invalid'
            }).then(function () {
              return knex.select().from('User');
            }).then(function (result) {
              expect(parseInt(result[0].id)).to.equal(1);
            })
          ]);
        });
    });

    it("#updateIdSequences should update primary key sequences", function () {
      // UpdateIdSequences not implemented on MySqlDatabaseManager yet...
      if (dbManager.config.knex.client === 'mysql') {
        return;
      }

      var knex = dbManager.knexInstance();

      return knex('User').insert([
        { id: 5, username: 'new1', email: 'new_1@example.com' },
        { id: 6, username: 'new2', email: 'new_2@example.com' },
        { id: 7, username: 'new3', email: 'new_3@example.com' }
      ]).then(function () {
        return dbManager.updateIdSequences();
      }).then(function () {
        return knex('User').insert({
          username: 'new4', email: 'new_4@example.com'
        });
      }).then(function () {
        return knex.select().where('username', 'new4').from('User');
      }).then(function (users) {
        expect(users.length).to.equal(1);
        expect(users[0].id).to.equal('8');
      });
    });

    it("#updateIdSequences should work with empty table and with minimum value other than 1", function () {
      // UpdateIdSequences not implemented on MySqlDatabaseManager yet...
      if (dbManager.config.knex.client === 'mysql') {
        return;
      }

      var knex = dbManager.knexInstance();

      return knex.select().from('IdSeqTest').then(function (result) {
        expect(result.length).to.equal(0);

        // Set min value of sequence to other than 1 (100),
        // and current value to some other value so we can detect that it has changed.
        return knex.raw('ALTER SEQUENCE "IdSeqTest_id_seq" START 200 RESTART WITH 200 MINVALUE 100 ');
      }).then(function () {
        // DB manager caches the sequence names and min values,
        // so the cache needs to be reset.
        dbManager._cachedIdSequences = null;
        return dbManager.updateIdSequences();
      }).then(function () {
        return knex('IdSeqTest').insert({
          value: 'foo'
        });
      }).then(function () {
        return knex.select().from('IdSeqTest');
      }).then(function (result) {
        expect(result.length).to.equal(1);
        expect(result[0].id).to.equal('100');
      });
    });

    it("#dropDb should drop a database", function () {
        return Bluebird.all([
          dbManager.dropDb(dbManager.config.knex.connection.database),
          dbManager.dropDb(dbCopyName),
          dbManager.dropDb(dbCopyName) // this should not fail
        ]).then(function () {
          // test db was dropped
          var knex = dbManager.knexInstance();
          return knex.raw('SELECT 1').then(function () {
            expect("Expected error from DB").to.fail();
          })
          .catch(function (err) {
            expect("All good!").to.be.string;
          });

        }).then(function () {
          var knex = knexWithCustomDb(dbManager, dbCopyName);
          return knex.raw('SELECT 1').then(function () {
            expect("Expected error from DB").to.fail();
          })
          .catch(function () {
            expect(!!"All good!").to.be.string;
          })
          .finally(function () {
            knex.destroy();
          });
        });
    });

    it('should reconnect if used after .close', function () {
      return dbManager.close()
        .then(function () {
          return dbManager.dropDb();
        })
        .then(function () {
          return dbManager.createDb();
        })
        .then(function () {
          return dbManager.migrateDb();
        });
    });

    it('should create database with default collate', function () {
      dbManager.config.dbManager.collate = null;
      return dbManager.dropDb()
        .then(function () {
          return dbManager.createDb();
        });
    });
  });
});

describe('Postgresql only tests', () => {
  var manager1 = null;
  var manager2 = null;

  before(() => {
    manager1 = dbManagerFactory(postgresConf);
    manager2 = dbManagerFactory(postgresConf);
  });

  before(() => manager1.dropDb('testdb1'));
  before(() => manager1.dropDb('testdb2'));

  after(() => {
    return Bluebird.all([
      manager1.dropDb('testdb1'),
      manager1.dropDb('testdb2')
    ]).then(() => {
      return Bluebird.all([
        manager1.close(),
        manager2.close()
      ]);
    });
  })

  it('should be able to create 2 DBs with 2 clients at the same time', () => {
    return Bluebird.all([
      manager1.createDb('testdb1'),
      manager2.createDb('testdb2')
    ]);
  });

});
