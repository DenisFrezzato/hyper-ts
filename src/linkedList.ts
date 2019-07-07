export type LinkedList<A> =
  | { type: 'Nil'; length: number }
  | { type: 'Cons'; head: A; tail: LinkedList<A>; length: number }

export const nil: LinkedList<never> = { type: 'Nil', length: 0 }

export const cons = <A>(head: A, tail: LinkedList<A>): LinkedList<A> => ({
  type: 'Cons',
  head,
  tail,
  length: tail.length + 1
})

export const toArray = <A>(list: LinkedList<A>): Array<A> => {
  const len = list.length
  const r: Array<A> = new Array(len)
  let l: LinkedList<A> = list
  let i = 1
  while (l.type !== 'Nil') {
    r[len - i] = l.head
    i++
    l = l.tail
  }
  return r
}
