import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import { pipe } from 'fp-ts/function'
import { describe, expect, test } from 'tstyche'
import * as H from '../src'
import * as _ from '../src/Middleware'

declare const middleware1: _.Middleware<'one', 'one', number, boolean>
declare const middleware2a: _.Middleware<'one', 'two', number, string>
declare const middleware2b: _.Middleware<'one', 'two', Error, string>
declare const middleware3: _.Middleware<'two', 'three', number, string>
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
