var hyperdom = require('hyperdom');

module.exports = class ResultTab {
  constructor() {
    this.name = 'Result'
  }

  result(result, error) {
    this._result = result
    this.error = error
  }

  render() {
    return <div data-tab-name="output" class="Output">
      {
        this.error? <div class="Output-Error">{this.error.message}</div>: ''
      }
      {
        this._result !== undefined? <div class="Output-Result">{this._result}</div>: ''
      }
    </div>
  }
}
