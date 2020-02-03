import * as assert from 'assert'
import * as E from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import * as querystring from 'qs'
import { connection as H, middleware as HM } from '../src'
import { Action, ExpressConnection, toArray } from '../src/express'
import { pipe } from 'fp-ts/lib/pipeable'

class MockRequest {
  constructor(
    readonly params?: unknown,
    readonly query: string = '',
    readonly body?: unknown,
    readonly headers: Record<string, string> = {},
    readonly originalUrl: string = '',
    readonly method: string = 'GET'
  ) {
    this.query = querystring.parse(query)
  }
  header(name: string) {
    return this.headers[name]
  }
}

class MockConnection<S> extends ExpressConnection<S> {
  constructor(req: MockRequest) {
    super(req as any, null as any)
  }
}

function assertSuccess<I, O, A>(m: HM.Middleware<I, O, any, A>, cin: MockConnection<I>, a: A, actions: Array<Action>) {
  return m(cin)().then(e => {
    assert.deepStrictEqual(
      pipe(
        e,
        E.map(([a, cout]) => [a, toArray((cout as MockConnection<O>).actions)])
      ),
      E.right([a, actions])
    )
  })
}

function assertFailure<I, L>(m: HM.Middleware<I, any, L, any>, conn: MockConnection<I>, f: (l: L) => void) {
  return m(conn)().then(e => {
    if (E.isLeft(e)) {
      f(e.left)
    } else {
      assert.fail('not a left')
    }
  })
}

describe('Middleware', () => {
  it('ap', () => {
    const fab = pipe(
      HM.header('a', 'a'),
      HM.map(() => (s: string): number => s.length)
    )
    const fa = pipe(
      HM.header('b', 'b'),
      HM.map(() => 'foo')
    )
    const m = pipe(fab, HM.ap(fa))
    const c = new MockConnection<H.HeadersOpen>(new MockRequest())
    return assertSuccess(m, c, 3, [
      { type: 'setHeader', name: 'a', value: 'a' },
      { type: 'setHeader', name: 'b', value: 'b' }
    ])
  })

  describe('status', () => {
    it('should write the status code', () => {
      const m = HM.status(200)
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [{ type: 'setStatus', status: 200 }])
    })
  })

  describe('header', () => {
    it('should write the headers', () => {
      const m = HM.header('name', 'value')
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [{ type: 'setHeader', name: 'name', value: 'value' }])
    })
  })

  describe('send', () => {
    it('should send the content', () => {
      const m = HM.send('<h1>Hello world!</h1>')
      const c = new MockConnection<H.BodyOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [{ type: 'setBody', body: '<h1>Hello world!</h1>' }])
    })
  })

  describe('json', () => {
    it('should add the proper header and send the content', () => {
      const m = HM.json({ a: 1 }, E.toError)
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [
        { type: 'setHeader', name: 'Content-Type', value: 'application/json' },
        { type: 'setBody', body: `{"a":1}` }
      ])
    })
  })

  describe('cookie', () => {
    it('should add the cookie', () => {
      const m = HM.cookie('name', 'value', {})
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [{ type: 'setCookie', name: 'name', value: 'value', options: {} }])
    })
  })

  describe('clearCookie', () => {
    it('should clear the cookie', () => {
      const m = pipe(
        HM.cookie('name', 'value', {}),
        HM.ichain(() => HM.clearCookie('name', {}))
      )
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [
        { type: 'setCookie', name: 'name', value: 'value', options: {} },
        { type: 'clearCookie', name: 'name', options: {} }
      ])
    })
  })

  describe('contentType', () => {
    it('should add the `Content-Type` header', () => {
      const m = HM.contentType(H.MediaType.applicationXML)
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [{ type: 'setHeader', name: 'Content-Type', value: 'application/xml' }])
    })
  })

  describe('redirect', () => {
    it('should add the correct status / header', () => {
      const m = HM.redirect('/users')
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [
        { type: 'setStatus', status: 302 },
        { type: 'setHeader', name: 'Location', value: '/users' }
      ])
    })
  })

  describe('decodeParam', () => {
    it('should validate a param (success case)', () => {
      const m = HM.decodeParam('foo', t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 1 }))
      return assertSuccess(m, c, 1, [])
    })

    it('should validate a param (failure case)', () => {
      const m = HM.decodeParam('foo', t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 'a' }))
      return assertFailure(m, c, errors => {
        assert.deepStrictEqual(failure(errors), ['Invalid value "a" supplied to : number'])
      })
    })

    describe('decodeParams', () => {
      it('should validate all params (success case)', () => {
        const m = HM.decodeParams(t.interface({ foo: t.number }).decode)
        const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 1 }))
        return assertSuccess(m, c, { foo: 1 }, [])
      })

      it('should validate all params (failure case)', () => {
        const m = HM.decodeParams(t.interface({ foo: t.number }).decode)
        const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 'a' }))
        return assertFailure(m, c, errors => {
          assert.deepStrictEqual(failure(errors), ['Invalid value "a" supplied to : { foo: number }/foo: number'])
        })
      })
    })
  })

  describe('decodeQuery', () => {
    it('should validate a query (success case 1)', () => {
      const Query = t.interface({
        q: t.string
      })
      const m = HM.decodeQuery(Query.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, 'q=tobi+ferret'))
      return assertSuccess(m, c, { q: 'tobi ferret' }, [])
    })

    it('should validate a query (success case 2)', () => {
      const Query = t.interface({
        order: t.string,
        shoe: t.interface({
          color: t.string,
          type: t.string
        })
      })
      const m = HM.decodeQuery(Query.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, 'order=desc&shoe[color]=blue&shoe[type]=converse'))
      return assertSuccess(m, c, { order: 'desc', shoe: { color: 'blue', type: 'converse' } }, [])
    })

    it('should validate a query (failure case)', () => {
      const Query = t.interface({
        q: t.number
      })
      const m = HM.decodeQuery(Query.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, 'q=tobi+ferret'))
      return assertFailure(m, c, errors => {
        assert.deepStrictEqual(failure(errors), ['Invalid value "tobi ferret" supplied to : { q: number }/q: number'])
      })
    })
  })

  describe('decodeBody', () => {
    it('should validate the body (success case)', () => {
      const m = HM.decodeBody(t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, 1))
      return assertSuccess(m, c, 1, [])
    })

    it('should validate the body (failure case)', () => {
      const m = HM.decodeBody(t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, 'a'))
      return assertFailure(m, c, errors => {
        assert.deepStrictEqual(failure(errors), ['Invalid value "a" supplied to : number'])
      })
    })
  })

  describe('decodeHeader', () => {
    it('should validate a header (success case)', () => {
      const m = HM.decodeHeader('token', t.string.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, { token: 'mytoken' }))
      return assertSuccess(m, c, 'mytoken', [])
    })

    it('should validate a header (failure case)', () => {
      const m = HM.decodeHeader('token', t.string.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
      return assertFailure(m, c, errors => {
        assert.deepStrictEqual(failure(errors), ['Invalid value undefined supplied to : string'])
      })
    })
  })
})
