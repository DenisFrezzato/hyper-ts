import * as assert from 'assert'
import { right } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import * as querystring from 'qs'
import {
  decodeBody,
  BodyOpen,
  clearCookie,
  Connection,
  contentType,
  cookie,
  CookieOptions,
  decodeHeader,
  header,
  HeadersOpen,
  json,
  MediaType,
  Middleware,
  decodeParam,
  decodeParams,
  decodeQuery,
  redirect,
  send,
  Status,
  status,
  StatusOpen
} from '../src'

type MockedHeaders = { [key: string]: string }

class MockConnection<S> implements Connection<S> {
  readonly _S!: S
  constructor(readonly req: MockRequest, readonly logger: Array<string> = []) {}
  getBody() {
    return this.req.getBody()
  }
  getHeader(name: string) {
    return this.req.getHeader(name)
  }
  getParams() {
    return this.req.getParams()
  }
  getQuery() {
    return this.req.getQuery()
  }
  getOriginalUrl() {
    return this.req.getOriginalUrl()
  }
  getMethod() {
    return this.req.getMethod()
  }
  setCookie<T>(name: string, value: string, options: CookieOptions) {
    return new MockConnection<T>(this.req, [
      ...this.logger,
      `setCookie(${name}, ${value}, ${JSON.stringify(options)}})`
    ])
  }
  clearCookie<T>(name: string, options: CookieOptions) {
    return new MockConnection<T>(this.req, [...this.logger, `clearCookie(${name}, ${JSON.stringify(options)})`])
  }
  setHeader<T>(name: string, value: string) {
    return new MockConnection<T>(this.req, [...this.logger, `setHeader(${name}, ${value})`])
  }
  setStatus<T>(status: Status) {
    return new MockConnection<T>(this.req, [...this.logger, `setStatus(${status})`])
  }
  setBody<T>(body: unknown) {
    return new MockConnection<T>(this.req, [...this.logger, `setBody(${body})`])
  }
  endResponse<T>() {
    return new MockConnection<T>(this.req, [...this.logger, `endResponse()`])
  }
}

class MockRequest {
  constructor(
    readonly params?: any,
    readonly query: string = '',
    readonly body?: any,
    readonly headers: MockedHeaders = {},
    readonly originalUrl: string = '',
    readonly method: string = 'GET'
  ) {
    this.query = querystring.parse(query)
  }
  getBody() {
    return this.body
  }
  getHeader(name: string) {
    return this.headers[name]
  }
  getParams() {
    return this.params
  }
  getQuery() {
    return this.query
  }
  getOriginalUrl() {
    return this.originalUrl
  }
  getMethod() {
    return this.method
  }
}

function assertSuccess<I, A>(m: Middleware<I, any, any, A>, conn: MockConnection<I>, a: A, logger: Array<string>) {
  return m
    .run(conn)
    .run()
    .then(e => {
      assert.deepStrictEqual(e.map(([a, conn]) => [a, (conn as any).logger]), right([a, logger]))
    })
}

function assertFailure<I, L>(m: Middleware<I, any, L, any>, conn: MockConnection<I>, f: (l: L) => void) {
  return m
    .run(conn)
    .run()
    .then(e => {
      f(e.value as any)
    })
}

