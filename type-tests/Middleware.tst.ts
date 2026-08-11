import * as E from 'fp-ts/Either'
import { IO } from 'fp-ts/IO'
import * as O from 'fp-ts/Option'
import { Task } from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as TO from 'fp-ts/TaskOption'
import { pipe } from 'fp-ts/function'
import { describe, expect, test } from 'tstyche'
import * as H from '../src'
import * as _ from '../src/Middleware'

declare const middleware1: _.Middleware<'one', 'one', number, boolean>
declare const middleware2a: _.Middleware<'one', 'two', number, string>
declare const middleware2b: _.Middleware<'one', 'two', Error, string>
declare const middleware3: _.Middleware<'two', 'three', number, string>
declare const middlewareSame: _.Middleware<'one', 'one', Error, string>
declare const eF: (a: boolean) => E.Either<Error, string>
declare const oF: (a: boolean) => O.Option<string>
declare const ioF: (a: boolean) => IO<string>
declare const taskF: (a: boolean) => Task<string>
declare const teF: (a: boolean) => TE.TaskEither<Error, string>
declare const toF: (a: boolean) => TO.TaskOption<string>
declare const onNone: (a: boolean) => Error
declare const decoderU: (value: unknown) => E.Either<number, boolean>
declare const decoderS: (value: string) => E.Either<number, boolean>

describe('decodeParam', () => {
  test('default', () => {
    expect(_.decodeParam('foo', decoderU)).type.toBe<_.Middleware<H.StatusOpen, H.StatusOpen, number, boolean>>()
  })
  test('explicit type arguments', () => {
    expect(_.decodeParam<'one', number, boolean>('foo', decoderU)).type.toBe<
      _.Middleware<'one', 'one', number, boolean>
    >()
  })
})

describe('decodeParams', () => {
  test('default', () => {
    expect(_.decodeParams(decoderU)).type.toBe<_.Middleware<H.StatusOpen, H.StatusOpen, number, boolean>>()
  })
  test('explicit type arguments', () => {
    expect(_.decodeParams<'one', number, boolean>(decoderU)).type.toBe<_.Middleware<'one', 'one', number, boolean>>()
  })
})

describe('decodeQuery', () => {
  test('default', () => {
    expect(_.decodeQuery(decoderU)).type.toBe<_.Middleware<H.StatusOpen, H.StatusOpen, number, boolean>>()
  })
  test('explicit type arguments', () => {
    expect(_.decodeQuery<'one', number, boolean>(decoderU)).type.toBe<_.Middleware<'one', 'one', number, boolean>>()
  })
})

describe('decodeBody', () => {
  test('default', () => {
    expect(_.decodeBody(decoderU)).type.toBe<_.Middleware<H.StatusOpen, H.StatusOpen, number, boolean>>()
  })
  test('explicit type arguments', () => {
    expect(_.decodeBody<'one', number, boolean>(decoderU)).type.toBe<_.Middleware<'one', 'one', number, boolean>>()
  })
})

describe('decodeMethod', () => {
  test('default', () => {
    expect(_.decodeMethod(decoderS)).type.toBe<_.Middleware<H.StatusOpen, H.StatusOpen, number, boolean>>()
  })
  test('explicit type arguments', () => {
    expect(_.decodeMethod<'one', number, boolean>(decoderS)).type.toBe<_.Middleware<'one', 'one', number, boolean>>()
  })
})

describe('decodeHeader', () => {
  test('default', () => {
    expect(_.decodeHeader('foo', decoderU)).type.toBe<_.Middleware<H.StatusOpen, H.StatusOpen, number, boolean>>()
  })
  test('explicit type arguments', () => {
    expect(_.decodeHeader<'one', number, boolean>('foo', decoderU)).type.toBe<
      _.Middleware<'one', 'one', number, boolean>
    >()
  })
})

describe('flatMap', () => {
  test('data-last, widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.flatMap(() => middlewareSame)
      )
    ).type.toBe<_.Middleware<'one', 'one', number | Error, string>>()
  })
  test('data-first, widens the error type', () => {
    expect(_.flatMap(middleware1, () => middlewareSame)).type.toBe<_.Middleware<'one', 'one', number | Error, string>>()
  })
})

