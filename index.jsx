/** @jsx hyperdom.jsx */
var hyperdom = require('hyperdom');
var AceEditor = require('hyperdom-ace-editor');
var Compiler = require('./compiler');
var Modules = require('./modules');

require('brace/mode/jsx');
require('brace/theme/monokai');

class App {
  constructor() {
    this.globals = {};
    this.compiler = new Compiler(['require', 'module', 'exports', 'console', 'setInterval', 'hyperdom']);
    this.modules = new Modules({
      hyperdom: hyperdom
    });

    var sourceBinding = {
      get: () => this.text,
      set: value => {
        this.text = value;
        try {
          this.compiled = this.compiler.compile(value);
          var reqPromise = this.modules.setDependencies(this.compiled.dependencies);
          if (reqPromise) {
            reqPromise.then(() => {
              this.output = this.call();
              this.rerender();
            });
          }
          this.output = this.call();
        } catch (e) {
          this.compiled = undefined;
          this.output = {console: [], error: e};
        }
        localStorage.text = value;
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

    this.consoleOutput = [];
    this.console = {
      log: (...args) => {
        this.consoleOutput.push(args);
      }
    };
  }

  call() {
    var cnsl = new Console(this);
    var module = {
      exports: {}
    };
    try {
      var result = this.compiled.call(this.globals, this.modules.require, module, module.exports, cnsl, setInterval, hyperdom);
      return {
        console: cnsl.output,
        result: result
      };
    } catch(e) {
      console.error(e);
      return {
        console: cnsl.output,
        error: e
      };
    }
  }

  render() {
    return <div>
      <pre><code>{JSON.stringify(this.globals, null, 2)}</code></pre>
      {this.editor}
      <pre><code>{JSON.stringify(this.modules.dependencies, null, 2)}</code></pre>
      {this.renderOutput()}
    </div>
  }

  renderOutput() {
    return <div class="Output">
      {
        this.output.error? <div class="Output-Error">{this.output.error.message}</div>: ''
      }
      <ol>
        {
          this.output.console.map(entry => {
            return <li class={entry.type}>{join(entry.args, ' ')}</li>
          })
        }
      </ol>
      {
        this.output.result !== undefined? <div class="Output-Result">{this.output.result}</div>: ''
      }
    </div>
  }

  rerender() {
  }
}

function join(items, separator) {
  var results = [];

  items.forEach((i, index) => {
    if (index != 0) {
      results.push(separator);
    }

    results.push(i);
  });

  return results;
}

class Console {
  constructor(viewModel) {
    this.output = [];
    this.viewModel = viewModel;

    this.log = this.log.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
  }

  log(...args) {
    this.output.push({type: 'log', args: trapPromises(args, this.viewModel)});
    this.viewModel.rerender();
  }

  warn(...args) {
    this.output.push({type: 'warn', args: trapPromises(args, this.viewModel)});
    this.viewModel.rerender();
  }

  error(...args) {
    this.output.push({type: 'error', args: trapPromises(args, this.viewModel)});
    this.viewModel.rerender();
  }
}

class PromiseView {
  constructor(promise, viewModel) {
    promise.then(r => {
      this.hasResult = true;
      this.result = r;
      viewModel.rerender();
    }, e => {
      this.hasError = true;
      this.error = e;
      viewModel.rerender();
    })
  }

  render() {
    if (this.hasResult) {
      return this.result;
    } else if (this.hasError) {
      return this.error;
    } else {
      return '[promise]';
    }
  }
}

function trapPromises(list, viewModel) {
  return list.map(item => {
    if (item && typeof item.then == 'function') {
      return new PromiseView(item, viewModel)
    } else {
      return item;
    }
  });
}

hyperdom.append(document.body, new App());
