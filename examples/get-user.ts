import * as express from 'express'
import { none, Option, some } from 'fp-ts/lib/Option'
import * as t from 'io-ts'
import { Middleware, of, param, Status, status, StatusOpen } from '../src'
import { fromMiddleware } from '../src/toExpressRequestHandler'

interface UserIdBrand {
  readonly UserId: unique symbol
}

const UserId = t.brand(t.string, (s): s is t.Branded<string, UserIdBrand> => s.length > 1, 'UserId')

type UserId = t.TypeOf<typeof UserId>

interface User {
  name: string
}

const badRequest = (message: string) =>
  status<never>(Status.BadRequest)
    .closeHeaders()
    .send(message)

const notFound = (message: string) =>
  status<never>(Status.NotFound)
    .closeHeaders()
    .send(message)

const getUserId = param('user_id', UserId)

const loadUser = <L>(userId: UserId): Middleware<StatusOpen, StatusOpen, L, Option<User>> =>
  userId === 'ab' ? of(some({ name: 'User name...' })) : of(none)

const sendUser = <L>(user: User) =>
  status<L>(Status.OK)
    .closeHeaders()
    .send(JSON.stringify(user))

const user = getUserId
  .ichain(loadUser)
  .ichain(o => o.foldL(() => notFound('user not found'), user => sendUser(user)))
  .orElse(() => badRequest('invalid arguments'))

express()
  .get('/:user_id', fromMiddleware(user))
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /:user_id'))
