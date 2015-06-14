var ini = require('iniparser')
var _ = require('lodash')
var parseTorrent = require('parse-torrent')
var fs = require('fs')
var crypto = require('crypto')
var createTorrent = require('create-torrent')
var logger = require(__dirname + '/logger')('development')
var util = require('util')
var FolderCapper = require('folder-capper')
var async = require('async')
var torrent_tracker = require(__dirname + '/tracker')
// var torrent_peer = require(__dirname + '/peer')
var WebTorrent = require('webtorrent')
var Table = require('cli-table')
var moment = require('moment')
var betterConsole = require('better-console')
var events = require('events')

var MetadataFetcher = function (customProperties) {
  try {
    var properties_default = ini.parseSync(__dirname + '/settings/properties_default.conf')
    var properties_custom
    try {
      properties_custom = ini.parseSync(__dirname + '/settings/properties.conf')
    } catch (e) {
      properties_custom = {}
    }
    this.properties = _.merge(properties_default, properties_custom)
  } catch (e) {
    if (customProperties) {
      this.properties = customProperties || this.properties
    } else throw new Error('Missing properties')
  }
  this.client = new WebTorrent({maxPeers: this.properties.swarm.maxPeers})
  this.maxConns = this.properties.swarm.maxConns
  this.dataDir = __dirname + this.properties.folders.data
  this.spvFolder = this.dataDir + this.properties.folders.spvData
  this.fullNodeFolder = this.dataDir + this.properties.folders.fullNodeData
  this.torrentDir = __dirname + this.properties.folders.torrents
  this.capSize = this.properties.folders.capSize
  this.peerId = this.properties.client.peerId
  this.streamData = false
  this.cliViewStatus = false
  this.streamClientData()
}

util.inherits(MetadataFetcher, events.EventEmitter)

// MetadataFetcher.prototype.getMetadata = function (torrentHash, metadataSHA2, importent, cb) {

// }

// MetadataFetcher.prototype.addMetadata = function (metadata, cb) {

// }

// MetadataFetcher.prototype.shareMetadata = function (torrentHash, cb) {

// }

// this.emit('downloads', err, metadata)
// this.emit('downloads/' + torrentHash, err, peer)
// this.emit('uploads', err, peer)
// this.emit('uploads/' + torrentHash, err, metadata)

var saveTorrentToFolder = function (folder, maxConns) {
  return function (torrent) {
    // Got torrent metadata!
    logger.info('Saving torrent: ' + torrent.name + ' to folder: ' + folder)
    torrent.swarm.maxConns = maxConns
    // logger.debug(torrent.swarm.maxConns)
    torrent.files.forEach(function (file) {
      // console.log(file)
      var source = file.createReadStream()
      var destination = fs.createWriteStream(folder + file.name)
      source.pipe(destination)
    })
  }
}

var formatBytes = function (bytes, decimals) {
  if (bytes === 0) return '0 Byte'
  var k = 1024
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  var i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toPrecision(decimals + 1) + ' ' + sizes[i]
}

MetadataFetcher.prototype.cliView = function () {
  this.cliViewStatus = !this.cliViewStatus
}

MetadataFetcher.prototype.streamClientData = function () {
  this.streamData = !this.streamData
  var self = this
  var dataStream = setInterval(function () {
    if (!self.streamData) return clearInterval(dataStream)
    var table = new Table({
      head: [
        'Name',
        'Info hash',
        'Size',
        'Peers',
        'Connections',
        'Time remaining',
        'Progress',
        'Downloaded',
        'Download speed',
        'Uploaded',
        'Upload speed',
        'Ratio'
      ]
    })
    var dataSet = self.client.torrents.map(function (torrent) {
      var row = [
        torrent.name,
        torrent.infoHash,
        formatBytes(torrent.length, 2),
        torrent.swarm.numPeers,
        torrent.swarm.numConns,
        moment().startOf('day').seconds(torrent.timeRemaining / 1000).format('HH:mm:ss'),
        (torrent.progress * 100).toFixed(4) + '%',
        formatBytes(torrent.downloaded, 2),
        formatBytes(torrent.swarm.downloadSpeed(), 2),
        formatBytes(torrent.uploaded, 2),
        formatBytes(torrent.swarm.uploadSpeed(), 2),
        torrent.ratio
      ]
      table.push(row)
      return row
    })
    self.emit('clientData', dataSet)
    if (self.cliViewStatus) {
      betterConsole.clear()
      console.log(table.toString())
    }
  }, 100)
}

