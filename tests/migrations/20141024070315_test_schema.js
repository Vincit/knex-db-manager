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
    .createTable('Ignoreme', function(table) {
      table.bigincrements('id').primary();
      table.string('description');
    })
    .then(function() {
      return knex('Ignoreme').insert({ description: 'wat' });
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable('User').dropTable('Ignoreme');
};
