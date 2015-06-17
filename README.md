# Colored Coins Metadata Handler
[![Build Status](https://travis-ci.org/Colored-Coins/Metadata-Handler.svg?branch=master)](https://travis-ci.org/Colored-Coins/Metadata-Handler) [![Coverage Status](https://coveralls.io/repos/Colored-Coins/Metadata-Handler/badge.svg?branch=master)](https://coveralls.io/r/Colored-Coins/Metadata-Handler?branch=master) [![npm version](https://badge.fury.io/js/cc-metadata-handler.svg)](http://badge.fury.io/js/cc-metadata-handler)

### Installation

```sh
$ npm i cc-metadata-handler
```


### Initialize

```js
var MetadataHandler = require('cc-metadata-handler')

var properties = {
  tracker: {               // Tracker settings
    udp: Boolean,           // Using udp for torrent trafic or not
    http: Boolean,          // Using http for torrent trafic or not
    ws: Boolean,            // Using websockets for torrent trafic or not
    hostname: String,       // Our machince host name
    port: Number            // Port to listen as tracker
  }
  client: {
    torrentPort: Number,
    dhtPort: Number,
  // Enable DHT (default=true), or options object for DHT
    // dht: true,
  // Max number of peers to connect to per torrent (default=100)
    maxPeers: Number,
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
  folders: { // Folder structure settings
    torrents: '/torrents',  // Path to save torrent files to, if left empty, all the torrent references will be saved in memory and will be lost on restart
    data: '/data',          // Main path to where all the data is stored
    spvData: '/spv',        // Path to where data that is relevent to us is stored relative to the main path
    fullNodeData: '/full',  // Path to where data that is not relevent to us is stored relative to the main path
    capSize: '80%',          // Number of MB or precent in the form of 12%
    retryTime: 10000,
    autoWatchInterval: 60000,
    ignores: []
  }
}

var handler = new MetadataHandler(settings)
```

### Fetch Metadata

Params:
  - torrentHash - The torrent infoHash of the metadata.
  - metadataSHA2 - The sha256 of the metadata json.
  - importent - A boolean flag which determines if the metadata will be saved forever or possibly deleted when folder reaches max limit size.

```js

var torrentHash = '5add2b0ce8f7da372c856d4efe6b9b6e8584919e'
var metadataSHA2 = '6ed0dd02806fa89e25de060c19d3ac86cabb87d6a0ddd05c333b84f4'
var importent = true

handler.getMetadata(torrentHash, metadataSHA2, importent, function (err, metadata) {
  if (err) return console.error(err)
  console.log(metadata) // Will print the json file of the metadata
})

```

You can also use this method together with an event listner like this:

```js

// You can listen for the channel of the torrentHash to get the metadata
handler.on('downloads/'+torrentHash, function (metadata) {
  console.log(metadata) // Will print the the metadata parsed to json
})

// Starting the proccess of getting the metadata from the torrent network.
handler.getMetadata(torrentHash, metadataSHA2, importent)

```

### Add new Metadata

Params:
  - metadata - A new metadata json we just created and we plan on sharing with other people.

```js

// Creates the torrent file and sha2 for the metadata.
// Saves the metadata as a local torrentHash.dat file.
// Saves the torrent file called torrentHash.torrent for future use.
// Returns the torrentHash and sha2 created.
handler.addMetadata(metadata, function (err, hashes) {
  if (err) return console.error(err)
  console.log(hashes.torrentHash) // Will print Bit-torrent hashing scheme using sha1 as the hashing algorithem
  console.log(hashes.sha2) // Will print the sha256 of the raw metadata file
})

```

### Share Metadata

Params:
  - torrentHash - The torrent info hash of the metadata we want to share with other people

```js

// You can listen for the channel of the torrentHash to get the metadata
handler.on('uploads/'+torrentHash, function (peer) {
  console.log(peer) // Will print information about the latest peer that is trying to download the metadata from your client
})

handler.shareMetadata(torrentHash, function (err) {
  if (err) console.log(err) // Returns error if there is problem with sharing the file
})

```

### Other Events

```js

// Receives the latest metadata we finished downloading
handler.on('downloads', function (metadata) {
  console.log(metadata) // Will print the the metadata parsed to json
})

// Receives the latest peer that is trying to get a file from our client and the file it's trying to get
handler.on('uploads', function (peer) {
  console.log(peer.info) // Will print info about the peer
  console.log(peer.file) // Will print info about the file
})

// If any error occurs
handler.on('error', function (err) {
  console.error(err)
})

```

### Testing

```sh
$ cd /"module-path"/cc-metadata-handler
$ mocha
```


License
----

MIT