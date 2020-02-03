import { IncomingMessage } from 'http'

/**
 * Adapted from https://github.com/purescript-contrib/purescript-media-types
 *
 * @since 0.5.0
 */
export const MediaType = {
  applicationFormURLEncoded: 'application/x-www-form-urlencoded',
  applicationJSON: 'application/json',
  applicationJavascript: 'application/javascript',
  applicationOctetStream: 'application/octet-stream',
  applicationXML: 'application/xml',
  imageGIF: 'image/gif',
  imageJPEG: 'image/jpeg',
  imagePNG: 'image/png',
  multipartFormData: 'multipart/form-data',
  textCSV: 'text/csv',
  textHTML: 'text/html',
  textPlain: 'text/plain',
  textXML: 'text/xml'
} as const

/**
 * @since 0.5.0
 */
export type MediaType = typeof MediaType[keyof typeof MediaType]

/**
 * @since 0.5.0
 */
export const Status = {
  OK: 200,
  Created: 201,
  Found: 302,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ServerError: 500
} as const

/**
 * @since 0.5.0
 */
export type Status = typeof Status[keyof typeof Status]

/**
 * @since 0.5.0
 */
export interface CookieOptions {
  readonly expires?: Date
  readonly domain?: string
  readonly httpOnly?: boolean
  readonly maxAge?: number
  readonly path?: string
  readonly sameSite?: boolean | 'strict' | 'lax'
  readonly secure?: boolean
  readonly signed?: boolean
}

/**
 * Type indicating that the status-line is ready to be sent
 *
 * @since 0.5.0
 */
export interface StatusOpen {
  readonly StatusOpen: unique symbol
}

/**
 * Type indicating that headers are ready to be sent, i.e. the body streaming has not been started
 *
 * @since 0.5.0
 */
export interface HeadersOpen {
  readonly HeadersOpen: unique symbol
}

/**
 * Type indicating that headers have already been sent, and that the body is currently streaming
 *
 * @since 0.5.0
 */
export interface BodyOpen {
  readonly BodyOpen: unique symbol
}

/**
 * Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished
 *
 * @since 0.5.0
 */
export interface ResponseEnded {
  readonly ResponseEnded: unique symbol
}

/**
 * A `Connection`, models the entirety of a connection between the HTTP server and the user agent,
 * both request and response.
 * State changes are tracked by the phantom type `S`
 *
 * @since 0.5.0
 */
export interface Connection<S> {
  readonly _S: S
  readonly getRequest: () => IncomingMessage
  readonly getBody: () => unknown
  readonly getHeader: (name: string) => unknown
  readonly getParams: () => unknown
  readonly getQuery: () => unknown
  readonly getOriginalUrl: () => string
  readonly getMethod: () => string
  readonly setCookie: (
    this: Connection<HeadersOpen>,
    name: string,
    value: string,
    options: CookieOptions
  ) => Connection<HeadersOpen>
  readonly clearCookie: (this: Connection<HeadersOpen>, name: string, options: CookieOptions) => Connection<HeadersOpen>
  readonly setHeader: (this: Connection<HeadersOpen>, name: string, value: string) => Connection<HeadersOpen>
  readonly setStatus: (this: Connection<StatusOpen>, status: Status) => Connection<HeadersOpen>
  readonly setBody: (this: Connection<BodyOpen>, body: unknown) => Connection<ResponseEnded>
  readonly endResponse: (this: Connection<BodyOpen>) => Connection<ResponseEnded>
}
