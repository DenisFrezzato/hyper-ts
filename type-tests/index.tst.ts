import { pipe } from 'fp-ts/function'
import { describe, expect, test } from 'tstyche'
import * as M from '../src/Middleware'
import * as H from '../src'

describe('status', () => {
  test('rejects an out-of-range status code', () => {
    expect(M.status).type.not.toBeCallableWith(1000)
  })
})

describe('ichain', () => {
  test('rejects a middleware with a mismatched state transition', () => {
    const afterResponse = pipe(
      M.status(H.Status.OK),
      M.ichain(() => M.closeHeaders()),
      M.ichain(() => M.send('Hello hyper-ts!'))
    )
    expect(M.ichain(() => M.header('field', 'value'))).type.not.toBeCallableWith(afterResponse)
  })
})
