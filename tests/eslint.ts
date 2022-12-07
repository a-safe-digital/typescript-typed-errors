import { Err, Ok } from '../src/core.js'

export function probandoEslint (n: number) {
  switch (n) {
    case 1:
      return Ok(true)
    case 2:
      return Ok(false)
    case 3:
      return Ok(null)
  }
  return undefined
}
