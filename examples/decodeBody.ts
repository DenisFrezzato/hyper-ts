import * as M from '../src/Middleware'
import * as t from 'io-ts'

// return a middleware validating `req.body`
export const middleware = M.decodeBody(t.string.decode)
