import * as express from 'express'
import { log } from 'fp-ts/lib/Console'
import { fromIO, StatusOpen } from '../src'
import { fromMiddleware } from '../src/express'

export const myLogger = fromIO<StatusOpen, StatusOpen, void>(log('LOGGED'))

express()
  .get('/', fromMiddleware(myLogger), (_, res) => {
    res.send('hello')
  })
  // tslint:disable-next-line: no-console
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
