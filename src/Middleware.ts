import { Task } from 'fp-ts/lib/Task'
import * as task from 'fp-ts/lib/Task'
import { tuple } from 'fp-ts/lib/function'
import { Monad } from 'fp-ts/lib/Monad'
import { IxMonad } from 'fp-ts/lib/IxMonad'
import { Conn } from './Conn'

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT3<U, L, A> {
    Middleware: Middleware<U, L, A>
  }
}

export const URI = 'Middleware'

export type URI = typeof URI

export class Middleware<I, O, A> {
  // prettier-ignore
  readonly '_A': A
  // prettier-ignore
  readonly '_L': O
  // prettier-ignore
  readonly '_U': I
  // prettier-ignore
  readonly '_URI': URI
  constructor(readonly run: (c: Conn<I>) => Task<[A, Conn<O>]>) {}
  eval(c: Conn<I>): Task<A> {
    return this.run(c).map(([a]) => a)
  }
  map<B>(f: (a: A) => B): Middleware<I, O, B> {
    return new Middleware(cf => this.run(cf).map(([a, ct]) => tuple(f(a), ct)))
  }
  ap<S, B>(this: Middleware<S, S, A>, fab: Middleware<S, S, (a: A) => B>): Middleware<S, S, B> {
    return new Middleware(c => {
      const ta = this.eval(c)
      const tab = fab.eval(c)
      return ta.ap(tab).map(b => tuple(b, c))
    })
    // return fab.chain(f => this.map(f)) // <= derived
  }
  chain<S, B>(this: Middleware<S, S, A>, f: (a: A) => Middleware<S, S, B>): Middleware<S, S, B> {
    return this.ichain(f)
  }
  ichain<Z, B>(f: (a: A) => Middleware<O, Z, B>): Middleware<I, Z, B> {
    return new Middleware(cf => this.run(cf).chain(([a, ct]) => f(a).run(ct)))
  }
}

export const of = <S, A>(a: A): Middleware<S, S, A> => {
  return new Middleware(c => task.of(tuple(a, c)))
}

export const map = <I, O, A, B>(f: (a: A) => B, fa: Middleware<I, O, A>): Middleware<I, O, B> => {
  return fa.map(f)
}

export const ap = <S, A, B>(fab: Middleware<S, S, (a: A) => B>, fa: Middleware<S, S, A>): Middleware<S, S, B> => {
  return fa.ap(fab)
}

export const chain = <S, A, B>(f: (a: A) => Middleware<S, S, B>, fa: Middleware<S, S, A>): Middleware<S, S, B> => {
  return fa.chain(f)
}

export const ichain = <I, O, Z, A, B>(
  f: (a: A) => Middleware<O, Z, B>,
  fa: Middleware<I, O, A>
): Middleware<I, Z, B> => {
  return fa.ichain(f)
}

export const modify = <I, O>(f: (c: Conn<I>) => Conn<O>): Middleware<I, O, void> => {
  return new Middleware(c => task.of(tuple(undefined, f(c))))
}

export const gets = <I, A>(f: (c: Conn<I>) => A): Middleware<I, I, A> => {
  return new Middleware(c => task.of(tuple(f(c), c)))
}

export const fromTask = <I, A>(task: Task<A>): Middleware<I, I, A> => {
  return new Middleware(c => task.map(a => tuple(a, c)))
}

export const middleware: Monad<URI> & IxMonad<URI> = {
  URI,
  map,
  of,
  ap,
  chain,
  iof: of,
  ichain
}