MetadataFetcher.prototype.start = function (cb) {
  var self = this
  async.waterfall([
    function (callback) {
      var options = {
        folderToClear: self.fullNodeFolder,
        ignores: self.properties.folders.ignore,
        folderToCap: self.dataDir,
        capSize: self.capSize,
        retryTime: self.properties.folders.diskNotReadyRetryTime,
        autoWatchInterval: self.properties.folders.autoWatchInterval
      }
      self.capper = new FolderCapper(options)

      self.capper.clear(callback)
    },
    function (junkResult, callback) {
      logger.debug('Pre Folders Cleaning results: ' + util.inspect(junkResult))
      torrent_tracker(self.properties, callback)
    },
    function (tracker, callback) {
      self.tracker = tracker
      logger.debug('Tracker listening on http port:' + tracker.http.address().port)
      logger.debug('Tracker listening on udp port:' + tracker.udp.address().port)
      logger.debug('Tracker listening on ws port:' + tracker.ws.options.port)
      var handleTorrent = saveTorrentToFolder(self.dataDir + '/test/', self.maxConns)
      // logger.debug(self.torrentDir)
      // self.peers = []
      fs.readdirSync(self.torrentDir).forEach(function (file) {
        var fileSplit = file.split('.')
        if (fileSplit[1] === 'torrent') {
          // logger.debug(fileSplit[0])
          var torrent = fs.readFileSync(self.torrentDir + '/' + file)
          self.client.add(torrent, handleTorrent)
        }
      })
      var testMag = 'magnet:?xt=urn:btih:5ADD2B0CE8F7DA372C856D4EFE6B9B6E8584919E&dn=taylor+swift+shake+it+off+2014+pop&tr=http%3A%2F%2Ftracker.ex.ua%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.com%3A1337'
      // var testMag = 'magnet:?xt=urn:btih:1eb7cc4083efa26eda476e563c28b7238c5f3683&dn=GIRLS+DO+PORN+-+18+Years+Old+-+Her+First+Hard+Fuck+HD+720p&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969'
      self.client.add(testMag, handleTorrent)

      callback(null, tracker)
    }], function (err, tracker) {
      if (err) return cb(err)
      return cb(null, self)
    }
  )
}

MetadataFetcher.prototype.publishMetaData = function (data, cb) {
  // if (MetadataFetcher.getDataHash(data) !== hash) return cb(new Error('hash dons\'t match'))
  var self = this
  async.waterfall([
    function (callback) {
      if (typeof data === 'string') {
        self.createTorrentFromMetaData(data, callback)
      } else if (typeof data === 'object') {
        self.createNewMetaDataFile(data, self.spvFolder, callback)
      } else callback(new Error('Can\' Parse Data'))
    },
    function (result, callback) {
      // logger.debug(result)
      if (result.torrent) return callback(null, result)
      self.createTorrentFromMetaData(result.fileName, callback)
    },
    function (result, callback) {
      // self.broadcastMetaData(result, callback)
      callback(null, result)
    }
  ], function (err, result) {
    if (err) return cb(err)
    // logger.debug('Torrent File: ' + util.inspect(result.torrent))
    cb(null, result)
  })
}

// MetadataFetcher.prototype.broadcastMetaData = function (hash, cb) {
//   cb(null, hash)
// }

// MetadataFetcher.prototype.getMetaData = function (hash, cb) {
//   cb(null, hash)
// }

MetadataFetcher.prototype.createNewMetaDataFile = function (data, pool, cb) {
  if (typeof pool === 'function') {
    cb = pool
    pool = this.spvFolder
  }
  var calculatedHash = MetadataFetcher.getHash(JSON.stringify(data))
  data = JSON.stringify(data)
  // logger.debug('calculatedHash:' + calculatedHash)
  // logger.debug('data:' + util.inspect(data))

  var filePath = pool + '/' + calculatedHash + '.dat'

  fs.writeFile(filePath, data, function (err) {
    if (err) return cb(err)
    logger.debug('Data File saved: ' + filePath)
    cb(null, {filePath: filePath, fileName: calculatedHash})
  })
}

MetadataFetcher.prototype.createTorrentFromMetaData = function (data, cb) {
  // {
  //   creationDate: Date       // creation time in UNIX epoch format (default = now)
  //   private: Boolean,        // is this a private .torrent? (default = false)
  //   pieceLength: Number      // force a custom piece length (number of bytes)
  //   announceList: [[String]] // custom trackers (array of arrays of strings) (see [bep12](http://www.bittorrent.org/beps/bep_0012.html))
  //   urlList: [String]        // web seed urls (see [bep19](http://www.bittorrent.org/beps/bep_0019.html))
  // }
  var filePath = this.spvFolder + '/' + data + '.dat'

  var opts = {
    // name: data + '.dat',
    comment: 'ColoredCoins',
    createdBy: this.peerId
  }

  var self = this
  var finish = function (filePath, fileName) {
    createTorrent(filePath, opts, function (err, torrent) {
      if (err) return cb(err)
      var torrentObject = parseTorrent(torrent)
      var torrentPath = self.torrentDir + '/' + torrentObject.infoHash + '.torrent'
      var magnetURI = parseTorrent.toMagnetURI(torrentObject)
      fs.writeFile(torrentPath, torrent, function (err) {
        if (err) return cb(err)
        logger.debug('Torrent File saved: ' + torrentPath)
        return cb(err, {torrent: torrentObject, fileName: fileName + '.torrent', filePath: torrentPath, magnetURI: magnetURI})
      })
    })
  }

  // opts.name = data
  fs.stat(filePath, function (err, stat) {
    if (!err) {
      finish(filePath, data)
    } else if (err.code === 'ENOENT') {
      filePath = self.fullNodeFolder + '/' + data + '.dat'
      fs.stat(filePath, function (err, stat) {
        if (err) return cb(err)
        finish(filePath, data)
      })
    } else {
      return cb(err)
    }
  })
}

MetadataFetcher.getHash = function (data) {
  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data)
  }
  var sha2 = crypto.createHash('sha256')
  var calculatedHash = sha2.update(data).digest('hex')
  return calculatedHash
}

module.exports = MetadataFetcher
