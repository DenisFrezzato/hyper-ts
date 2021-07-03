import * as H from '../src'
import * as M from '../src/Middleware'
import { fromRequestHandler, toRequestHandler } from '../src/express'
import { flow, pipe } from 'fp-ts/function'
import { Readable } from 'stream'
import * as express from 'express'
import * as supertest from 'supertest'
import * as t from 'io-ts'
import * as E from 'fp-ts/Either'

describe('express', () => {
  it('should call `next` with an error', () => {
    const server = express()
    const m = pipe(
      M.left<H.StatusOpen, string, void>('error'),
      M.ichain(() => M.status(H.Status.OK)),
      M.ichain(() => M.closeHeaders()),
      M.ichain(() => M.end())
    )
    server.use(toRequestHandler(m))

    return supertest(server).get('/').expect(500)
  })

  describe('fromRequestHandler', () => {
    it('should work with the unsafe version', () => {
      const json = express.json()
      const jsonMiddleware = fromRequestHandler(json, () => undefined)

      const Body = t.type({ name: t.string })
      const bodyDecoder = pipe(
        jsonMiddleware,
        M.ichain(() =>
          M.decodeBody(
            flow(
              Body.decode,
              E.mapLeft(() => 'invalid body')
            )
          )
        )
      )

      const helloHandler = pipe(
        bodyDecoder,
        M.ichain(({ name }) =>
          pipe(
            M.status<string>(H.Status.OK),
            M.ichain(() => M.closeHeaders()),
            M.ichain(() => M.send(`Hello ${name}!`))
          )
        )
      )

      const app = express()
      app.post('/', toRequestHandler(helloHandler))

      return supertest(app).post('/').send({ name: 'Ninkasi' }).expect(200, 'Hello Ninkasi!')
    })

    it('should work with the safe version', async () => {
      const json = express.json()
      const jsonMiddleware = fromRequestHandler(
        json,
        () => E.right(undefined),
        () => 'oops'
      )

      const Body = t.type({ name: t.string })
      const bodyDecoder = pipe(
        jsonMiddleware,
        M.ichain(() =>
          M.decodeBody(
            flow(
              Body.decode,
              E.mapLeft(() => 'invalid body')
            )
          )
        )
      )

      const helloHandler = pipe(
        bodyDecoder,
        M.ichain(({ name }) =>
          pipe(
            M.status<string>(H.Status.OK),
            M.ichain(() => M.closeHeaders()),
            M.ichain(() => M.send(`Hello ${name}!`))
          )
        ),
        M.orElse((err) =>
          pipe(
            M.status(H.Status.BadRequest),
            M.ichain(() => M.closeHeaders()),
            M.ichain(() => M.send(err))
          )
        )
      )

      const app = express()
      app.post('/', toRequestHandler(helloHandler))

      await supertest(app).post('/').send({ name: 'Ninkasi' }).expect(200, 'Hello Ninkasi!')
      await supertest(app).post('/').send({}).expect(400, 'invalid body')
    })
  })

  describe('pipeStream', () => {
    it('should pipe a stream', () => {
      const server = express()
      const someStream = (): Readable => {
        const stream = new Readable()
        setTimeout(() => {
          stream.push('a')
          stream.push(null)
        })
        return stream
      }

      const stream = someStream()
      const m = pipe(
        M.status(H.Status.OK),
        M.ichain(() => M.closeHeaders()),
        M.ichain(() => M.pipeStream(stream))
      )
      server.use(toRequestHandler(m))

      return supertest(server).get('/').expect(200, 'a')
    })
  })
})
