import createApi from "../src/api/renderer_api"

test('Test structure of renderer API', () => {
    var api = createApi()
    expect(api).not.toBeNull()
})