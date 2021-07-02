// Example file for the post load functionality.

async function postLoad(api, context) {
  api.print('Test post-load function.')
  for (fn of api.functions()) {
    api.print(`Function: ${fn}`)
  }
  api.print(`Session Id: ${api.sessionId(context)}`)
  api.print('Endpoints:')
  let endpoints = await api.endpoints(context)
  for (ep of endpoints) {
    api.print(`  - endpoint: ${ep.endpointIdentifier}`)
    let clusters = await api.clusters(context, ep)
    for (cl of clusters) {
      api.print(`    - cluster: ${cl.name} [${cl.side}]`)
      let attributes = await api.attributes(context, ep, cl)
      for (at of attributes) {
        api.print(`      - attribute: ${at.name}`)
      }
      let commands = await api.commands(context, ep, cl)
      for (co of commands) {
        api.print(`      - command: ${co.name}`)
      }
    }
  }
  api.deleteEndpoint(context, endpoints[0])
}

exports.postLoad = postLoad
