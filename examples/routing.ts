import * as express from 'express'
import { Status, status, Middleware, StatusOpen, fromConnection, decodeMethod } from '../src'
import { toRequestHandler } from '../src/express'
import { str, lit, end, Parser, Route } from 'fp-ts-routing'
import { right, left } from 'fp-ts/lib/Either'

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

function fromParser<L, A extends object>(parser: Parser<A>, error: L): Middleware<StatusOpen, StatusOpen, L, A> {
  const e = left<L, A>(error)
  return fromConnection(c =>
    parser
      .run(Route.parse(c.getOriginalUrl()))
      .map(([a]) => right<L, A>(a))
      .getOrElse(e)
  )
}

const routingMiddleware = fromParser(router, 'not found')

const notFound = (message: string) =>
  status(Status.NotFound)
    .closeHeaders()
    .send(message)

export const GET: Middleware<StatusOpen, StatusOpen, string, 'GET'> = decodeMethod(s =>
  s.toLowerCase() === 'get' ? right<string, 'GET'>('GET') : left('Unknown verb')
)

const appMiddleware = routingMiddleware
  .ichain(route => {
    switch (route.type) {
      case 'Home':
        return GET.ichain(() => status(Status.OK))
          .closeHeaders()
          .send('Welcome!')
      case 'User':
        return GET.ichain(() => status(Status.OK))
          .closeHeaders()
          .send(`Welcome ${route.id} user!`)
    }
  })
  .orElse(notFound)

const app = express()

app.use(toRequestHandler(appMiddleware))

// tslint:disable-next-line: no-console
app.listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
