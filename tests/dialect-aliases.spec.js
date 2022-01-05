const dbManagerFactory = require('../lib').databaseManagerFactory;
const expect = require('chai').expect;

describe('Testing dialect aliases', function() {
  const aliases = [
    'pg',
    'postgres',
    'postgresql',
    'mysql',
    'mysql2',
    'maria',
    'mariadb',
    'mariasql',
    'sqlite',
    'sqlite3',
  ];

  aliases.forEach((dialect) => {
    it(`should load client with alias "${dialect}"`, () => {
      const manager = dbManagerFactory({
        knex: {
          client: dialect,
        },
      });
    });
  });

  it(`should fail loading unknown client`, () => {
    try {
      const manager = dbManagerFactory({
        knex: {
          client: 'foobar',
        },
      });
      expect('should have thrown an exception').to.equal(false);
    } catch (err) {
      expect(err.message).to.contains('is not supported');
    }
  });
});
