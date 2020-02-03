import { connection as H, middleware as HM } from '../../src'
import { pipe } from 'fp-ts/lib/pipeable'

// $ExpectError
const m1 = HM.status(1000)

const m2 = pipe(
  HM.status(H.Status.OK),
  HM.ichain(() => HM.closeHeaders()),
  HM.ichain(() => HM.send('Hello hyper-ts!')),
  // $ExpectError
  HM.ichain(() => () => HM.header('field', 'value'))
)
