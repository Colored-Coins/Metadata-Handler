var exec = require('child_process').exec

// executes `pwd`
module.exports = function (torrentHash) {
  exec('webtorrent ' + torrentHash + ' --vlc', function (error, stdout, stderr) {
    if (error !== null) {
      return console.log('exec error: ' + error)
    }
    return
  })
}
