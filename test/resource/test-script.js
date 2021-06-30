// Example file for the post load functionality.

function postLoad(api, context) {
  api.print('Test post-load function.')
  for (fn of api.functions()) {
    api.print(`Function: ${fn}`)
  }
  api.print(`Session Id: ${api.sessionId(context)}`)
}

exports.postLoad = postLoad
