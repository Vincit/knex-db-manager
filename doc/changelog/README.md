# Changelog

### 0.5.0

 * Fixed id sequence queries to work on postgresql 10 databases even when 
 * Updated dependencies
 * Removed gatsby and started to use vuepress for docs
 * Added CI testing for node 8 and 10

### 0.4.0

 * Fix allowing to create new databases even when multiple clients are connected to postgres server #36
 * Updated list of supported dialect aliases #33
 * Fixed npm repo to point Vincit #31
 * Updated various dependencies
 * Initial support for mysql #13, #30

#### Breaking changes

 * truncateDb doesn't automatically leave migration table out #10
 * Add owner privileges for the database user after creating new database as super user #15

### 0.3.0

 * Added documentation pages

#### Breaking changes

 * Removed automatic ingnore of migrations table from truncate DB
 * Removed automatic testing / support for node < 4

### 0.2.0

 * Initial changelog entry

#### Breaking changes

 * All functionality
