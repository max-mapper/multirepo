var request = require('request')
var series = require('run-series')
var child = require('child_process')
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
  
  function cloneRepos(repos, cb) {
    var fns = repos.map(function(repo) {
      return function clone(cb) {
        ev.emit('clone-progress', repo)
        child.exec('git clone ' + repo.clone_url, function(err, stdo, stde) {
          cb(err, {full_name: repo.full_name, clone_url: repo.clone_url, stdout: stdo, stde: stde})
        })
      }
    })
    series(fns, cb)
  }
  
}
