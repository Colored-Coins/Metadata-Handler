var WebTorrent = require('webtorrent')

var torrentProperties = {
  client: {
    torrentPort: 13231,
    dhtPort: 20000,
    announce: [['udp://tracker.openbittorrent.com:80', 'udp://open.demonii.com:1337', 'udp://tracker.coppersurfer.tk:6969', 'udp://tracker.leechers-paradise.org:6969']]
  }
}

var client = new WebTorrent(torrentProperties)

var magnetURI = 'magnet:?xt=urn:btih:7a6fd6dc66026d4aea8a95d82e468847a1123963&dn=a.ccm&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.webtorrent.io%3A80&tr=wss%3A%2F%2Ftracker.webtorrent.io'
// When user drops files on the browser, create a new torrent and start seeding it!
client.add(magnetURI, function onTorrent (torrent) {
  // Client is seeding the file!
  console.log(torrent.magnetURI)
})
