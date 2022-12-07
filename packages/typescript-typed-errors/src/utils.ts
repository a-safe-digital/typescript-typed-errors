import {
  Result,
  Ok,
  Err,
  IErr,
  isErr,
  ErrResult,
  OkResult,
  ResultPromise,
  ResultAsyncFn,
  InferErrorResultAsyncFn,
  InferPromisedErrResult,
  InferPromisedOkResult,
} from './core.js'

export function unwrap <R> (result: OkResult<R> | ErrResult<IErr>): R {
  if (isErr(result)) {
    throw result
  }
  const ret = result.value
  return ret
}

export function wrap <Fn extends ResultAsyncFn, LL extends IErr = InferErrorResultAsyncFn<Fn>> ()
  : <
  A extends unknown[],
  TResult extends ResultPromise,
  L extends InferPromisedErrResult<TResult>,
  R extends InferPromisedOkResult<TResult>
  > (
    fn: (...args: A) => TResult
  ) => (...args: A) => Promise<Result<LL | L, R>> {
  return (fn) =>
    (...args) =>
      fn(...args)
        .catch((err) => {
          if (isErr(err)) {
            return err
          }
          throw err
        })
}

type MapResults <T extends readonly ResultPromise[]> = Result<InferPromisedErrResult<T[number]>, {
    [K in keyof T]: InferPromisedOkResult<T[K]>
}>

export function resultAll <
  Promises extends readonly ResultPromise[],
> (promises: Promises): Promise<MapResults<Promises>> {
  return new Promise((resolve) => {
    const results: unknown[] = []
    promises.forEach((promise, i) => {
      promise.then((result) => {
        if (isErr(result)) {
          resolve(Err(result.error as any))
          return
        }
        results[i] = result.value
        if (results.length === promises.length) {
          // @ts-expect-error: This is ok. We've tests to ensure everything works as expected at runtime
          resolve(Ok(results))
        }
      })
    })
  })
}
