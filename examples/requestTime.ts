import * as express from 'express'
import { fromRequestHandler, toRequestHandler } from '../src/express'
import { StatusOpen, fromEither, Status, status } from '../src'
import { Either, right, left } from 'fp-ts/lib/Either'

// "Middleware function requestTime" example on http://expressjs.com/en/guide/writing-middleware.html

const app = express()

const requestTime: express.RequestHandler = function(req: any, _, next) {
  req.requestTime = Date.now()
  next()
}

const decodeNumber = (u: unknown): Either<string, number> => (typeof u === 'number' ? right(u) : left('Invalid number'))

const parseRequestTime = fromRequestHandler<StatusOpen, unknown>(requestTime, (req: any) => req.requestTime).chain(u =>
  fromEither(decodeNumber(u))
)

const sendRequestTime = (requestTime: number) =>
  status(Status.OK)
    .closeHeaders()
    .send(`Current time: ${requestTime}`)

const badRequest = (message: string) =>
  status(Status.BadRequest)
    .closeHeaders()
    .send(message)

app.get('/', toRequestHandler(parseRequestTime.ichain(sendRequestTime).orElse(badRequest)))

app.listen(3000)
