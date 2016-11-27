var babel = require('babel-core');
var presetEs2015 = require('babel-preset-es2015');
var syntaxJsx = require('babel-plugin-syntax-jsx');
var transformReactJsx = require('babel-plugin-transform-react-jsx');
var detective = require('detective');

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

    var dependencies = detective(output.code);

    var fn = new Function(['globals'].concat(this.parameters).join(', '), output.code);

    return {
      call: (...args) => {
        return fn.apply(undefined, args);
      },
      code: output.code,
      variables: Object.keys(dependenciesPlugin.variables),
      dependencies: dependencies
    };
  }
};

function createDependencyPlugin(parameters) {
  var variables = {};

  var plugin = function (babel) {
    return {
      manipulateOptions: function (opts, parserOpts) {
        parserOpts.allowReturnOutsideFunction = true;
      },

      visitor: {
        Identifier: function (path) {
          if (path.container.type == 'AssignmentExpression' || babel.types.isReferenced(path.node, path.parent) && path.node.name != 'globals') {
            var isGlobal = !path.scope.hasBinding(path.node.name) && !parameters.has(path.node.name);

            if (isGlobal) {
              variables[path.node.name] = true;
              path.replaceWith(babel.types.memberExpression(babel.types.identifier('globals'), path.node));
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

  return plugin;
}
