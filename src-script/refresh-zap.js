const glob = require('glob')
const fs = require('fs')
// const fsp = fs.promises

// let rawdata = fs.readFileSync('student.json');
// let student = JSON.parse(rawdata);
// console.log(student);

glob('**/*.zap', null, function (er, files) {
  files.forEach((f) => {
    let rawdata = fs.readFileSync(f)
    let zapState = JSON.parse(rawdata)
    console.log(`${f}, creator: ${zapState.creator}`)
    zapState.keyValuePairs.push({
      key: 'shareConfigsAcrossEndpoints',
      value: '1',
    })
    fs.writeFile(f, JSON.stringify(zapState, null, 2), (err) => {
      if (err) throw err
      console.log(`file saved ${f}`)
    })
  })
  // files is an array of filenames.
  // If the `nonull` option is set, and nothing
  // was found, then files is ["**/*.js"]
  // er is an error object or null.
})
