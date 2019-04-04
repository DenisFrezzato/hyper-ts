import * as express from 'express'
import { log } from 'fp-ts/lib/Console'
import { fromIO, StatusOpen } from '../src'
import { toRequestHandler } from '../src/express'

// "Middleware function myLogger" example on http://expressjs.com/en/guide/writing-middleware.html

const app = express()

const myLogger = fromIO<StatusOpen, StatusOpen, void>(log('LOGGED'))

app.use(toRequestHandler(myLogger))

app.get('/', toRequestHandler(myLogger), (_, res) => {
  res.send('hello')
})

app.listen(3000)
