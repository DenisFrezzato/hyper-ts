import * as H from '../src'
import * as t from 'io-ts'

// return a middleware validating `req.body`
export const middleware = H.decodeBody(t.string.decode)
