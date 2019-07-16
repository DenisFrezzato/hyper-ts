import * as express from 'express'
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString'
import * as H from '../src'
import { toRequestHandler } from '../src/express'
import { pipe } from 'fp-ts/lib/pipeable'

//
// model
//

interface User {
  name: string
}

//
// business logic
//

const UserNotFound = 'UserNotFound' as const

const InvalidArguments = 'InvalidArguments' as const

const JSONError = 'JSONError' as const

type UserError = 'InvalidArguments' | 'UserNotFound' | 'JSONError'

/** Parses the `user_id` param */
const getUserId: H.Middleware<H.StatusOpen, H.StatusOpen, UserError, NonEmptyString> = pipe(
  H.decodeParam('user_id', NonEmptyString.decode),
  H.mapLeft(() => InvalidArguments)
)

/** Loads a `User` from a database (fake) */
function loadUser(userId: NonEmptyString): H.Middleware<H.StatusOpen, H.StatusOpen, UserError, User> {
  return userId === 'ab' ? H.right({ name: 'User name...' }) : H.left(UserNotFound)
}

/** Sends a `User` to the client */
function sendUser(user: User): H.Middleware<H.StatusOpen, H.ResponseEnded, UserError, void> {
  return pipe(
    H.status(H.Status.OK),
    H.ichain(() => H.json(user, () => JSONError))
  )
}

const getUser: H.Middleware<H.StatusOpen, H.ResponseEnded, UserError, void> = pipe(
  getUserId,
  H.ichain(loadUser),
  H.ichain(sendUser)
)

//
// error handling
//

function badRequest<E = never>(message: string): H.Middleware<H.StatusOpen, H.ResponseEnded, E, void> {
  return pipe(
    H.status(H.Status.BadRequest),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(message))
  )
}

function notFound<E = never>(message: string): H.Middleware<H.StatusOpen, H.ResponseEnded, E, void> {
  return pipe(
    H.status(H.Status.NotFound),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(message))
  )
}

function serverError<E = never>(message: string): H.Middleware<H.StatusOpen, H.ResponseEnded, E, void> {
  return pipe(
    H.status(H.Status.ServerError),
    H.ichain(() => H.closeHeaders()),
    H.ichain(() => H.send(message))
  )
}

function sendError(err: UserError): H.Middleware<H.StatusOpen, H.ResponseEnded, never, void> {
  switch (err) {
    case 'UserNotFound':
      return notFound('user not found')
    case 'InvalidArguments':
      return badRequest('invalid arguments')
    case 'JSONError':
      return serverError('invalid JSON')
  }
}

//
// route
//

const user = pipe(
  getUser,
  H.orElse(sendError)
)

express()
  .get('/:user_id', toRequestHandler(user))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /:user_id'))
