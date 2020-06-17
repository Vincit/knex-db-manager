module.exports = function(knex) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      return knex('User')
        .insert({
          username: 'dummy',
          email: 'lol@fake.invalid',
        })
        .then(resolve);
    }, 100);
  });
};
