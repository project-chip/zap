// Barrier Control Light Server

async function postLoad(api, context) {
  let endpoints = await api.endpoints(context)
  let ep = endpoints[0]
  // Here we disable server cluster
  await api.enableServerCluster(context, ep, 257)

  await api.disableClientCluster(context, ep, 257)

  for (let i = 0; i < 7; i++) {
    await api.enableServerAttribute(context, ep, 257, i)
  }

  for (let i = 16; i <= 26; i++) {
    await api.enableServerAttribute(context, ep, 257, i)
  }

  for (let i = 32; i <= 43; i++) {
    await api.enableServerAttribute(context, ep, 257, i)
  }

  for (let i of [48, 49, 50, 51, 52]) {
    await api.enableServerAttribute(context, ep, 257, i)
  }

  for (let i = 64; i <= 71; i++) {
    await api.enableServerAttribute(context, ep, 257, i)
  }

  await api.enableServerAttribute(context, ep, 257, 65533)
  await api.enableServerAttribute(context, ep, 257, 65534)

  for (let i = 0; i <= 0x19; i++) {
    await api.enableOutgoingCommand(context, ep, 257, i, api.server)
    await api.enableIncomingCommand(context, ep, 257, i, api.client)
  }

  await api.enableOutgoingCommand(context, ep, 257, 0x20, api.server)
  await api.enableOutgoingCommand(context, ep, 257, 0x21, api.server)
}

exports.postLoad = postLoad
