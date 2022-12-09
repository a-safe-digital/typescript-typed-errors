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
        return Err({ code: '1' })
      } else if (err === 2) {
        return Err({ code: '2' })
      } else if (err === 3) {
        return Err({ code: '3', ctx: true })
      } else {
        return Ok('')
      }
    }
    const result = maybeError(i)
    expect(isErr(result)).toBe(err !== null)
    expect(isOk(result)).toBe(err === null)

    if (isErr(result)) {
      if (isErrCode(result, ['1', '2'])) {
        expect(result.error.code === '1').toBe(err === '1')
        expect(result.error.code === '2').toBe(err === '2')

        // @ts-expect-error we shouldnt be able to use 3 as code, because we've narrowed it to 1 | 2
        expect(result.error.code === '3').toBe(false)
      } else {
        expect(result.error.code === '3').toBe(true)
        expect(result.error.ctx).toBe(true)

        // @ts-expect-error this should fail, because we've narrowed other error to be 3 only
        expect(result.error.code === '2').toBe(false)
        // @ts-expect-error this should fail, because we've narrowed other error to be 3 only
        expect(result.error.code === '1').toBe(false)
      }

      // @ts-expect-error this should fail, as 'a' is not an err code possibility
      if (isErrCode(result, ['1', '2', 'a'])) {
        //
      }

      // @ts-expect-error this should fail, as we dont accept empty arrays
      if (isErrCode(result, [])) {
        //
      }

      if (!isErrCode(result, ['1', '2', '3'])) {
        // @ts-expect-error this should fail, as result should be never
        console.log(result.error.code)
      }
    } else {
      expect(result.value).toBe(val)
    }

    if (isErrCode(result, ['1', '2', '3'])) {
      expect(result.error.code).toBe(err)
    } else {
      expect(result.value).toBe(val)
    }

    function handleOnlyOneError () {
      const result = maybeError(2)
      if (isErrCode(result, ['1'])) {
        return Ok(1)
      } else {
        return result
      }
    }

    const result2 = handleOnlyOneError()
    if (isErrCode(result2, ['2', '3'])) {
      //
    }
    // @ts-expect-error 1 is not a possible err code since we handled it
    if (isErrCode(result2, ['1', '2'])) {
      //
    }
  })
})
