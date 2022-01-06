import { pipe } from 'fp-ts/function'
import { ReaderTask } from 'fp-ts/ReaderTask'
import * as _ from '../../src/ReaderMiddleware'

interface R1 {
  r1: string
}

interface R2 {
  r2: string
}

declare const middleware1: _.ReaderMiddleware<R1, 'one', 'one', number, boolean>
declare const middleware2a: _.ReaderMiddleware<R1, 'one', 'two', number, string>
declare const middleware2b: _.ReaderMiddleware<R2, 'one', 'two', Error, string>
declare const middleware3: _.ReaderMiddleware<R1, 'two', 'three', number, string>

declare const readerTask1: ReaderTask<R1, string>

//
// ichainFirst
//

// $ExpectType ReaderMiddleware<R1, "one", "two", number, boolean>
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

// $ExpectType ReaderMiddleware<R1, "one", "two", number, boolean>
pipe(
  middleware1,
  _.ichainFirstW((_: boolean) => middleware2a)
)

// $ExpectType ReaderMiddleware<R1 & R2, "one", "two", number | Error, boolean>
pipe(
  middleware1,
  _.ichainFirstW(() => middleware2b)
)

pipe(
  middleware1,
  _.ichainFirstW(() => middleware3) // $ExpectError
)

//
// rightReaderTask
//

// $ExpectType ReaderMiddleware<R1, StatusOpen, StatusOpen, never, string>
pipe(readerTask1, _.rightReaderTask)

//
// leftReaderTask
//

// $ExpectType ReaderMiddleware<R1, StatusOpen, StatusOpen, string, never>
pipe(readerTask1, _.leftReaderTask)
