import * as express from 'express'
import { Middleware, Status, status, decodeBody, StatusOpen } from '../src'
import { fromMiddleware, toMiddleware } from '../src/express'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'

// Express middleware
const json = express.json()

function withJsonBody<L, A>(
  middleware: Middleware<StatusOpen, StatusOpen, string, A>
): Middleware<StatusOpen, StatusOpen, string, A> {
  return toMiddleware(json, err => `cannot mount json middleware: ${String(err)}`).ichain(() => middleware)
}

const Body = t.strict({
  name: t.string
})

const bodyDecoder = decodeBody(u => Body.decode(u).mapLeft(errors => `invalid body: ${failure(errors).join('\n')}`))

const badRequest = (message: string) =>
  status<never>(Status.BadRequest)
    .closeHeaders()
    .send(message)

const hello = withJsonBody(bodyDecoder)
  .ichain(({ name }) =>
    status<never>(Status.OK)
      .closeHeaders()
      .send(`Hello ${name}!`)
  )
  .orElse(badRequest)

const app = express()

app
  .post('/', fromMiddleware(hello))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: POST /'))

// curl --request POST --silent --header 'Content-Type: application/json' --data '{"name":"bob"}' "localhost:3000/"
// curl --request POST --silent --header 'Content-Type: application/json' --data '{}' "localhost:3000/"
