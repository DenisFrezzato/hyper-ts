import * as assert from 'assert'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import * as RT from 'fp-ts/ReaderTask'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as TO from 'fp-ts/TaskOption'
import * as t from 'io-ts'
import * as _ from '../src/ReaderMiddleware'
import { pipe } from 'fp-ts/function'
import { MockRequest, MockConnection } from './_helpers'
import * as H from '../src'
import * as M from '../src/Middleware'
import { Action } from '../src/express'
import * as L from 'fp-ts-contrib/List'

function assertProperty<R, I, O, A>(
  m1: _.ReaderMiddleware<R, I, O, any, A>,
  r: R,
  m2: M.Middleware<I, O, any, A>,
  cin: MockConnection<I>
) {
  return Promise.all([m1(r)(cin)(), m2(cin)()] as const).then(([e1, e2]) => {
    assert.deepStrictEqual(
      pipe(
        e1,
        E.map(([a1, cout1]) => [a1, L.toReversedArray((cout1 as MockConnection<O>).actions)])
      ),
      pipe(
        e2,
        E.map(([a2, cout2]) => [a2, L.toReversedArray((cout2 as MockConnection<O>).actions)])
      )
    )
  })
}

function assertSuccess<R, I, O, A>(
  m: _.ReaderMiddleware<R, I, O, any, A>,
  r: R,
  cin: MockConnection<I>,
  a: A,
  actions: Array<Action>
) {
  return m(r)(cin)().then((e) => {
    assert.deepStrictEqual(
      pipe(
        e,
        E.map(([a, cout]) => [a, L.toArray((cout as MockConnection<O>).actions)])
      ),
      E.right([a, actions])
    )
  })
}

function assertFailure<R, I, O, E>(m: _.ReaderMiddleware<R, I, O, E, any>, r: R, cin: MockConnection<I>, e: E) {
  return m(r)(cin)().then((a) => {
    assert.deepStrictEqual(a, E.left(e))
  })
}

