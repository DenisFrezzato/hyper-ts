import * as express from 'express'
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString'
import * as H from '../src'
import * as M from '../src/Middleware'
import { toRequestHandler } from '../src/express'
import { pipe } from 'fp-ts/function'

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

type UserError = typeof InvalidArguments | typeof UserNotFound | typeof JSONError

/** Parses the `user_id` param */
const getUserId: M.Middleware<H.StatusOpen, H.StatusOpen, UserError, NonEmptyString> = pipe(
  M.decodeParam('user_id', NonEmptyString.decode),
  M.mapLeft(() => InvalidArguments)
)

/** Loads a `User` from a database (fake) */
function loadUser(userId: NonEmptyString): M.Middleware<H.StatusOpen, H.StatusOpen, UserError, User> {
  return userId === 'ab' ? M.right({ name: 'User name...' }) : M.left(UserNotFound)
}

/** Sends a `User` to the client */
function sendUser(user: User): M.Middleware<H.StatusOpen, H.ResponseEnded, UserError, void> {
  return pipe(
    M.status(H.Status.OK),
    M.ichain(() => M.json(user, () => JSONError))
  )
}

const getUser: M.Middleware<H.StatusOpen, H.ResponseEnded, UserError, void> = pipe(
  getUserId,
  M.ichain(loadUser),
  M.ichain(sendUser)
)

//
// error handling
//

function badRequest<E = never>(message: string): M.Middleware<H.StatusOpen, H.ResponseEnded, E, void> {
  return pipe(
    M.status(H.Status.BadRequest),
    M.ichain(() => M.closeHeaders()),
    M.ichain(() => M.send(message))
  )
}

function notFound<E = never>(message: string): M.Middleware<H.StatusOpen, H.ResponseEnded, E, void> {
  return pipe(
    M.status(H.Status.NotFound),
    M.ichain(() => M.closeHeaders()),
    M.ichain(() => M.send(message))
  )
}

function serverError<E = never>(message: string): M.Middleware<H.StatusOpen, H.ResponseEnded, E, void> {
  return pipe(
    M.status(H.Status.InternalServerError),
    M.ichain(() => M.closeHeaders()),
    M.ichain(() => M.send(message))
  )
}

function sendError(err: UserError): M.Middleware<H.StatusOpen, H.ResponseEnded, never, void> {
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

const user = pipe(getUser, M.orElse(sendError))

express()
  .get('/:user_id', toRequestHandler(user))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /:user_id'))
