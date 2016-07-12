var DatabaseManager = require('./DatabaseManager')
  , classUtils = require('../../class-utils');

/**
 * @constructor
 * @extends DatabaseManager
 */
function MySqlDatabaseManager() {
  DatabaseManager.apply(this, arguments);
}

classUtils.inherits(MySqlDatabaseManager, DatabaseManager);

module.exports = MySqlDatabaseManager;