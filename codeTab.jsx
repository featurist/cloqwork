var hyperdom = require('hyperdom')

module.exports = class CodeTab {
  constructor() {
    this.name = 'Code'
  }

  compileResult(result, error) {
    this.code = result && result.code
    this.error = error
  }

  render() {
    if (this.code) {
      return <pre><code>{this.code ? this.code : ''}</code></pre>
    } else {
      return <pre><code>{this.error.message}</code></pre>
    }
  }
}
