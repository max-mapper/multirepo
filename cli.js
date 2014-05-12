#!/usr/bin/env node
var multirepo = require('./')
var log = require('single-line-log')
var argv = require('minimist')(process.argv.slice(2))

var child = require('child_process')
var url = require('url')
var ghauth = require('ghauth')
var mkdirp = require('mkdirp')
var path = require('path')
var fs = require('fs')

var ghAuthOptions = {
   // ~/.config/[configName].json will store the token
  configName : 'multirepo-github',
  // (optional) whatever GitHub auth scopes you require
  scopes     : [ 'repo' ],
  // (optional) saved with the token on GitHub
  note       : 'This token is for the multirepo module from NPM'
}

var lastFetch
var lastFetchPath = path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'last-multirepo-fetch.txt')
mkdirp.sync(path.dirname(lastFetchPath))
if (!fs.existsSync(lastFetchPath)) lastFetch = false
else lastFetch = argv.since || fs.readFileSync(lastFetchPath).toString()


auth(function(err, authData) {
  if (err) return console.error(err)
  
  var repoOpts = {
    token: authData.token,
    sort: 'updated'
  }
  
  if (lastFetch) {
    repoOpts.since = lastFetch
    console.log('Checking for repos with new pushes since', lastFetch)
  }
  
  var mr = multirepo(repoOpts, function(err, data) {
    if (err) return console.error(err)
    
    // filter out repos that you don't own
    var repos = []
    data.repos.map(function(r) {
      if (r.owner.login === data.user.login) repos.push(r)
    })
    
    console.log(repos.length + ' repo(s) with new pushes have been found')
    
    if (argv._[0] === 'clone') {
      
      if (repos.length === 0) return console.log('No new pushes since', lastFetch)
      
      mr.cloneRepos(repos, argv, function(err, results) {
        if (err) return console.error(err)
        log('Cloned', results.cloned, 'new repos, skipped', results.skipped, 'existing repos,', 'pulled', results.pulled, 'existing repos.')
        fs.writeFileSync(lastFetchPath, new Date().toISOString())
      })
    }
    
  })
  
  mr.on('load-progress', function(num) {
    log('Loading repo metadata from GitHub API (page ' + num + ')...')
  })
  
  mr.on('clone-progress', function(repo, verb) {
    verb = verb || 'Cloning'
    log(verb + ' repo ' + repo.full_name + '...')
  })
})

function auth(cb) {
  var user = process.argv[2]
  ghauth(ghAuthOptions, function (err, authData) {
    if (err) return cb(err)
    cb(null, authData)
  })
}
