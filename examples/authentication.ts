import * as express from 'express'
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString'
import { fromLeft, iof, Middleware, of, param, ResponseEnded, Status, status, StatusOpen } from '../src'
import { fromMiddleware } from '../src/express'

//
// Authentication state
//

/** The new connection state */
type AuthenticatedOpen = 'Authenticated'

/** Use this middleware where you want to ensure a successful authentication process upstream */
const requireAuthentication = <L>(): Middleware<AuthenticatedOpen, StatusOpen, L, void> => iof(undefined)

const AuthenticationError: 'AuthenticationError' = 'AuthenticationError'

type AuthenticationError = typeof AuthenticationError

/**
 * Returns a middleware that proves statically that the authentication process succeeded (`Some`) or failed (`None`)
 */
function withAuthentication<L, A>(
  middleware: Middleware<StatusOpen, StatusOpen, L, A>
): Middleware<StatusOpen, AuthenticatedOpen, AuthenticationError | L, A> {
  return new Middleware(c => {
    // dummy authentication logic
    if (NonEmptyString.is(c.getHeader('token'))) {
      return middleware.run(c) as any
    } else {
      return fromLeft(AuthenticationError)
    }
  })
}

//
// model
//

type UserId = NonEmptyString

interface User {
  name: string
}

//
// business logic
//

const UserNotFound: 'UserNotFound' = 'UserNotFound'

const InvalidArguments: 'InvalidArguments' = 'InvalidArguments'

type UserError = typeof InvalidArguments | typeof UserNotFound | AuthenticationError

/** Parses the `user_id` param */
const getUserId = param('user_id', NonEmptyString).mapLeft<UserError>(() => InvalidArguments)

/** Sends a `User` to the client */
const sendUser = (user: User) =>
  status<never>(Status.OK)
    .closeHeaders()
    .send(`Hello ${user.name}!`)

/**
 * Loads a `User` from a database. The resulting middleware requires a successful authentication upstream because of the
 * `requireAuthentication` middleware
 */
const loadUser = (userId: UserId): Middleware<AuthenticatedOpen, StatusOpen, UserError, User> =>
  requireAuthentication<UserError>().ichain(() =>
    userId === 'ab' ? of({ name: 'User name...' }) : fromLeft(UserNotFound)
  )

// const getUser = getUserId
//   .ichain(loadUser) // static error! Type '"StatusOpen"' is not assignable to type '"Authenticated"'
//   .ichain(sendUser)

const getUser = withAuthentication(getUserId)
  .ichain(loadUser)
  .ichain(sendUser)

//
// error handling
//

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

const sendError = (err: UserError): Middleware<StatusOpen, ResponseEnded, never, void> => {
  switch (err) {
    case 'UserNotFound':
      return notFound('user not found')
    case 'InvalidArguments':
      return badRequest('invalid arguments')
    case 'AuthenticationError':
      return unauthorized('Unauthorized user')
  }
}

//
// express handler
//

const user = getUser.orElse(sendError)

express()
  .get('/:user_id', fromMiddleware(user))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /:user_id'))
