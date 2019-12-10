var _ = require('lodash')
  , Knex = require('knex')
  , Promise = require('bluebird')
  , multiRequire = require('./multi-require').multiRequire;

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
  this._knex = null;
}

/**
 * Creates user which is used to access the database described in knex configuration.
 *
 * @returns {Promise} Resolves if success reject if user could not be created for some reason.
 */
DatabaseManager.prototype.createDbOwnerIfNotExist = function() {
  throw new Error(this.constructor.name + '.createDbOwner not implemented');
};

/**
 * Creates and initializes a database `databaseName`.
 *
 * Rejects promise if databaseName already exists or could not
 * be created.
 *
 * @param {String=} databaseName if not given, database from knex config is used
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
 * Truncates all tables in the database from knex configuration and also resets all
 * sequences.
 *
 * @returns {Promise}
 */
DatabaseManager.prototype.truncateDb = function(ignoreTables) {
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
 * @returns {Promise}
 */
DatabaseManager.prototype.updateIdSequences = function() {
  throw new Error(this.constructor.name + '.updateIdSequences not implemented');
};

/**
 * Populate database.
 *
 * @param {String=} populatePathPattern
 * @returns {Promise}
 */
DatabaseManager.prototype.populateDb = function(populatePathPattern) {
  populatePathPattern = populatePathPattern || this.config.dbManager.populatePathPattern;

  var knex = this.knexInstance();
  var modules = multiRequire(populatePathPattern).filterModule(_.isFunction).require();

  return Promise
    .all(_.map(modules, function (module) {
      return knex.transaction(function (trx) {
        return module.module(trx);
      });
    }));
};

/**
 * Runs migrations for database in knex config.
 *
 * @returns {Promise}
 */
DatabaseManager.prototype.migrateDb = function() {
  var knex = this.knexInstance();
  return knex.migrate.latest();
};

/**
 * Gets the migration version of the database of knex config.
 *
 * If no migrations run returns 'none'
 * Otherwise returns first numbers of latest migration file ran
 * e.g. for 20141024070315_test_schema.js version will be
 * '20141024070315'
 *
 * @returns {Promise}
 */
DatabaseManager.prototype.dbVersion = function() {
  var knex = this.knexInstance();
  return knex.migrate.currentVersion();
};

/**
 * Closes all connections made by the the manager.
 *
 * @returns {Promise}
 */
DatabaseManager.prototype.close = function() {
  throw new Error(this.constructor.name + '.close not implemented');
};

/**
 * Closes connection made with knex directly to certain database
 */
DatabaseManager.prototype.closeKnex = function() {
  if (this._knex) {
    knex = this._knex;
    this._knex = null;
    return knex.destroy();
  }
  return Promise.resolve();
};

/**
 * @return {QueryBuilder} Knex query builder for knex configuration.
 */
DatabaseManager.prototype.knexInstance = function() {
  if (!this._knex) {
    this._knex = Knex(this.config.knex);
  }
  return this._knex;
};

module.exports = {
  default: DatabaseManager,
  DatabaseManager: DatabaseManager
}
