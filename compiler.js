var babel = require('babel-standalone');
var presetEs2015 = require('babel-preset-es2015');
var hyperdomPreset = require('babel-preset-hyperdom');

module.exports = class {
  compile(source, statements) {
    var dependenciesPlugin = createDependencyPlugin({statements});

    var output = babel.transform(source, {
      presets: [presetEs2015, hyperdomPreset],
      plugins: [
        dependenciesPlugin
      ]
    });

    var fn = new Function(['globals'], output.code);

    return {
      run: (context) => {
        var globals = new Globals(context);
        return fn.call(globals, globals)
      },
      code: output.code,
      globals: Object.keys(dependenciesPlugin.variables),
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

function createDependencyPlugin({statements = []} = {}) {
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
            var isGlobal = !path.scope.hasBinding(path.node.name)

            if (isGlobal) {
              variables[path.node.name] = true;
              path.replaceWith(babel.types.callExpression(babel.types.memberExpression(babel.types.identifier('globals'), babel.types.identifier('get')), [babel.types.stringLiteral(path.node.name)]));
            }
          }
        },

        AssignmentExpression: function (path) {
          if (babel.types.isIdentifier(path.node.left) && !path.scope.hasBinding(path.node.left.name)) {
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
          if (statements.length > 0) {
            var stmts = statements.map(s => {
              var ast = babel.transform(s, {code: false}).ast
              return ast.program.body[0]
            })
            path.node.body.push(...stmts)
          } else {
            if (path.node.body.length == 1 && babel.types.isExpressionStatement(path.node.body[0])) {
              path.node.body[0] = babel.types.returnStatement(path.node.body[0].expression);
            }
          }
        }
      }
    };
  };

  plugin.variables = variables;
  plugin.dependencies = dependencies;

  return plugin;
}
