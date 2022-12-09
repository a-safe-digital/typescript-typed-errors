import b from 'benny'
import tsResults from 'ts-results'
import oxide from 'oxide.ts'
import { Ok, isOk } from '@fathom3-dev/typescript-typed-errors'

function Ts () {
  return tsResults.Ok(true)
}

function Oxide () {
  return oxide.Ok(true)
}

function TypedErrors () {
  return Ok(true)
}

b.suite(
  'typed error handling (ok value)',

  b.add('typescript-typed-errors', () => {
    const result = TypedErrors()
    if (isOk(result)) {
      return result.value
    }
  }),

  b.add('ts-results', () => {
    const result = Ts()
    if (result.ok) {
      return result.val
    }
  }),

  b.add('oxide.ts', () => {
    const result = Oxide()
    if (result.isOk()) {
      return result.unwrap()
    }
  }),

  b.cycle(),
  b.complete(),
)
