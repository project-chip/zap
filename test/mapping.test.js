import { dbMap } from '../src-electron/db/db-mapping'

test('Test DB mappings', () => {
  Object.keys(dbMap).forEach((k) => {
    dbMap[k](null)
    dbMap[k]({ a: 1 })
  })
})
