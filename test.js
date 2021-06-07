function b(a, b, c) {
  console.log('==> B():')
  console.log(arguments)
  console.log(`b: ${a} + ${b} + ${c} => ${a + b + c}`)
  console.log('==> EO B().')
}

function wrapped(f) {
  console.log(`Wrapper.`)
  return (...theArgs) => {
    console.log(`Wrapped function.`)
    f(...theArgs)
  }
}

function a() {
  console.log('A():')
  console.log(arguments)
  b.call(null, ...arguments)
  console.log('EO A().')
}

a(1, 2, 3)

wrapped(b)(1, 2, 3)
