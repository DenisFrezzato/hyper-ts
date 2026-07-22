import * as E from 'fp-ts/Either'
import { IO } from 'fp-ts/IO'
import * as O from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { ReaderEither } from 'fp-ts/ReaderEither'
import { ReaderIO } from 'fp-ts/ReaderIO'
import { ReaderTask } from 'fp-ts/ReaderTask'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { Task } from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as TO from 'fp-ts/TaskOption'
import { pipe } from 'fp-ts/function'
import { describe, expect, test } from 'tstyche'
import * as H from '../src'
import * as M from '../src/Middleware'
import * as _ from '../src/ReaderMiddleware'

interface R1 {
  r1: string
}

interface R2 {
  r2: string
}

declare const middleware1: _.ReaderMiddleware<R1, 'one', 'one', number, boolean>
declare const middleware2a: _.ReaderMiddleware<R1, 'one', 'two', number, string>
declare const middleware2b: _.ReaderMiddleware<R2, 'one', 'two', Error, string>
declare const middleware3: _.ReaderMiddleware<R1, 'two', 'three', number, string>
declare const middlewareSame: _.ReaderMiddleware<R2, 'one', 'one', Error, string>
declare const middleware4a: M.Middleware<'one', 'one', number, boolean>
declare const middleware4b: M.Middleware<'one', 'one', Error, string>
declare const middleware5: M.Middleware<'one', 'two', number, string>

declare const reader1: Reader<R1, string>
declare const reader2: Reader<R2, string>

declare const readerEither1: ReaderEither<R1, number, string>

declare const readerIO1: ReaderIO<R1, string>

declare const readerTask1: ReaderTask<R1, string>
declare const readerTask2: ReaderTask<R2, string>

declare const readerTaskEither1: ReaderTaskEither<R1, number, string>
declare const readerTaskEither2: ReaderTaskEither<R2, Error, string>

declare const eF: (a: boolean) => E.Either<Error, string>
declare const oF: (a: boolean) => O.Option<string>
declare const ioF: (a: boolean) => IO<string>
declare const taskF: (a: boolean) => Task<string>
declare const teF: (a: boolean) => TE.TaskEither<Error, string>
declare const toF: (a: boolean) => TO.TaskOption<string>
declare const onNone: (a: boolean) => Error

declare const decoderU: (value: unknown) => E.Either<number, boolean>
declare const decoderS: (value: string) => E.Either<number, boolean>

describe('fromReaderEither', () => {
  test('default', () => {
    expect(_.fromReaderEither(readerEither1)).type.toBe<
      _.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, number, string>
    >()
  })
})

describe('fromReaderIO', () => {
  test('default', () => {
    expect(_.fromReaderIO(readerIO1)).type.toBe<_.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, never, string>>()
  })
})

describe('rightReaderIO', () => {
  test('default', () => {
    expect(_.rightReaderIO(readerIO1)).type.toBe<_.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, never, string>>()
  })
})

describe('leftReaderIO', () => {
  test('default', () => {
    expect(_.leftReaderIO(readerIO1)).type.toBe<_.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, string, never>>()
  })
})

describe('asksReaderMiddlewareW', () => {
  test('intersects the environments', () => {
    expect(_.asksReaderMiddlewareW((r: R1) => _.of<R2, H.StatusOpen, string, boolean>(true))).type.toBe<
      _.ReaderMiddleware<R1 & R2, H.StatusOpen, H.StatusOpen, string, boolean>
    >()
  })
})

describe('asksReaderMiddleware', () => {
  test('default', () => {
    expect(_.asksReaderMiddleware((r: R1) => _.of<R1, H.StatusOpen, string, boolean>(true))).type.toBe<
      _.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, string, boolean>
    >()
  })
  test('rejects a mismatched environment', () => {
    expect(_.asksReaderMiddleware).type.not.toBeCallableWith((r: R1) => _.of<R2, H.StatusOpen, string, boolean>(true))
  })
})

describe('fromReaderK', () => {
  test('default', () => {
    expect(_.fromReaderK((a: boolean, b: number) => reader1)).type.toBe<
      (a: boolean, b: number) => _.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, never, string>
    >()
  })
})

