import * as express from 'express'
import { tuple } from 'fp-ts/lib/function'
import { none, Option, some } from 'fp-ts/lib/Option'
import { taskEither } from 'fp-ts/lib/TaskEither'
import * as t from 'io-ts'
import { IntFromString } from 'io-ts-types/lib/IntFromString'
import { iof, Middleware, of, param, Status, status, StatusOpen } from '../src'
import { fromMiddleware } from '../src/toExpressRequestHandler'

/** The new connection state */
type AuthenticatedOpen = 'Authenticated'

/** Use this middleware where you want to ensure a successful authentication process upstream */
const requireAuthentication: Middleware<AuthenticatedOpen, StatusOpen, never, void> = iof(undefined)

/**
 * The resulting middleware requires a successful authentication upstream since the first operation is
 * `requireAuthentication`
 */
const loadUser = (userId: number) =>
  requireAuthentication.ichain(() => of(userId === 1 ? some<User>({ name: 'Giulio' }) : none))

const isAuthenticated: Middleware<StatusOpen, StatusOpen, never, boolean> = new Middleware(c => {
  // dummy authentication logic
  if (t.string.is(c.getHeader('token'))) {
    return taskEither.of(tuple(true, c))
  } else {
    return taskEither.of(tuple(false, c))
  }
})

/**
 * Returns a middleware that proves statically that the authentication process succeeded (`Some`) or failed (`None`)
 */
function withAuthentication<L, A>(
  middleware: Middleware<StatusOpen, StatusOpen, L, A>
): Middleware<StatusOpen, StatusOpen, L, Option<Middleware<StatusOpen, AuthenticatedOpen, L, A>>> {
  return isAuthenticated.map(b => (b ? some(middleware as any) : none))
}

const badRequest = (message: string) =>
  status<never>(Status.BadRequest)
    .closeHeaders()
    .send(message)

const notFound = (message: string) =>
  status<never>(Status.NotFound)
    .closeHeaders()
    .send(message)

const unauthorized = (message: string) =>
  status<never>(Status.Unauthorized)
    .closeHeaders()
    .send(message)

//
// API
//

interface User {
  name: string
}

const getUserId = param('user_id', IntFromString)

/** send the user to the client */
const sendUser = (user: User) =>
  status<never>(Status.OK)
    .closeHeaders()
    .send(`Hello ${user.name}!`)

// const user = getUserId
//   .ichain(loadUser) // static error!

const user = withAuthentication(getUserId)
  .ichain(o =>
    o.foldL(
      () => unauthorized('Unauthorized user'),
      userId => userId.ichain(loadUser).ichain(o => o.foldL(() => notFound('User not found'), sendUser))
    )
  )
  .orElse(() => badRequest('Invalid user id'))

express()
  .get('/:user_id', fromMiddleware(user))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /:user_id'))
