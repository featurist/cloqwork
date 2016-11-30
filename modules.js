var httpism = require('httpism');

module.exports = class {
  constructor(staticDependencies = []) {
    this.staticDependencies = staticDependencies;
    this.dependencies = {};
    this.require = function(module) {
      throw new Error(`Cannot find module '${module}'`);
    }
  }

  setDependencies(dependencies) {
    var deps = this.staticDependencies.concat(dependencies);

    if (!this.hasAllDependencies(deps)) {
      deps.sort();
      var modules = deps.map(encodeURIComponent).join(',');
      if (this.requestedModules != modules) {
        if (this.request) {
          this.request.abort();
        }
        this.requestedModules = modules;
        return this.request = httpism.get('http://localhost:4000/modules/' + modules).then(r => {
          var req = loadRequire(r.body);
          this.dependencies = req('package.json').dependencies;
          this.require = req;
          console.log('loaded requires');
        });
      }
    }
  }

  hasAllDependencies(dependencies) {
    return dependencies.every(d => this.dependencies[d]);
  }
}

function loadRequire(js) {
  return new Function('var require;\n' + js + ';\nreturn require;')();
}
