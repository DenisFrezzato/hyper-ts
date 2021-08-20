import * as assert from 'assert'
import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import * as H from '../src'
import { Action } from '../src/express'
import { pipe } from 'fp-ts/function'
import { MockConnection, MockRequest } from './_helpers'
import { Readable } from 'stream'
import * as _ from '../src/Middleware'
import * as L from 'fp-ts-contrib/List'

function assertSuccess<I, O, A>(m: _.Middleware<I, O, any, A>, cin: MockConnection<I>, a: A, actions: Array<Action>) {
  return m(cin)().then((e) => {
    assert.deepStrictEqual(
      pipe(
        e,
        E.map(([a, cout]) => [a, L.toReversedArray((cout as MockConnection<O>).actions)])
      ),
      E.right([a, actions])
    )
  })
}

function assertFailure<I, L>(m: _.Middleware<I, any, L, any>, conn: MockConnection<I>, f: (l: L) => void) {
  return m(conn)().then((e) => {
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
    const m = pipe(fab, _.ap(fa))
    const c = new MockConnection<H.HeadersOpen>(new MockRequest())
    return assertSuccess(m, c, 3, [
      { type: 'setHeader', name: 'a', value: 'a' },
      { type: 'setHeader', name: 'b', value: 'b' },
    ])
  })

  it('apFirst', async () => {
    const fa = _.right(4)
    const fb = _.right(true)
    const m = pipe(fa, _.apFirst(fb))
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, c, 4, [])
  })

  it('apFirstW', async () => {
    const fa = _.right<H.StatusOpen, 'Foo', number>(4)
    const fb = _.right<H.StatusOpen, 'Bar', boolean>(true)
    const m = pipe(fa, _.apFirstW(fb))
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, c, 4, [])
  })

  it('apSecond', async () => {
    const fa = _.right(4)
    const fb = _.right(true)
    const m = pipe(fa, _.apSecond(fb))
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, c, true, [])
  })

  it('apSecondW', async () => {
    const fa = _.right<H.StatusOpen, 'Foo', number>(4)
    const fb = _.right<H.StatusOpen, 'Bar', boolean>(true)
    const m = pipe(fa, _.apSecondW(fb))
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, c, true, [])
  })

  describe('status', () => {
    it('should write the status code', () => {
      const m = _.status(200)
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [{ type: 'setStatus', status: 200 }])
    })
  })

  describe('header', () => {
    it('should write the headers', () => {
      const m = _.header('name', 'value')
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [{ type: 'setHeader', name: 'name', value: 'value' }])
    })
  })

  describe('send', () => {
    it('should send the content', () => {
      const m = _.send('<h1>Hello world!</h1>')
      const c = new MockConnection<H.BodyOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [{ type: 'setBody', body: '<h1>Hello world!</h1>' }])
    })
  })

  describe('json', () => {
    it('should add the proper header and send the content', () => {
      const m = _.json({ a: 1 }, E.toError)
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [
        { type: 'setHeader', name: 'Content-Type', value: 'application/json' },
        { type: 'setBody', body: `{"a":1}` },
      ])
    })
  })

  describe('cookie', () => {
    it('should add the cookie', () => {
      const m = _.cookie('name', 'value', {})
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [{ type: 'setCookie', name: 'name', value: 'value', options: {} }])
    })
  })

  describe('clearCookie', () => {
    it('should clear the cookie', () => {
      const m = pipe(
        _.cookie('name', 'value', {}),
        _.ichain(() => _.clearCookie('name', {}))
      )
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [
        { type: 'setCookie', name: 'name', value: 'value', options: {} },
        { type: 'clearCookie', name: 'name', options: {} },
      ])
    })
  })

  describe('contentType', () => {
    it('should add the `Content-Type` header', () => {
      const m = _.contentType(H.MediaType.applicationXML)
      const c = new MockConnection<H.HeadersOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [{ type: 'setHeader', name: 'Content-Type', value: 'application/xml' }])
    })
  })

  describe('redirect', () => {
    it('should add the correct status / header', () => {
      const m = _.redirect('/users')
      const c = new MockConnection<H.StatusOpen>(new MockRequest())
      return assertSuccess(m, c, undefined, [
        { type: 'setStatus', status: 302 },
        { type: 'setHeader', name: 'Location', value: '/users' },
      ])
    })
  })

  describe('pipeStream', () => {
    it('should pipe a stream', () => {
      const someStream = (): Readable => {
        const stream = new Readable()
        setTimeout(() => {
          stream.push('a')
          stream.push(null)
        }, 1)
        return stream
      }
      const stream = someStream()
      const c = new MockConnection<H.BodyOpen>(new MockRequest())
      const m = _.pipeStream(stream)

      return assertSuccess(m, c, undefined, [{ type: 'pipeStream', stream }])
    })

    it('should pipe a stream and handle the failure', () => {
      const someStream = (): Readable => {
        const stream = new Readable()
        setTimeout(() => {
          throw new Error('Boom')
        }, 1)
        return stream
      }
      const stream = someStream()
      const c = new MockConnection<H.BodyOpen>(new MockRequest())
      const m = _.pipeStream(stream)

      return assertSuccess(m, c, undefined, [{ type: 'pipeStream', stream }])
    })
  })

  describe('decodeParam', () => {
    it('should validate a param (success case)', () => {
      const m = _.decodeParam('foo', t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 1 }))
      return assertSuccess(m, c, 1, [])
    })

    it('should validate a param (failure case)', () => {
      const m = _.decodeParam('foo', t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 'a' }))
      return assertFailure(m, c, (errors) => {
        assert.deepStrictEqual(failure(errors), ['Invalid value "a" supplied to : number'])
      })
    })

    describe('decodeParams', () => {
      it('should validate all params (success case)', () => {
        const m = _.decodeParams(t.interface({ foo: t.number }).decode)
        const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 1 }))
        return assertSuccess(m, c, { foo: 1 }, [])
      })

      it('should validate all params (failure case)', () => {
        const m = _.decodeParams(t.interface({ foo: t.number }).decode)
        const c = new MockConnection<H.StatusOpen>(new MockRequest({ foo: 'a' }))
        return assertFailure(m, c, (errors) => {
          assert.deepStrictEqual(failure(errors), ['Invalid value "a" supplied to : { foo: number }/foo: number'])
        })
      })
    })
  })

  describe('decodeQuery', () => {
    it('should validate a query (success case 1)', () => {
      const Query = t.interface({
        q: t.string,
      })
      const m = _.decodeQuery(Query.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, 'q=tobi+ferret'))
      return assertSuccess(m, c, { q: 'tobi ferret' }, [])
    })

    it('should validate a query (success case 2)', () => {
      const Query = t.interface({
        order: t.string,
        shoe: t.interface({
          color: t.string,
          type: t.string,
        }),
      })
      const m = _.decodeQuery(Query.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, 'order=desc&shoe[color]=blue&shoe[type]=converse'))
      return assertSuccess(m, c, { order: 'desc', shoe: { color: 'blue', type: 'converse' } }, [])
    })

    it('should validate a query (failure case)', () => {
      const Query = t.interface({
        q: t.number,
      })
      const m = _.decodeQuery(Query.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, 'q=tobi+ferret'))
      return assertFailure(m, c, (errors) => {
        assert.deepStrictEqual(failure(errors), ['Invalid value "tobi ferret" supplied to : { q: number }/q: number'])
      })
    })
  })

  describe('decodeBody', () => {
    it('should validate the body (success case)', () => {
      const m = _.decodeBody(t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, 1))
      return assertSuccess(m, c, 1, [])
    })

    it('should validate the body (failure case)', () => {
      const m = _.decodeBody(t.number.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, 'a'))
      return assertFailure(m, c, (errors) => {
        assert.deepStrictEqual(failure(errors), ['Invalid value "a" supplied to : number'])
      })
    })
  })

  describe('decodeHeader', () => {
    it('should validate a header (success case)', () => {
      const m = _.decodeHeader('token', t.string.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, { token: 'mytoken' }))
      return assertSuccess(m, c, 'mytoken', [])
    })

    it('should validate a header (failure case)', () => {
      const m = _.decodeHeader('token', t.string.decode)
      const c = new MockConnection<H.StatusOpen>(new MockRequest({}, undefined, undefined, {}))
      return assertFailure(m, c, (errors) => {
        assert.deepStrictEqual(failure(errors), ['Invalid value undefined supplied to : string'])
      })
    })
  })

  it('do notation', () => {
    const m = pipe(
      _.right(1),
      _.bindTo('a'),
      _.bind('b', () => _.right('b'))
    )
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, c, { a: 1, b: 'b' }, [])
  })

  it('indexed do notation', () => {
    const m = pipe(
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
    const c = new MockConnection<H.StatusOpen>(new MockRequest())
    return assertSuccess(m, c, { a: 1, b: 'b' }, [
      { type: 'setStatus', status: 200 },
      { type: 'setHeader', name: 'x-header', value: 'nice header' },
    ])
  })
})
