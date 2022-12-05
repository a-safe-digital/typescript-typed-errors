export const IsErrSymbol = Symbol('IsErr')

export type IErr <T extends string | number = string | number> = { code: T }
export type OkResult <R> = { value: R, [IsErrSymbol]: false }
export type ErrResult <L extends IErr> = { error: L, [IsErrSymbol]: true }
export type Result<L extends IErr = never, R = never> = ErrResult<L> | OkResult<R>
export type InferErrResult <T extends Result<IErr, unknown>> = T extends ErrResult<infer L> ? L : never
export type InferOkResult <T extends Result<IErr, unknown>> = T extends OkResult<infer R> ? R : never
export type InferErrCode <T extends Result<IErr, unknown>> = InferErrResult<T>['code']
export type HandledErrorCodes <T extends Result<IErr, unknown>> = [InferErrCode<T>, ...InferErrCode<T>[]]

export function Err <Code extends IErr['code'], L extends IErr<Code>> (error: L): ErrResult<L> {
  return { error, [IsErrSymbol]: true }
}

export function Ok <R> (value: R): OkResult<R> {
  return { value, [IsErrSymbol]: false }
}

export function isErr <
  L extends IErr,
  TErr extends ErrResult<L> = ErrResult<L>
> (result: OkResult<unknown> | TErr): result is TErr {
  return result[IsErrSymbol]
}

export function isErrCode <
  TErr extends ErrResult<IErr>,
  TCode extends TErr['error']['code'],
  TErrNarrow extends ErrResult<IErr<TCode>>,
> (result: OkResult<unknown> | TErr | TErrNarrow, code: [TCode, ...TCode[]]): result is TErrNarrow {
  if (result[IsErrSymbol]) {
    return code.includes(result.error.code as TCode)
  } else {
    return false
  }
}

export function isOk <
  R,
  TOk extends OkResult<R> = OkResult<R>,
> (result: ErrResult<IErr> | TOk): result is TOk {
  return !result[IsErrSymbol]
}
