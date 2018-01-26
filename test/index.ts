import * as assert from 'assert'
import {
  param,
  status,
  send,
  json,
  headers,
  contentType,
  redirect,
  cookie,
  clearCookie,
  query,
  params,
  body,
  header
} from '../src/MiddlewareTask'
import { right, left } from 'fp-ts/lib/Either'
import { Conn, StatusOpen, HeadersOpen, BodyOpen, MediaType, Status, CookieOptions } from '../src/index'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import * as querystring from 'qs'

type MockedHeaders = { [key: string]: string }
type MockedCookies = { [key: string]: [string | undefined, CookieOptions] }

class MockConn<S> implements Conn<S> {
  public readonly '-S': S

  constructor(readonly req: MockRequest, readonly res: MockResponse) {}

  public clearCookie(name: string, options: CookieOptions) {
    return this.res.clearCookie(name, options)
  }

  public endResponse() {
    return this.res.responseEnded
  }

  public getBody() {
    return this.req.getBody()
  }

  public getHeader(name: string) {
    return this.req.getHeader(name)
  }

  public getParams() {
    return this.req.getParams()
  }

  public getQuery() {
    return this.req.getQuery()
  }

  public setBody(body: any) {
    this.res.setBody(body)
  }

  public setCookie(name: string, value: string, options: CookieOptions) {
    this.res.setCookie(name, value, options)
  }

  public setHeader(name: string, value: string) {
    this.res.setHeader(name, value)
  }

  public setStatus(status: Status) {
    this.res.setStatus(status)
  }
}

class MockRequest {
  public body: any
  public headers: MockedHeaders
  public params: any
  public query: any

  constructor(params?: any, query?: string, body?: any, headers?: MockedHeaders) {
    this.params = params
    this.query = querystring.parse(query || '')
    this.body = body
    this.headers = headers || {}
  }

  public getBody() {
    return this.body
  }

  public getHeader(name: string) {
    return this.headers[name]
  }

  public getParams() {
    return this.params
  }

  public getQuery() {
    return this.query
  }
}

class MockResponse {
  public body: any
  public cookies: MockedCookies = {}
  public headers: MockedHeaders = {}
  public responseEnded: boolean = false
  public status: Status | undefined

  public clearCookie(name: string, options: CookieOptions) {
    delete this.cookies[name]
  }

  public endResponse() {
    this.responseEnded = true
  }

  public setBody(body: any) {
    this.body = body
  }

  public setCookie(name: string, value: string, options: CookieOptions) {
    this.cookies[name] = [value, options]
  }

  public setHeader(name: string, value: string) {
    this.headers[name] = value
  }

  public setStatus(status: Status) {
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
  assert.deepEqual(res.headers, headers)
  assert.strictEqual(res.body, body)
  assert.deepEqual(res.cookies, cookies)
}

describe('MiddlewareTask', () => {
  describe('status', () => {
    it('should write the status code', () => {
      const middleware = status(200)
      const res = new MockResponse()
      const conn = new MockConn<StatusOpen>(new MockRequest(), res)
      return middleware
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, 200, {}, undefined, {})
        })
    })
  })

  describe('headers', () => {
    it('should write the headers', () => {
      const middleware = headers({ name: 'value' })
      const res = new MockResponse()
      const conn = new MockConn<HeadersOpen>(new MockRequest(), res)
      return middleware
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, undefined, { name: 'value' }, undefined, {})
        })
    })
  })

  describe('send', () => {
    it('should send the content', () => {
      const middleware = send('<h1>Hello world!</h1>')
      const res = new MockResponse()
      const conn = new MockConn<BodyOpen>(new MockRequest(), res)
      return middleware
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
      const middleware = cookie('name', 'value', {})
      const res = new MockResponse()
      const conn = new MockConn<HeadersOpen>(new MockRequest(), res)
      return middleware
        .eval(conn)
        .run()
        .then(() => {
          assertResponse(res, undefined, {}, undefined, { name: ['value', {}] })
        })
    })
  })

  describe('clearCookie', () => {
    it('should clear the cookie', () => {
      const middleware = cookie('name', 'value', {}).ichain(() => clearCookie('name', {}))
      const res = new MockResponse()
      const conn = new MockConn<HeadersOpen>(new MockRequest(), res)
      return middleware
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
      return param('foo', t.number)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e, right(1))
        })
    })

    it('should validate a param (failure case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({ foo: 'a' }), new MockResponse())
      return param('foo', t.number)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e.mapLeft(failure), left(['Invalid value "a" supplied to : number']))
        })
    })
  })

  describe('params', () => {
    it('should validate all params (success case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({ foo: 1 }), new MockResponse())
      return params(t.interface({ foo: t.number }))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e, right({ foo: 1 }))
        })
    })

    it('should validate all params (failure case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({ foo: 'a' }), new MockResponse())
      return params(t.interface({ foo: t.number }))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e.mapLeft(failure), left(['Invalid value "a" supplied to : { foo: number }/foo: number']))
        })
    })
  })

  describe('query', () => {
    it('should validate a query (success case 1)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({}, 'q=tobi+ferret'), new MockResponse())
      const Query = t.interface({
        q: t.string
      })
      return query(Query)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e, right({ q: 'tobi ferret' }))
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
      return query(Query)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e, right({ order: 'desc', shoe: { color: 'blue', type: 'converse' } }))
        })
    })

    it('should validate a query (failure case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({}, 'q=tobi+ferret'), new MockResponse())
      const Query = t.interface({
        q: t.number
      })
      return query(Query)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(
            e.mapLeft(failure),
            left(['Invalid value "tobi ferret" supplied to : { q: number }/q: number'])
          )
        })
    })
  })

  describe('body', () => {
    it('should validate the body (success case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({}, undefined, 1), new MockResponse())
      return body(t.number)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e, right(1))
        })
    })

    it('should validate the body (failure case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({}, undefined, 'a'), new MockResponse())
      return body(t.number)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e.mapLeft(failure), left(['Invalid value "a" supplied to : number']))
        })
    })
  })

  describe('header', () => {
    it('should validate a header (success case)', () => {
      const conn = new MockConn<StatusOpen>(
        new MockRequest({}, undefined, undefined, { token: 'mytoken' }),
        new MockResponse()
      )
      return header('token', t.string)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e, right('mytoken'))
        })
    })

    it('should validate a header (failure case)', () => {
      const conn = new MockConn<StatusOpen>(new MockRequest({}, undefined, undefined, {}), new MockResponse())
      return header('token', t.string)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e.mapLeft(failure), left(['Invalid value undefined supplied to : string']))
        })
    })
  })
})
