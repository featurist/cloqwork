var babel = require('babel-core');

module.exports = function (source) {
  var transformedSource = transform(source);
  // var transformedSource = transform('function x(module, exports, require, globals) {' + source + '}');
  return new Function('globals', 'return ' + transformedSource);
};

function transform(source) {
  var compiled = babel.transform(source, {
    sourceType: 'function',
    // presets: [require('babel-preset-es2015'), require('babel-preset-stage-2')],
    "plugins": [
      // [require('babel-plugin-syntax-flow')],
      // [require('babel-plugin-syntax-jsx')],
      // [require('babel-plugin-transform-flow-strip-types')],
      // [require("babel-plugin-transform-react-jsx"), { "pragma": "plastiq.html" }]
      [require("babel-rewrite-globals")]
    ]
  });

  // console.log('compiled', compiled);
  return compiled.code;
}
