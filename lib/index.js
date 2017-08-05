/**
 * Configuration is dodo-objection configuration.
 *
 * @param config Dodo-objection configuration.
 * @return {DatabaseManager}
 */
module.exports = {
  databaseManagerFactory: function databaseManagerFactory(config) {

    // Prevent people from invoking this as a constructor.
    if (this instanceof databaseManagerFactory) {
      throw new Error('this is not a constructor');
    }

    switch (config.knex.client) {
      case 'pg':
      case 'postgresql':
      case 'postgres': {
        var PostgresDatabaseManager = require('./PostgresDatabaseManager').default;
        return new PostgresDatabaseManager(config);
      }
      case 'maria':
      case 'mariadb':
      case 'mariasql':
      case 'mysql': {
        var MySqlDatabaseManager = require('./MySqlDatabaseManager').default;
        return new MySqlDatabaseManager(config);
      
      }
      case 'sqlite3':
      case 'sqlite': {
        var SqliteDatabaseManager = require('./SqliteDatabaseManager').default;
        return new SqliteDatabaseManager(config);
      }
      default:
        throw new Error(config.knex.client + ' is not supported. Supported clients currently: postgres, mysql and sqlite');
    }
  }
};
