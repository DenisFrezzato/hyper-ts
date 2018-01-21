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
import * as express from 'express'
import { Conn, StatusOpen, HeadersOpen, BodyOpen, MediaType } from '../src/index'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import * as querystring from 'qs'

function mockRequest(
  params: any,
  query: string = '',
  body: any = undefined,
  headers: { [key: string]: string } = {}
): express.Request {
  const parsedQuery = querystring.parse(query)
  return {
    params,
    query: parsedQuery,
    body,
    get: (name: string) => headers[name]
  } as any
}

type MokedHeaders = { [key: string]: string }
type MokedCookies = { [key: string]: [string, express.CookieOptions] }

interface MockedResponse extends express.Response {
  getStatus(): number
  getContent(): string
  getCookies(): MokedCookies
}

function mockResponse(): MockedResponse {
  let status: number
  let headers: MokedHeaders = {}
  let content: string
  let cookies: MokedCookies = {}
  return {
    status(s: number) {
      status = s
    },
    getStatus() {
      return status
    },
    header(field: string, value: string) {
      headers[field] = value
    },
    getHeaders() {
      return headers
    },
    send(o: string) {
      content = o
    },
    getContent() {
      return content
    },
    cookie(name: string, value: string, options: express.CookieOptions) {
      cookies[name] = [value, options]
    },
    clearCookie(name: string, options: express.CookieOptions) {
      delete cookies[name]
    },
    getCookies() {
      return cookies
    }
  } as any
}

function assertResponse(
  res: MockedResponse,
  status: number | undefined,
  headers: MokedHeaders,
  content: string | undefined,
  cookies: MokedCookies
) {
  assert.strictEqual(res.getStatus(), status)
  assert.deepEqual(res.getHeaders(), headers)
  assert.strictEqual(res.getContent(), content)
  assert.deepEqual(res.getCookies(), cookies)
}

describe('MiddlewareTask', () => {
  describe('status', () => {
    it('should write the status code', () => {
      const middleware = status(200)
      const res = mockResponse()
      const conn = new Conn<StatusOpen>(mockRequest({}), res)
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
      const res = mockResponse()
      const conn = new Conn<HeadersOpen>(mockRequest({}), res)
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
      const res = mockResponse()
      const conn = new Conn<BodyOpen>(mockRequest({}), res)
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
      const res = mockResponse()
      const conn = new Conn<HeadersOpen>(mockRequest({}), res)
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
      const res = mockResponse()
      const conn = new Conn<HeadersOpen>(mockRequest({}), res)
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
      const res = mockResponse()
      const conn = new Conn<HeadersOpen>(mockRequest({}), res)
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
      const res = mockResponse()
      const conn = new Conn<HeadersOpen>(mockRequest({}), res)
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
      const res = mockResponse()
      const conn = new Conn<StatusOpen>(mockRequest({}), res)
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
      const conn = new Conn<StatusOpen>(mockRequest({ foo: 1 }), mockResponse())
      return param('foo', t.number)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e, right(1))
        })
    })

    it('should validate a param (failure case)', () => {
      const conn = new Conn<StatusOpen>(mockRequest({ foo: 'a' }), mockResponse())
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
      const conn = new Conn<StatusOpen>(mockRequest({ foo: 1 }), mockResponse())
      return params(t.interface({ foo: t.number }))
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e, right({ foo: 1 }))
        })
    })

    it('should validate all params (failure case)', () => {
      const conn = new Conn<StatusOpen>(mockRequest({ foo: 'a' }), mockResponse())
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
      const conn = new Conn<StatusOpen>(mockRequest({}, 'q=tobi+ferret'), mockResponse())
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
      const conn = new Conn<StatusOpen>(
        mockRequest({}, 'order=desc&shoe[color]=blue&shoe[type]=converse'),
        mockResponse()
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
      const conn = new Conn<StatusOpen>(mockRequest({}, 'q=tobi+ferret'), mockResponse())
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
      const conn = new Conn<StatusOpen>(mockRequest({}, undefined, 1), mockResponse())
      return body(t.number)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e, right(1))
        })
    })

    it('should validate the body (failure case)', () => {
      const conn = new Conn<StatusOpen>(mockRequest({}, undefined, 'a'), mockResponse())
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
      const conn = new Conn<StatusOpen>(mockRequest({}, undefined, undefined, { token: 'mytoken' }), mockResponse())
      return header('token', t.string)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e, right('mytoken'))
        })
    })

    it('should validate a header (failure case)', () => {
      const conn = new Conn<StatusOpen>(mockRequest({}, undefined, undefined, {}), mockResponse())
      return header('token', t.string)
        .eval(conn)
        .run()
        .then(e => {
          assert.deepEqual(e.mapLeft(failure), left(['Invalid value undefined supplied to : string']))
        })
    })
  })
})
