import { header, status, Status, json, Middleware, BodyOpen, HeadersOpen } from '../../src'

// $ExpectError
const m1 = status(1000)

const m2 = status(Status.OK)
  .closeHeaders()
  .send('Hello hyper-ts!')
  // $ExpectError
  .ichain(() => header('field', 'value'))

//
// json
//

const m3 = json({ a: 1 })

declare const m4: Middleware<HeadersOpen, BodyOpen, never, void>

// $ExpectError
const m5 = m4.ichain(() => m3)
// $ExpectError
const m6 = json({ a: new Date() })
