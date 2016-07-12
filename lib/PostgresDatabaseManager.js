var _ = require('lodash')
  , pg = require('pg')
  , escape = require('pg-escape')
  , Promise = require('bluebird')
  , classUtils = require('dodo/lib/utils/class-utils')
  , DatabaseManager = require('./DatabaseManager');

/**
 * @constructor
 */
function PostgresDatabaseManager() {
  DatabaseManager.apply(this, arguments);
  this.masterClient_ = null;
  this.cachedTableNames_ = null;
  this.cachedIdSequences_ = null;
}

classUtils.inherits(PostgresDatabaseManager, DatabaseManager);

/**
 * @Override
 */
PostgresDatabaseManager.prototype.createDb = function(databaseName) {
  databaseName = databaseName || this.config.knex.connection.database;
  var collate = this.config.dbManager.collate;
  var self = this;
  var promise = Promise.reject();
  // Try to create with each collate. Use the first one that works. This is kind of a hack
  // but seems to be the only reliable way to make this work with both windows and unix.
  _.each(collate, function(locale) {
    promise = promise.catch(function() {
      return self.masterQuery_("CREATE DATABASE %I ENCODING = 'UTF-8' LC_COLLATE = %L TEMPLATE template0", [databaseName, locale])
    });
  });
  return promise;
};

/**
 * Drops database with name if db exists.
 *
 * @Override
 */
PostgresDatabaseManager.prototype.dropDb = function(databaseName) {
  databaseName = databaseName || this.config.knex.connection.database;
  return this.masterQuery_("DROP DATABASE IF EXISTS %I", [databaseName]);
};

/**
 * @Override
 */
PostgresDatabaseManager.prototype.copyDb = function(fromDatabaseName, toDatabaseName) {
  return this.masterQuery_("CREATE DATABASE %I template %I", [toDatabaseName, fromDatabaseName]);
};

/**
 * @Override
 */
PostgresDatabaseManager.prototype.truncateDb = function(databaseName) {
  var knex = this.knexInstance(databaseName);
  var config = this.config;

  if (!this.cachedTableNames_) {
    this._updateTableNameCache(knex, config);
  }

  return this.cachedTableNames_.then(function (tableNames) {
    if (!_.isEmpty(tableNames)) {
      return knex.raw('TRUNCATE TABLE "' + tableNames.join('","') + '" RESTART IDENTITY');
    }
  }).tap(function () {
    knex.destroy();
  }).catch(function(err) {
    knex.destroy();
    throw err;
  });
};

/**
 * @Override
 */
PostgresDatabaseManager.prototype.updateIdSequences = function(databaseName) {
  var knex = this.knexInstance(databaseName);
  var config = this.config;

  if (!this.cachedIdSequences_) {
    this._updateIdSequenceCache(knex, config);
  }

  // Set current value of id sequence for each table.
  // If there are no rows in the table, the value will be set to sequence's minimum constraint.
  // Otherwise, it will be set to max(id) + 1.
  return this.cachedIdSequences_.then(function (result) {
    var query = _.map(result.rows, function (row) {
      return escape("SELECT setval('%s', GREATEST(coalesce(max(id),0) + 1, '%s'), false) FROM \"%I\"",
                    row.sequence, row.min, row.table);
    });

    query = query.join(' UNION ALL ') + ';';
    return knex.raw(query);
  }).tap(function () {
    knex.destroy();
  }).catch(function(err) {
    knex.destroy();
    throw err;
  });

};

/**
 * @private
 */
PostgresDatabaseManager.prototype._updateTableNameCache = function(knex, config) {
  this.cachedTableNames_ = knex('pg_tables').select('tablename').where('schemaname', 'public').then(function (tables) {
    return _.without(_.pluck(tables, 'tablename'), config.knex.migrations.tableName);
  });
};

/**
 * Id sequence cache holds a Promise, that returns following objects:
 * {
 *   table: String, // Table that rest of the values target
 *   sequence: String, // Sequence for the primary key (which is assumed to be id)
 *   min: String // Minimum allowed value for the sequence
 * }
 *
 * These values are cached because they are not expected to change often,
 * and finding them is slow.
 *
 * @private
 */
PostgresDatabaseManager.prototype._updateIdSequenceCache = function(knex, config) {
  if (!this.cachedTableNames_) {
    this._updateTableNameCache(knex, config);
  }

  this.cachedIdSequences_ = this.cachedTableNames_.then(function (tableNames) {
    // Skip tables without id column.
    return knex('information_schema.columns')
      .select('table_name')
      .where('column_name', 'id')
      .then(function (tables) {
        return _.intersection(_.pluck(tables, 'table_name'), tableNames);
      });
  // Find name of the id sequence for each table.
  // This is required for searching the minimum constraint for the sequence.
  }).then(function (idTableNames) {
    var query = _.map(idTableNames, function (tableName) {
      return escape("SELECT '%I' AS table, pg_get_serial_sequence('\"%I\"', 'id') AS sequence",
                    tableName, tableName);
    });

    query = query.join(' UNION ALL ') + ';';
    return knex.raw(query);
  // Find min constraint for each of the id sequences.
  }).then(function (result) {
    var query = _.map(result.rows, function (row) {
      return escape("SELECT '%I' AS table, '%s' AS sequence, min_value AS min FROM %s",
                    row.table, row.sequence, row.sequence);
    });

    query = query.join(' UNION ALL ') + ';';
    return knex.raw(query);
  });
};

/**
 * @Override
 */
PostgresDatabaseManager.prototype.close = function() {
  if (this.masterClient_) {
    return this.masterClient_.then(function(client) {
      client.end();
    });
  } else {
    return Promise.resolve();
  }
};

/**
 * @private
 * @returns {Promise}
 */
PostgresDatabaseManager.prototype.masterQuery_ = function(query, params) {
  if (!this.masterClient_) {
    this.masterClient_ = this.createMasterClient_();
  }
  var self = this;
  return this.masterClient_.then(function(client) {
    return self.performMasterQuery_(client, query, params);
  });
};

/**
 * @private
 * @returns {Promise}
 */
PostgresDatabaseManager.prototype.createMasterClient_ = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    var client = new pg.Client(self.masterConnectionUrl_());
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
PostgresDatabaseManager.prototype.performMasterQuery_ = function(client, query, params) {
  return new Promise(function(resolve, reject) {
    if (params) {
      var args = [query].concat(params);
      query = escape.apply(global, args);
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
PostgresDatabaseManager.prototype.masterConnectionUrl_ = function() {
  var url = 'postgres://';
  if (this.config.dbManager.superUser) {
    url += this.config.dbManager.superUser;
  } else {
    throw new Error('DatabaseManager: database config must have `superUser`');
  }
  if (this.config.dbManager.superPassword) {
    url += ':' + this.config.dbManager.superPassword
  }
  var port = this.config.knex.connection.port || 5432;
  url += '@' + this.config.knex.connection.host + ':' + port + '/template1';
  return url;
};

module.exports = PostgresDatabaseManager;
