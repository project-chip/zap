//Usage 'node ./license-check.js --production'

var fs = require('fs')
var checker = require('./node_modules/license-checker/lib/index')
var args = require('./node_modules/license-checker/lib/args').parse()
var whiteList = fs.readFileSync('license-whitelist.txt').toString().split('\n')
var fail = false
checker.init(args, function (err, json) {
  for (x in json) {
    var license = json[x].licenses
    if (!x.includes('zap@') && !whiteList.includes(license.toString())) {
      console.log(
        'New License Found for module: ' +
          x +
          ' license:"' +
          json[x].licenses +
          '"'
      )
      fail = true
    }
  }
  if (fail) {
    console.log('License check FAILED')
  } else {
    console.log('License check SUCCESS')
  }
})
