import { header, status, Status, json, Middleware, BodyOpen, HeadersOpen } from '../../src'

// $ExpectError
const m1 = status(1000)

const m2 = status(Status.OK)
  .closeHeaders()
  .send('Hello hyper-ts!')
  // $ExpectError
  .ichain(() => header('field', 'value'))
