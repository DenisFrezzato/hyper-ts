import * as express from 'express'
import { NonEmptyString } from 'io-ts-types/lib/NonEmptyString'
import { connection as H, middleware as HM } from '../src'
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

type UserError = typeof InvalidArguments | typeof UserNotFound | typeof JSONError

/** Parses the `user_id` param */
const getUserId: HM.Middleware<H.StatusOpen, H.StatusOpen, UserError, NonEmptyString> = pipe(
  HM.decodeParam('user_id', NonEmptyString.decode),
  HM.mapLeft(() => InvalidArguments)
)

/** Loads a `User` from a database (fake) */
function loadUser(userId: NonEmptyString): HM.Middleware<H.StatusOpen, H.StatusOpen, UserError, User> {
  return userId === 'ab' ? HM.right({ name: 'User name...' }) : HM.left(UserNotFound)
}

/** Sends a `User` to the client */
function sendUser(user: User): H.Middleware<H.StatusOpen, H.ResponseEnded, UserError, void> {
  return pipe(
    HM.status(H.Status.OK),
    HM.ichain(() => HM.json(user, () => JSONError))
  )
}

const getUser: HM.Middleware<H.StatusOpen, H.ResponseEnded, UserError, void> = pipe(
  getUserId,
  HM.ichain(loadUser),
  HM.ichain(sendUser)
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
