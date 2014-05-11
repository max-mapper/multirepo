var request = require('request')
var series = require('run-series')
var child = require('child_process')
var path = require('path')
var Emitter = require('events').EventEmitter

var base = 'https://api.github.com'

module.exports = function(token, cb) {
  var ev = new Emitter()
  
  var headers = {"user-agent": "multirepo module"}
  headers['Authorization'] = 'token ' + token
  
  request(base + '/user', {json: true, headers: headers}, function(err, resp, me) {
    if (err) return cb(err)
    
    getAllRepos()
    
    function getAllRepos() {
      var allRepos = []
      var pageNum = 1
      
      setImmediate(getRepos)
      
      function getRepos() {
        var reqUrl = base + '/user/repos?page=' + pageNum + '&per_page=100'
        ev.emit('load-progress', pageNum.toString())
        request(reqUrl, { json: true, headers: headers }, function(err, resp, repos) {
          if (err || resp.statusCode > 299) return cb(err || resp.statusCode)
          if (repos.length === 0) return cb(null, {user: me, repos: allRepos})
          allRepos = allRepos.concat(repos)
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
        ev.emit('clone-progress', repo)
        var repoResult = {full_name: repo.full_name, clone_url: repo.clone_url}
        child.exec('git clone ' + repo.clone_url, function(err, stdo, stde) {
          repoResult.stdout = stdo
          repoResult.stderr = stde
          if (!options.pull) return cb(null, repoResult)
          if (stde.indexOf('already exists') > -1) {
            var repoPath = path.join(process.cwd(), repo.name)
            child.exec('git pull origin master', {cwd: repoPath}, function(err, stdo, stde) {
              repoResult.stdout = stdo
              repoResult.stderr = stde
              cb(null, repoResult)
            })
          } else {
            cb(null, repoResult)
          }
        })
      }
    })
    series(functions, function(err, results) {
      var stats = {skipped: 0, cloned: 0, pulled: 0}
      results.map(function(r) {
        if (r.stderr.indexOf('already exists') > -1) stats.skipped++
        if (r.stderr.indexOf('Cloning into') > -1) stats.cloned++
      })
      cb(err, stats)
    })
  }
  
}
