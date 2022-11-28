export const IsErrSymbol = Symbol('IsErr')

export type OkResult <R> = { value: R, [IsErrSymbol]: false }
export type ErrResult <L> = { error: L, [IsErrSymbol]: true }

export type Result<L, R> = ErrResult<L> | OkResult<R>

export function Err <L> (error: L): ErrResult<L> {
  return { error, [IsErrSymbol]: true } as ErrResult<L>
}

export function Ok <R> (value: R): OkResult<R> {
  return { value, [IsErrSymbol]: false } as OkResult<R>
}

export function isErr <L, R> (result: Result<L, R>): result is ErrResult<L> {
  return result[IsErrSymbol]
}

export function isOk <L, R> (result: Result<L, R>): result is OkResult<R> {
  return !result[IsErrSymbol]
}
