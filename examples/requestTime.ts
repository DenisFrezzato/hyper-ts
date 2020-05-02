import * as express from 'express'
import { fromRequestHandler, toRequestHandler } from '../src/express'
import * as H from '../src'
import { Either, right, left } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

// "Middleware function requestTime" example on http://expressjs.com/en/guide/writing-middleware.html

const app = express()

const requestTime: express.RequestHandler = function(req: any, _, next) {
  req.requestTime = Date.now()
  next()
}

const decodeNumber = (u: unknown): Either<string, number> => (typeof u === 'number' ? right(u) : left('Invalid number'))

const parseRequestTime = pipe(
  fromRequestHandler<H.StatusOpen, string, number>(requestTime, (req: any) => req.requestTime),
  H.chain(u => H.fromEither(decodeNumber(u)))
)

const sendRequestTime = (requestTime: number): H.Middleware<H.StatusOpen, H.ResponseEnded, string, void> =>
  pipe(
    H.status(H.Status.OK),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(`Current time: ${requestTime}`))
  )

const badRequest = (message: string) =>
  pipe(
    H.status(H.Status.BadRequest),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(message))
  )

app.get('/', toRequestHandler(pipe(parseRequestTime, H.ichain(sendRequestTime), H.orElse(badRequest))))

app.listen(3000)
