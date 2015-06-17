var MetadataHandler = require(__dirname + '/../cliView.js')

var properties = {
  tracker: {
  udp: true,
  http: true,
  ws: true,
  hostname: '127.0.0.1',
  port: 8084
  },
  client: {
    torrentPort: 49507,
    dhtPort: 12679,
  // Enable DHT (default=true), or options object for DHT
    // dht: true,
  // Max number of peers to connect to per torrent (default=100)
    maxPeers: 100,
  // DHT protocol node ID (default=randomly generated)
    // nodeId: String|Buffer,
  // Wire protocol peer ID (default=randomly generated)
    // peerId: '01234567890123456789',
  // RTCPeerConnection configuration object (default=STUN only)
    // rtcConfig: Object,,
  // custom storage engine, or `false` to use in-memory engine
    // storage: Function,
  // custom webrtc implementation (in node, specify the [wrtc](https://www.npmjs.com/package/wrtc) package)
    // wrtc: {},
  // List of additional trackers to use (added to list in .torrent or magnet uri)
    // announce: [],
  // List of web seed urls (see [bep19](http://www.bittorrent.org/beps/bep_0019.html))
    // urlList: []
  // Whether or not to enable trackers (default=true)
    tracker: false
  },
  folders: {
    torrents: '/torrents',
    data: '/data',
    spvData: '/spv',
    fullNodeData: '/full',
    capSize: '80%',
    retryTime: 10000,
    autoWatchInterval: 60000,
    ignores: []
  },
  cliView: {
    streamData: false,
    cliViewStatus: false
  }
}

var handler = new MetadataHandler(properties)

var metaData = {
  a: 'adaad',
  b: 'adaad',
  c: 'adaad',
  d: 'adaad',
  e: 'adaad',
  f: 'adaad',
  g: 'adaad',
  h: 'adaad',
  i: 'adaad',
  j: 'adaad'
}

handler.addMetadata(metaData, function (err, result) {
  if (err) return console.error(err)
  handler.on('uploads/' + result.torrentHash.toString('hex'), function (torrent) {
    console.log('uploads: ', torrent)
  })
  handler.shareMetadata(result.torrentHash.toString('hex'), function (err, torrent) {
    if (err) return console.error(err)
    return console.log('shareMetadata: ', torrent)
  })
  return console.log(result)
})

var testMag = '5ADD2B0CE8F7DA372C856D4EFE6B9B6E8584919E'
handler.on('downloads/' + testMag, function (torrent) {
  console.log('downloads: ', torrent)
})

handler.on('error', function (error) {
  console.error(error)
})

handler.getMetadata(testMag, null, true)

// console.log(handler)

handler.cliViewStatus = true
