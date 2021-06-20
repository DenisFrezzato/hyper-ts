import * as assert from 'assert'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as t from 'io-ts'
import * as _ from '../src/ReaderMiddleware'
import { pipe } from 'fp-ts/function'
import { MockRequest, MockConnection } from './_helpers'
import * as H from '../src'
import * as M from '../src/Middleware'
import { toArray, Action } from '../src/express'

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
        E.map(([a1, cout1]) => [a1, toArray((cout1 as MockConnection<O>).actions)])
      ),
      pipe(
        e2,
        E.map(([a2, cout2]) => [a2, toArray((cout2 as MockConnection<O>).actions)])
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
        E.map(([a, cout]) => [a, toArray((cout as MockConnection<O>).actions)])
      ),
      E.right([a, actions])
    )
  })
}

describe('ReaderMiddleware', () => {
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
    it('should add the correct status / header', () => {
      const m1 = _.redirect('/users')
      const r = 'yee'
      const m2 = M.redirect('/users')
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

  it('chainReaderTaskEitherK', () => {
    const m1 = pipe(
      _.right('foo'),
      _.chainReaderTaskEitherK((s) => RTE.right(s.length))
    )
    const r = 'foo'
    const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
    return assertSuccess(m1, r, c, 3, [])
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
})