describe('ReaderMiddleware', () => {
  describe('fromTaskOption', () => {
    test('with a some', async () => {
      const m = pipe(
        TO.some(4),
        _.fromTaskOption(() => 'Some error')
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, undefined, c, 4, [])
    })

    test('with a none', async () => {
      const m = pipe(
        TO.none,
        _.fromTaskOption(() => 'Some error')
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertFailure(m, undefined, c, 'Some error')
    })
  })

  it('fromMiddleware', () => {
    const m2 = M.right(42)
    const m1 = _.fromMiddleware(m2)
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertProperty(m1, undefined, m2, c)
  })

  it('fromReaderTaskK', () => {
    const m2 = (value: string) => RT.of(value.length)
    const m1 = _.fromReaderTaskK(m2)
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m1('foo'), undefined, c, 3, [])
  })

  describe('fromReaderTaskEitherK', () => {
    test('with a left', () => {
      const m2 = (value: string) => RTE.left(value.length)
      const m1 = _.fromReaderTaskEitherK(m2)
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertFailure(m1('foo'), undefined, c, 3)
    })

    test('with a right', () => {
      const m2 = (value: string) => RTE.right(value.length)
      const m1 = _.fromReaderTaskEitherK(m2)
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m1('foo'), undefined, c, 3, [])
    })
  })

  it('ap', () => {
    const fab = pipe(
      _.header('a', 'a'),
      _.map(
        () =>
          (s: string): number =>
            s.length
      )
    )
    const fa = pipe(
      _.header('b', 'b'),
      _.map(() => 'foo')
    )
    const m1 = pipe(fab, _.ap(fa))
    const r = 'yee'
    const fab2 = pipe(
      M.header('a', 'a'),
      M.map(
        () =>
          (s: string): number =>
            s.length
      )
    )
    const fa2 = pipe(
      M.header('b', 'b'),
      M.map(() => 'foo')
    )
    const m2 = pipe(fab2, M.ap(fa2))
    const c = new MockConnection<H.HeadersOpen>(new MockRequest())
    return assertProperty(m1, r, m2, c)
  })

  it('apFirst', async () => {
    const fa = _.right(4)
    const fb = _.right(true)
    const m = pipe(fa, _.apFirst(fb))
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, undefined, c, 4, [])
  })

  it('apFirstW', async () => {
    const fa = _.right<number, H.StatusOpen, 'Foo', number>(4)
    const fb = _.right<number, H.StatusOpen, 'Bar', boolean>(true)
    const m = pipe(fa, _.apFirstW(fb))
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, 1, c, 4, [])
  })

  it('apSecond', async () => {
    const fa = _.right(4)
    const fb = _.right(true)
    const m = pipe(fa, _.apSecond(fb))
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, undefined, c, true, [])
  })

  it('apSecondW', async () => {
    const fa = _.right<number, H.StatusOpen, 'Foo', number>(4)
    const fb = _.right<number, H.StatusOpen, 'Bar', boolean>(true)
    const m = pipe(fa, _.apSecondW(fb))
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, 4, c, true, [])
  })

  it('ichainFirst', async () => {
    const fa = _.right(4)
    const fb = _.right(true)
    const m = pipe(
      fa,
      _.ichainFirst(() => fb)
    )
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, 4, c, 4, [])
  })

  it('ichainFirstW', async () => {
    const fa = _.right<number, H.StatusOpen, 'Foo', number>(4)
    const fb = _.right<number, H.StatusOpen, 'Bar', boolean>(true)
    const m = pipe(
      fa,
      _.ichainFirstW(() => fb)
    )
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, 4, c, 4, [])
  })

  it('rightReaderTask', async () => {
    const m = pipe(RT.of('foo'), _.rightReaderTask)
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, 4, c, 'foo', [])
  })

  it('leftReaderTask', async () => {
    const m = pipe(RT.of('foo'), _.leftReaderTask)
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertFailure(m, 4, c, 'foo')
  })

  it('ask', () => {
    const m = _.ask<string>()
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, 'yee', c, 'yee', [])
  })

  it('asks', () => {
    const m = _.asks((s: string) => s.length)
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, 'yee', c, 3, [])
  })

  it('orElseMiddlewareK', () => {
    const fa = _.left<unknown, H.StatusOpen, number, number>(42)
    const fb = M.right
    const m = pipe(fa, _.orElseMiddlewareK(fb))
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, 'yee', c, 42, [])
  })

  it('orElseMiddlewareKW', () => {
    const fa = _.left<unknown, H.StatusOpen, number, number>(42)
    const fb = M.right('foo')
    const m = pipe(
      fa,
      _.orElseMiddlewareKW(() => fb)
    )
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, 'yee', c, 'foo', [])
  })

  describe('status', () => {
    it('should write the status code', () => {
      const m1 = _.status(200)
      const r = 'yee'
      const m2 = M.status(200)
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertProperty(m1, r, m2, c)
    })
  })

  describe('header', () => {
    it('should write the headers', () => {
      const m1 = _.header('name', 'value')
      const r = 'yee'
      const m2 = M.header('name', 'value')
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertProperty(m1, r, m2, c)
    })
  })

  describe('send', () => {
    it('should send the content', () => {
      const m1 = _.send('<h1>Hello world!</h1>')
      const r = 'yee'
      const m2 = M.send('<h1>Hello world!</h1>')
      const c = new MockConnection<H.BodyOpen>(new MockRequest())
      return assertProperty(m1, r, m2, c)
    })
  })

  describe('json', () => {
    it('should add the proper header and send the content', () => {
      const m1 = _.json({ a: 1 }, E.toError)
      const r = 'yee'
      const m2 = M.json({ a: 1 }, E.toError)
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertProperty(m1, r, m2, c)
    })
  })

  describe('cookie', () => {
    it('should add the cookie', () => {
      const m1 = _.cookie('name', 'value', {})
      const r = 'yee'
      const m2 = M.cookie('name', 'value', {})
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertProperty(m1, r, m2, c)
    })
  })

  describe('clearCookie', () => {
    it('should clear the cookie', () => {
      const m1 = pipe(
        _.cookie('name', 'value', {}),
        _.ichain(() => _.clearCookie('name', {}))
      )
      const r = 'yee'
      const m2 = pipe(
        M.cookie('name', 'value', {}),
        M.ichain(() => M.clearCookie('name', {}))
      )
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertProperty(m1, r, m2, c)
    })
  })

  describe('contentType', () => {
    it('should add the `Content-Type` header', () => {
      const m1 = _.contentType(H.MediaType.applicationXML)
      const r = 'yee'
      const m2 = M.contentType(H.MediaType.applicationXML)
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertProperty(m1, r, m2, c)
    })
  })

  describe('redirect', () => {
    it.each([
      ['string', '/users', '/users'],
      ['URL', new URL('http://example.com/users'), 'http://example.com/users'],
    ])('should add the correct status / header for a %s', (_type, actual, expected) => {
      const m1 = _.redirect(actual)
      const r = 'yee'
      const m2 = M.redirect(expected)
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertProperty(m1, r, m2, c)
    })
  })

  describe('decodeParam', () => {
    it('should validate a param (success case)', () => {
      const m1 = _.decodeParam('foo', t.number.decode)
      const r = 'yee'
      const m2 = M.decodeParam('foo', t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 1 }))
      return assertProperty(m1, r, m2, c)
    })
    it('should validate a param (failure case)', () => {
      const m1 = _.decodeParam('foo', t.number.decode)
      const r = 'yee'
      const m2 = M.decodeParam('foo', t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 'a' }))
      return assertProperty(m1, r, m2, c)
    })
    describe('decodeParams', () => {
      it('should validate all params (success case)', () => {
        const decoder = t.type({ foo: t.number }).decode
        const m1 = _.decodeParams(decoder)
        const r = 'yee'
        const m2 = M.decodeParams(decoder)
        const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 1 }))
        return assertProperty(m1, r, m2, c)
      })
      it('should validate all params (failure case)', () => {
        const decoder = t.type({ foo: t.number }).decode
        const m1 = _.decodeParams(decoder)
        const r = 'yee'
        const m2 = M.decodeParams(decoder)
        const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 'a' }))
        return assertProperty(m1, r, m2, c)
      })
    })
  })

  describe('decodeQuery', () => {
    it('should validate a query (success case 1)', () => {
      const decoder = t.type({ q: t.string }).decode
      const m1 = _.decodeQuery(decoder)
      const r = 'yee'
      const m2 = M.decodeQuery(decoder)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, 'q=tobi+ferret'))
      return assertProperty(m1, r, m2, c)
    })
    it('should validate a query (success case 2)', () => {
      const decoder = t.type({
        order: t.string,
        shoe: t.type({
          color: t.string,
          type: t.string,
        }),
      }).decode
      const m1 = _.decodeQuery(decoder)
      const r = 'yee'
      const m2 = M.decodeQuery(decoder)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, 'order=desc&shoe[color]=blue&shoe[type]=converse'))
      return assertProperty(m1, r, m2, c)
    })
    it('should validate a query (failure case)', () => {
      const decoder = t.type({ q: t.number }).decode
      const m1 = _.decodeQuery(decoder)
      const r = 'yee'
      const m2 = M.decodeQuery(decoder)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, 'q=tobi+ferret'))
      return assertProperty(m1, r, m2, c)
    })
  })

  describe('decodeBody', () => {
    it('should validate the body (success case)', () => {
      const m1 = _.decodeBody(t.number.decode)
      const r = 'yee'
      const m2 = M.decodeBody(t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, 1))
      return assertProperty(m1, r, m2, c)
    })
    it('should validate the body (failure case)', () => {
      const m1 = _.decodeBody(t.number.decode)
      const r = 'yee'
      const m2 = M.decodeBody(t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, 'a'))
      return assertProperty(m1, r, m2, c)
    })
  })

  describe('decodeHeader', () => {
    it('should validate a header (success case)', () => {
      const m1 = _.decodeHeader('token', t.string.decode)
      const r = 'yee'
      const m2 = M.decodeHeader('token', t.string.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, { token: 'mytoken' }))
      return assertProperty(m1, r, m2, c)
    })
    it('should validate a header (failure case)', () => {
      const m1 = _.decodeHeader('token', t.string.decode)
      const r = 'yee'
      const m2 = M.decodeHeader('token', t.string.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
      return assertProperty(m1, r, m2, c)
    })
  })

  it('ask', () => {
    const m1 = _.ask<number>()
    const r = 1
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 1, [])
  })

  it('asks', () => {
    const m1 = _.asks((s: string) => s.length)
    const r = 'foo'
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 3, [])
  })

  it('asksReaderMiddlewareW', () => {
    const m1 = _.asksReaderMiddlewareW((s: string) => _.of(s.length))
    const r = 'foo'
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 3, [])
  })

  it('asksReaderMiddleware', () => {
    const m1 = _.asksReaderMiddleware((s: string) => _.of(s.length))
    const r = 'foo'
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 3, [])
  })

  it('chainMiddlewareK', () => {
    const m1 = pipe(
      _.right('foo'),
      _.chainMiddlewareK((s) => M.right(s.length))
    )
    const r = 'foo'
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 3, [])
  })

  it('chainTaskEitherK', () => {
    const m1 = pipe(
      _.right('foo'),
      _.chainTaskEitherK((s) => TE.right(s.length))
    )
    const r = 'foo'
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 3, [])
  })

  describe('chainTaskOptionK', () => {
    test('with a some', async () => {
      const m = pipe(
        _.right(4),
        _.chainTaskOptionK(() => 0)((a) => TO.some(a * 2))
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, undefined, c, 8, [])
    })

    test('with a none', async () => {
      const m = pipe(
        _.right(4),
        _.chainTaskOptionK(() => 'Some error')(() => TO.none)
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertFailure(m, undefined, c, 'Some error')
    })
  })

  describe('chainTaskOptionKW', () => {
    test('with a some', async () => {
      const m = pipe(
        _.right(4),
        _.chainTaskOptionKW(() => 0)((a) => TO.some(a * 2))
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, undefined, c, 8, [])
    })

    test('with a none', async () => {
      const m = pipe(
        _.right(4),
        _.chainTaskOptionKW(() => 'Some error')(() => TO.none)
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertFailure(m, undefined, c, 'Some error')
    })
  })

  it('chainReaderTaskKW', () => {
    const m1 = pipe(
      _.right('foo'),
      _.chainReaderTaskKW((s) => RT.of(s.length))
    )
    const r = 'foo'
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 3, [])
  })

  it('chainReaderTaskK', () => {
    const m1 = pipe(
      _.right('foo'),
      _.chainReaderTaskK((s) => RT.of(s.length))
    )
    const r = 'foo'
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 3, [])
  })

  describe('chainReaderTaskEitherKW', () => {
    test('with a left', () => {
      const m1 = pipe(
        _.right('foo'),
        _.chainFirstReaderTaskEitherKW((s) => RTE.left(s.length))
      )
      const r = 'foo'
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
      return assertFailure(m1, r, c, 3)
    })

    test('with a right', () => {
      const m1 = pipe(
        _.right('foo'),
        _.chainFirstReaderTaskEitherKW((s) => RTE.right(s.length))
      )
      const r = 'foo'
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
      return assertSuccess(m1, r, c, 'foo', [])
    })
  })

  describe('chainReaderTaskEitherK', () => {
    test('with a left', () => {
      const m1 = pipe(
        _.right('foo'),
        _.chainFirstReaderTaskEitherK((s) => RTE.left(s.length))
      )
      const r = 'foo'
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
      return assertFailure(m1, r, c, 3)
    })

    test('with a right', () => {
      const m1 = pipe(
        _.right('foo'),
        _.chainFirstReaderTaskEitherK((s) => RTE.right(s.length))
      )
      const r = 'foo'
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
      return assertSuccess(m1, r, c, 'foo', [])
    })
  })

  it('chainFirstReaderTaskKW', () => {
    const m1 = pipe(
      _.right('foo'),
      _.chainFirstReaderTaskKW((s) => RT.of(s.length))
    )
    const r = 'foo'
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 'foo', [])
  })

  it('chainFirstReaderTaskK', () => {
    const m1 = pipe(
      _.right('foo'),
      _.chainFirstReaderTaskK((s) => RT.of(s.length))
    )
    const r = 'foo'
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 'foo', [])
  })

  describe('fromOption', () => {
    test('with a some', async () => {
      const m = pipe(
        O.some(8),
        _.fromOption(() => 0)
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, undefined, c, 8, [])
    })

    test('with a none', async () => {
      const m = pipe(
        O.none,
        _.fromOption(() => 'Some error')
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertFailure(m, undefined, c, 'Some error')
    })
  })

  describe('chainOptionK', () => {
    test('with a some', async () => {
      const m = pipe(
        _.right(4),
        _.chainOptionK(() => 0)((a) => O.some(a * 2))
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, undefined, c, 8, [])
    })

    test('with a none', async () => {
      const m = pipe(
        _.right(4),
        _.chainOptionK(() => 'Some error')(() => O.none)
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertFailure(m, undefined, c, 'Some error')
    })
  })

  describe('chainOptionKW', () => {
    test('with a some', async () => {
      const m = pipe(
        _.right(4),
        _.chainOptionKW(() => 0)((a) => O.some(a * 2))
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, undefined, c, 8, [])
    })

    test('with a none', async () => {
      const m = pipe(
        _.right(4),
        _.chainOptionKW(() => 'Some error')(() => O.none)
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertFailure(m, undefined, c, 'Some error')
    })
  })

  describe('chainFirstTaskOptionKW', () => {
    test('with a some', async () => {
      const m = pipe(
        _.right(4),
        _.chainFirstTaskOptionKW(() => 0)((a) => TO.some(a * 2))
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, undefined, c, 4, [])
    })

    test('with a none', async () => {
      const m = pipe(
        _.right(4),
        _.chainFirstTaskOptionKW(() => 'Some error')(() => TO.none)
      )
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertFailure(m, undefined, c, 'Some error')
    })
  })

  it('do notation', () => {
    const m1 = pipe(
      _.right(1),
      _.bindTo('a'),
      _.bind('b', () => _.right('b'))
    )
    const r = 'yee'
    const m2 = pipe(
      M.right(1),
      M.bindTo('a'),
      M.bind('b', () => M.right('b'))
    )
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertProperty(m1, r, m2, c)
  })

  it('indexed do notation', () => {
    const m1 = pipe(
      _.status(H.Status.OK),
      _.imap(() => 1),
      _.ibindTo('a'),
      _.ibind('b', () =>
        pipe(
          _.header('x-header', 'nice header'),
          _.imap(() => 'b')
        )
      )
    )
    const r = 1
    const m2 = pipe(
      M.status(H.Status.OK),
      M.imap(() => 1),
      M.ibindTo('a'),
      M.ibind('b', () =>
        pipe(
          M.header('x-header', 'nice header'),
          M.imap(() => 'b')
        )
      )
    )
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertProperty(m1, r, m2, c)
  })
})
