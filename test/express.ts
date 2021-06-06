import * as H from '../src'
import { toRequestHandler } from '../src/express'
import { pipe } from 'fp-ts/lib/pipeable'
import { Readable } from 'stream'
import * as express from 'express'
import * as supertest from 'supertest'

describe('express', () => {
  it('should call `next` with an error', () => {
    const server = express()
    const m = pipe(
      H.left<H.StatusOpen, string, void>('error'),
      H.ichain(() => H.status(H.Status.OK)),
      H.ichain(() => H.closeHeaders()),
      H.ichain(() => H.end())
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
        H.status(H.Status.OK),
        H.ichain(() => H.closeHeaders()),
        H.ichain(() => H.pipeStream(stream))
      )
      server.use(toRequestHandler(m))

      return supertest(server).get('/').expect(200, 'a')
    })
  })
})
