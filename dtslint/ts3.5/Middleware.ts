import { pipe } from 'fp-ts/function'
import * as _ from '../../src/Middleware'

declare const middleware1: _.Middleware<'one', 'one', number, boolean>
declare const middleware2a: _.Middleware<'one', 'two', number, string>
declare const middleware2b: _.Middleware<'one', 'two', Error, string>
declare const middleware3: _.Middleware<'two', 'three', number, string>

//
// ichainFirst
//

// $ExpectType Middleware<"one", "two", number, boolean>
pipe(
  middleware1,
  _.ichainFirst((_: boolean) => middleware2a)
)

pipe(
  middleware1,
  _.ichainFirst(() => middleware2b) // $ExpectError
)

pipe(
  middleware1,
  _.ichainFirst(() => middleware3) // $ExpectError
)

//
// ichainFirstW
//

// $ExpectType Middleware<"one", "two", number, boolean>
pipe(
  middleware1,
  _.ichainFirstW((_: boolean) => middleware2a)
)

// $ExpectType Middleware<"one", "two", number | Error, boolean>
pipe(
  middleware1,
  _.ichainFirstW(() => middleware2b)
)

pipe(
  middleware1,
  _.ichainFirstW(() => middleware3) // $ExpectError
)
