var httpism = require('httpism');
var mapObject = require('lowscore/mapObject');

module.exports = class {
  constructor(externalDependencies = {}) {
    this.externalDependencies = externalDependencies;
    this.dependencies = {};
    this.require = function(module) {
      throw new Error(`Cannot find module '${module}'`);
    }
  }

  setDependencies(dependencies) {
    if (!this.hasAllDependencies(dependencies)) {
      var modules = this.moduleList(dependencies);
      if (modules) {
        if (this.requestedModules != modules) {
          if (this.request) {
            this.request.abort();
          }
          this.requestedModules = modules;
          return this.request = httpism.get('http://require.plastiq.org/modules/' + modules).then(js => {
            var req = loadRequire(js, this.externalDependencies);
            this.dependencies = req('package.json').dependencies;
            this.require = req;
            console.log('loaded requires');
          });
        }
      } else {
        this.dependencies = mapObject(this.externalDependencies, () => '*');
        this.require = createRequire(this.externalDependencies);
      }
    }
  }

  moduleList(dependencies) {
    var excludes = Object.keys(this.externalDependencies).map(d => '!' + d);
    var deps = dependencies.filter(d => !this.externalDependencies[d]);

    if (deps.length) {
      return excludes.concat(deps.map(encodeURIComponent)).sort().join(',');
    }
  }

  hasAllDependencies(dependencies) {
    return dependencies.every(d => this.dependencies[d]);
  }
}

function loadRequire(js, modules) {
  return new Function('require', js + ';\nreturn require;')(createRequire(modules));
}

function createRequire(modules) {
  return function(name) {
    if (modules.hasOwnProperty(name)) {
      return modules[name];
    } else {
      throw new Error("Cannot find module '" + name + "'");
    }
  };
}
