import * as M from '../src/Middleware'
import * as t from 'io-ts'

// returns a middleware validating both `req.param.user_id` and `req.param.user_name`
export const middleware = M.decodeParams(
  t.strict({
    user_id: t.string,
    user_name: t.string,
  }).decode
)
