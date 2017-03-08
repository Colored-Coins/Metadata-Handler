var MetadataHandler = require('../index.js')
var fs = require('fs')

var properties = {
  client: {
    // torrentPort: 49507,
    // dhtPort: 12679,
  // Enable DHT (default=true), or options object for DHT
    dht: true,
  // Max number of peers to connect to per torrent (default=100)
    // maxPeers: 100,
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
    announce: [],
  // List of web seed urls (see [bep19](http://www.bittorrent.org/beps/bep_0019.html))
    // urlList: []
  // Whether or not to enable trackers (default=true)
    tracker: false
  },
  folders: {
    torrents: './torrents',
    data: './data',
    capSize: '80%',
    retryTime: 10000,
    autoWatchInterval: 60000,
    ignores: []
  }
}

var folders = []
folders.push(properties.folders.torrents)
folders.push(properties.folders.data)
folders.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
})

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

describe('Torrent Creation', function () {
  this.timeout(0)
  it('should return seed metadata', function (done) {
    handler.addMetadata(metaData, function (err, result) {
      if (err) throw err
      handler.on('uploads/' + result.torrentHash.toString('hex'), function (torrent) {
        // console.log('uploads: ', torrent)
      })
      handler.shareMetadata(result.torrentHash.toString('hex'), function (err, torrent) {
        if (err) throw err
        // console.log('shareMetadata: ', torrent)
        return done()
      })
      // console.log(result)
    })
  })

  it('should download wrong data', function (done) {
    var testMag = '2B12CE09236526A728C6974C0D89D52860E82DAA'
    handler.on('downloads/' + testMag, function (torrent) {
      // console.log('downloads: ', torrent)
    })

    handler.on('error', function (error) {
      // console.error(error)
      if (error) done()
    })

    handler.getMetadata(testMag, null, false)
  })
})
