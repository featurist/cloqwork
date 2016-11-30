var babel = require('babel-core');
var presetEs2015 = require('babel-preset-es2015');
var syntaxJsx = require('babel-plugin-syntax-jsx');
var transformReactJsx = require('babel-plugin-transform-react-jsx');

module.exports = class {
  constructor(parameters = [], globals = {}) {
    this.parameters = parameters;
    this.paramSet = new Set(parameters);
    this.globals = globals;
  }

  compile(source) {
    var dependenciesPlugin = createDependencyPlugin(this.paramSet);

    var output = babel.transform(source, {
      presets: [presetEs2015],
      plugins: [
        syntaxJsx,
        [transformReactJsx, {pragma: 'hyperdom.jsx'}],
        dependenciesPlugin
      ]
    });

    var fn = new Function(['globals'].concat(this.parameters).join(', '), output.code);

    return {
      call: (...args) => {
        args[0] = new Globals(args[0]);
        return fn.apply(undefined, args);
      },
      code: output.code,
      variables: Object.keys(dependenciesPlugin.variables),
      dependencies: Object.keys(dependenciesPlugin.dependencies)
    };
  }
};

class Globals {
  constructor(context) {
    this.context = context;
  }

  get(name) {
    if (this.context.hasOwnProperty(name)) {
      return this.context[name];
    } else {
      throw new ReferenceError(name + ' is not defined');
    }
  }

  set(name, value) {
    return this.context[name] = value;
  }
}

function createDependencyPlugin(parameters) {
  var variables = {};
  var dependencies = {};


  var plugin = function (babel) {
    return {
      manipulateOptions: function (opts, parserOpts) {
        parserOpts.allowReturnOutsideFunction = true;
      },

      visitor: {
        Identifier: function (path) {
          if (babel.types.isReferenced(path.node, path.parent) && path.node.name != 'globals') {
            var isGlobal = !path.scope.hasBinding(path.node.name) && !parameters.has(path.node.name);

            if (isGlobal) {
              variables[path.node.name] = true;
              path.replaceWith(babel.types.callExpression(babel.types.memberExpression(babel.types.identifier('globals'), babel.types.identifier('get')), [babel.types.stringLiteral(path.node.name)]));
            }
          }
        },

        AssignmentExpression: function (path) {
          if (babel.types.isIdentifier(path.node.left) && !path.scope.hasBinding(path.node.left.name) && !parameters.has(path.node.left.name)) {
            path.replaceWith(babel.types.callExpression(babel.types.memberExpression(babel.types.identifier('globals'), babel.types.identifier('set')), [babel.types.stringLiteral(path.node.left.name), path.node.right]));
          }
        },

        CallExpression: function (path) {
          if (path.node.callee.type == 'Identifier' && path.node.callee.name == 'require') {
            var args = path.node.arguments;
            if (args.length == 1 && args[0].type == 'StringLiteral') {
              dependencies[args[0].value] = true;
            }
          }
        },

        Program: function (path) {
          if (path.node.body.length == 1 && babel.types.isExpressionStatement(path.node.body[0])) {
            path.node.body[0] = babel.types.returnStatement(path.node.body[0].expression);
          }
        }
      }
    };
  };

  plugin.variables = variables;
  plugin.dependencies = dependencies;

  return plugin;
}
