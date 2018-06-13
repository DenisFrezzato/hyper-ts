import {
  getMiddlewareT,
  Conn,
  Status,
  StatusOpen,
  HeadersOpen,
  BodyOpen,
  ResponseEnded,
  MonadMiddleware3,
  CookieOptions
} from './index'
import { State } from 'fp-ts/lib/State'
import { state } from 'fp-ts/lib/State'

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

export class HeadersEvent {
  readonly type: 'HeadersEvent' = 'HeadersEvent'
  constructor(readonly headers: { [key: string]: string }) {}
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
  constructor(readonly name: string, readonly value: string, readonly options: CookieOptions) {}
}

export class ClearCookieEvent {
  readonly type: 'ClearCookieEvent' = 'ClearCookieEvent'
  constructor(readonly name: string, readonly options: CookieOptions) {}
}

export class CustomEvent {
  readonly type: 'CustomEvent' = 'CustomEvent'
  constructor(readonly o: string) {}
}

export type Event =
  | StatusEvent
  | HeadersEvent
  | CloseHeadersEvent
  | SendEvent
  | EndEvent
  | CookieEvent
  | ClearCookieEvent
  | CustomEvent

export type S = Array<Event>

export class MiddlewareState<I, O, A> {
  readonly _A!: A
  readonly _L!: O
  readonly _U!: I
  readonly _URI!: URI
  constructor(readonly run: (c: Conn<I>) => State<S, [A, Conn<O>]>) {}
  eval(c: Conn<I>): State<S, A> {
    return t.evalMiddleware(this.run, c)
  }
  map<I, B>(this: MiddlewareState<I, I, A>, f: (a: A) => B): MiddlewareState<I, I, B> {
    return new MiddlewareState(t.map(this.run, f))
  }
  ap<I, B>(this: MiddlewareState<I, I, A>, fab: MiddlewareState<I, I, (a: A) => B>): MiddlewareState<I, I, B> {
    return new MiddlewareState(t.ap(fab.run, this.run))
  }
  chain<I, B>(this: MiddlewareState<I, I, A>, f: (a: A) => MiddlewareState<I, I, B>): MiddlewareState<I, I, B> {
    return this.ichain(f)
  }
  ichain<Z, B>(f: (a: A) => MiddlewareState<O, Z, B>): MiddlewareState<I, Z, B> {
    return new MiddlewareState(t.ichain(this.run, a => f(a).run))
  }
}

const of = <I, A>(a: A): MiddlewareState<I, I, A> => {
  return new MiddlewareState(t.of(a))
}

const map = <I, A, B>(fa: MiddlewareState<I, I, A>, f: (a: A) => B): MiddlewareState<I, I, B> => {
  return fa.map(f)
}

const ap = <S, A, B>(
  fab: MiddlewareState<S, S, (a: A) => B>,
  fa: MiddlewareState<S, S, A>
): MiddlewareState<S, S, B> => {
  return fa.ap(fab)
}

const chain = <S, A, B>(
  fa: MiddlewareState<S, S, A>,
  f: (a: A) => MiddlewareState<S, S, B>
): MiddlewareState<S, S, B> => {
  return fa.chain(f)
}

const ichain = <I, O, Z, A, B>(
  fa: MiddlewareState<I, O, A>,
  f: (a: A) => MiddlewareState<O, Z, B>
): MiddlewareState<I, Z, B> => {
  return fa.ichain(f)
}

export const lift = <I, A>(fa: State<S, A>): MiddlewareState<I, I, A> => {
  return new MiddlewareState(t.lift(fa))
}

const gets = <I, A>(f: (c: Conn<I>) => A): MiddlewareState<I, I, A> => {
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

const status = (status: Status): ResponseStateTransition<StatusOpen, HeadersOpen> =>
  transition(() => new StatusEvent(status))

const headers = (headers: { [key: string]: string }): ResponseStateTransition<HeadersOpen, HeadersOpen> =>
  transition(() => new HeadersEvent(headers))

const closeHeaders: ResponseStateTransition<HeadersOpen, BodyOpen> = transition(() => new CloseHeadersEvent())

const send = (o: string): ResponseStateTransition<BodyOpen, ResponseEnded> => transition(() => new SendEvent(o))

const end: ResponseStateTransition<BodyOpen, ResponseEnded> = transition(() => new EndEvent())

const cookie = (
  name: string,
  value: string,
  options: CookieOptions
): ResponseStateTransition<HeadersOpen, HeadersOpen> => transition(() => new CookieEvent(name, value, options))

const clearCookie = (name: string, options: CookieOptions): ResponseStateTransition<HeadersOpen, HeadersOpen> =>
  transition(() => new ClearCookieEvent(name, options))

/** @instance */
export const middleware: MonadMiddleware3<URI> = {
  URI,
  map,
  of,
  ap,
  chain,
  iof: of,
  ichain,
  status,
  headers,
  closeHeaders,
  send,
  end,
  cookie,
  clearCookie,
  gets
}
