import * as assert from 'assert'
import * as H from '../src'
import { toRequestHandler } from '../src/express'
import { pipe } from 'fp-ts/lib/pipeable'

describe('express', () => {
  it('should call `next` with an error', () => {
    const m = pipe(
      H.left<H.StatusOpen, string, void>('error'),
      H.ichain(() => H.status(H.Status.OK)),
      H.ichain(() => H.closeHeaders()),
      H.ichain(() => H.end())
    )
    const rh = toRequestHandler(m)
    rh(null as any, null as any, e => {
      assert.strictEqual(e, 'error')
    })
  })
})
