var hyperdom = require('hyperdom')

module.exports = class HyperdomTab {
  constructor() {
    this.name = 'Hyperdom'
  }

  globals () {
    this.app = undefined
    return {
      hyperdomAppend: (app) => {
        this.app = app
      }
    }
  }

  statements() {
    return ["if (typeof App !== 'undefined') { hyperdomAppend(new App()) }"]
  }

  render() {
    return <div class="Hyperdom">
      {
        this.app || <span>please define a Hyperdom App class</span>
      }
    </div>
  }
}
