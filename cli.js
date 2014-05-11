#!/usr/bin/env node
var multirepo = require('./')
var log = require('single-line-log')
var argv = require('minimist')(process.argv.slice(2))

var child = require('child_process')
var url = require('url')
var ghauth = require('ghauth')

var ghAuthOptions = {
   // ~/.config/[configName].json will store the token
  configName : 'multirepo-github',
  // (optional) whatever GitHub auth scopes you require
  scopes     : [ 'repo' ],
  // (optional) saved with the token on GitHub
  note       : 'This token is for the multirepo module from NPM'
}


auth(function(err, authData) {
  if (err) return console.error(err)
  var mr = multirepo(authData.token, function(err, data) {
    if (err) return console.error(err)
    
    if (argv._[0] === 'clone') {
      
      var repos = []
      
      data.repos.map(function(r) {
        if (r.owner.login === data.user.login) repos.push(r)
      })
      
      mr.cloneRepos(repos, argv, function(err, results) {
        if (err) return console.error(err)
        log('Cloned', results.cloned, 'new repos, skipped', results.skipped, 'existing repos.')
      })
    }
    
  })
  
  mr.on('load-progress', function(num) {
    log('Loading repo page ' + num + ' (100 per page) ...')
  })
  
  mr.on('clone-progress', function(repo) {
    log('Cloning repo ' + repo.full_name + '...')
  })
})

function auth(cb) {
  var user = process.argv[2]
  ghauth(ghAuthOptions, function (err, authData) {
    if (err) return cb(err)
    cb(null, authData)
  })
}
