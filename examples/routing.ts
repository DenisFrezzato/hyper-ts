import * as express from 'express'
import * as H from '../src'
import * as M from '../src/Middleware'
import { toRequestHandler } from '../src/express'
import { str, lit, end, Parser, Route } from 'fp-ts-routing'
import { right, left } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

const home = lit('home').then(end)

const user = lit('user').then(str('user_id')).then(end)

type Location = { type: 'Home' } | { type: 'User'; id: string }

const homeLocation: Location = { type: 'Home' }

const userLocation = (id: string): Location => ({ type: 'User', id })

const router: Parser<Location> = home.parser
  .map<Location>(() => homeLocation)
  .alt(user.parser.map(({ user_id }) => userLocation(user_id)))

function fromParser<E, A extends object>(parser: Parser<A>, error: E): M.Middleware<H.StatusOpen, H.StatusOpen, E, A> {
  return M.fromConnection((c) =>
    parser
      .run(Route.parse(c.getOriginalUrl()))
      .map(([a]) => right<E, A>(a))
      .getOrElse(left(error))
  )
}

const routingMiddleware = fromParser(router, 'not found')

const notFound = (message: string) =>
  pipe(
    M.status(H.Status.NotFound),
    M.ichain(() => M.closeHeaders()),
    M.ichain(() => M.send(message))
  )

export const GET: M.Middleware<H.StatusOpen, H.StatusOpen, string, 'GET'> = M.decodeMethod((s) =>
  s.toLowerCase() === 'get' ? right('GET') : left('Unknown verb')
)

const appMiddleware = pipe(
  routingMiddleware,
  M.ichain((route) => {
    switch (route.type) {
      case 'Home':
        return pipe(
          GET,
          M.ichain(() => M.status(H.Status.OK)),
          M.ichain(() => M.closeHeaders()),
          M.ichain(() => M.send('Welcome!'))
        )
      case 'User':
        return pipe(
          GET,
          M.ichain(() => M.status(H.Status.OK)),
          M.ichain(() => M.closeHeaders()),
          M.ichain(() => M.send(`Welcome ${route.id} user!`))
        )
    }
  }),
  M.orElse(notFound)
)

const app = express()

app.use(toRequestHandler(appMiddleware))

// tslint:disable-next-line: no-console
app.listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