describe('fromReaderIOK', () => {
  test('default', () => {
    expect(_.fromReaderIOK((a: boolean, b: number) => readerIO1)).type.toBe<
      (a: boolean, b: number) => _.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, never, string>
    >()
  })
})

describe('fromReaderTaskK', () => {
  test('default', () => {
    expect(_.fromReaderTaskK((a: boolean, b: number) => readerTask1)).type.toBe<
      (a: boolean, b: number) => _.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, never, string>
    >()
  })
})

describe('fromReaderEitherK', () => {
  test('default', () => {
    expect(_.fromReaderEitherK((a: boolean, b: number) => readerEither1)).type.toBe<
      (a: boolean, b: number) => _.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, number, string>
    >()
  })
})

describe('fromReaderTaskEitherK', () => {
  test('default', () => {
    expect(_.fromReaderTaskEitherK((a: boolean, b: number) => readerTaskEither1)).type.toBe<
      (a: boolean, b: number) => _.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, number, string>
    >()
  })
})

describe('decodeParam', () => {
  test('default', () => {
    expect(_.decodeParam('foo', decoderU)).type.toBe<
      _.ReaderMiddleware<unknown, H.StatusOpen, H.StatusOpen, number, boolean>
    >()
  })
  test('explicit type arguments', () => {
    expect(_.decodeParam<R1, 'one', number, boolean>('foo', decoderU)).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number, boolean>
    >()
  })
})

describe('decodeParams', () => {
  test('default', () => {
    expect(_.decodeParams(decoderU)).type.toBe<
      _.ReaderMiddleware<unknown, H.StatusOpen, H.StatusOpen, number, boolean>
    >()
  })
  test('explicit type arguments', () => {
    expect(_.decodeParams<R1, 'one', number, boolean>(decoderU)).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number, boolean>
    >()
  })
})

describe('decodeQuery', () => {
  test('default', () => {
    expect(_.decodeQuery(decoderU)).type.toBe<
      _.ReaderMiddleware<unknown, H.StatusOpen, H.StatusOpen, number, boolean>
    >()
  })
  test('explicit type arguments', () => {
    expect(_.decodeQuery<R1, 'one', number, boolean>(decoderU)).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number, boolean>
    >()
  })
})

describe('decodeBody', () => {
  test('default', () => {
    expect(_.decodeBody(decoderU)).type.toBe<_.ReaderMiddleware<unknown, H.StatusOpen, H.StatusOpen, number, boolean>>()
  })
  test('explicit type arguments', () => {
    expect(_.decodeBody<R1, 'one', number, boolean>(decoderU)).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number, boolean>
    >()
  })
})

describe('decodeMethod', () => {
  test('default', () => {
    expect(_.decodeMethod(decoderS)).type.toBe<
      _.ReaderMiddleware<unknown, H.StatusOpen, H.StatusOpen, number, boolean>
    >()
  })
  test('explicit type arguments', () => {
    expect(_.decodeMethod<R1, 'one', number, boolean>(decoderS)).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number, boolean>
    >()
  })
})

describe('decodeHeader', () => {
  test('default', () => {
    expect(_.decodeHeader('foo', decoderU)).type.toBe<
      _.ReaderMiddleware<unknown, H.StatusOpen, H.StatusOpen, number, boolean>
    >()
  })
  test('explicit type arguments', () => {
    expect(_.decodeHeader<R1, 'one', number, boolean>('foo', decoderU)).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number, boolean>
    >()
  })
})

