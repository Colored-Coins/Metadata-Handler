var torrentServer = require('bittorrent-tracker')
var util = require('util')
var logger = require('./logger')('development')

module.exports = function (properties, cb) {
  // var infoHash = 'aaa67059ed6bd08362da625b3ae77f6f4a075aaa'

  var onListening = function () {
    logger.debug('Traker started')
    // get info hashes for all torrents in the tracker server
    logger.debug('torrents tracked in this server: ' + util.inspect(Object.keys(server.torrents)))
    cb(null, server)
  }

  var server = new torrentServer.Server({
    udp: properties.server.udp === 'true', // enable udp server? [default=true]
    http: properties.server.http === 'true', // enable http server? [default=true]
    ws: properties.server.ws === 'true' // enable websocket server? [default=false]
    // filter: function (hash, params) {
    //   // black/whitelist for disallowing/allowing torrents [default=allow all]
    //   // this example only allows this one torrent
    //   return hash === infoHash

    //   // you can also block by peer id (whitelisting torrent clients) or by
    //   // secret key, as you get full access to the original http GET
    //   // request parameters in `params`
    // }
  })

  server.on('error', function (err) {
    // fatal server error!
    logger.info(err.message)
  })

  server.on('warning', function (err) {
    // client sent bad data. probably not a problem, just a buggy client.
    logger.info(err.message)
  })

  server.on('listening', function (err) {
    if (err) cb(err)
    // cb(null, server)
  })

  if (properties.hostname) {
    // start tracker server listening! Use 0 to listen on a random free port.
    server.listen(properties.server.port, properties.server.hostname, onListening)
  } else {
    server.listen(properties.server.port, onListening)
  }

  // listen for individual tracker messages from peers:
  server.on('start', function (addr) {
    logger.info('got start message from ' + addr)
  })

  server.on('complete', function (addr) {})
  server.on('update', function (addr) {})
  server.on('stop', function (addr) {})

  // // get the number of seeders for a particular torrent
  // server.torrents[infoHash].complete

  // // get the number of leechers for a particular torrent
  // server.torrents[infoHash].incomplete

  // // get the peers who are in a particular torrent swarm
  // server.torrents[infoHash].peers

}
