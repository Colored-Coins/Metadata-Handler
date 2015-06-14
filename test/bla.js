var parseTorrent = require('parse-torrent')
var fs = require('fs')

// var torrentFile1 = fs.readFileSync(__dirname + '/torrents/blat.torrent')
// var torrent1 = parseTorrent(torrentFile1)

// var magnetURI1 = parseTorrent.toMagnetURI(torrent1)
// console.log(JSON.stringify(torrent1))
// console.log(magnetURI1)

var torrentFile2 = fs.readFileSync(__dirname + '/torrents/f055579470352a071cafdd84afcca8f76a4db676.torrent')
var torrent2 = parseTorrent(torrentFile2)

var magnetURI2 = parseTorrent.toMagnetURI(torrent2)
console.log(JSON.stringify(torrent2))
console.log(magnetURI2)
