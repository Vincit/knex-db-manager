exports.seed = function(knex) {
  return knex('User').insert({
    username: 'dummy-old',
    email: 'lol-old@fake.invalid',
  });
};
