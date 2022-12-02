import { describe, it, expect } from '@jest/globals'
import { Result, Err, Ok, isErr, isErrCode, isOk } from '../src/core.js'

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

  it.each([
    [0, null, true],
    [1, '1', null],
    [2, '2', null],
    [3, '3', null],
    [4, null, ''],
  ])('can detect multiple erroneus values %d', (i, err, val) => {
    function maybeError (err: number) {
      if (err === 0) {
        return Ok(true)
      } else if (err === 1) {
        return Err({ code: '1' as const, ctx: '' })
      } else if (err === 2) {
        return Err({ code: '2' as const })
      } else if (err === 3) {
        return Err({ code: '3' as const })
      } else {
        return Ok('')
      }
    }
    const errResult = maybeError(i)
    expect(isErr(errResult)).toBe(err !== null)
    expect(isOk(errResult)).toBe(err === null)

    if (isErr(errResult)) {
      if (isErrCode(errResult, ['1', '2'])) {
        expect(errResult.error.code === '1').toBe(err === '1')
        expect(errResult.error.code === '2').toBe(err === '2')

        // @ts-expect-error we shouldnt be able to use 3 as code, because we've narrowed it to 1 | 2
        expect(errResult.error.code === '3').toBe(false)
      } else {
        expect(errResult.error.code === '3').toStrictEqual(true)

        // @ts-expect-error this should fail, because we've narrowed other error to be 3 only
        expect(errResult.error.code === '2').toStrictEqual(false)
        // @ts-expect-error this should fail, because we've narrowed other error to be 3 only
        expect(errResult.error.code === '1').toStrictEqual(false)
      }

      // @ts-expect-error this should fail, as 'a' is not an err code possibility
      if (isErrCode(errResult, ['1', '2', 'a'])) {
        //
      }

      // @ts-expect-error this should fail, as we dont accept empty arrays
      if (isErrCode(errResult, [])) {
        //
      }

      if (!isErrCode(errResult, ['1', '2', '3'])) {
        // @ts-expect-error this should fail, as errResult should be never
        console.log(errResult.error.code)
      }
    } else {
      expect(errResult.value).toBe(val)
    }
  })
})
