var DHT = require('bittorrent-dht')
var dht = new DHT()
var ready = false

module.exports = function lookup (infoHash, cb) {
  if (!ready) return dht.once('ready', lookup.bind(null, infoHash, cb))
  return dht.lookup(infoHash, cb)
}

dht.on('peer', function (addr, hash, from) {
  console.log('found potential peer ' + addr + ' through ' + from + ' for ' + hash)
})

dht.on('ready', function () {
  // DHT is ready to use (i.e. the routing table contains at least K nodes, discovered
  // via the bootstrap nodes)
  ready = true
  // find peers for the given torrent info hash
})

dht.listen(20000, function () {
  console.log('now listening')
})

dht.on('peer', function (addr, hash, from) {
  console.log('found potential peer ' + addr + ' through ' + from)
})
