import * as express from 'express'
import { fromRequestHandler, toRequestHandler } from '../src/express'
import * as H from '../src'
import * as M from '../src/Middleware'
import { Either, right, left } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

// "Middleware function requestTime" example on https://expressjs.com/en/5x/guide/writing-middleware/#middleware-function-requesttime

const app = express()

const requestTime: express.RequestHandler = function (req: any, _, next) {
  req.requestTime = Date.now()
  next()
}

const decodeNumber = (u: unknown): Either<string, number> => (typeof u === 'number' ? right(u) : left('Invalid number'))

const parseRequestTime = pipe(
  fromRequestHandler<H.StatusOpen, string, number>(
    requestTime,
    (req: any) => right(req.requestTime),
    (err) => String(err)
  ),
  M.flatMap((u) => M.fromEither(decodeNumber(u)))
)

const sendRequestTime = (requestTime: number): M.Middleware<H.StatusOpen, H.ResponseEnded, string, void> =>
  pipe(
    M.status(H.Status.OK),
    M.iflatMap(() => M.closeHeaders()),
    M.iflatMap(() => M.send(`Current time: ${requestTime}`))
  )

const badRequest = (message: string) =>
  pipe(
    M.status(H.Status.BadRequest),
    M.iflatMap(() => M.closeHeaders()),
    M.iflatMap(() => M.send(message))
  )

app.get('/', toRequestHandler(pipe(parseRequestTime, M.iflatMap(sendRequestTime), M.orElse(badRequest))))

app.listen(3000)
