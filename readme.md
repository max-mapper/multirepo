# multirepo

[![NPM](https://nodei.co/npm/multirepo.png)](https://nodei.co/npm/multirepo/)

a power tool for batch processing multiple github repositories

## usage

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

your github credentials are stored in `~/.config/multirepo-github.json`. 

the timestamp of your last successful pull/clone is stored in `~/.config/last-multirepo-fetch.txt`

clone and pull all new repos since a custom timestamp:

```sh
multirepo pull --since 2013-11-28
```

you can check how many have changed by just running `multirepo`

clone someone elses repos:

```sh
multirepo clone --user substack --since 2014-01-01
```

## bulk updating

If you clone many users' repos into one repositories organized by username, e.g.:

```
$ ls repositories/
dominictarr
mafintosh
maxogden
raynos
rvagg
substack
```

then you can put this bash script in your `repositories` folder and run it to bulk update all of the sub-multirepo folders:

```sh
#!/bin/bash

for i in * ; do
  if [ -d "$i" ]; then
    cd $(basename "$i")
    CMD="multirepo clone --pull --user $(basename "$i") --since $(cat ../lastdate.txt)"
    echo $CMD
    $CMD
    cd ..
  fi
done
date +%Y-%m-%d > lastdate.txt
 
```
