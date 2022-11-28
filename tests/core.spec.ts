import { describe, it, expect } from '@jest/globals'
import { Result, Err, Ok, isErr, isOk } from '../src/core.js'

describe('core functionality', () => {
  it('can detect error', () => {
    function alwaysErroneous () {
      return Err({ code: 'AlwaysError' })
    }
    const result = alwaysErroneous()
    expect(isErr(result)).toBe(true)
    expect(isOk(result)).toBe(false)
    expect(result.error.code).toBe('AlwaysError')
  })

  it('can detect ok', () => {
    function alwaysOk () {
      return Ok('Valid')
    }
    const result = alwaysOk()
    expect(isErr(result)).toBe(false)
    expect(isOk(result)).toBe(true)
    expect(result.value).toBe('Valid')
  })

  it('can detect mixed error-ok result', () => {
    function maybeError (isErr: boolean): Result<{ code: 'Erroneous' }, true> {
      return isErr
        ? Err({ code: 'Erroneous' })
        : Ok(true)
    }
    const errResult = maybeError(true)
    expect(isErr(errResult)).toBe(true)
    expect(isOk(errResult)).toBe(false)
    if (isErr(errResult)) {
      expect(errResult.error).toStrictEqual({ code: 'Erroneous' })
    }

    const okResult = maybeError(false)
    expect(isErr(okResult)).toBe(false)
    expect(isOk(okResult)).toBe(true)
    if (isOk(okResult)) {
      expect(okResult.value).toStrictEqual(true)
    }
  })
})
