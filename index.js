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
  this.spvFolder = this.dataDir + properties.folders.spvData
  this.fullNodeFolder = this.dataDir + properties.folders.fullNodeData
  this.torrentDir = properties.folders.torrents

  this.seedConcurrency = properties.seedConcurrency


  // Folder Capper Settings
  // var options = {
  //   folderToClear: this.fullNodeFolder,
  //   ignores: properties.folders.ignores,
  //   folderToCap: this.dataDir,
  //   capSize: properties.folders.capSize,
  //   retryTime: properties.folders.retryTime
  // }

  // Start the torrent Client
  this.client = new WebTorrent(properties.client)

  // // Start the floder capper
  // this.capper = new FolderCapper(options)
  // var self = this
  // this.capper.on('full', function (amountToClear) {
  //   self.emit('full', amountToClear)
  //   self.capper.clear(function (err, results) {
  //     if (err) return self.emit('error', err)
  //     return self.emit('cleanup', results)
  //   })
  // })
  // this.capper.startWatchMode(properties.folders.autoWatchInterval)
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

var getFilePathFromTorrent = function (torrentFileName, cb) {
  fs.readFile(torrentFileName, function (err, data) {
    if (err) return cb(err)
    return cb(null, parseTorrent(data).name)
  })
}

MetadataHandler.prototype.getMetadata = function (input, sha2, spv, cb) {
  var folderToSave = spv ? this.spvFolder : this.fullNodeFolder
  var opts = {
    announce: this.announce, // List of additional trackers to use (added to list in .torrent or magnet uri)
    path: folderToSave,      // Folder where files will be downloaded (default=`/tmp/webtorrent/`)
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
      createNewMetaDataFile(metadata, fileName, self.spvFolder, callback)
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

MetadataHandler.prototype.shareMetadata = function (infoHash, spv, cb) {
  var self = this
  var torrentFilePath = this.torrentDir + '/' + infoHash + '.torrent'
  var torrent = fs.readFileSync(torrentFilePath)
  getFilePathFromTorrent(torrentFilePath, function (err, dataFileName) {
    if (err) {
      self.emit('error', err)
      if (cb) cb(err)
      return
    }
    var folderToLook = spv ? self.spvFolder : self.fullNodeFolder
    var dataFilePath = folderToLook + '/' + dataFileName
    var opts = {
      name: dataFileName,                 // name of the torrent (default = basename of `path`)
      comment: 'Colored Coins Metadata',  // free-form textual comments of the author
      createdBy: 'ColoredCoins-1.0.0',    // name and version of program used to create torrent
      announceList: self.announce,        // custom trackers (array of arrays of strings) (see [bep12](http://www.bittorrent.org/beps/bep_0012.html))
      urlList: self.urlList               // web seed urls (see [bep19](http://www.bittorrent.org/beps/bep_0019.html))
    }
    self.client.on('error', function (err) {console.error(err)})
    self.client.seed(dataFilePath, opts, function (torrent) {
      console.log('onseed() - torrent.infoHash = ', torrent.infoHash)
      self.emit('uploads/' + infoHash, torrent)
      self.emit('uploads', torrent)
      if (cb) cb(null, torrent)
    })
  })
}

MetadataHandler.prototype.shareMetadataBulks = function (infoHashes, spv, cb) {
  if (typeof spv === 'function') {
    cb = spv
    spv = true
  }
  if (typeof spv === 'undefined') spv = true

  var self = this
  var cargoCount = 0
  var cargo = async.cargo(function (infoHashes, callback) {
    var count = 0;
    for (var i = 0 ; i < infoHashes.length ; i++) {
      console.log('Start seeding : ' + infoHashes[i] + ', # ' + (cargoCount * self.seedConcurrency +  i))
      self.shareMetadata(infoHashes[i], spv, function(err) {
        count++
        if (count == infoHashes.length) {
          callback(err)
        }
      })
    }
  }, self.seedConcurrency)
  
  infoHashes.forEach(function (infoHash) {
    cargo.push(infoHash, function(err) {
      if (err) return console.error("Error in shareMetadata()! err = ", err)
    })
  })
}

module.exports = MetadataHandler
