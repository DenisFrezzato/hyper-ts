import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { ReaderTask } from 'fp-ts/ReaderTask'
import * as M from '../../src/Middleware'
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
declare const middleware4a: M.Middleware<'one', 'one', number, boolean>
declare const middleware4b: M.Middleware<'one', 'one', Error, string>
declare const middleware5: M.Middleware<'one', 'two', number, string>

declare const readerTask1: ReaderTask<R1, string>
declare const readerTask2: ReaderTask<R2, string>

declare const decoderU: (value: unknown) => E.Either<number, boolean>
declare const decoderS: (value: string) => E.Either<number, boolean>

//
// fromReaderTaskK
//

// $ExpectType (a: boolean, b: number) => ReaderMiddleware<R1, StatusOpen, StatusOpen, never, string>
_.fromReaderTaskK((a: boolean, b: number) => readerTask1)

//
// decodeParam
//

// $ExpectType ReaderMiddleware<unknown, StatusOpen, StatusOpen, number, boolean>
_.decodeParam('foo', decoderU)
// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
_.decodeParam<R1, 'one', number, boolean>('foo', decoderU)

//
// decodeParams
//

// $ExpectType ReaderMiddleware<unknown, StatusOpen, StatusOpen, number, boolean>
_.decodeParams(decoderU)
// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
_.decodeParams<R1, 'one', number, boolean>(decoderU)

//
// decodeQuery
//

// $ExpectType ReaderMiddleware<unknown, StatusOpen, StatusOpen, number, boolean>
_.decodeQuery(decoderU)
// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
_.decodeQuery<R1, 'one', number, boolean>(decoderU)

//
// decodeBody
//

// $ExpectType ReaderMiddleware<unknown, StatusOpen, StatusOpen, number, boolean>
_.decodeBody(decoderU)
// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
_.decodeBody<R1, 'one', number, boolean>(decoderU)

//
// decodeMethod
//

// $ExpectType ReaderMiddleware<unknown, StatusOpen, StatusOpen, number, boolean>
_.decodeMethod(decoderS)
// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
_.decodeMethod<R1, 'one', number, boolean>(decoderS)

//
// decodeHeader
//

// $ExpectType ReaderMiddleware<unknown, StatusOpen, StatusOpen, number, boolean>
_.decodeHeader('foo', decoderU)
// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
_.decodeHeader<R1, 'one', number, boolean>('foo', decoderU)

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

//
// orElseMiddlewareK
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
pipe(
  middleware1,
  _.orElseMiddlewareK((_: number) => middleware4a)
)

pipe(
  middleware1,
  _.orElseMiddlewareK(() => middleware4b) // $ExpectError
)

pipe(
  middleware1,
  _.orElseMiddlewareK(() => middleware5) // $ExpectError
)

//
// orElseMiddlewareKW
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
pipe(
  middleware1,
  _.orElseMiddlewareKW((_: number) => middleware4a)
)

// $ExpectType ReaderMiddleware<R1, "one", "one", Error, string | boolean>
pipe(
  middleware1,
  _.orElseMiddlewareKW(() => middleware4b)
)

pipe(
  middleware1,
  _.orElseMiddlewareKW(() => middleware5) // $ExpectError
)

//
// chainReaderTaskKW
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, string>
pipe(
  middleware1,
  _.chainReaderTaskKW(() => readerTask1)
)

// $ExpectType ReaderMiddleware<R1 & R2, "one", "one", number, string>
pipe(
  middleware1,
  _.chainReaderTaskKW(() => readerTask2)
)

//
// chainReaderTaskK
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, string>
pipe(
  middleware1,
  _.chainReaderTaskK(() => readerTask1)
)

pipe(
  middleware1,
  _.chainReaderTaskK(() => readerTask2) // $ExpectError
)

//
// chainFirstReaderTaskKW
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
pipe(
  middleware1,
  _.chainFirstReaderTaskKW(() => readerTask1)
)

// $ExpectType ReaderMiddleware<R1 & R2, "one", "one", number, boolean>
pipe(
  middleware1,
  _.chainFirstReaderTaskKW(() => readerTask2)
)

//
// chainFirstReaderTaskK
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
pipe(
  middleware1,
  _.chainFirstReaderTaskK(() => readerTask1)
)

pipe(
  middleware1,
  _.chainFirstReaderTaskK(() => readerTask2) // $ExpectError
)
