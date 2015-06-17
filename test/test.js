var TorrentFS = require(__dirname + '/../app.js')
var crypto = require('crypto')
var logger = require(__dirname + '/../logger')('development')
var assert = require('assert')
// var util = require('util')
var torrentApp
var bufferedData
var torrentData
var calculatedHash

describe('Torrent Creation', function () {
  this.timeout(0)
  before(function (done) {
    torrentApp = new TorrentFS()
    torrentApp.start(function (err, server) {
      if (err) return done(err)
      // logger.info('Server Object: ' + util.inspect(server))
      torrentData = {
        test1: 'test32',
        test2: 'test212',
        test13: 'test32',
        test23: 'test212',
        test12: 'test32',
        test21: 'test212'
      }
      bufferedData = JSON.stringify(torrentData)
      // logger.debug('String Data: ' + util.inspect(JSON.stringify(bufferedData)))
      if (!Buffer.isBuffer(bufferedData)) {
        bufferedData = new Buffer(bufferedData)
      }
      var sha2 = crypto.createHash('sha256')
      calculatedHash = sha2.update(bufferedData).digest('hex')
      // logger.debug('Data is: ' + util.inspect(torrentData))
      // logger.debug('bufferedData: ' + util.inspect(JSON.stringify(bufferedData)))
      logger.debug('Calculaed sha256 Hash: ' + calculatedHash)
      done()
    })
    // initialize the database
  })

  after(function () {
    // clear the database
    logger.debug('ended testing \'Torrent Creation\'')
  })

  it('should return a torrent file from JSON data', function (done) {
    torrentApp.publishMetaData(torrentData, function (err, result) {
      assert(!err, err)
      assert(result.torrent.name === calculatedHash + '.dat', 'Wrong Hashing')
      logger.debug('Torrent Name: ' + result.torrent.name)
      logger.debug('fileName: ' + result.fileName)
      logger.debug('filePath: ' + result.filePath)
      logger.debug('torrent info hash: ' + result.torrent.infoHash)
      logger.debug('magnetURI: ' + result.magnetURI)
      // assert(result.name === result.infoHash, 'Wrong hashing Scheme')
      // logger.debug(util.inspect(result))
      done()
    })
  })

  it('should return a torrent file from Hash name', function (done) {
    torrentApp.publishMetaData(calculatedHash, function (err, result) {
      assert(!err, err)
      assert(result.torrent.name === calculatedHash + '.dat', 'Wrong Hashing')
      logger.debug('Torrent Name: ' + result.torrent.name)
      logger.debug('fileName: ' + result.fileName)
      logger.debug('filePath: ' + result.filePath)
      logger.debug('torrent info hash: ' + result.torrent.infoHash)
      logger.debug('magnetURI: ' + result.magnetURI)
      // assert(result.name === result.infoHash, 'Wrong hashing Scheme')
      // logger.debug(util.inspect(result))
      done()
    })
  })

  it('should return a error since no data file is found', function (done) {
    torrentApp.createTorrentFromMetaData(calculatedHash + '0', function (err, result) {
      assert(err, err)
      logger.debug('filePath: ' + err)
      done()
    })
  })

  it('should return a data file', function (done) {
    torrentData = {
      test1: 'test32',
      test2: 'test212'
    }
    torrentApp.createNewMetaDataFile(torrentData, function (err, result) {
      assert(!err, err)
      assert(result.fileName, result.fileName)
      assert(result.filePath, result.filePath)
      logger.debug('fileName: ' + result.fileName)
      logger.debug('filePath: ' + result.filePath)
      // assert(result.name === result.infoHash, 'Wrong hashing Scheme')
      // logger.debug(util.inspect(result))
      done()
    })
  })

  it('should return a torrent file from data in file', function (done) {
    bufferedData = JSON.stringify(torrentData)
    // logger.debug('String Data: ' + util.inspect(JSON.stringify(bufferedData)))
    if (!Buffer.isBuffer(bufferedData)) {
      bufferedData = new Buffer(bufferedData)
    }
    var sha2 = crypto.createHash('sha256')
    calculatedHash = sha2.update(bufferedData).digest('hex')
    // logger.debug('Data is: ' + util.inspect(torrentData))
    // logger.debug('bufferedData: ' + util.inspect(JSON.stringify(bufferedData)))
    logger.debug('Calculaed sha256 Hash: ' + calculatedHash)
    torrentApp.createTorrentFromMetaData(calculatedHash, function (err, result) {
      assert(!err, err)
      assert(result.torrent.name === calculatedHash + '.dat', 'Wrong Hashing')
      // assert(!err, err)
      // result = parseTorrent(result)
      logger.debug('fileName: ' + result.fileName)
      logger.debug('filePath: ' + result.filePath)
      // assert(result.name === calculatedHash, 'Wrong Hashing, Name: ' + result.name + ', Calc Hash: ' + calculatedHash)
      // assert(result.name === result.infoHash, 'Wrong hashing Scheme')
      // logger.debug(util.inspect(result))
      done()
    })
  })

  it('should return a data file in full node folder', function (done) {
    torrentData = {
      test15: 'test32',
      test23: 'test212'
    }
    torrentApp.createNewMetaDataFile(torrentData, './data/full', function (err, result) {
      assert(!err, err)
      assert(result.fileName, result.fileName)
      assert(result.filePath, result.filePath)
      logger.debug('fileName: ' + result.fileName)
      logger.debug('filePath: ' + result.filePath)
      // assert(result.name === result.infoHash, 'Wrong hashing Scheme')
      // logger.debug(util.inspect(result))
      done()
    })
  })

  it('should return a torrent file from data in full node folder', function (done) {
    bufferedData = JSON.stringify(torrentData)
    // logger.debug('String Data: ' + util.inspect(JSON.stringify(bufferedData)))
    if (!Buffer.isBuffer(bufferedData)) {
      bufferedData = new Buffer(bufferedData)
    }
    var sha2 = crypto.createHash('sha256')
    calculatedHash = sha2.update(bufferedData).digest('hex')
    // logger.debug('Data is: ' + util.inspect(torrentData))
    // logger.debug('bufferedData: ' + util.inspect(JSON.stringify(bufferedData)))
    logger.debug('Calculaed sha256 Hash: ' + calculatedHash)
    torrentApp.createTorrentFromMetaData(calculatedHash, function (err, result) {
      assert(!err, err)
      assert(result.torrent.name === calculatedHash + '.dat', 'Wrong Hashing')
      // assert(!err, err)
      // result = parseTorrent(result)
      logger.debug('fileName: ' + result.fileName)
      logger.debug('filePath: ' + result.filePath)
      // assert(result.name === calculatedHash, 'Wrong Hashing, Name: ' + result.name + ', Calc Hash: ' + calculatedHash)
      // assert(result.name === result.infoHash, 'Wrong hashing Scheme')
      // logger.debug(util.inspect(result))
      done()
    })
  })

})
