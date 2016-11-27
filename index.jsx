/** @jsx hyperdom.jsx */
var hyperdom = require('hyperdom');
var AceEditor = require('hyperdom-ace-editor');
var Compiler = require('./compiler');

require('brace/mode/jsx');
require('brace/theme/monokai');

class App {
  constructor() {
    this.globals = {};
    this.compiler = new Compiler(['require', 'module', 'exports', 'console', 'setInterval', 'hyperdom'], this.globals);

    var sourceBinding = {
      get: () => this.text,
      set: value => {
        this.text = value;
        try {
          this.compiled = this.compiler.compile(value);
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
    var globals = {};
    try {
      var result = this.compiled.call(globals, require, module, exports, cnsl, setInterval, hyperdom);
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
      {this.editor}
      <p>
        {this.compiled}
      </p>
      <button onclick={() => this.call()}>call</button>
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
            return <li class={entry.type}>{entry.args.join(' ')}</li>
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

class Console {
  constructor(viewModel) {
    this.output = [];
    this.viewModel = viewModel;

    this.log = this.log.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
  }

  log(...args) {
    this.output.push({type: 'log', args: args});
    this.viewModel.rerender();
  }

  warn(...args) {
    this.output.push({type: 'warn', args: args});
    this.viewModel.rerender();
  }

  error(...args) {
    this.output.push({type: 'error', args: args});
    this.viewModel.rerender();
  }
}

hyperdom.append(document.body, new App());
