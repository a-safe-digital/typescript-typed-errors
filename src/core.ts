export const IsErrSymbol = Symbol('IsErr')

export type OkResult <R> = { value: R, [IsErrSymbol]: false }
export type ErrResult <L> = { error: L, [IsErrSymbol]: true }
export type Result<L = never, R = never> = ErrResult<L> | OkResult<R>
export type InferErrResult <T extends Result<unknown, unknown>> = T extends ErrResult<infer L> ? L : never
export type InferOkResult <T extends Result<unknown, unknown>> = T extends OkResult<infer R> ? R : never

export function Err <L> (error: L): ErrResult<L> {
  return { error, [IsErrSymbol]: true }
}

export function Ok <R> (value: R): OkResult<R> {
  return { value, [IsErrSymbol]: false }
}

export function isErr <
  L,
  R,
  TOk extends OkResult<R> = OkResult<R>,
  TErr extends ErrResult<L> = ErrResult<L>
> (result: TOk | TErr): result is TErr {
  return result[IsErrSymbol]
}

export function isOk <
  L,
  R,
  TOk extends OkResult<R> = OkResult<R>,
  TErr extends ErrResult<L> = ErrResult<L>
> (result: TOk | TErr): result is TOk {
  return !result[IsErrSymbol]
}
