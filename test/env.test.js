// Copyright (c) 2020 Silicon Labs. All rights reserved.

import * as Env from '../src-electron/util/env.js'

test('Test environment', () => {
  expect(Env.appDirectory().length).toBeGreaterThan(10)
  expect(Env.sqliteFile().length).toBeGreaterThan(10)
  expect(Env.iconsDirectory().length).toBeGreaterThan(10)
})

test('Test logging', () => {
  Env.logSql('Sql log test.')
  Env.logInfo('Info log test.')
  Env.logWarning('Warn log test.')
  Env.logError('Error log test.')
})

test('Main database', () => {
  Env.setMainDatabase('stalin')
  expect(Env.mainDatabase()).toBe('stalin')
})
