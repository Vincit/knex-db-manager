# Changelog

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
