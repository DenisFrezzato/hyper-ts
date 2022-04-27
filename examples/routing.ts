import * as express from 'express'
import * as H from '../src'
import * as M from '../src/Middleware'
import { toRequestHandler } from '../src/express'
import { map, str, lit, end, Parser, Route, getParserMonoid } from 'fp-ts-routing'
import { right, left } from 'fp-ts/Either'
import { concatAll } from 'fp-ts/Monoid'
import { match } from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'

const home = lit('home').then(end)

const user = lit('user').then(str('user_id')).then(end)

const router = pipe(
  [
    pipe(
      home.parser,
      map(() => homeRoute)
    ),
    pipe(
      user.parser,
      map(({ user_id }) => userRoute(user_id))
    ),
  ],
  concatAll(getParserMonoid())
)

function fromParser<E, A extends object>(parser: Parser<A>, error: E): M.Middleware<H.StatusOpen, H.StatusOpen, E, A> {
  return M.fromConnection((c) =>
    pipe(
      Route.parse(c.getOriginalUrl()),
      parser.run,
      match(
        () => left(error),
        ([a]) => right(a)
      )
    )
  )
}

const routingMiddleware = pipe(fromParser(router, 'not found'), M.iflattenW)

const notFound = (message: string) =>
  pipe(
    M.status(H.Status.NotFound),
    M.ichain(() => M.closeHeaders()),
    M.ichain(() => M.send(message))
  )

export const GET: M.Middleware<H.StatusOpen, H.StatusOpen, string, 'GET'> = M.decodeMethod((s) =>
  s.toLowerCase() === 'get' ? right('GET') : left('Unknown verb')
)

const homeRoute = pipe(
  GET,
  M.ichain(() => M.status(H.Status.OK)),
  M.ichain(() => M.closeHeaders()),
  M.ichain(() => M.send('Welcome!'))
)

const userRoute = (user: String) =>
  pipe(
    GET,
    M.ichain(() => M.status(H.Status.OK)),
    M.ichain(() => M.closeHeaders()),
    M.ichain(() => M.send(`Welcome ${user} user!`))
  )

const appMiddleware = pipe(routingMiddleware, M.orElse(notFound))

const app = express()

app.use(toRequestHandler(appMiddleware))

// tslint:disable-next-line: no-console
app.listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
