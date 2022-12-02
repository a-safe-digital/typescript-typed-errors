export const IsErrSymbol = Symbol('IsErr')

export type IErr <T = string> = { code: T }
export type OkResult <R> = { value: R, [IsErrSymbol]: false }
export type ErrResult <L extends IErr> = { error: L, [IsErrSymbol]: true }
export type Result<L extends IErr = never, R = never> = ErrResult<L> | OkResult<R>
export type InferErrResult <T extends Result<IErr, unknown>> = T extends ErrResult<infer L> ? L : never
export type InferOkResult <T extends Result<IErr, unknown>> = T extends OkResult<infer R> ? R : never

export function Err <L extends IErr> (error: L): ErrResult<L> {
  return { error, [IsErrSymbol]: true }
}

export function Ok <R> (value: R): OkResult<R> {
  return { value, [IsErrSymbol]: false }
}

export function isErr <
  L extends IErr,
  R,
  TOk extends OkResult<R> = OkResult<R>,
  TErr extends ErrResult<L> = ErrResult<L>
> (result: TOk | TErr): result is TErr {
  return result[IsErrSymbol]
}

export function isErrCode <
  TErr extends ErrResult<IErr>,
  TCode extends TErr['error']['code'],
  TErrNarrow extends ErrResult<IErr<TCode>>,
> (result: TErr | TErrNarrow, code: [TCode, ...TCode[]]): result is TErrNarrow {
  return code.includes(result.error.code as TCode)
}

export function isOk <
  L extends IErr,
  R,
  TOk extends OkResult<R> = OkResult<R>,
  TErr extends ErrResult<L> = ErrResult<L>
> (result: TOk | TErr): result is TOk {
  return !result[IsErrSymbol]
}
