var ini = require('iniparser')
var _ = require('lodash')
var MetadataHandler = require(__dirname + '/../cliView.js')

var properties

try {
  var properties_default = ini.parseSync(__dirname + '/properties_default.conf')
  var properties_custom
  try {
    properties_custom = ini.parseSync(__dirname + '/properties.conf')
  } catch (e) {
    properties_custom = {}
  }
  properties = _.merge(properties_default, properties_custom)
} catch (e) {
  throw new Error('Missing properties')
}

properties.client.tracker = (properties.client.tracker === 'true')
properties.cliView.streamData = (properties.cliView.streamData === 'true')
properties.cliView.cliViewStatus = (properties.cliView.cliViewStatus === 'true')

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
    console.log(torrent)
  })
  handler.shareMetadata(result.torrentHash.toString('hex'), function (err, torrent) {
    if (err) return console.error(err)
    return console.log('shareMetadata: ', torrent)
  })
  return console.log(result)
})

var testMag = '5ADD2B0CE8F7DA372C856D4EFE6B9B6E8584919E'
handler.on('downloads/' + testMag, function (torrent) {
  // console.log(torrent)
})

handler.on('error', function (error) {
  console.error(error)
})

handler.getMetadata(testMag, null, true)

// console.log(handler)

// handler.cliViewStatus = true
