import * as assert from 'assert'
import { left, right } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import * as querystring from 'qs'
import {
  body,
  BodyOpen,
  Conn,
  contentType,
  CookieOptions,
  header,
  HeadersOpen,
  json,
  MediaType,
  param,
  params,
  query,
  redirect,
  Status,
  StatusOpen,
  status,
  headers,
  send,
  cookie,
  clearCookie
} from '../src'

type MockedHeaders = { [key: string]: string }
type MockedCookies = { [key: string]: [string | undefined, CookieOptions] }

class MockConn<S> implements Conn<S> {
  readonly '_S': S
  constructor(readonly req: MockRequest, readonly res: MockResponse) {}
  clearCookie(name: string, options: CookieOptions) {
    return this.res.clearCookie(name, options)
  }
  endResponse() {
    return this.res.responseEnded
  }
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
  setBody(body: any) {
    this.res.setBody(body)
  }
  setCookie(name: string, value: string, options: CookieOptions) {
    this.res.setCookie(name, value, options)
  }
  setHeader(name: string, value: string) {
    this.res.setHeader(name, value)
  }
  setStatus(status: Status) {
    this.res.setStatus(status)
  }
  getOriginalUrl() {
    return this.req.getOriginalUrl()
  }
  getMethod() {
    return this.req.getMethod()
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

class MockResponse {
  body: any
  cookies: MockedCookies = {}
  headers: MockedHeaders = {}
  responseEnded: boolean = false
  status: Status | undefined
  clearCookie(name: string, _: CookieOptions) {
    delete this.cookies[name]
  }
  endResponse() {
    this.responseEnded = true
  }
  setBody(body: any) {
    this.body = body
  }
  setCookie(name: string, value: string, options: CookieOptions) {
    this.cookies[name] = [value, options]
  }
  setHeader(name: string, value: string) {
    this.headers[name] = value
  }
  setStatus(status: Status) {
    this.status = status
  }
}

function assertResponse(
  res: MockResponse,
  status: number | undefined,
  headers: MockedHeaders,
  body: string | undefined,
  cookies: MockedCookies
) {
  assert.strictEqual(res.status, status)
  assert.deepStrictEqual(res.headers, headers)
  assert.strictEqual(res.body, body)
  assert.deepStrictEqual(res.cookies, cookies)
}

describe('Middleware', () => {
  describe('status', () => {
    it('should write the status code', () => {
      const m = status(200)
      const res = new MockResponse()
      const conn = new MockConn<StatusOpen>(new MockRequest(), res)
      return m
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, 200, {}, undefined, {})
        })
    })
  })

