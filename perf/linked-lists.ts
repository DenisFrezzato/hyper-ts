import * as Benchmark from 'benchmark'
import { cons, nil, toArray } from '../src/express'

const suite = new Benchmark.Suite()

const empty: Array<number> = []

// // tslint:disable-next-line: no-console
// console.log(toArray(cons(4, cons(3, cons(2, cons(1, nil))))))

// // tslint:disable-next-line: no-console
// console.log([...[...[...[...empty, 1], 2], 3], 4])

suite
  .add('LinkedList', function() {
    cons(6, cons(5, cons(4, cons(3, cons(2, cons(1, nil))))))
  })
  .add('LinkedList (with toArray)', function() {
    toArray(cons(6, cons(5, cons(4, cons(3, cons(2, cons(1, nil)))))))
  })
  .add('Array', function() {
    // tslint:disable-next-line: no-unused-expression
    ;[...[...[...[...[...[...empty, 1], 2], 3], 4], 5], 6]
  })
  .on('cycle', function(event: any) {
    // tslint:disable-next-line: no-console
    console.log(String(event.target))
  })
  .on('complete', function(this: any) {
    // tslint:disable-next-line: no-console
    console.log('Fastest is ' + this.filter('fastest').map('name'))
  })
  .run({ async: true })
