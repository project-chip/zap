// Copyright (c) 2020 Silicon Labs. All rights reserved.

import { processCommandLineArguments } from '../src-electron/main-process/args'
import yargs from 'yargs'

test('Test basic command line processing', () => {
  var args = processCommandLineArguments([
    'node',
    'test.js',
    '--noUI',
    '--httpPort',
    '123',
    '--arglessArg',
    '--xmlRoot',
    'XmlRoot',
  ])

  expect(args.noUI).toBeTruthy()
  expect(args.httpPort).toBeTruthy()
  expect(args.httpPort).toEqual(123)
  expect(args.arglessArg).toBeTruthy()
  expect(args.xmlRoot).toBe('XmlRoot')
})

test('Verify how yargs works', () => {
  var argv = yargs(['a', '--x', 1, 'b', '--y', 2, '--tst', 42]).parse()
  expect(argv._).toContain('a')
  expect(argv._).toContain('b')
  expect(argv.x).toBe(1)
  expect(argv.y).toBe(2)
  expect(argv.tst).toBe(42)
})
