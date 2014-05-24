var request = require('request')
var series = require('run-series')
var child = require('child_process')
var path = require('path')
var fs = require('fs')
var Emitter = require('events').EventEmitter

var base = 'https://api.github.com'

module.exports = function(opts, cb) {
  if (!opts.token) return cb(new Error('must pass in token'))
  var ev = new Emitter()
  
  var headers = {"user-agent": "multirepo module"}
  headers['Authorization'] = 'token ' + opts.token
  
  request(base + '/user', {json: true, headers: headers}, function(err, resp, me) {
    if (err) return cb(err)
    
    getAllRepos()
    
    function getAllRepos() {
      var allRepos = []
      var pageNum = 1
      
      setImmediate(getRepos)
      
      function getRepos() {
        var user = me
        if (opts.user) user = {login: opts.user}
        var reqUrl = base + '/user' + (opts.user ? 's/' + opts.user : '/') + '/repos?sort=pushed&page=' + pageNum + '&per_page=100'
        ev.emit('load-progress', pageNum.toString())
        request(reqUrl, { json: true, headers: headers }, function(err, resp, repos) {
          if (err || resp.statusCode > 299) return cb(err || resp.statusCode)
          if (repos.length === 0) return cb(null, {user: user, repos: allRepos})
          if (opts.since) {
            for (var i = 0; i < repos.length; i++) {
              var r = repos[i]
              if (r.pushed_at < opts.since) return cb(null, {user: user, repos: allRepos})
              else allRepos = allRepos.concat(r)
            }
          } else {
            allRepos = allRepos.concat(repos)
          }

          if (!opts.forks) {
            allRepos = allRepos.filter(function(repo) {
              return !repo.fork
            })
          }

          getRepos(pageNum++)
        })
      }
    }
  })
  
  ev.cloneRepos = cloneRepos
  
  return ev
  
  function cloneRepos(repos, options, cb) {
    if (typeof options === 'function') {
      cb = options
      options = {}
    }
    var functions = repos.map(function(repo) {
      return function clone(cb) {
        var repoPath = path.join(process.cwd(), repo.name)
        var repoResult = {full_name: repo.full_name, clone_url: repo.clone_url}
        if (options.pull && fs.existsSync(repoPath)) return pull()
        ev.emit('clone-progress', repo)
        child.exec('git clone ' + repo.clone_url, function(err, stdo, stde) {
          repoResult.stdout = stdo
          repoResult.stderr = stde
          if (!options.pull) return cb(null, repoResult)
          if (stde.indexOf('already exists') > -1) {
            pull()
          } else {
            cb(null, repoResult)
          }
        })
        
        function pull() {
          ev.emit('clone-progress', repo, 'Pulling')
          
          child.exec('git pull origin master', {cwd: repoPath}, function(err, stdo, stde) {
            repoResult.stdout = stdo
            repoResult.stderr = stde
            cb(null, repoResult)
          })
        }
      }
    })
    series(functions, function(err, results) {
      var stats = {skipped: 0, cloned: 0, pulled: 0}
      results.map(function(r) {
        if (r.stderr.indexOf('already exists') > -1) stats.skipped++
        if (r.stderr.indexOf('Cloning into') > -1) stats.cloned++
        if (r.stderr.indexOf('FETCH_HEAD') > -1) stats.pulled++
      })
      cb(err, stats)
    })
  }
  
}
