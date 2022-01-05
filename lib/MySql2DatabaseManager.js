var DatabaseManager = require('./DatabaseManager').default,
  classUtils = require('./class-utils'),
  mysql = require('mysql2'),
  Promise = require('bluebird'),
  _ = require('lodash');

/**
 * @constructor
 * @extends DatabaseManager
 *
 * Notes:
 *   - Even though the method signature implicates that _masterConnectionUrl returns
 *     an URL string, it actually returns an object because MySQL node lib
 *     assumes that the database name is defined in the URL format.
 *
 */
function MySql2DatabaseManager() {
  DatabaseManager.apply(this, arguments);
  this._masterClient = null;
  this._cachedTableNames = null;
}

classUtils.inherits(MySql2DatabaseManager, DatabaseManager);

/**
 * @Override
 */
MySql2DatabaseManager.prototype.createDbOwnerIfNotExist = function() {
  return this._masterQuery("CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?", [
    this.config.knex.connection.user,
    this.config.knex.connection.password,
  ]);
};

/**
 * @Override
 */
MySql2DatabaseManager.prototype.createDb = function(databaseName) {
  databaseName = databaseName || this.config.knex.connection.database;
  var collate = this.config.dbManager.collate;
  var owner = this.config.knex.connection.user;
  var self = this;
  var promise = Promise.reject(new Error());

  if (_.isEmpty(collate)) {
    promise = promise.catch(function() {
      return self._masterQuery(
        'CREATE DATABASE ?? DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci',
        [databaseName]
      );
    });
  } else {
    // Try to create with each collate. Use the first one that works. This is kind of a hack
    // but seems to be the only reliable way to make this work with both windows and unix.
    _.each(collate, function(locale) {
      promise = promise.catch(function() {
        return self._masterQuery(
          'CREATE DATABASE ?? DEFAULT CHARACTER SET utf8 DEFAULT COLLATE ?',
          [databaseName, locale]
        );
      });
    });
  }

  promise = promise.then(function() {
    return self._masterQuery('GRANT ALL PRIVILEGES ON ??.* TO ??', [
      databaseName,
      owner,
    ]);
  });

  return promise;
};

/**
 * Drops database with name if db exists.
 *
 * @Override
 */
MySql2DatabaseManager.prototype.dropDb = function(databaseName) {
  databaseName = databaseName || this.config.knex.connection.database;
  return this._masterQuery('DROP DATABASE IF EXISTS ??', [databaseName]);
};

/**
 * @Override
 */
MySql2DatabaseManager.prototype.truncateDb = function(ignoreTables) {
  var knex = this.knexInstance();
  var config = this.config;

  if (!this._cachedTableNames) {
    this._updateTableNameCache(knex, config);
  }

  return this._cachedTableNames.then(function(tableNames) {
    if (!_.isEmpty(tableNames)) {
      return knex.transaction(function(trx) {
        return knex
          .raw('SET FOREIGN_KEY_CHECKS = 0')
          .transacting(trx)
          .then(function() {
            // ignore the tables based on `ignoreTables`
            var filteredTables = _.differenceWith(
              tableNames,
              ignoreTables,
              _.isEqual
            );
            return Promise.map(
              filteredTables,
              function(tableName) {
                return knex
                  .table(tableName)
                  .truncate()
                  .transacting(trx);
              },
              { concurrency: 1 }
            );
          });
      });
    }
  });
};

/**
 * @private
 */
MySql2DatabaseManager.prototype._updateTableNameCache = function(knex, config) {
  this._cachedTableNames = knex('information_schema.TABLES')
    .select('TABLE_NAME')
    .where('TABLE_SCHEMA', config.knex.connection.database)
    .then(function(tables) {
      return _.without(
        _.map(tables, 'TABLE_NAME'),
        config.knex.migrations.tableName
      );
    });
};

/**
 * @Override
 */
MySql2DatabaseManager.prototype.close = function() {
  var disconnectAll = [this.closeKnex()];
  if (this._masterClient) {
    disconnectAll.push(
      this._masterClient.then(function(client) {
        client.end();
      })
    );
    this._masterClient = null;
  }
  return Promise.all(disconnectAll);
};

/**
 * @private
 * @returns {Promise}
 */
MySql2DatabaseManager.prototype._masterQuery = function(query, params) {
  var self = this;
  if (!this._masterClient) {
    this._masterClient = this.create_masterClient();
  }
  return this._masterClient.then(function(client) {
    return self.perform_masterQuery(client, query, params);
  });
};

/**
 * @private
 * @returns {Promise}
 */
MySql2DatabaseManager.prototype.create_masterClient = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    var client = mysql.createConnection(self._masterConnectionUrl());
    client.connect(function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(client);
      }
    });
  });
};

/**
 * @private
 * @returns {Promise}
 */
MySql2DatabaseManager.prototype.perform_masterQuery = function(
  client,
  query,
  params
) {
  return new Promise(function(resolve, reject) {
    if (params) {
      query = mysql.format(query, params);
    }
    client.query(query, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * @private
 * @returns {String}
 */
MySql2DatabaseManager.prototype._masterConnectionUrl = function() {
  return {
    host: this.config.knex.connection.host,
    port: this.config.knex.connection.port || 3306,
    user: this.config.dbManager.superUser,
    password: this.config.dbManager.superPassword,
  };
};

module.exports = {
  default: MySql2DatabaseManager,
  MySql2DatabaseManager: MySql2DatabaseManager,
};
