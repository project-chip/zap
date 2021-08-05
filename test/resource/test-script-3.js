// Example file for the post load functionality.

async function postLoad(api, context) {
  let endpoints = await api.endpoints(context)
  let ep = endpoints[0]
  // Here we disable cluster with code 2
  await api.disableClientCluster(context, ep, 2)
}

exports.postLoad = postLoad
