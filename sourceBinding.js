var plastiq = require('plastiq');
var detective = require('detective');
var babel = require('babel-core');

module.exports = {
  view: function (model) {
    return model? model.source: '';
  },

  model: function (view) {
    var source = transform(view);
    var dependencies = detective(source);
    return {
      source: view,
      function: new Function('module', 'exports', 'require', source),
      dependencies: dependencies
    };
  }
};

function transform(source) {
  return babel.transform(source, {
    blacklist: ['useStrict'],
    jsxPragma: 'plastiq.html'
  }).code;
}
