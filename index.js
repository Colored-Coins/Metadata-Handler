var util = require('util')
var FolderCapper = require('folder-capper')
var async = require('async')
var WebTorrent = require('webtorrent')
var events = require('events')
var utils = require('./utils')

var MetadataHandler = function (properties) {
  // Torrent setup
  this.announce = properties.client.announce
  this.urlList = properties.client.urlList

  // File system propertie
  this.dataDir = properties.folders.data
  this.spvFolder = this.dataDir + properties.folders.spvData
  this.fullNodeFolder = this.dataDir + properties.folders.fullNodeData
  this.torrentDir = properties.folders.torrents

  // Folder Capper Settings
  var options = {
    folderToClear: this.fullNodeFolder,
    ignores: properties.folders.ignores,
    folderToCap: this.dataDir,
    capSize: properties.folders.capSize,
    retryTime: properties.folders.retryTime
  }

  // Start the torrent Client
  this.client = new WebTorrent(properties.client)

  // Start the floder capper
  this.capper = new FolderCapper(options)
  var self = this
  this.capper.on('full', function (amountToClear) {
    self.emit('full', amountToClear)
    self.capper.clear(function (err, results) {
      if (err) return self.emit('error', err)
      return self.emit('cleanup', results)
    })
  })
  this.capper.startWatchMode(properties.folders.autoWatchInterval)
}

util.inherits(MetadataHandler, events.EventEmitter)

MetadataHandler.prototype.getMetadata = function (input, sha2, spv, cb) {
  // if (input === '5ADD2B0CE8F7DA372C856D4EFE6B9B6E8584919E') require(__dirname + '/vlc.js')('5ADD2B0CE8F7DA372C856D4EFE6B9B6E8584919E')
  var folderToSave = spv ? this.spvFolder : this.fullNodeFolder
  var opts = {
    announce: this.announce, // List of additional trackers to use (added to list in .torrent or magnet uri)
    path: folderToSave,      // Folder where files will be downloaded (default=`/tmp/webtorrent/`)
    verify: true             // Verify previously stored data before starting (default=false)
  }
  var self = this
  this.client.add(input, opts, function (torrent) {
    // console.log(self.client)
    torrent.on('done', function () {
      utils.merge(torrent, function (err, metadata) {
        if (err) {
          self.emit('error', err)
          if (cb) cb(err)
        }
        if (sha2 && utils.getHash(metadata) !== sha2) {
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
    sha2 = utils.getHash(metadata)
  } else {
    try {
      sha2 = utils.getHash(JSON.stringify(metadata))
    } catch (e) {
      return cb(e)
    }
  }
  var fileName = sha2.toString('hex')
  var self = this
  async.waterfall([
    function (callback) {
      utils.createNewMetaDataFile(metadata, fileName, self.spvFolder, callback)
    },
    function (result, callback) {
      result.torrentDir = self.torrentDir
      result.announce = self.announce
      result.urlList = self.urlList
      utils.createTorrentFromMetaData(result, callback)
    }
  ], function (err, result) {
    if (err) return cb(err)
    cb(null, {torrentHash: new Buffer(result.torrent.infoHash, 'hex'), sha2: sha2})
  })
}

MetadataHandler.prototype.shareMetadata = function (infoHash, spv, cb) {
  if (typeof spv === 'function') {
    cb = spv
    spv = true
  }
  if (typeof spv === 'undefined') spv = true
  var torrentFilePath = this.torrentDir + '/' + infoHash + '.torrent'
  var self = this
  utils.getFilePathFromTorrent(torrentFilePath, function (err, dataFileName) {
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
      self.emit('uploads/' + infoHash, torrent)
      self.emit('uploads', torrent)
      if (cb) cb(null, torrent)
    })
  })
}

module.exports = MetadataHandler
