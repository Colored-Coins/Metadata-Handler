var Client = require('bittorrent-tracker')
var logger = require('./logger')('development')

module.exports = function (properties, torrentFile) {
  var client = new Client(properties.client.peerId, properties.client.port, torrentFile)

  client.on('error', function (err) {
    // fatal client error!
    logger.info(torrentFile.info.name + ':' + err.message)
  })

  client.on('warning', function (err) {
    // a tracker was unavailable or sent bad data to the client. you can probably ignore it
    logger.info(torrentFile.info.name + ':' + err.message)
  })

  // start getting peers from the tracker
  // client.start()

  client.on('update', function (data) {
    logger.info(torrentFile.info.name + ':' + 'got an announce response from tracker: ' + data.announce)
    logger.info(torrentFile.info.name + ':' + 'number of seeders in the swarm: ' + data.complete)
    logger.info(torrentFile.info.name + ':' + 'number of leechers in the swarm: ' + data.incomplete)
  })

  client.once('peer', function (addr) {
    logger.info(torrentFile.info.name + ':' + 'found a peer: ' + addr) // 85.10.239.191:48623
  })

  // // announce that download has completed (and you are now a seeder)
  // client.complete()

  // // force a tracker announce. will trigger more 'update' events and maybe more 'peer' events
  // client.update()

  // // stop getting peers from the tracker, gracefully leave the swarm
  // client.stop()

  // // ungracefully leave the swarm (without sending final 'stop' message)
  // client.destroy()

  // // scrape
  // client.scrape()

  client.on('scrape', function (data) {
    logger.info(torrentFile.info.name + ':' + 'got a scrape response from tracker: ' + data.announce)
    logger.info(torrentFile.info.name + ':' + 'number of seeders in the swarm: ' + data.complete)
    logger.info(torrentFile.info.name + ':' + 'number of leechers in the swarm: ' + data.incomplete)
    logger.info(torrentFile.info.name + ':' + 'number of total downloads of this torrent: ' + data.incomplete)
  })

  return client
}
