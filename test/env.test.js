import * as Env from '../src-electron/main-process/env.js'

test('Test environment', () => {
    expect(Env.appDirectory().length > 10).toBeTruthy()
    expect(Env.sqliteFile().length > 10).toBeTruthy()
    expect(Env.iconsDirectory().length > 10).toBeTruthy()
})

test('Test logging', () => {
    Env.logInfo('Info.')
    Env.logError('Error.')
    Env.logWarning('Warning.')
})