import { MonadMiddleware, Status } from '../src'

declare const M: MonadMiddleware<'Test'>

// status

M.status(Status.OK)
// $ExpectError Argument of type '1000' is not assignable to parameter of type
M.status(1000)
