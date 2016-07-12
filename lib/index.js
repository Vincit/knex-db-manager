/**
 * Configuration is dodo-objection configuration.
 *
 * @param config Dodo-objection configuration.
 * @return {DatabaseManager}
 */
module.exports = function DatabaseManagerFactory(config) {
  // Prevent morons from invoking this as a constructor.
  if (this instanceof DatabaseManagerFactory) {
    throw new Error('this is not a constructor');
  }

  switch (config.knex.client) {
    case 'postgres': {
      var PostgresDatabaseManager = require('./PostgresDatabaseManager');
      return new PostgresDatabaseManager(config);
    }
    case 'mysql': {
      var MySqlDatabaseManager = require('./MySqlDatabaseManager');
      return new MySqlDatabaseManager(config);
    }
    case 'sqlite': {
      var SqliteDatabaseManager = require('./SqliteDatabaseManager');
      return new SqliteDatabaseManager(config);
    }
    default:
      throw new Error(config.knex.client + ' is not supported. Supported clients: postgres, mysql and sqlite');
  }
};
