import * as express from 'express'
import { log } from 'fp-ts/lib/Console'
import { fromIO, StatusOpen } from '../src'
import { fromMiddleware } from '../src/express'

// "Middleware function myLogger" example on http://expressjs.com/en/guide/writing-middleware.html

const app = express()

const myLogger = fromIO<StatusOpen, StatusOpen, void>(log('LOGGED'))

app.use(fromMiddleware(myLogger))

app.get('/', fromMiddleware(myLogger), (_, res) => {
  res.send('hello')
})

app.listen(3000)
