var WebTorrent = require('webtorrent')

var client = new WebTorrent()
var file = __dirname + '/data/spv/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.ccm'
// When user drops files on the browser, create a new torrent and start seeding it!
client.seed(file, function onTorrent (torrent) {
  // Client is seeding the file!
  console.log('Torrent info hash:', torrent.infoHash)
})
