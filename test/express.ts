import * as assert from 'assert'
import { toMiddleware, ExpressConnection, fromMiddleware } from '../src/express'
import { left } from 'fp-ts/lib/Either'
import { fromLeft, StatusOpen, Status } from '../src'

describe('express', () => {
  it('should propagate express middleware errors', () => {
    const m = toMiddleware((_req, _res, next) => next('error'), e => String(e))
    return m
      .run(new ExpressConnection(null as any, null as any))
      .run()
      .then(e => {
        assert.deepStrictEqual(e, left('error'))
      })
  })
  it('should call `next` with an error', () => {
    const m = fromLeft<StatusOpen, string, void>('error')
      .status(Status.OK)
      .closeHeaders()
      .end()
    const rh = fromMiddleware(m)
    rh(null as any, null as any, e => {
      assert.strictEqual(e, 'error')
    })
  })
})