describe('Middleware', () => {
  describe('status', () => {
    it('should write the status code', () => {
      const m = status(200)
      const c = new MockConnection<StatusOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, ['setStatus(200)'])
    })
  })

  describe('header', () => {
    it('should write the headers', () => {
      const m = header('name', 'value')
      const c = new MockConnection<HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, ['setHeader(name, value)'])
    })
  })

  describe('send', () => {
    it('should send the content', () => {
      const m = send('<h1>Hello world!</h1>')
      const c = new MockConnection<BodyOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, ['setBody(<h1>Hello world!</h1>)'])
    })
  })

  describe('json', () => {
    it('should add the proper header and send the content', () => {
      const m = json('{}')
      const c = new MockConnection<HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, ['setHeader(Content-Type, application/json)', 'setBody({})'])
    })
  })

  describe('cookie', () => {
    it('should add the cookie', () => {
      const m = cookie('name', 'value', {})
      const c = new MockConnection<HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, ['setCookie(name, value, {}})'])
    })
  })

  describe('clearCookie', () => {
    it('should clear the cookie', () => {
      const m = cookie('name', 'value', {}).ichain(() => clearCookie('name', {}))
      const c = new MockConnection<HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, ['setCookie(name, value, {}})', 'clearCookie(name, {})'])
    })
  })

  describe('contentType', () => {
    it('should add the `Content-Type` header', () => {
      const m = contentType(MediaType.applicationXML)
      const c = new MockConnection<HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, ['setHeader(Content-Type, application/xml)'])
    })
  })

  describe('redirect', () => {
    it('should add the correct status / header', () => {
      const m = redirect('/users')
      const c = new MockConnection<StatusOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, ['setStatus(302)', 'setHeader(Location, /users)'])
    })
  })

  describe('decodeParam', () => {
    it('should validate a param (success case)', () => {
      const m = decodeParam('foo', t.number.decode)
      const c = new MockConnection<StatusOpen>(new MockRequest({ foo: 1 }))
      return assertSuccess(m, c, 1, [])
    })

    it('should validate a param (failure case)', () => {
      const m = decodeParam('foo', t.number.decode)
      const c = new MockConnection<StatusOpen>(new MockRequest({ foo: 'a' }))
      return assertFailure(m, c, errors => {
        assert.deepStrictEqual(failure(errors), ['Invalid value "a" supplied to : number'])
      })
    })

    describe('decodeParams', () => {
      it('should validate all params (success case)', () => {
        const m = decodeParams(t.interface({ foo: t.number }).decode)
        const c = new MockConnection<StatusOpen>(new MockRequest({ foo: 1 }))
        return assertSuccess(m, c, { foo: 1 }, [])
      })

      it('should validate all params (failure case)', () => {
        const m = decodeParams(t.interface({ foo: t.number }).decode)
        const c = new MockConnection<StatusOpen>(new MockRequest({ foo: 'a' }))
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
      const m = decodeQuery(Query.decode)
      const c = new MockConnection<StatusOpen>(new MockRequest({}, 'q=tobi+ferret'))
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
      const m = decodeQuery(Query.decode)
      const c = new MockConnection<StatusOpen>(new MockRequest({}, 'order=desc&shoe[color]=blue&shoe[type]=converse'))
      return assertSuccess(m, c, { order: 'desc', shoe: { color: 'blue', type: 'converse' } }, [])
    })

    it('should validate a query (failure case)', () => {
      const Query = t.interface({
        q: t.number
      })
      const m = decodeQuery(Query.decode)
      const c = new MockConnection<StatusOpen>(new MockRequest({}, 'q=tobi+ferret'))
      return assertFailure(m, c, errors => {
        assert.deepStrictEqual(failure(errors), ['Invalid value "tobi ferret" supplied to : { q: number }/q: number'])
      })
    })
  })

  describe('decodeBody', () => {
    it('should validate the body (success case)', () => {
      const m = decodeBody(t.number.decode)
      const c = new MockConnection<StatusOpen>(new MockRequest({}, undefined, 1))
      return assertSuccess(m, c, 1, [])
    })

    it('should validate the body (failure case)', () => {
      const m = decodeBody(t.number.decode)
      const c = new MockConnection<StatusOpen>(new MockRequest({}, undefined, 'a'))
      return assertFailure(m, c, errors => {
        assert.deepStrictEqual(failure(errors), ['Invalid value "a" supplied to : number'])
      })
    })
  })

  describe('decodeHeader', () => {
    it('should validate a header (success case)', () => {
      const m = decodeHeader('token', t.string.decode)
      const c = new MockConnection<StatusOpen>(new MockRequest({}, undefined, undefined, { token: 'mytoken' }))
      return assertSuccess(m, c, 'mytoken', [])
    })

    it('should validate a header (failure case)', () => {
      const m = decodeHeader('token', t.string.decode)
      const c = new MockConnection<StatusOpen>(new MockRequest({}, undefined, undefined, {}))
      return assertFailure(m, c, errors => {
        assert.deepStrictEqual(failure(errors), ['Invalid value undefined supplied to : string'])
      })
    })
  })
})
