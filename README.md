# Colored Coins Metadata Handler
[![Build Status](https://travis-ci.org/Colored-Coins/Metadata-Handler.svg?branch=master)](https://travis-ci.org/Colored-Coins/Metadata-Handler) [![Coverage Status](https://coveralls.io/repos/Colored-Coins/Metadata-Handler/badge.svg?branch=master)](https://coveralls.io/r/Colored-Coins/Metadata-Handler?branch=master) [![npm version](https://badge.fury.io/js/cc-metadata-handler.svg)](http://badge.fury.io/js/cc-metadata-handler)

#### Currently only works on node version 0.12.2 and above.

### Installation

```sh
$ npm i cc-metadata-handler
```


### Initialize

```js
var MetadataHandler = require('cc-metadata-handler')

var settings = {
  "swarm": {                // Torrent swarm settings
    maxPeers: Number,       // Maximum number of peers per seed/leech
    maxConns: Number        // Maximum number of connections per seed/leech
  },
  "folders": {              // Folder structure settings
    data: String,           // Main path to where all the data is stored
    spvData: String,        // Path to where data that is relevent to us is stored relative to the main path
    fullNodeData: String,   // Path to where data that is not relevent to us is stored relative to the main path
    torrents: String,       // Path to save torrent files to, if left empty, all the torrent references will be saved in memory and will be lost on restart
    capSize: Number/String  // Number of MB or precent in the form of 12%
  },
  "client": {               // Client settings
    peerId: String,         // Our torrent peer ID, must be a random 20 byte hex. Best practice is to use sha1 on a random string or use a good random number generator
    port: Number            // Port to open client on
  },
  "server": {               // Tracker settings
    udp: Boolean,           // Using udp for torrent trafic or not
    http: Boolean,          // Using http for torrent trafic or not
    ws: Boolean,            // Using websockets for torrent trafic or not
    hostname: String,       // Our machince host name
    port: Number            // Port to listen as tracker
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