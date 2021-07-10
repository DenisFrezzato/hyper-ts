import * as M from '../src/Middleware'
import * as t from 'io-ts'

// return a middleware validating the query "order=desc&shoe[color]=blue&shoe[type]=converse"
export const middleware = M.decodeQuery(
  t.strict({
    order: t.string,
    shoe: t.strict({
      color: t.string,
      type: t.string,
    }),
  }).decode
)
