import * as express from 'express'
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString'
import { fromLeft, Middleware, of, param, Status, status, StatusOpen, ResponseEnded } from '../src'
import { fromMiddleware } from '../src/express'

//
// model
//

const UserId = NonEmptyString

type UserId = NonEmptyString

interface User {
  name: string
}

//
// business logic
//

const UserNotFound: 'UserNotFound' = 'UserNotFound'

const InvalidArguments: 'InvalidArguments' = 'InvalidArguments'

type UserError = typeof InvalidArguments | typeof UserNotFound

/** Parses the `user_id` param */
const getUserId = param('user_id', UserId).mapLeft<UserError>(() => InvalidArguments)

/** Loads a `User` from a database */
const loadUser = (userId: UserId): Middleware<StatusOpen, StatusOpen, UserError, User> =>
  userId === 'ab' ? of({ name: 'User name...' }) : fromLeft(UserNotFound)

/** Sends a `User` to the client */
const sendUser = <L>(user: User) =>
  status<L>(Status.OK)
    .closeHeaders()
    .send(JSON.stringify(user))

const getUser = getUserId.ichain(loadUser).ichain(sendUser)

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

const sendError = (err: UserError): Middleware<StatusOpen, ResponseEnded, never, void> => {
  switch (err) {
    case 'UserNotFound':
      return notFound('user not found')
    case 'InvalidArguments':
      return badRequest('invalid arguments')
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
