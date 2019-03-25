import { header, status, Status } from '../../src'

// $ExpectError
status(1000)

status(Status.OK)
  .closeHeaders()
  .send('Hello hyper-ts!')
  // $ExpectError
  .ichain(() => header('field', 'value'))
