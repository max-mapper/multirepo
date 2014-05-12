# multirepo

work in progress. a power tool for batch processing github repos + npm modules

install and clone all your repos into `cwd`:

```
npm install multirepo -g

// clone all new repos. gets all the first time. on subsequent executions will only get new ones
multirepo clone

// clone and pull all new repos
multirepo clone --pull

// clone and pull all new repos since a custom timestamp
multirepo clone --pull --since 2013-11-28
```