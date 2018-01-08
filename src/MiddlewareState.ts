import {
  getMiddlewareT,
  Conn,
  Status,
  StatusOpen,
  HeadersOpen,
  BodyOpen,
  ResponseEnded,
  MediaType,
  Header,
  MonadMiddleware,
  headers as headers_,
  contentType as contentType_,
  redirect as redirect_
} from './index'
import { State } from 'fp-ts/lib/State'
import * as state from 'fp-ts/lib/State'
import * as express from 'express'
import { Foldable } from 'fp-ts/lib/Foldable'
import { HKT } from 'fp-ts/lib/HKT'

const t = getMiddlewareT(state)

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT3<U, L, A> {
    MiddlewareState: MiddlewareState<U, L, A>
  }
}

export const URI = 'MiddlewareState'

export type URI = typeof URI

export class StatusEvent {
  readonly type: 'StatusEvent' = 'StatusEvent'
  constructor(readonly status: number) {}
}

export class HeaderEvent {
  readonly type: 'HeaderEvent' = 'HeaderEvent'
  constructor(readonly field: string, readonly value: string) {}
}

export class CloseHeadersEvent {
  readonly type: 'CloseHeadersEvent' = 'CloseHeadersEvent'
}

export class SendEvent {
  readonly type: 'SendEvent' = 'SendEvent'
  constructor(readonly o: string) {}
}

export class EndEvent {
  readonly type: 'EndEvent' = 'EndEvent'
}

export class CookieEvent {
  readonly type: 'CookieEvent' = 'CookieEvent'
  constructor(readonly name: string, readonly value: string, readonly options: express.CookieOptions) {}
}

export class ClearCookieEvent {
  readonly type: 'ClearCookieEvent' = 'ClearCookieEvent'
  constructor(readonly name: string, readonly options: express.CookieOptions) {}
}

export class CustomEvent {
  readonly type: 'CustomEvent' = 'CustomEvent'
  constructor(readonly o: string) {}
}

export type Event =
  | StatusEvent
  | HeaderEvent
  | CloseHeadersEvent
  | SendEvent
  | EndEvent
  | CookieEvent
  | ClearCookieEvent
  | CustomEvent

export type S = Array<Event>

export class MiddlewareState<I, O, A> {
  // prettier-ignore
  readonly '_A': A
  // prettier-ignore
  readonly '_L': O
  // prettier-ignore
  readonly '_U': I
  // prettier-ignore
  readonly '_URI': URI
  constructor(readonly run: (c: Conn<I>) => State<S, [A, Conn<O>]>) {}
  eval(c: Conn<I>): State<S, A> {
    return t.eval(this.run, c)
  }
  map<I, B>(this: MiddlewareState<I, I, A>, f: (a: A) => B): MiddlewareState<I, I, B> {
    return new MiddlewareState(t.map(f, this.run))
  }
  ap<I, B>(this: MiddlewareState<I, I, A>, fab: MiddlewareState<I, I, (a: A) => B>): MiddlewareState<I, I, B> {
    return new MiddlewareState(t.ap(fab.run, this.run))
  }
  chain<I, B>(this: MiddlewareState<I, I, A>, f: (a: A) => MiddlewareState<I, I, B>): MiddlewareState<I, I, B> {
    return this.ichain(f)
  }
  ichain<Z, B>(f: (a: A) => MiddlewareState<O, Z, B>): MiddlewareState<I, Z, B> {
    return new MiddlewareState(t.ichain(a => f(a).run, this.run))
  }
}

export const of = <I, A>(a: A): MiddlewareState<I, I, A> => {
  return new MiddlewareState(t.of(a))
}

export const map = <I, A, B>(f: (a: A) => B, fa: MiddlewareState<I, I, A>): MiddlewareState<I, I, B> => {
  return fa.map(f)
}

export const ap = <S, A, B>(
  fab: MiddlewareState<S, S, (a: A) => B>,
  fa: MiddlewareState<S, S, A>
): MiddlewareState<S, S, B> => {
  return fa.ap(fab)
}

export const chain = <S, A, B>(
  f: (a: A) => MiddlewareState<S, S, B>,
  fa: MiddlewareState<S, S, A>
): MiddlewareState<S, S, B> => {
  return fa.chain(f)
}

export const ichain = <I, O, Z, A, B>(
  f: (a: A) => MiddlewareState<O, Z, B>,
  fa: MiddlewareState<I, O, A>
): MiddlewareState<I, Z, B> => {
  return fa.ichain(f)
}

export const lift = <I, A>(fa: State<S, A>): MiddlewareState<I, I, A> => {
  return new MiddlewareState(t.lift(fa))
}

export const gets = <I, A>(f: (c: Conn<I>) => A): MiddlewareState<I, I, A> => {
  return new MiddlewareState(t.gets(f))
}

/** A middleware transitioning from one `Response` state to another */
export interface ResponseStateTransition<I, O> extends MiddlewareState<I, O, void> {}

/** A middleware representing a complete `Request` / `Response` handling */
export interface Handler extends ResponseStateTransition<StatusOpen, ResponseEnded> {}

const transition = <I, O>(f: () => Event): ResponseStateTransition<I, O> =>
  new MiddlewareState(
    c =>
      new State(s => {
        return [[undefined, c], s.concat([f()])] as any
      })
  )

export const status = (status: Status): ResponseStateTransition<StatusOpen, HeadersOpen> =>
  transition(() => new StatusEvent(status))

export const header = ([field, value]: Header): ResponseStateTransition<HeadersOpen, HeadersOpen> =>
  transition(() => new HeaderEvent(field, value))

export const closeHeaders: ResponseStateTransition<HeadersOpen, BodyOpen> = transition(() => new CloseHeadersEvent())

export const send = (o: string): ResponseStateTransition<BodyOpen, ResponseEnded> => transition(() => new SendEvent(o))

export const json = (o: string): ResponseStateTransition<HeadersOpen, ResponseEnded> =>
  contentType(MediaType.applicationJSON)
    .ichain(() => closeHeaders)
    .ichain(() => send(o))

export const end: ResponseStateTransition<BodyOpen, ResponseEnded> = transition(() => new EndEvent())

export const cookie = (
  name: string,
  value: string,
  options: express.CookieOptions
): ResponseStateTransition<HeadersOpen, HeadersOpen> => transition(() => new CookieEvent(name, value, options))

export const clearCookie = (
  name: string,
  options: express.CookieOptions
): ResponseStateTransition<HeadersOpen, HeadersOpen> => transition(() => new ClearCookieEvent(name, options))

/** @instance */
export const middlewareState: MonadMiddleware<URI> = {
  URI,
  map,
  of,
  ap,
  chain,
  iof: of,
  ichain,
  status,
  header,
  closeHeaders,
  send,
  json,
  end,
  cookie,
  clearCookie
}

export const headers: <F>(
  F: Foldable<F>
) => (headers: HKT<F, Header>) => ResponseStateTransition<HeadersOpen, BodyOpen> = headers_(middlewareState)

export const contentType: (mediaType: MediaType) => ResponseStateTransition<HeadersOpen, HeadersOpen> = contentType_(
  middlewareState
)

export const redirect: (uri: string) => ResponseStateTransition<StatusOpen, HeadersOpen> = redirect_(middlewareState)
