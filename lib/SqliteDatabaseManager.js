var DatabaseManager = require('./DatabaseManager')
  , classUtils = require('../../class-utils');

/**
 * @constructor
 * @extends DatabaseManager
 */
function SqliteDatabaseManager() {
  DatabaseManager.apply(this, arguments);
}

classUtils.inherits(SqliteDatabaseManager, DatabaseManager);

module.exports = SqliteDatabaseManager;