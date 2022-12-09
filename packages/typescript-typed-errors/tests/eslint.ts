import { isErr, isOk, wrap, unwrap, Ok, Err } from '../src/index.js'

async function maybeError (isErr: boolean) {
  return isErr
    ? Err({ code: 'MaybeError' as const })
    : Ok(true)
}

async function maybeManyErrors (err: number) {
  if (err === 0) {
    return Ok(true)
  } else if (err === 1) {
    return Err({ code: '1' })
  } else if (err === 2) {
    return Err({ code: '2' })
  } else {
    return Err({ code: '>=3' })
  }
}

export async function probandoEslint (n: number) {
  switch (n) {
    case 1:
      return Ok(true)
    case 2:
      return Ok(false)
    case 3:
      return Err({ code: 3 })
    default:
      return Ok(undefined)
  }
}

export async function returnInferedUnion (n: number) {
  if (n > 100) {
    return Err({ code: '>100' })
  }
  const result = await probandoEslint(2)
  return result
}

export const wrappedFunction = wrap<typeof maybeManyErrors | typeof maybeError | typeof probandoEslint>()(
  async (n: number) => {
    const value1 = unwrap(await maybeManyErrors(n))
    const value2 = unwrap(await maybeError(true))
    const value3 = unwrap(await probandoEslint(n))
    if (value1 === false) {
      return Err({ code: 'value1===false' })
    }
    if (value2 === false) {
      return Err({ code: 'value2===false' })
    }
    if (value3 === false) {
      return Err({ code: 'value3===false' })
    }
    return Ok(true)
  },
)
