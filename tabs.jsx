var hyperdom = require('hyperdom')

module.exports = class Tabs {
  constructor(properties, children) {
    this.children = children
  }

  render() {
    var names = this.children.map(c => c.properties.dataset && c.properties.dataset.tabName).filter(x => x);

    if (!this.name) {
      this.name = names[0];
    }

    if (this.children.length === 1) {
      return this.children[0]
    } else {
      return <div class="Tabs">
        <ol class="Tabs-names">
          { names.map(n => <li class={['Tabs-name', {'Tabs-name--active': n === this.name}]} onclick={() => this.name = n}>{n}</li>) }
        </ol>
        {
          this.children.map(tab => <div key={tab.name} class="Tabs-tab">
            {tab.properties.dataset && tab.properties.dataset.tabName === this.name ? tab : undefined}
          </div>)
        }
      </div>
    }
  }
}
