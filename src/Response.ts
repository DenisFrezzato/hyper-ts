import { Foldable, traverse_ } from 'fp-ts/lib/Foldable'
import { HKT } from 'fp-ts/lib/HKT'
import { Middleware, middleware, modify } from './Middleware'
import { Conn } from './Conn'
import { MediaType } from './MediaType'
import { Status } from './Status'
import { tuple } from 'fp-ts/lib/function'
import { Task } from 'fp-ts/lib/Task'
import { Header } from './Header'
import * as header from './Header'
import * as express from 'express'

/** Type indicating that the status-line is ready to be sent */
export type StatusOpen = 'StatusOpen'

/** Type indicating that headers are ready to be sent, i.e. the body streaming has not been started */
export type HeadersOpen = 'HeadersOpen'

/** Type indicating that headers have already been sent, and that the body is currently streaming */
export type BodyOpen = 'BodyOpen'

/** Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished. */
export type ResponseEnded = 'ResponseEnded'

const unsafeCoerce = <A, B>(a: A): B => a as any

const unsafeCoerceConn = <I, O>(c: Conn<I>): Promise<[void, Conn<O>]> =>
  Promise.resolve(tuple(undefined, unsafeCoerce(c)))

export const writeStatus = (status: Status): Middleware<StatusOpen, HeadersOpen, void> =>
  new Middleware(
    c =>
      new Task(() => {
        c.res.status(status)
        return unsafeCoerceConn(c)
      })
  )

export const writeHeader = ([field, value]: Header): Middleware<HeadersOpen, HeadersOpen, void> =>
  new Middleware(
    c =>
      new Task(() => {
        c.res.header(field, value)
        return unsafeCoerceConn(c)
      })
  )

export const closeHeaders: Middleware<HeadersOpen, BodyOpen, void> = modify(unsafeCoerce)

export const send = (o: string): Middleware<BodyOpen, ResponseEnded, void> =>
  new Middleware(
    c =>
      new Task(() => {
        c.res.send(o)
        return unsafeCoerceConn(c)
      })
  )

export const json = (o: string): Middleware<HeadersOpen, ResponseEnded, void> =>
  contentType(MediaType.applicationJSON)
    .ichain(() => closeHeaders)
    .ichain(() => send(o))

export const end: Middleware<BodyOpen, ResponseEnded, void> = new Middleware(
  c =>
    new Task(() => {
      c.res.end()
      return unsafeCoerceConn(c)
    })
)

export const headers = <F>(F: Foldable<F>) => (headers: HKT<F, Header>): Middleware<HeadersOpen, BodyOpen, void> =>
  traverse_(middleware, F)(writeHeader, headers).ichain(() => closeHeaders)

export const contentType = (mediaType: MediaType): Middleware<HeadersOpen, HeadersOpen, void> =>
  writeHeader(header.contentType(mediaType))

export const redirect = (uri: string): Middleware<StatusOpen, HeadersOpen, void> =>
  writeStatus(Status.Found).ichain(() => writeHeader(header.location(uri)))

export const toRequestHandler = (middleware: Middleware<StatusOpen, ResponseEnded, void>): express.RequestHandler => (
  req,
  res
) => middleware.eval(new Conn(req, res)).run()
