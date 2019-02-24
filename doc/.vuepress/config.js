module.exports = {
  title: 'knex-db-manager',
  description: 'Tool to create / drop / truncate / copy SQL database',
  base: '/knex-db-manager/',
  themeConfig: {
    displayAllHeaders: true ,
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Changelog', link: '/changelog/' },
      { text: 'Github', link: 'https://github.com/Vincit/knex-db-manager' },
    ],
    sidebar: [
      ['/', 'Home'],
      ['/changelog/', 'Changelog']
    ],
    sidebarDepth: 2
  }
}