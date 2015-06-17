var Table = require('cli-table')
var moment = require('moment')
var betterConsole = require('better-console')
var MetaDataHandler = require('./index')
var util = require('util')

var CliView = function (options) {
  MetaDataHandler.call(this, options)
  this.streamData = options.streamData
  this.cliViewStatus = options.cliViewStatus
  this.streamClientData()
}

util.inherits(CliView, MetaDataHandler)

var formatBytes = function (bytes, decimals) {
  if (bytes === 0) return '0 Byte'
  var k = 1024
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  var i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toPrecision(decimals + 1) + ' ' + sizes[i]
}

CliView.prototype.cliView = function () {
  this.cliViewStatus = !this.cliViewStatus
}

CliView.prototype.streamClientData = function () {
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
        torrent.name || '',
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
      // console.log('table: ', table)
      return row
    })
    self.emit('clientData', dataSet)
    if (self.cliViewStatus) {
      betterConsole.clear()
      console.log(table.toString())
    }
  }, 100)
}

module.exports = CliView
