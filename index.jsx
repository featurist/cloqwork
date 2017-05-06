var hyperdom = require('hyperdom');
var AceEditor = require('hyperdom-ace-editor');
var Compiler = require('./compiler');
var Modules = require('./modules');
var ConsoleTab = require('./consoleTab');
var ResultTab = require('./resultTab');
var HyperdomTab = require('./hyperdomTab');
var CodeTab = require('./codeTab');
var Tabs = require('./tabs');
var extend = require('lowscore/extend')
var compact = require('lowscore/compact')
var flatten = require('lowscore/flatten')

require('brace/mode/jsx');
require('brace/theme/monokai');

class App {
  constructor() {
    this.plugins = [
      new ConsoleTab(),
      new ResultTab(),
      new HyperdomTab(),
      new CodeTab()
    ]

    this.compiler = new Compiler();
    this.modules = new Modules({
      hyperdom: hyperdom
    });

    var sourceBinding = {
      get: () => this.text,
      set: value => {
        localStorage.text = value;
        this.text = value;
        var result
        var error

        var statements = flatten(compact(this.plugins.map(p => typeof p.statements === 'function' && p.statements())))

        try {
          result = this.compiler.compile(value, statements);
        } catch (e) {
          error = e
        }

        if (error) {
          this.plugins.forEach(p => typeof p.compileResult === 'function' && p.compileResult(undefined, error))
        } else {
          this.plugins.forEach(p => typeof p.compileResult === 'function' && p.compileResult(result))

          var reqPromise = this.modules.setDependencies(result.dependencies);
          if (reqPromise) {
            return reqPromise.then(() => {
              this.call(result);
            });
          } else {
            this.call(result);
          }
        }
      }
    };

    sourceBinding.set(localStorage.text);

    this.editor = new AceEditor({
      binding: sourceBinding,
      theme: 'monokai',
      mode: 'jsx',
      render: () => {
        return <pre class="source"></pre>
      }
    });
  }

  call(compiled) {
    var error
    var result

    var module = {
      exports: {}
    };

    var globals = extend({
      hyperdom,
      module,
      exports: module.exports,
      require: this.modules.require
    }, ...this.plugins.map(p => typeof p.globals === 'function' && p.globals()))

    try {
      result = compiled.run(globals);
    } catch(e) {
      error = e
    }

    if (error) {
      this.plugins.forEach(plugin => {
        typeof plugin.result === 'function' && plugin.result(undefined, error, globals)
      })
    } else {
      this.plugins.forEach(plugin => {
        typeof plugin.result === 'function' && plugin.result(result, undefined, globals)
      })
    }
  }

  render() {
    return <div class="Cloqwork">
      <div class="Editors">
        <div class="Editor">
          {this.editor}
        </div>
      </div>
      <div class="Outputs">
        <Tabs>
          <div data-tab-name="dependencies" class="Dependencies">
            <pre><code>{JSON.stringify(this.modules.dependencies, null, 2)}</code></pre>
          </div>
          {
            this.plugins.map(p => <div data-tab-name={p.name}>{p}</div>)
          }
        </Tabs>
      </div>
    </div>
  }
}

hyperdom.append(document.body, new App());