  describe('headers', () => {
    it('should write the headers', () => {
      const m = headers({ name: 'value' })
      const res = new MockResponse()
      const conn = new MockConn<HeadersOpen>(new MockRequest(), res)
      return m
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, undefined, { name: 'value' }, undefined, {})
        })
    })
  })

  describe('send', () => {
    it('should send the content', () => {
      const m = send('<h1>Hello world!</h1>')
      const res = new MockResponse()
      const conn = new MockConn<BodyOpen>(new MockRequest(), res)
      return m
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, undefined, {}, '<h1>Hello world!</h1>', {})
        })
    })
  })

  describe('json', () => {
    it('should add the proper header and send the content', () => {
      const middleware = json('{}')
      const res = new MockResponse()
      const conn = new MockConn<HeadersOpen>(new MockRequest(), res)
      return middleware
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, undefined, { 'Content-Type': 'application/json' }, '{}', {})
        })
    })
  })

  describe('cookie', () => {
    it('should add the cookie', () => {
      const m = cookie('name', 'value', {})
      const res = new MockResponse()
      const conn = new MockConn<HeadersOpen>(new MockRequest(), res)
      return m
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, undefined, {}, undefined, { name: ['value', {}] })
        })
    })
  })

  describe('clearCookie', () => {
    it('should clear the cookie', () => {
      const m = cookie('name', 'value', {}).ichain(() => clearCookie('name', {}))
      const res = new MockResponse()
      const conn = new MockConn<HeadersOpen>(new MockRequest(), res)
      return m
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, undefined, {}, undefined, {})
        })
    })
  })

  describe('contentType', () => {
    it('should add the `Content-Type` header', () => {
      const middleware = contentType(MediaType.applicationXML)
      const res = new MockResponse()
      const conn = new MockConn<HeadersOpen>(new MockRequest(), res)
      return middleware
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, undefined, { 'Content-Type': 'application/xml' }, undefined, {})
        })
    })
  })

  describe('redirect', () => {
    it('should add the correct status / header', () => {
      const middleware = redirect('/users')
      const res = new MockResponse()
      const conn = new MockConn<StatusOpen>(new MockRequest(), res)
      return middleware
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, 302, { Location: '/users' }, undefined, {})
        })
    })
  })

  describe('param', () => {
    it('should validate a param (success case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({ foo: 1 }), new MockResponse())
      return param('foo', u => t.number.decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(e, right(1))
        })
    })

    it('should validate a param (failure case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({ foo: 'a' }), new MockResponse())
      return param('foo', u => t.number.decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(e.mapLeft(failure), left(['Invalid value "a" supplied to : number']))
        })
    })
  })

  describe('params', () => {
    it('should validate all params (success case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({ foo: 1 }), new MockResponse())
      return params(u => t.interface({ foo: t.number }).decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(e, right({ foo: 1 }))
        })
    })

    it('should validate all params (failure case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({ foo: 'a' }), new MockResponse())
      return params(u => t.interface({ foo: t.number }).decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(
            e.mapLeft(failure),
            left(['Invalid value "a" supplied to : { foo: number }/foo: number'])
          )
        })
    })
  })

  describe('query', () => {
    it('should validate a query (success case 1)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({}, 'q=tobi+ferret'), new MockResponse())
      const Query = t.interface({
        q: t.string
      })
      return query(u => Query.decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(e, right({ q: 'tobi ferret' }))
        })
    })

    it('should validate a query (success case 2)', () => {
      const conn = new MockConn<StatusOpen>(
        new MockRequest({}, 'order=desc&shoe[color]=blue&shoe[type]=converse'),
        new MockResponse()
      )
      const Query = t.interface({
        order: t.string,
        shoe: t.interface({
          color: t.string,
          type: t.string
        })
      })
      return query(u => Query.decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(e, right({ order: 'desc', shoe: { color: 'blue', type: 'converse' } }))
        })
    })

    it('should validate a query (failure case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({}, 'q=tobi+ferret'), new MockResponse())
      const Query = t.interface({
        q: t.number
      })
      return query(u => Query.decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(
            e.mapLeft(failure),
            left(['Invalid value "tobi ferret" supplied to : { q: number }/q: number'])
          )
        })
    })
  })

  describe('body', () => {
    it('should validate the body (success case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({}, undefined, 1), new MockResponse())
      return body(u => t.number.decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(e, right(1))
        })
    })

    it('should validate the body (failure case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({}, undefined, 'a'), new MockResponse())
      return body(u => t.number.decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(e.mapLeft(failure), left(['Invalid value "a" supplied to : number']))
        })
    })
  })

  describe('header', () => {
    it('should validate a header (success case)', () => {
      const conn = new MockConn<StatusOpen>(
        new MockRequest({}, undefined, undefined, { token: 'mytoken' }),
        new MockResponse()
      )
      return header('token', u => t.string.decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(e, right('mytoken'))
        })
    })

    it('should validate a header (failure case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({}, undefined, undefined, {}), new MockResponse())
      return header('token', u => t.string.decode(u))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepStrictEqual(e.mapLeft(failure), left(['Invalid value undefined supplied to : string']))
        })
    })
  })
})
