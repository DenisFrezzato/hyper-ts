import { middleware as HM } from '../src'
import * as t from 'io-ts'

// return a middleware validating `req.body`
export const middleware = HM.decodeBody(t.string.decode)