describe('flatMap', () => {
  test('data-last, widens the environment and error type', () => {
    expect(
      pipe(
        middleware1,
        _.flatMap(() => middlewareSame)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'one', number | Error, string>>()
  })
  test('data-first, widens the environment and error type', () => {
    expect(_.flatMap(middleware1, () => middlewareSame)).type.toBe<
      _.ReaderMiddleware<R1 & R2, 'one', 'one', number | Error, string>
    >()
  })
})

describe('iflatMap', () => {
  test('data-last, transitions the state and widens the environment and error type', () => {
    expect(
      pipe(
        middleware1,
        _.iflatMap(() => middleware2b)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'two', number | Error, string>>()
  })
  test('data-first, transitions the state and widens the environment and error type', () => {
    expect(_.iflatMap(middleware1, () => middleware2b)).type.toBe<
      _.ReaderMiddleware<R1 & R2, 'one', 'two', number | Error, string>
    >()
  })
})

describe('flatMapMiddleware', () => {
  test('data-last, widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.flatMapMiddleware(() => middleware4b)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number | Error, string>>()
  })
  test('data-first, widens the error type', () => {
    expect(_.flatMapMiddleware(middleware1, () => middleware4b)).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number | Error, string>
    >()
  })
})

describe('flatMapEither', () => {
  test('data-last, widens the error type', () => {
    expect(pipe(middleware1, _.flatMapEither(eF))).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number | Error, string>
    >()
  })
  test('data-first, widens the error type', () => {
    expect(_.flatMapEither(middleware1, eF)).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number | Error, string>>()
  })
})

describe('flatMapOption', () => {
  test('data-last, widens the error type', () => {
    expect(pipe(middleware1, _.flatMapOption(oF, onNone))).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number | Error, string>
    >()
  })
  test('data-first, widens the error type', () => {
    expect(_.flatMapOption(middleware1, oF, onNone)).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number | Error, string>
    >()
  })
})

describe('flatMapIO', () => {
  test('data-last, preserves the error type', () => {
    expect(pipe(middleware1, _.flatMapIO(ioF))).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, string>>()
  })
  test('data-first, preserves the error type', () => {
    expect(_.flatMapIO(middleware1, ioF)).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, string>>()
  })
})

describe('flatMapTask', () => {
  test('data-last, preserves the error type', () => {
    expect(pipe(middleware1, _.flatMapTask(taskF))).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, string>>()
  })
  test('data-first, preserves the error type', () => {
    expect(_.flatMapTask(middleware1, taskF)).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, string>>()
  })
})

describe('flatMapTaskEither', () => {
  test('data-last, widens the error type', () => {
    expect(pipe(middleware1, _.flatMapTaskEither(teF))).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number | Error, string>
    >()
  })
  test('data-first, widens the error type', () => {
    expect(_.flatMapTaskEither(middleware1, teF)).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number | Error, string>
    >()
  })
})

describe('flatMapTaskOption', () => {
  test('data-last, widens the error type', () => {
    expect(pipe(middleware1, _.flatMapTaskOption(toF, onNone))).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number | Error, string>
    >()
  })
  test('data-first, widens the error type', () => {
    expect(_.flatMapTaskOption(middleware1, toF, onNone)).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'one', number | Error, string>
    >()
  })
})

describe('flatMapReader', () => {
  test('data-last, intersects the environments', () => {
    expect(
      pipe(
        middleware1,
        _.flatMapReader(() => reader2)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'one', number, string>>()
  })
  test('data-first, intersects the environments', () => {
    expect(_.flatMapReader(middleware1, () => reader2)).type.toBe<
      _.ReaderMiddleware<R1 & R2, 'one', 'one', number, string>
    >()
  })
})

describe('flatMapReaderTask', () => {
  test('data-last, intersects the environments', () => {
    expect(
      pipe(
        middleware1,
        _.flatMapReaderTask(() => readerTask2)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'one', number, string>>()
  })
  test('data-first, intersects the environments', () => {
    expect(_.flatMapReaderTask(middleware1, () => readerTask2)).type.toBe<
      _.ReaderMiddleware<R1 & R2, 'one', 'one', number, string>
    >()
  })
})

describe('flatMapReaderTaskEither', () => {
  test('data-last, intersects the environments and widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.flatMapReaderTaskEither(() => readerTaskEither2)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'one', number | Error, string>>()
  })
  test('data-first, intersects the environments and widens the error type', () => {
    expect(_.flatMapReaderTaskEither(middleware1, () => readerTaskEither2)).type.toBe<
      _.ReaderMiddleware<R1 & R2, 'one', 'one', number | Error, string>
    >()
  })
})

describe('ichainFirst', () => {
  test('preserves the environment and error type', () => {
    expect(
      pipe(
        middleware1,
        _.ichainFirst((_: boolean) => middleware2a)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'two', number, boolean>>()
  })
  test('rejects a widened environment', () => {
    expect(_.ichainFirst(() => middleware2b)).type.not.toBeCallableWith(middleware1)
  })
  test('rejects a mismatched input state', () => {
    expect(_.ichainFirst(() => middleware3)).type.not.toBeCallableWith(middleware1)
  })
})

describe('ichainFirstW', () => {
  test('preserves the environment and error type', () => {
    expect(
      pipe(
        middleware1,
        _.ichainFirstW((_: boolean) => middleware2a)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'two', number, boolean>>()
  })
  test('widens the environment and error type', () => {
    expect(
      pipe(
        middleware1,
        _.ichainFirstW(() => middleware2b)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'two', number | Error, boolean>>()
  })
  test('rejects a mismatched input state', () => {
    expect(_.ichainFirstW(() => middleware3)).type.not.toBeCallableWith(middleware1)
  })
})

describe('fromMiddlewareK', () => {
  test('default', () => {
    expect(_.fromMiddlewareK((a: boolean, b: number) => middleware5)).type.toBe<
      (a: boolean, b: number) => _.ReaderMiddleware<unknown, 'one', 'two', number, string>
    >()
  })
  test('composes with ichain', () => {
    expect(pipe(middleware1, _.ichain(_.fromMiddlewareK((a: boolean) => middleware5)))).type.toBe<
      _.ReaderMiddleware<R1, 'one', 'two', number, string>
    >()
  })
})

describe('rightReaderTask', () => {
  test('default', () => {
    expect(pipe(readerTask1, _.rightReaderTask)).type.toBe<
      _.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, never, string>
    >()
  })
})

describe('leftReaderTask', () => {
  test('default', () => {
    expect(pipe(readerTask1, _.leftReaderTask)).type.toBe<
      _.ReaderMiddleware<R1, H.StatusOpen, H.StatusOpen, string, never>
    >()
  })
})

describe('orElseMiddlewareK', () => {
  test('default', () => {
    expect(
      pipe(
        middleware1,
        _.orElseMiddlewareK((_: number) => middleware4a)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, boolean>>()
  })
  test('rejects a widened error type', () => {
    expect(_.orElseMiddlewareK(() => middleware4b)).type.not.toBeCallableWith(middleware1)
  })
  test('rejects a mismatched state transition', () => {
    expect(_.orElseMiddlewareK(() => middleware5)).type.not.toBeCallableWith(middleware1)
  })
})

describe('orElseMiddlewareKW', () => {
  test('default', () => {
    expect(
      pipe(
        middleware1,
        _.orElseMiddlewareKW((_: number) => middleware4a)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, boolean>>()
  })
  test('widens the error and output type', () => {
    expect(
      pipe(
        middleware1,
        _.orElseMiddlewareKW(() => middleware4b)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', Error, string | boolean>>()
  })
  test('rejects a mismatched state transition', () => {
    expect(_.orElseMiddlewareKW(() => middleware5)).type.not.toBeCallableWith(middleware1)
  })
})

describe('chainTaskOptionK', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainTaskOptionK(() => 1)((_: boolean) => TO.some(2))
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, number>>()
  })
  test('rejects a widened error type', () => {
    expect(_.chainTaskOptionK(() => true)((_: boolean) => TO.some(2))).type.not.toBeCallableWith(middleware1)
  })
})

describe('chainTaskOptionKW', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainTaskOptionKW(() => 1)((_: boolean) => TO.some(2))
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, number>>()
  })
  test('widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainTaskOptionKW(() => true)((_: boolean) => TO.some(2))
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number | boolean, number>>()
  })
})

describe('chainReaderKW', () => {
  test('preserves the environment', () => {
    expect(
      pipe(
        middleware1,
        _.chainReaderKW(() => reader1)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, string>>()
  })
  test('intersects the environments', () => {
    expect(
      pipe(
        middleware1,
        _.chainReaderKW(() => reader2)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'one', number, string>>()
  })
})

describe('chainReaderK', () => {
  test('preserves the environment', () => {
    expect(
      pipe(
        middleware1,
        _.chainReaderK(() => reader1)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, string>>()
  })
  test('rejects a mismatched environment', () => {
    expect(_.chainReaderK(() => reader2)).type.not.toBeCallableWith(middleware1)
  })
})

describe('chainReaderTaskKW', () => {
  test('preserves the environment', () => {
    expect(
      pipe(
        middleware1,
        _.chainReaderTaskKW(() => readerTask1)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, string>>()
  })
  test('intersects the environments', () => {
    expect(
      pipe(
        middleware1,
        _.chainReaderTaskKW(() => readerTask2)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'one', number, string>>()
  })
})

describe('chainReaderTaskK', () => {
  test('preserves the environment', () => {
    expect(
      pipe(
        middleware1,
        _.chainReaderTaskK(() => readerTask1)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, string>>()
  })
  test('rejects a mismatched environment', () => {
    expect(_.chainReaderTaskK(() => readerTask2)).type.not.toBeCallableWith(middleware1)
  })
})

describe('chainReaderTaskEitherKW', () => {
  test('preserves the environment and error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainReaderTaskEitherKW(() => readerTaskEither1)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, string>>()
  })
  test('intersects the environments and widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainReaderTaskEitherKW(() => readerTaskEither2)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'one', number | Error, string>>()
  })
})

describe('chainReaderTaskEitherK', () => {
  test('preserves the environment and error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainReaderTaskEitherK(() => readerTaskEither1)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, string>>()
  })
  test('rejects a mismatched environment', () => {
    expect(_.chainReaderTaskEitherK(() => readerTaskEither2)).type.not.toBeCallableWith(middleware1)
  })
})

describe('chainFirstReaderTaskKW', () => {
  test('preserves the environment', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstReaderTaskKW(() => readerTask1)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, boolean>>()
  })
  test('intersects the environments', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstReaderTaskKW(() => readerTask2)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'one', number, boolean>>()
  })
})

describe('chainFirstReaderTaskK', () => {
  test('preserves the environment', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstReaderTaskK(() => readerTask1)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, boolean>>()
  })
  test('rejects a mismatched environment', () => {
    expect(_.chainFirstReaderTaskK(() => readerTask2)).type.not.toBeCallableWith(middleware1)
  })
})

describe('chainFirstReaderTaskEitherKW', () => {
  test('preserves the environment and error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstReaderTaskEitherKW(() => readerTaskEither1)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, boolean>>()
  })
  test('intersects the environments and widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstReaderTaskEitherKW(() => readerTaskEither2)
      )
    ).type.toBe<_.ReaderMiddleware<R1 & R2, 'one', 'one', number | Error, boolean>>()
  })
})

describe('chainFirstReaderTaskEitherK', () => {
  test('preserves the environment and error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstReaderTaskEitherK(() => readerTaskEither1)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, boolean>>()
  })
  test('rejects a mismatched environment', () => {
    expect(_.chainFirstReaderTaskEitherK(() => readerTaskEither2)).type.not.toBeCallableWith(middleware1)
  })
})

describe('chainOptionK', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainOptionK(() => 1)((_: boolean) => O.some(2))
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, number>>()
  })
  test('rejects a widened error type', () => {
    expect(_.chainOptionK(() => true)((_: boolean) => O.some(2))).type.not.toBeCallableWith(middleware1)
  })
})

describe('chainOptionKW', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainOptionKW(() => 1)((_: boolean) => O.some(2))
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, number>>()
  })
  test('widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainOptionKW(() => true)((_: boolean) => O.some(2))
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number | boolean, number>>()
  })
})

describe('chainFirstTaskOptionK', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstTaskOptionK(() => 1)((_: boolean) => TO.some(2))
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, boolean>>()
  })
  test('rejects a widened error type', () => {
    expect(_.chainFirstTaskOptionK(() => true)((_: boolean) => TO.some(2))).type.not.toBeCallableWith(middleware1)
  })
})

describe('chainFirstTaskOptionKW', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstTaskOptionKW(() => 1)((_: boolean) => TO.some(2))
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, boolean>>()
  })
  test('widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstTaskOptionKW(() => true)((_: boolean) => TO.some(2))
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number | boolean, boolean>>()
  })
})

describe('chainMiddlewareK', () => {
  test('default', () => {
    expect(
      pipe(
        middleware1,
        _.chainMiddlewareK(() => middleware4a)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number, boolean>>()
  })
  test('widens the error and output type', () => {
    expect(
      pipe(
        middleware1,
        _.chainMiddlewareKW(() => middleware4b)
      )
    ).type.toBe<_.ReaderMiddleware<R1, 'one', 'one', number | Error, string>>()
  })
})
