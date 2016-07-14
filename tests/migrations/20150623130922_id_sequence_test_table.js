exports.up = function(knex) {
  return knex.schema.createTable('IdSeqTest', function(table) {
    table.bigincrements('id').primary();
    table.string('value');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('IdSeqTest');
};
