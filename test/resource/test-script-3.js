// Example file for the post load functionality.

async function postLoad(api, context) {
  let endpoints = api.endpoints(context)
  let ep = endpoints[0]
  // Here we disable cluster with code 2
  api.disableClientCluster(context, ep, 0x0002)
}

exports.postLoad = postLoad
