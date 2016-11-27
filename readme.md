# cloqwork

Read the blog, [cloqwork](http://cloqwork.tumblr.com/), to see what this is all about.

## run it

setup

```sh
npm i
```

run

```sh
npm run serve
```

Then go to [http://localhost:9966/](http://localhost:9966/).

# How this works

## Cells

We have cells, which are named. Cells can either expressions or data. Expression cells can reference other cells by name. Data cells don't reference other cells, and are just pure data. The data in the cells _can_ be updated by performing actions in the UI. The UI is built by returning HTML from a cell.
