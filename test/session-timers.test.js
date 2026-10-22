/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 *
 * @jest-environment node
 */

const sessionTimers = require('../src-electron/main-process/session-timers')
const dbApi = require('../src-electron/db/db-api')

let databases

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] })
  databases = []
})

afterEach(() => {
  databases.forEach(sessionTimers.deinitDatabaseSessionTimers)
  jest.useRealTimers()
})

function database() {
  const db = { close: jest.fn((callback) => callback(null)) }
  databases.push(db)
  return db
}

function start(db, callback) {
  sessionTimers.initSessionTimers(db, { sessionId: 1 }, [
    { func: callback, timerInterval: 3000 }
  ])
}

test.each(['closeDatabase', 'closeDatabaseSync'])(
  '%s stops session validation without stopping another database',
  async (close) => {
    const first = database()
    const second = database()
    const firstCallback = jest.fn()
    const secondCallback = jest.fn()
    start(first, firstCallback)
    start(second, secondCallback)
    jest.advanceTimersByTime(3000)
    expect(firstCallback).toHaveBeenCalledTimes(1)
    expect(secondCallback).toHaveBeenCalledTimes(1)

    await dbApi[close](first)
    jest.advanceTimersByTime(3000)
    expect(firstCallback).toHaveBeenCalledTimes(1)
    expect(secondCallback).toHaveBeenCalledTimes(2)
    await dbApi[close](second)
    jest.advanceTimersByTime(9000)
    expect(firstCallback).toHaveBeenCalledTimes(1)
    expect(secondCallback).toHaveBeenCalledTimes(2)
  }
)

test('reinitializing a session replaces its timers', () => {
  const db = database()
  const previous = jest.fn()
  const current = jest.fn()
  start(db, previous)
  start(db, current)
  jest.advanceTimersByTime(3000)
  expect(previous).not.toHaveBeenCalled()
  expect(current).toHaveBeenCalledTimes(1)

  sessionTimers.deinitSessionTimers({ sessionId: 1 }, db)
  sessionTimers.deinitSessionTimers({ sessionId: 1 }, db)
  expect(jest.getTimerCount()).toBe(0)
})
