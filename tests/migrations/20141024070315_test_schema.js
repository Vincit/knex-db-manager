exports.up = function(knex) {
  return knex.schema
    .createTable('User', function(table) {
      table.bigincrements('id').primary();
      table
        .string('username')
        .index()
        .unique()
        .notNullable();
      table.string('email');
    })
    .createTable('Pet', function(table) {
      table.bigincrements('id').primary();
      table.string('name');
      table
        .biginteger('userid')
        .unsigned()
        .notNullable();
      table.foreign('userid').references('User.id');
    })
    .createTable('Ignoreme', function(table) {
      table.bigincrements('id').primary();
      table.string('description');
    })
    .then(function() {
      return knex('Ignoreme').insert({ description: 'wat' });
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('Pet')
    .dropTable('User')
    .dropTable('Ignoreme');
};
