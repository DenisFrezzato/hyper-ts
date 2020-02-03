import * as assert from 'assert'
import { connection as H, middleware as HM } from '../src'
import { toRequestHandler } from '../src/express'
import { pipe } from 'fp-ts/lib/pipeable'

describe('express', () => {
  it('should call `next` with an error', () => {
    const m = pipe(
      HM.left<H.StatusOpen, string, void>('error'),
      HM.ichain(() => HM.status(H.Status.OK)),
      HM.ichain(() => HM.closeHeaders()),
      HM.ichain(() => HM.end())
    )
    const rh = toRequestHandler(m)
    rh(null as any, null as any, e => {
      assert.strictEqual(e, 'error')
    })
  })
})
