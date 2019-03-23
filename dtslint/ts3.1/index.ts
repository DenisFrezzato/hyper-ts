import { MonadMiddleware, Status } from '../../src'

declare const M: MonadMiddleware<'Test'>

// status

M.status(Status.OK)
// $ExpectError
M.status(1000)
