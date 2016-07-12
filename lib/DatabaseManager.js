var _ = require('lodash')
  , Knex = require('knex')
  , Promise = require('bluebird')
  , multiRequire = require('dodo/lib/utils/multi-require');

/**
 * Base class for database managers.
 *
 * Database manager is used to create/drop databases, run migrations for them and doing other "super user" stuff.
 *
 * @constructor
 * @param {object} config
 *    Database configuration. See `index.js` for example config and `database` feature for further description.
 */
function DatabaseManager(config) {
  this.config = config;
}

/**
 * Creates and initializes a database `databaseName`.
 *
 * Rejects promise if databaseName already exists or could not
 * be created.
 *
 * @param {String=} databaseName
 * @returns {Promise}
 */
DatabaseManager.prototype.createDb = function(databaseName) {
  throw new Error(this.constructor.name + '.initDb not implemented');
};

/**
 * Drops the database `databaseName`.
 *
 * @param {String=} databaseName
 * @returns {Promise}
 */
DatabaseManager.prototype.dropDb = function(databaseName) {
  throw new Error(this.constructor.name + '.dropDb not implemented');
};

/**
 * Makes copy of database.
 *
 * Good for backing up stuff before running migrations etc.
 *
 * @param {String} fromDatabaseName
 * @param {String} toDatabaseName
 * @returns {Promise}
 */
DatabaseManager.prototype.copyDb = function(fromDatabaseName, toDatabaseName) {
  throw new Error(this.constructor.name + '.copyDb not implemented');
};

/**
 * Truncates all tables in the database `databaseName` and also resets all
 * sequences.
 *
 * @param {String=} databaseName
 * @returns {Promise}
 */
DatabaseManager.prototype.truncateDb = function(databaseName) {
  throw new Error(this.constructor.name + '.truncateDb not implemented');
};

/**
 * Updates the primary key sequences for all tables so that next insert selects
 * correct id (one that does not conflict with previous ids and is valid).
 *
 * This means that the next id will be greater (by 1) than currently largest
 * id in the table. If the table is empty, minimum value for the key sequence
 * will be used instead.
 *
 * This function assumes that the primary key for each table is called `id`.
 *
 * @param {String=} databaseName
 * @returns {Promise}
 */
DatabaseManager.prototype.updateIdSequences = function(databaseName) {
  throw new Error(this.constructor.name + '.updateIdSequences not implemented');
};

/**
 * Populate database.
 *
 * @param {String=} databaseName
 * @param {String=} populatePathPattern
 * @returns {Promise}
 */
DatabaseManager.prototype.populateDb = function(databaseName, populatePathPattern) {
  databaseName = databaseName || this.config.knex.connection.database;
  populatePathPattern = populatePathPattern || this.config.populatePathPattern;

  var knex = this.knexInstance(databaseName);
  var modules = multiRequire(populatePathPattern).filterModule(_.isFunction).require();
  return Promise
    .all(_.map(modules, function (module) {
      return module.module(knex);
    }))
    .tap(function () { knex.destroy(); })
    .catch(function(err) {
      knex.destroy();
      throw err;
    });
};

/**
 * Runs migrations for database `databaseName`.
 *
 * @param {String=} databaseName
 * @returns {Promise}
 */
DatabaseManager.prototype.migrateDb = function(databaseName) {
  var knex = this.knexInstance(databaseName);
  return knex.migrate.latest()
    .tap(function () { knex.destroy(); })
    .catch(function(err) {
      knex.destroy();
      throw err;
    });
};

/**
 * Gets the migration version of the database `databaseName`.
 *
 * If no migrations run returns 'none'
 * Otherwise returns first numbers of latest migration file ran
 * e.g. for 20141024070315_test_schema.js version will be
 * '20141024070315'
 *
 * @param {String=} databaseName
 * @returns {Promise}
 */
DatabaseManager.prototype.dbVersion = function(databaseName) {
  var knex = this.knexInstance(databaseName);
  return knex.migrate.currentVersion()
    .tap(function () { knex.destroy(); })
    .catch(function(err) {
      knex.destroy();
      throw err;
    });
};

/**
 * Closes the manager.
 *
 * @returns {Promise}
 */
DatabaseManager.prototype.close = function() {
  throw new Error(this.constructor.name + '.close not implemented');
};

/**
 * @return {QueryBuilder} When query builder is executed, it should fail if ´databaseName´ does not exist.
 */
DatabaseManager.prototype.knexInstance = function(databaseName) {
  var config = _.clone(this.config);
  if (databaseName) {
    config.knex.connection.database = databaseName;
  }
  return Knex(config.knex);
};

module.exports = DatabaseManager;
