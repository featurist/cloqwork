/** @jsx plastiq.html */
var plastiq = require('plastiq');
var aceEditor = require('plastiq-ace-editor');

require('brace/mode/javascript');
require('brace/theme/monokai');

module.exports = function (binding) {
  return aceEditor({
    binding: binding,
    theme: 'monokai',
    mode: 'javascript'
  }, <pre class="source"></pre>);
};