describe('iflatMap', () => {
  test('data-last, transitions the state and widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.iflatMap(() => middleware2b)
      )
    ).type.toBe<_.Middleware<'one', 'two', number | Error, string>>()
  })
  test('data-first, transitions the state and widens the error type', () => {
    expect(_.iflatMap(middleware1, () => middleware2b)).type.toBe<_.Middleware<'one', 'two', number | Error, string>>()
  })
})

describe('flatMapEither', () => {
  test('data-last, widens the error type', () => {
    expect(pipe(middleware1, _.flatMapEither(eF))).type.toBe<_.Middleware<'one', 'one', number | Error, string>>()
  })
  test('data-first, widens the error type', () => {
    expect(_.flatMapEither(middleware1, eF)).type.toBe<_.Middleware<'one', 'one', number | Error, string>>()
  })
})

describe('flatMapOption', () => {
  test('data-last, widens the error type', () => {
    expect(pipe(middleware1, _.flatMapOption(oF, onNone))).type.toBe<
      _.Middleware<'one', 'one', number | Error, string>
    >()
  })
  test('data-first, widens the error type', () => {
    expect(_.flatMapOption(middleware1, oF, onNone)).type.toBe<_.Middleware<'one', 'one', number | Error, string>>()
  })
})

describe('flatMapIO', () => {
  test('data-last, preserves the error type', () => {
    expect(pipe(middleware1, _.flatMapIO(ioF))).type.toBe<_.Middleware<'one', 'one', number, string>>()
  })
  test('data-first, preserves the error type', () => {
    expect(_.flatMapIO(middleware1, ioF)).type.toBe<_.Middleware<'one', 'one', number, string>>()
  })
})

describe('flatMapTask', () => {
  test('data-last, preserves the error type', () => {
    expect(pipe(middleware1, _.flatMapTask(taskF))).type.toBe<_.Middleware<'one', 'one', number, string>>()
  })
  test('data-first, preserves the error type', () => {
    expect(_.flatMapTask(middleware1, taskF)).type.toBe<_.Middleware<'one', 'one', number, string>>()
  })
})

describe('flatMapTaskEither', () => {
  test('data-last, widens the error type', () => {
    expect(pipe(middleware1, _.flatMapTaskEither(teF))).type.toBe<_.Middleware<'one', 'one', number | Error, string>>()
  })
  test('data-first, widens the error type', () => {
    expect(_.flatMapTaskEither(middleware1, teF)).type.toBe<_.Middleware<'one', 'one', number | Error, string>>()
  })
})

describe('flatMapTaskOption', () => {
  test('data-last, widens the error type', () => {
    expect(pipe(middleware1, _.flatMapTaskOption(toF, onNone))).type.toBe<
      _.Middleware<'one', 'one', number | Error, string>
    >()
  })
  test('data-first, widens the error type', () => {
    expect(_.flatMapTaskOption(middleware1, toF, onNone)).type.toBe<
      _.Middleware<'one', 'one', number | Error, string>
    >()
  })
})

describe('tap', () => {
  test('data-last, keeps the value and widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.tap(() => middlewareSame)
      )
    ).type.toBe<_.Middleware<'one', 'one', number | Error, boolean>>()
  })
  test('data-first, keeps the value and widens the error type', () => {
    expect(_.tap(middleware1, () => middlewareSame)).type.toBe<_.Middleware<'one', 'one', number | Error, boolean>>()
  })
})

describe('itap', () => {
  test('data-last, transitions the state and keeps the value', () => {
    expect(
      pipe(
        middleware1,
        _.itap(() => middleware2b)
      )
    ).type.toBe<_.Middleware<'one', 'two', number | Error, boolean>>()
  })
  test('data-first, transitions the state and keeps the value', () => {
    expect(_.itap(middleware1, () => middleware2b)).type.toBe<_.Middleware<'one', 'two', number | Error, boolean>>()
  })
})

