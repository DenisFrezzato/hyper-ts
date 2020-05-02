import * as express from 'express'
import * as H from '../src'
import { toRequestHandler } from '../src/express'
import { str, lit, end, Parser, Route } from 'fp-ts-routing'
import { right, left } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

const home = lit('home').then(end)

const user = lit('user')
  .then(str('user_id'))
  .then(end)

type Location = { type: 'Home' } | { type: 'User'; id: string }

const homeLocation: Location = { type: 'Home' }

const userLocation = (id: string): Location => ({ type: 'User', id })

const router: Parser<Location> = home.parser
  .map<Location>(() => homeLocation)
  .alt(user.parser.map(({ user_id }) => userLocation(user_id)))

function fromParser<E, A extends object>(parser: Parser<A>, error: E): H.Middleware<H.StatusOpen, H.StatusOpen, E, A> {
  return H.fromConnection(c =>
    parser
      .run(Route.parse(c.getOriginalUrl()))
      .map(([a]) => right<E, A>(a))
      .getOrElse(left(error))
  )
}

const routingMiddleware = fromParser(router, 'not found')

const notFound = (message: string) =>
  pipe(
    H.status(H.Status.NotFound),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(message))
  )

export const GET: H.Middleware<H.StatusOpen, H.StatusOpen, string, 'GET'> = H.decodeMethod(s =>
  s.toLowerCase() === 'get' ? right('GET') : left('Unknown verb')
)

const appMiddleware = pipe(
  routingMiddleware,
  H.ichain(route => {
    switch (route.type) {
      case 'Home':
        return pipe(
          GET,
          H.ichain(() => H.status(H.Status.OK)),
          H.ichain(() => H.closeHeaders()),
          H.ichain(() => H.send('Welcome!'))
        )
      case 'User':
        return pipe(
          GET,
          H.ichain(() => H.status(H.Status.OK)),
          H.ichain(() => H.closeHeaders()),
          H.ichain(() => H.send(`Welcome ${route.id} user!`))
        )
    }
  }),
  H.orElse(notFound)
)

const app = express()

app.use(toRequestHandler(appMiddleware))

// tslint:disable-next-line: no-console
app.listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
