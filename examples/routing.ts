import * as express from 'express'
import { Status, status, Middleware, StatusOpen, fromConnection } from '../src'
import { fromMiddleware } from '../src/express'
import { str, lit, end, Parser, Route } from 'fp-ts-routing'
import { fromOption } from 'fp-ts/lib/Either'

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

const throwNotFound = fromOption<'NotFound'>('NotFound')

const routingMiddleware: Middleware<StatusOpen, StatusOpen, 'NotFound', Location> = fromConnection(c =>
  throwNotFound(router.run(Route.parse(c.getOriginalUrl())).map(([a]) => a))
)

const notFound = (message: string) =>
  status<never>(Status.NotFound)
    .closeHeaders()
    .send(message)

const appMiddleware = routingMiddleware
  .ichain(route =>
    status<never>(Status.OK)
      .closeHeaders()
      .send(JSON.stringify(route))
  )
  .orElse(() => notFound('not found'))

const app = express()

app.use(fromMiddleware(appMiddleware))

// tslint:disable-next-line: no-console
app.listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
