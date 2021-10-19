// Example file for the post load functionality.

async function postLoad(api, context) {
  let endpoints = await api.endpoints(context)
  let ep = endpoints[0]
  // Here we disable cluster with code 2
  await api.disableClientCluster(context, ep, 2)

  // Here we turn off attribute 4 on cluster 0, the manufacturer name
  await api.disableServerAttribute(context, ep, 0, 4)

  await api.enableOutgoingCommand(
    context,
    ep,
    0x00,
    0x00,
    api.dbEnums().source.client
  )
  await api.disableOutgoingCommand(
    context,
    ep,
    0x00,
    0x00,
    api.dbEnums().source.client
  )
}

exports.postLoad = postLoad
