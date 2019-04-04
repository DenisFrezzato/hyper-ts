import * as express from 'express'
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString'
import { fromLeft, Middleware, of, decodeParam, ResponseEnded, Status, status, StatusOpen } from '../src'
import { toRequestHandler } from '../src/express'

//
// Authentication state
//

/** The new connection constraint */
interface AuthenticatedOpen {
  readonly AuthenticatedOpen: unique symbol
}

const AuthenticationError: 'AuthenticationError' = 'AuthenticationError'

type AuthenticationError = typeof AuthenticationError

/**
 * Returns a middleware that either succeded with a `AuthenticatedOpen` output or returns an `AuthenticationError` error
 */
function withAuthentication<L, A>(
  middleware: Middleware<StatusOpen, StatusOpen, L, A>
): Middleware<StatusOpen, StatusOpen & AuthenticatedOpen, AuthenticationError | L, A> {
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
const getUserId = decodeParam('user_id', NonEmptyString.decode).mapLeft<UserError>(() => InvalidArguments)

/** Sends a `User` to the client */
const sendUser = (user: User) =>
  status(Status.OK)
    .closeHeaders()
    .send(`Hello ${user.name}!`)

/**
 * Loads a `User` from a database. The resulting middleware requires a successful authentication upstream because of the
 * `AuthenticatedOpen` constraint
 */
const loadUser = (userId: UserId): Middleware<StatusOpen & AuthenticatedOpen, StatusOpen, UserError, User> =>
  userId === 'ab' ? of({ name: 'User name...' }) : fromLeft(UserNotFound)

// const getUser = getUserId
//   .ichain(loadUser) // static error! Property 'AuthenticatedOpen' is missing in type 'StatusOpen' but required in type 'AuthenticatedOpen'
//   .ichain(sendUser)

const getUser = withAuthentication(getUserId)
  .ichain(loadUser)
  .ichain(sendUser)

//
// error handling
//

const badRequest = (message: string) =>
  status(Status.BadRequest)
    .closeHeaders()
    .send(message)

const notFound = (message: string) =>
  status(Status.NotFound)
    .closeHeaders()
    .send(message)

const unauthorized = (message: string) =>
  status(Status.Unauthorized)
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
  .get('/:user_id', toRequestHandler(user))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /:user_id'))
