exports.up = function(knex) {
  return knex.schema.createTable('User', function(table) {
    table.bigincrements('id').primary();
    table.string('username').index().unique().notNullable();
    table.string('email');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('User');
};