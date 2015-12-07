var plastiq = require('plastiq');
var detective = require('detective');
var babel = require('babel-core');

module.exports = {
  view: function (model) {
    return model? model.source: '';
  },

  model: function (view) {
    var source = transform('function x(module, exports, require, globals) {' + view + '}');
    var dependencies = detective(source);
    return {
      source: view,
      function: new Function('return ' + source)(),
      dependencies: dependencies
    };
  }
};

function transform(source) {
  return babel.transform(source, {
    // presets: [require('babel-preset-es2015'), require('babel-preset-stage-2')],
    "plugins": [
      // [require('babel-plugin-syntax-flow')],
      // [require('babel-plugin-syntax-jsx')],
      // [require('babel-plugin-transform-flow-strip-types')],
      // [require("babel-plugin-transform-react-jsx"), { "pragma": "plastiq.html" }]
      [require("babel-rewrite-globals")]
    ]
  }).code;
}
