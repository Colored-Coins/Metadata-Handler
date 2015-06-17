var parseTorrent = require('parse-torrent')
var fs = require('fs')
var createTorrent = require('create-torrent')
var hash = require('crypto-hashing')

var getHash = function (data) {
  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data)
  }
  var sha2 = hash.sha256(data)
  return sha2
}

var createNewMetaDataFile = function (data, name, folder, cb) {
  data = JSON.stringify(data)
  var filePath = folder + '/' + name + '.ccm'
  fs.writeFile(filePath, data, function (err) {
    if (err) return cb(err)
    console.log('Data File saved: ', filePath)
    cb(null, {filePath: filePath, fileName: name})
  })
}

var createTorrentFromMetaData = function (params, cb) {
  var opts = {
    name: params.fileName,              // name of the torrent (default = basename of `path`)
    comment: 'Colored Coins Metadata',  // free-form textual comments of the author
    createdBy: 'ColoredCoins-1.0.0',    // name and version of program used to create torrent
    announceList: params.announce,      // custom trackers (array of arrays of strings) (see [bep12](http://www.bittorrent.org/beps/bep_0012.html))
    creationDate: params.creationDate,  // creation time in UNIX epoch format (default = now)
    private: params.private,            // is this a private .torrent? (default = false)
    urlList: params.urlList,            // web seed urls (see [bep19](http://www.bittorrent.org/beps/bep_0019.html))
    pieceLength: params.pieceLength     // force a custom piece length (number of bytes)
  }

  createTorrent(params.filePath, opts, function (err, torrent) {
    if (err) return cb(err)
    var torrentObject = parseTorrent(torrent)
    var fileName = torrentObject.infoHash + '.torrent'
    var torrentPath = params.torrentDir + '/' + fileName
    var magnetURI = parseTorrent.toMagnetURI(torrentObject)
    fs.writeFile(torrentPath, torrent, function (err) {
      if (err) return cb(err)
      console.log('Torrent File saved: ', torrentPath)
      return cb(err, {torrent: torrentObject, fileName: fileName, filePath: torrentPath, magnetURI: magnetURI})
    })
  })
}

module.exports = {
  getHash: getHash,
  createNewMetaDataFile: createNewMetaDataFile,
  createTorrentFromMetaData: createTorrentFromMetaData
}
