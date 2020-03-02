module.exports = function(knex) {
  return knex('User').insert({
    username: 'dummy',
    email: 'lol@fake.invalid',
  });
};
