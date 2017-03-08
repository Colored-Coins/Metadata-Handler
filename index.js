var util = require('util')
// var FolderCapper = require('folder-capper')
var async = require('async')
var WebTorrent = require('webtorrent')
var events = require('events')
var parseTorrent = require('parse-torrent')
var fs = require('graceful-fs')
var createTorrent = require('create-torrent')
var hash = require('crypto-hashing')
var _ = require('lodash')

var FILEEXTENSION = '.ccm'

var MetadataHandler = function (properties) {
  // Torrent setup
  this.announce = properties.client.announce
  this.urlList = properties.client.urlList

  // File system propertie
  this.dataDir = properties.folders.data
  this.torrentDir = properties.folders.torrents

  // Start the torrent Client
  this.client = new WebTorrent(properties.client)
}

util.inherits(MetadataHandler, events.EventEmitter)

var merge = function (torrent, cb) {
  var folderPath = torrent.path
  var fileArray = torrent.files
  var result = {}
  async.map(fileArray
    , function (file, callback) {
      var filePath = folderPath + '/' + file.path
      fs.readFile(filePath, function (err, data) {
        if (err) return callback(err)
        try {
          var jsonData = JSON.parse(data)
          return callback(null, jsonData)
        } catch (e) {
          return callback(e)
        }
      })
    }
    , function (err, results) {
      if (err) return cb(err)
      cb(null, _.merge(result, results))
    }
  )
}

var getHash = function (data) {
  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data)
  }
  var sha2 = hash.sha256(data)
  return sha2
}

var createNewMetaDataFile = function (data, name, folder, cb) {
  data = JSON.stringify(data)
  var fileName = name + FILEEXTENSION
  var filePath = folder + '/' + fileName
  fs.writeFile(filePath, data, function (err) {
    if (err) return cb(err)
    cb(null, {filePath: filePath, fileName: fileName})
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
      return cb(err, {torrent: torrentObject, fileName: fileName, filePath: torrentPath, magnetURI: magnetURI})
    })
  })
}

var getFileNameFromTorrent = function (torrentFileName, cb) {
  fs.readFile(torrentFileName, function (err, data) {
    if (err) return cb(err)
    var parsedTorrent
    try {
      parsedTorrent = parseTorrent(data)
    } catch (err) {
      return cb(err)
    }
    return cb(null, parsedTorrent.name)
  })
}

MetadataHandler.prototype.getMetadata = function (input, sha2, cb) {
  var opts = {
    announce: this.announce, // List of additional trackers to use (added to list in .torrent or magnet uri)
    path: this.dataDir,      // Folder where files will be downloaded (default=`/tmp/webtorrent/`)
    verify: true             // Verify previously stored data before starting (default=false)
  }
  var self = this
  this.client.add(input, opts, function (torrent) {
    torrent.on('done', function () {
      merge(torrent, function (err, metadata) {
        if (err) {
          self.emit('error', err)
          if (cb) cb(err)
        }
        if (sha2 && getHash(metadata) !== sha2) {
          err = new Error(input + ' has failed hash test')
          self.emit('error', err)
          if (cb) cb(err)
          return
        }
        self.emit('downloads/' + input, metadata)
        self.emit('downloads', metadata)
        if (cb) cb(null, metadata)
      })
    })
  })
}

MetadataHandler.prototype.addMetadata = function (metadata, cb) {
  var sha2
  if (Buffer.isBuffer(metadata)) {
    sha2 = getHash(metadata)
  } else {
    try {
      sha2 = getHash(JSON.stringify(metadata))
    } catch (e) {
      return cb(e)
    }
  }
  var fileName = sha2.toString('hex')
  var self = this
  async.waterfall([
    function (callback) {
      createNewMetaDataFile(metadata, fileName, self.dataDir, callback)
    },
    function (result, callback) {
      result.torrentDir = self.torrentDir
      result.announce = self.announce
      result.urlList = self.urlList
      createTorrentFromMetaData(result, callback)
    }
  ], function (err, result) {
    if (err) return cb(err)
    cb(null, {torrentHash: new Buffer(result.torrent.infoHash, 'hex'), sha2: sha2})
  })
}

MetadataHandler.prototype.shareMetadata = function (infoHash, cb) {
  var self = this
  var torrentFilePath = this.torrentDir + '/' + infoHash + '.torrent'
  getFileNameFromTorrent(torrentFilePath, function (err, dataFileName) {
    if (err) {
      self.emit('error', err)
      if (cb) cb(err)
      return
    }
    var dataFilePath = self.dataDir + '/' + dataFileName
    var opts = {
      name: dataFileName,                 // name of the torrent (default = basename of `path`)
      comment: 'Colored Coins Metadata',  // free-form textual comments of the author
      createdBy: 'ColoredCoins-1.0.0',    // name and version of program used to create torrent
      announceList: self.announce,        // custom trackers (array of arrays of strings) (see [bep12](http://www.bittorrent.org/beps/bep_0012.html))
      urlList: self.urlList               // web seed urls (see [bep19](http://www.bittorrent.org/beps/bep_0019.html))
    }
    self.client.on('error', function (err) {console.error(err)})
    self.client.seed(dataFilePath, opts, function (torrent) {
      self.emit('uploads/' + infoHash, torrent)
      self.emit('uploads', torrent)
      if (cb) cb(null, torrent)
    })
  })
}

MetadataHandler.prototype.removeMetadata = function (infoHash, cb) {
  var self = this
  var torrentFilePath = self.torrentDir + '/' + infoHash + '.torrent'
  async.auto({
    removeTorrentFromClient: function (cb) {
      self.client.remove(infoHash, cb)
    },
    getDataFileName: ['removeTorrentFromClient', function (cb) {
      getFileNameFromTorrent(torrentFilePath, cb)
    }],
    deleteMetdataFile: ['getDataFileName', function (cb, results) {
      var dataFileName = results.getDataFileName
      var dataFilePath = self.dataDir + '/' + dataFileName
      fs.unlink(dataFilePath, cb)
    }],
    deleteTorrentFile: ['getDataFileName', function (cb) {
      fs.unlink(torrentFilePath, cb)
    }]
  },
  function (err) {
    if (err) {
      self.emit('error', err)
      if (cb) cb(err)
      return
    }
    cb()
  })
}

module.exports = MetadataHandler
