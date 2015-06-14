var TorrentFS = require(__dirname + '/../app.js')

var torrentApp = new TorrentFS()
torrentApp.start(function (err, server) {
  if (err) return console.error(err)
  console.log('Server Object: ' + server)
  torrentApp.cliViewStatus = true
  // torrentApp.streamClientData()
  // torrentApp.on('clientData', function (dataSet) {
  //   console.log(dataSet)
  // })
})
