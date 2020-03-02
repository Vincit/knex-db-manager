var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  glob = require('glob');

/**
 * Requires multiple modules from the given path pattern.
 *
 * The path pattern can be anything the node-glob library supports.
 *
 * ```js
 * var modules = multiRequire('some/path/**.js')
 *   .filterModule(_.isFunction)
 *   .require();
 * ```
 *
 * @param {String} pathPattern
 * @returns {MultiRequire}
 */
module.exports.multiRequire = function(pathPattern) {
  return new MultiRequire(pathPattern);
};

/**
 * @param {*} module
 * @param {String} filePath
 * @param {String} fileName
 * @param {String} fileExt
 * @constructor
 */
function RequireResult(module, filePath, fileName, fileExt) {
  this.module = module;
  this.filePath = filePath;
  this.fileName = fileName;
  this.fileExt = fileExt;
}

/**
 * @param {String} pathPattern
 * @constructor
 */
function MultiRequire(pathPattern) {
  this.pathPattern_ = pathPattern;
  this.folderModules_ = true;
  this.filters_ = [];
  this.moduleFilters_ = [];
}

/**
 * Are folders that contain an `index.js` file considered as single modules.
 *
 * Default is true.
 *
 * @param {Boolean} folderModules
 * @returns {MultiRequire}
 */
MultiRequire.prototype.folderModules = function(folderModules) {
  this.folderModules_ = folderModules;
  return this;
};

/**
 * Filters the result by requiring the modules to have a certain property.
 *
 * Example:
 *
 * ```js
 * multiRequire(path)
 *   .hasProperty('prop1')
 *   .hasProperty(['prop2', 'prop3'])
 *   .hasProperty('prop4', 'prop5', 'prop6')
 *   .require();
 * ```
 *
 * @param {String|Array.<String>} property
 * @returns {MultiRequire}
 */
MultiRequire.prototype.hasProperty = function(property) {
  if (arguments.length > 1 || _.isArray(property)) {
    var array = arguments.length > 1 ? arguments : property;
    for (var i = 0; i < array.length; ++i) {
      this.hasProperty(array[i]);
    }
  } else {
    this.filterModule(function(module) {
      return _.has(module, property);
    });
  }
  return this;
};

/**
 * Adds a filter function.
 *
 * @param {function(RequireResult):Boolean} filter
 * @param {*=} context
 * @returns {MultiRequire}
 */
MultiRequire.prototype.filter = function(filter, context) {
  this.filters_.push({ func: filter, context: context });
  return this;
};

/**
 * Adds a filter function that is passed the module instead of a `RequireResult`.
 *
 * @param {function(*):Boolean} filter
 * @param {*=} context
 * @returns {MultiRequire}
 */
MultiRequire.prototype.filterModule = function(filter, context) {
  this.moduleFilters_.push({ func: filter, context: context });
  return this;
};

/**
 * Synchronously requires all modules that pass the filters.
 *
 * @param {function(RequireResult)=} callback
 * @returns {Array.<RequireResult>}
 */
MultiRequire.prototype.require = function(callback) {
  return this.doRequire_(callback);
};

/**
 * @param {function(RequireResult)=} callback
 * @returns {Array.<RequireResult>}
 * @private
 */
MultiRequire.prototype.doRequire_ = function(callback) {
  var files,
    modules = [],
    folderModules = [],
    includeFolderModules = this.folderModules_,
    filters = this.filters_,
    moduleFilters = this.moduleFilters_;

  files = glob.sync(this.pathPattern_);

  _.each(files, function(filePath) {
    var fileExt = path.extname(filePath),
      fileName = path.basename(filePath, fileExt),
      isDir = fs.statSync(filePath).isDirectory(),
      hasIndex = isDir && fs.existsSync(path.join(filePath, 'index.js')),
      insideFolderModule;

    insideFolderModule = _.some(folderModules, function(folderModule) {
      return filePath.indexOf(folderModule.filePath) == 0;
    });

    // filePath is inside a folder module that was already required. Skip it.
    if (insideFolderModule) {
      return;
    }

    if (!isDir || (isDir && includeFolderModules && hasIndex)) {
      var module = require(filePath);
      var result = new RequireResult(module, filePath, fileName, fileExt);

      var filtersPass = _.every(filters, function(filter) {
        return filter.func.call(filter.context, result);
      });

      var moduleFiltersPass = _.every(moduleFilters, function(filter) {
        return filter.func.call(filter.context, result.module);
      });

      if (filtersPass && moduleFiltersPass) {
        modules.push(result);

        if (isDir) {
          folderModules.push(result);
        }

        if (callback) {
          callback(result);
        }
      }
    }
  });

  return modules;
};
