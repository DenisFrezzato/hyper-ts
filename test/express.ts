import * as H from '../src'
import * as M from '../src/Middleware'
import { toRequestHandler } from '../src/express'
import { pipe } from 'fp-ts/function'
import { Readable } from 'stream'
import * as express from 'express'
import * as supertest from 'supertest'

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
