# multirepo

work in progress. a power tool for batch processing github repos + npm modules

install and clone all your repos into `cwd`:

```sh
npm install multirepo -g

// clone all new repos. gets all the first time. on subsequent executions will only get new ones
multirepo clone
```

then later pull all repos that have changed since you first cloned:

```sh
multirepo pull
Checking for repos with new pushes since 2014-05-12T10:40:31.037Z
Loading repo metadata from GitHub API (page 1)...
1 repo(s) with new pushes have been found
Pulling repo maxogden/multirepo...
Cloned 0 new repos, skipped 0 existing repos, pulled 1 existing repos.
```

clone and pull all new repos since a custom timestamp:

```sh
multirepo pull --since 2013-11-28
```

you can check how many have changed by just running `multirepo`
