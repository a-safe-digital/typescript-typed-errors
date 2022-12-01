/* eslint-disable @typescript-eslint/no-explicit-any */
import { Result, Ok, Err, isErr, ErrResult, InferOkResult, InferErrResult } from './core.js'

export type ResultPromise = Promise<Result<unknown, unknown>>
export type ResultFn = (...args: any[]) => ResultPromise

export type InferPromisedErrResult <T extends ResultPromise> = InferErrResult<Awaited<T>>
export type InferPromisedOkResult <T extends ResultPromise> = InferOkResult<Awaited<T>>

export type InferErrorResultFn <T extends ResultFn> = InferPromisedErrResult<ReturnType<T>>
export type InferPromisedOkResultFn <T extends ResultFn> = InferPromisedOkResult<ReturnType<T>>

export function unwrap <L, R> (result: Result<L, R>): R {
  if (isErr(result)) {
    throw result
  }
  const ret = result.value
  return ret
}

export function wrap <Fn extends ResultFn, LL = InferErrorResultFn<Fn>> ()
  : <A extends any[], L = never, R = never> (
    fn: (...args: A) => Promise<Result<L, R>>
  ) => (...args: A) => Promise<Result<LL | L, R>> {
  return (fn) =>
    (...args) =>
      fn(...args)
        .catch((err) => {
          if (isErr(err)) {
            return err as ErrResult<LL>
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
