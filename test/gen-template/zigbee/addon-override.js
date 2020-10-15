// Example of an add-on override

// Example of how atomicType overrides security key, but leaves other names intact.
function atomicType(arg) {
  if (arg.name == 'security_key') return 'security_key_type_override'
  else throw 'not overriding anything'
}

exports.atomicType = atomicType
