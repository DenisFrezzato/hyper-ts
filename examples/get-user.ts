import * as express from 'express'
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString'
import { fromLeft, Middleware, of, decodeParam, Status, status, StatusOpen, ResponseEnded } from '../src'
import { toRequestHandler } from '../src/express'

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
const getUserId = decodeParam('user_id', UserId.decode).mapLeft<UserError>(() => InvalidArguments)

/** Loads a `User` from a database (fake) */
const loadUser = (userId: UserId): Middleware<StatusOpen, StatusOpen, UserError, User> =>
  userId === 'ab' ? of({ name: 'User name...' }) : fromLeft(UserNotFound)

/** Sends a `User` to the client */
const sendUser = (user: User) =>
  status(Status.OK)
    .closeHeaders()
    .send(JSON.stringify(user))

const getUser = getUserId.ichain(loadUser).ichain(sendUser)

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

const sendError = (err: UserError): Middleware<StatusOpen, ResponseEnded, never, void> => {
  switch (err) {
    case 'UserNotFound':
      return notFound('user not found')
    case 'InvalidArguments':
      return badRequest('invalid arguments')
  }
}

//
// route
//

const user = getUser.orElse(sendError)

express()
  .get('/:user_id', toRequestHandler(user))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /:user_id'))
