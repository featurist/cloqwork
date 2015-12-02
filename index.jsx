/** @jsx plastiq.html */
var plastiq = require('plastiq');
var variableEditor = require('./variableEditor');
var sourceBinding = require('./sourceBinding');
var compileBabel = require('./compileBabel');

class App {
  constructor() {
    this.variables = [];
    this.newVariable = {};
  }

  render() {
    var error = plastiq.html.meta(this, 'newVariable').error;

    return <div>
      <div class="add-variable">
        {variableEditor([this, 'newVariable', sourceBinding])}
        {
          <div>
            <h2>source</h2>
            <pre><code>
              {this.newVariable.source && this.newVariable.source.toString()}
            </code></pre>
            <h2>function</h2>
            <pre><code>
              {this.newVariable.function && this.newVariable.function.toString()}
            </code></pre>
            <h2>dependencies</h2>
            {this.newVariable.dependencies && join(this.newVariable.dependencies.map(d => <code>{d}</code>), ' ')}
            {
              error
                ? <li>
                    error: {error.stack}
                  </li>
                : undefined
            }
          </div>
        }
      </div>
      <ol class="variables">
        {
          this.variables.map(v => {
            return <li>
              <h2>{v.name}</h2>
              {
                v.editing
                  ? variableEditor()
                  : undefined
              }
            </li>;
          })
        }
      </ol>
    </div>;
  }
}

function join(array, el) {
  var result = [];

  for(var n = 0; n < array.length; n++) {
    if (n > 0) {
      result.push(el);
    }

    result.push(array[n]);
  }

  return result;
}

plastiq.append(document.body, new App());
