// Example file for the post load functionality.

async function postLoad(api, context) {
  let epts = await api.endpoints(context)
  await api.deleteEndpoint(context, epts[0])
}

exports.postLoad = postLoad
