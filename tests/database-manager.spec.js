var _ = require('lodash')
  , expect = require('chai').expect
  , dbManagerFactory = require('../lib').databaseManagerFactory
  , Promise = require('bluebird');

Promise.longStackTraces();

var postgresConf = {
  knex: {
    client: 'postgres',
    connection: {
      host: 'localhost',
      database: 'dbmanger-test-database-deleteme',
      // currently fail if these not found from postgres
      user: 'postgres',
      password: undefined
    },
    pool: {
      min: 0,
      max: 10
    },
    migrations: {
      directory: __dirname + '/migrations',
      tableName: 'testmigrations'
    }
  },
  dbManager: {
    collate: ['fi_FI.UTF-8', 'Finnish_Finland.1252'],
    superUser: 'postgres',
    superPassword: undefined
  }
};

var mysqlConf = { };

var sqliteConf = { };

/**
 * All tests depends that the ones ran earlier were success.
 */
describe('DatabaseManager', function() {

  var availableDatabases = [ dbManagerFactory(postgresConf) ];
  var dbCopyName = 'dbmanger-test-database-copy-deleteme';

  before(function () {
    // Make sure that database does not exist
    return Promise.all(
      _.map(availableDatabases, function (dbManager) {
        return Promise.all([
          dbManager.dropDb(dbManager.config.knex.database),
          dbManager.dropDb(dbCopyName)
        ]);
      })
    );
  });

  // TODO enable this when the knex bug #807 is fixed
  it.skip("#knexInstance should fail to create an instance with non existing db", function () {
    return Promise.all(
      _.map(availableDatabases, function (dbManager) {
        var knex = dbManager.knexInstance(dbManager.config.knex.database);
        return knex.raw(';')
          .then(function () {
            expect("Expected error from DB").to.fail();
          }).catch(function () {
            expect("All good!").to.be.ok();
          })
          .then(function () {
            knex.destroy();
          });
      })
    );
  });

  it("#createDb should create a database", function () {
    return Promise.all(
      _.map(availableDatabases, function (dbManager) {
        return dbManager.createDb(dbManager.config.knex.database)
          .then(function () {
            // connecting db should work
            var knex = dbManager.knexInstance(dbManager.config.knex.database);
            return knex.raw(';').then(function () {
              return knex.destroy();
            });
          });
      }));
  });

  it("#migrateDb should update version and run migrations", function () {
    return Promise.all(_.map(availableDatabases, function (dbManager) {
      return dbManager.dbVersion(dbManager.config.knex.database)
        .then(function (originalVersionInfo) {
          expect(originalVersionInfo).to.be('none');
          return dbManager.migrateDb(dbManager.config.knex.database);
        })
        .then(function (migrateResponse) {
          expect(migrateResponse[0]).to.be(1);
          return dbManager.dbVersion(dbManager.config.knex.database);
        })
        .then(function (versionInfo) {
          expect(versionInfo).to.be('20150623130922');
          return dbManager.migrateDb(dbManager.config.knex.database);
        })
        .then(function (migrateResponse) {
          expect(migrateResponse[0]).to.be(2);
          return dbManager.migrateDb(dbManager.config.knex.database);
        })
        .then(function (migrateResponse) {
          expect(migrateResponse[0]).to.be(2);
          return dbManager.dbVersion(dbManager.config.knex.database);
        })
        .then(function (versionInfo) {
          expect(versionInfo).to.be('20150623130922');
          return dbManager.migrateDb(dbManager.config.knex.database);
        });
      }));
  });

  it("#populateDb should populate data from given directory", function () {
    return Promise.all(
      _.map(availableDatabases, function (dbManager) {
        return dbManager.populateDb(dbManager.config.knex.database, __dirname + '/populate/*.js')
          .then(function () {
            var knex = dbManager.knexInstance(dbManager.config.knex.database);
            return knex.select().from('User').then(function (result) {
              expect(result[0].id).to.be('1');
            }).then(function () {
              return knex.destroy();
            });
          });
      }));
  });

  it("#copyDb should copy a database", function () {
    return Promise.all(
      _.map(availableDatabases, function (dbManager) {
        return dbManager.copyDb(dbManager.config.knex.database, dbCopyName)
          .then(function () {
            var knex = dbManager.knexInstance(dbCopyName);
            return knex.select().from('User')
              .then(function (result) {
                expect(result[0].id).to.be('1');
              })
              .then(function () {
                return knex.destroy();
              });
          });
      }));
  });

  it("#truncateDb should truncate a database", function () {
    return Promise.all(_.map(availableDatabases, function (dbManager) {
      return dbManager.truncateDb(dbManager.config.knex.database)
        .then(function (result) {
          var knex = dbManager.knexInstance(dbManager.config.knex.database);

          return Promise.all([
            knex.select().from('User').then(function (result) {
              expect(result.length).to.be(0);
            }),
            dbManager.dbVersion(dbManager.config.knex.database).then(function (ver) {
              expect(ver).to.be('20150623130922');
            }),
            knex('User').insert({
              username: 'new',
              email: 'imtadmin@fake.invalid'
            }).then(function () {
              return knex.select().from('User');
            }).then(function (result) {
              expect(result[0].id).to.be('1');
            })
          ])
          .then(function () {
            return knex.destroy();
          });
        });
    }));
  });

  it("#updateIdSequences should update primary key sequences", function () {
    return Promise.all(_.map(availableDatabases, function (dbManager) {
      var knex = dbManager.knexInstance(dbManager.config.knex.database);

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
        expect(users.length).to.be(1);
        expect(users[0].id).to.be('8');
      })
      .finally(function () {
        return knex.destroy();
      });
    }));
  });

  it("#updateIdSequences should work with empty table and with minimum value other than 1", function () {
    return Promise.all(_.map(availableDatabases, function (dbManager) {
      var knex = dbManager.knexInstance(dbManager.config.knex.database);

      return knex.select().from('IdSeqTest').then(function (result) {
        expect(result.length).to.be(0);

        // Set min value of sequence to other than 1 (100),
        // and current value to some other value so we can detect that it has changed.
        return knex.raw('ALTER SEQUENCE "IdSeqTest_id_seq" START 200 RESTART WITH 200 MINVALUE 100 ');
      }).then(function () {
        // DB manager caches the sequence names and min values,
        // so the cache needs to be reset.
        dbManager.cachedIdSequences_ = null;
        return dbManager.updateIdSequences();
      }).then(function () {
        return knex('IdSeqTest').insert({
          value: 'foo'
        });
      }).then(function () {
        return knex.select().from('IdSeqTest');
      }).then(function (result) {
        expect(result.length).to.be(1);
        expect(result[0].id).to.be('100');
      })
      .finally(function () {
        return knex.destroy();
      });
    }));
  });

  // TODO enable this when the knex bug #807 is fixed
  it.skip("#dropDb should drop a database", function () {
    return Promise.all(
      _.map(availableDatabases, function (dbManager) {
        return Promise.all([
          dbManager.dropDb(dbManager.config.knex.database),
          dbManager.dropDb(dbCopyName),
          dbManager.dropDb(dbCopyName) // this should not fail
        ]).then(function () {
          // test db was dropped
          var knex = dbManager.knexInstance(dbManager.config.knex.database);
          return knex.raw(';').then(function () {
            expect("Expected error from DB").to.fail();
          })
          .catch(function (err) {
            expect("All good!").to.be.ok();
          })
          .then(function () {
            knex.destroy();
          });

        }).then(function () {
          // copy db was dropped
          var knex = dbManager.knexInstance(dbCopyName);
          return knex.raw(';').then(function () {
            expect("Expected error from DB").to.fail();
          })
          .catch(function () {
            expect("All good!").to.be.ok();
          })
          .then(function () {
            knex.destroy();
          });
        });
      }));
  });

});
