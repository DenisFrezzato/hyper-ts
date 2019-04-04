import * as assert from 'assert'
import { fromLeft, Status, StatusOpen } from '../src'
import { toRequestHandler } from '../src/express'

describe('express', () => {
  it('should call `next` with an error', () => {
    const m = fromLeft<StatusOpen, string, void>('error')
      .status(Status.OK)
      .closeHeaders()
      .end()
    const rh = toRequestHandler(m)
    rh(null as any, null as any, e => {
      assert.strictEqual(e, 'error')
    })
  })
})
