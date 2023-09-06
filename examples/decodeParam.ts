import * as H from '../src'
import * as M from '../src/Middleware'
import * as E from 'fp-ts/Either'

const isUnknownRecord = (u: unknown): u is Record<string, unknown> => typeof u === 'object' && u !== null

// returns a middleware validating `req.param.user_id`
export const middleware: M.Middleware<H.StatusOpen, H.StatusOpen, string, string> = M.decodeParam('user_id', (u) =>
  isUnknownRecord(u) && typeof u.user_id === 'string' ? E.right(u.user_id) : E.left('cannot read param user_id')
)

import * as t from 'io-ts'

export const middleware2: M.Middleware<H.StatusOpen, H.StatusOpen, t.Errors, string> = M.decodeParam(
  'user_id',
  t.string.decode
)

import { IntFromString } from 'io-ts-types/IntFromString'

// validation succeeds only if `req.param.user_id` can be parsed to an integer
export const middleware3: M.Middleware<
  H.StatusOpen,
  H.StatusOpen,
  t.Errors,
  t.Branded<number, t.IntBrand>
> = M.decodeParam('user_id', IntFromString.decode)
