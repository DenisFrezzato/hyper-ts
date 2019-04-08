import * as Benchmark from 'benchmark'
import { cons, nil, toArray } from '../src/express'

const suite = new Benchmark.Suite()

const empty: Array<number> = []

// // tslint:disable-next-line: no-console
// console.log(toArray(cons(4, cons(3, cons(2, cons(1, nil))))))

// // tslint:disable-next-line: no-console
// console.log([...[...[...[...empty, 1], 2], 3], 4])

const one = { value: 1 }
const two = { value: 2 }
const three = { value: 3 }
const four = { value: 4 }
const five = { value: 5 }
const six = { value: 6 }

suite
  .add('LinkedList', function() {
    cons(six, cons(five, cons(four, cons(three, cons(two, cons(one, nil))))))
  })
  .add('LinkedList (with toArray)', function() {
    toArray(cons(six, cons(five, cons(four, cons(three, cons(two, cons(one, nil)))))))
  })
  .add('Array (spread)', function() {
    // tslint:disable-next-line: no-unused-expression
    ;[...[...[...[...[...[...empty, one], two], three], four], five], six]
  })
  .add('Array (concat)', function() {
    // tslint:disable-next-line: no-unused-expression
    ;([] as Array<{ value: number }>)
      .concat(one)
      .concat(two)
      .concat(three)
      .concat(four)
      .concat(five)
      .concat(six)
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
