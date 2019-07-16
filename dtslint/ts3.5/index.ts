import * as H from '../../src'
import { pipe } from 'fp-ts/lib/pipeable'

// $ExpectError
const m1 = H.status(1000)

const m2 = pipe(
  H.status(H.Status.OK),
  H.ichain(() => H.closeHeaders()),
  H.ichain(() => H.send('Hello hyper-ts!')),
  // $ExpectError
  H.ichain(() => () => H.header('field', 'value'))
)
