var DatabaseManager = require('./DatabaseManager').default
  , classUtils = require('./class-utils');

/**
 * @constructor
 * @extends DatabaseManager
 */
function MySqlDatabaseManager() {
  DatabaseManager.apply(this, arguments);
}

classUtils.inherits(MySqlDatabaseManager, DatabaseManager);

module.exports = {
  default: MySqlDatabaseManager,
  MySqlDatabaseManager: MySqlDatabaseManager
};