describe('tapIO', () => {
  test('data-last, keeps the value and error type', () => {
    expect(pipe(middleware1, _.tapIO(ioF))).type.toBe<_.Middleware<'one', 'one', number, boolean>>()
  })
  test('data-first, keeps the value and error type', () => {
    expect(_.tapIO(middleware1, ioF)).type.toBe<_.Middleware<'one', 'one', number, boolean>>()
  })
})

describe('tapTask', () => {
  test('data-last, keeps the value and error type', () => {
    expect(pipe(middleware1, _.tapTask(taskF))).type.toBe<_.Middleware<'one', 'one', number, boolean>>()
  })
  test('data-first, keeps the value and error type', () => {
    expect(_.tapTask(middleware1, taskF)).type.toBe<_.Middleware<'one', 'one', number, boolean>>()
  })
})

describe('tapTaskEither', () => {
  test('data-last, keeps the value and widens the error type', () => {
    expect(pipe(middleware1, _.tapTaskEither(teF))).type.toBe<_.Middleware<'one', 'one', number | Error, boolean>>()
  })
  test('data-first, keeps the value and widens the error type', () => {
    expect(_.tapTaskEither(middleware1, teF)).type.toBe<_.Middleware<'one', 'one', number | Error, boolean>>()
  })
})

describe('tapTaskOption', () => {
  test('data-last, keeps the value and widens the error type', () => {
    expect(pipe(middleware1, _.tapTaskOption(toF, onNone))).type.toBe<
      _.Middleware<'one', 'one', number | Error, boolean>
    >()
  })
  test('data-first, keeps the value and widens the error type', () => {
    expect(_.tapTaskOption(middleware1, toF, onNone)).type.toBe<_.Middleware<'one', 'one', number | Error, boolean>>()
  })
})

describe('ichainFirst', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.ichainFirst((_: boolean) => middleware2a)
      )
    ).type.toBe<_.Middleware<'one', 'two', number, boolean>>()
  })
  test('rejects a widened error type', () => {
    expect(_.ichainFirst(() => middleware2b)).type.not.toBeCallableWith(middleware1)
  })
  test('rejects a mismatched input state', () => {
    expect(_.ichainFirst(() => middleware3)).type.not.toBeCallableWith(middleware1)
  })
})

describe('ichainFirstW', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.ichainFirstW((_: boolean) => middleware2a)
      )
    ).type.toBe<_.Middleware<'one', 'two', number, boolean>>()
  })
  test('widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.ichainFirstW(() => middleware2b)
      )
    ).type.toBe<_.Middleware<'one', 'two', number | Error, boolean>>()
  })
  test('rejects a mismatched input state', () => {
    expect(_.ichainFirstW(() => middleware3)).type.not.toBeCallableWith(middleware1)
  })
})

describe('chainOptionK', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainOptionK(() => 1)((_: boolean) => O.some(2))
      )
    ).type.toBe<_.Middleware<'one', 'one', number, number>>()
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
    ).type.toBe<_.Middleware<'one', 'one', number, number>>()
  })
  test('widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainOptionKW(() => true)((_: boolean) => O.some(2))
      )
    ).type.toBe<_.Middleware<'one', 'one', number | boolean, number>>()
  })
})

describe('chainTaskOptionK', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainTaskOptionK(() => 1)((_: boolean) => TO.some(2))
      )
    ).type.toBe<_.Middleware<'one', 'one', number, number>>()
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
    ).type.toBe<_.Middleware<'one', 'one', number, number>>()
  })
  test('widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainTaskOptionKW(() => true)((_: boolean) => TO.some(2))
      )
    ).type.toBe<_.Middleware<'one', 'one', number | boolean, number>>()
  })
})

describe('chainFirstTaskOptionK', () => {
  test('preserves the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstTaskOptionK(() => 1)((_: boolean) => TO.some(2))
      )
    ).type.toBe<_.Middleware<'one', 'one', number, boolean>>()
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
    ).type.toBe<_.Middleware<'one', 'one', number, boolean>>()
  })
  test('widens the error type', () => {
    expect(
      pipe(
        middleware1,
        _.chainFirstTaskOptionKW(() => true)((_: boolean) => TO.some(2))
      )
    ).type.toBe<_.Middleware<'one', 'one', number | boolean, boolean>>()
  })
})
