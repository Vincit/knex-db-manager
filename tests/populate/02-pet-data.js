module.exports = function(knex) {
  return knex('Pet').insert({
    name: 'spot',
    userid: '1',
  });
};
