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
  //float
  expect(Validation.extractFloatValue('0.53') == 0.53)
  expect(Validation.extractFloatValue('.53') == 0.53)
})

test('Test int bounds', () => {
  //Integer
  expect(Validation.checkBoundsInteger(50, 25, 60))
  expect(!Validation.checkBoundsInteger(50, 25, 20))
  expect(!Validation.checkBoundsInteger(50, 51, 55))

  //Float
  expect(Validation.checkBoundsFloat(35.0, 25, 50.0))
  expect(!Validation.checkBoundsFloat(351.0, 25, 50.0))
  expect(!Validation.checkBoundsFloat(351.0, 355, 5650.0))
})

test('Validate types', () => {
  expect(Validation.isStringType('CHAR_STRING'))
  expect(Validation.isStringType('OCTET_STRING'))
  expect(Validation.isStringType('LONG_CHAR_STRING'))
  expect(Validation.isStringType('LONG_OCTET_STRING'))
  expect(!Validation.isStringType('FLOAT_SEMI'))

  expect(Validation.isFloatType('FLOAT_SEMI'))
  expect(Validation.isFloatType('FLOAT_SINGLE'))
  expect(Validation.isFloatType('FLOAT_DOUBLE'))
  expect(!Validation.isFloatType('LONG_OCTET_STRING'))
})
