import * as Validation from '../src-electron/validation/validation'

test('isValidNumberString Functions', () => {
  // Integer
  expect(Validation.isValidNumberString('0x0000'))
  expect(Validation.isValidNumberString('0x0001'))
  expect(!Validation.isValidNumberString('0x00asdfajaklsf;01'))
  // Float
  expect(Validation.isValidFloat('.0001'))
  expect(Validation.isValidFloat('5.6'))
  expect(Validation.isValidFloat('5'))
  expect(!Validation.isValidFloat('5.6....'))
})

test('extractValue Functions', () => {
  //Integer
  expect(Validation.extractIntegerValue('5') == 5)
  expect(Validation.extractIntegerValue('0x05') == 5)
  expect(Validation.extractIntegerValue('A') == 10)
})
