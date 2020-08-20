# Changelog

### 0.7.0

- Dropped node 8 and added node 14 to tests and fixed 0.6.2 changes

### 0.6.2

- NOTE: THIS WAS DEPRECATED FROM NPM DUE TO SOME BREAKING TESTS
- Set seeding to sequential instead of parallel #89
- Support for old-style seeding modules #88

### 0.6.1

- Added more files to gitignore to make package smaller

### 0.6.0

- Fixed special character escaping in password for postgresql
- Updated dependencies
- Added prettier config
- Added CI testing for node 12

#### Breaking changes

- Moved knex from normal deps to peerDep, so now one has to npm install knex explicitly

### 0.5.0

- Fixed id sequence queries to work on postgresql 10 databases even when
- Updated dependencies
- Removed gatsby and started to use vuepress for docs
- Added CI testing for node 8 and 10

### 0.4.0

- Fix allowing to create new databases even when multiple clients are connected to postgres server #36
- Updated list of supported dialect aliases #33
- Fixed npm repo to point Vincit #31
- Updated various dependencies
- Initial support for mysql #13, #30

#### Breaking changes

- truncateDb doesn't automatically leave migration table out #10
- Add owner privileges for the database user after creating new database as super user #15

### 0.3.0

- Added documentation pages

#### Breaking changes

- Removed automatic ingnore of migrations table from truncate DB
- Removed automatic testing / support for node < 4

### 0.2.0

- Initial changelog entry

#### Breaking changes

- All functionality
