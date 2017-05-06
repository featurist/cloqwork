var hyperdom = require('hyperdom')

module.exports = class ConsoleTab {
  constructor() {
    this.output = []
    this.name = 'Console'
  }

  globals() {
    this.output = []
    return {
      console: new Console(this)
    }
  }

  render() {
    return <ol class="Console">
      {
        this.output.map(entry => {
          return <li class={'Output-entry--' + entry.type}>{hyperdom.join(entry.args, ' ')}</li>
        })
      }
    </ol>
  }

  refreshComponent() {
  }
}

class Console {
  constructor(component) {
    this.component = component;

    this.log = this.log.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
  }

  log(...args) {
    this.component.output.push({type: 'log', args: trapPromises(args, this.component)});
    this.component.refreshComponent();
  }

  warn(...args) {
    this.component.output.push({type: 'warn', args: trapPromises(args, this.component)});
    this.component.refreshComponent();
  }

  error(...args) {
    this.component.output.push({type: 'error', args: trapPromises(args, this.component)});
    this.component.refreshComponent();
  }
}

class PromiseView {
  constructor(promise, component) {
    promise.then(r => {
      this.hasResult = true;
      this.result = r;
      component.refreshComponent();
    }, e => {
      this.hasError = true;
      this.error = e;
      component.refreshComponent();
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

function trapPromises(list, component) {
  return list.map(item => {
    if (item && typeof item.then == 'function') {
      return new PromiseView(item, component)
    } else {
      return item;
    }
  });
}
