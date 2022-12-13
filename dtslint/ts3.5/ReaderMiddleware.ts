import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import { ReaderEither } from 'fp-ts/ReaderEither'
import { ReaderTask } from 'fp-ts/ReaderTask'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import * as TO from 'fp-ts/TaskOption'
import * as H from '../../src'
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

declare const readerEither1: ReaderEither<R1, number, string>

declare const readerTask1: ReaderTask<R1, string>
declare const readerTask2: ReaderTask<R2, string>

declare const readerTaskEither1: ReaderTaskEither<R1, number, string>
declare const readerTaskEither2: ReaderTaskEither<R2, Error, string>

declare const decoderU: (value: unknown) => E.Either<number, boolean>
declare const decoderS: (value: string) => E.Either<number, boolean>

//
// fromReaderEither
//

// $ExpectType ReaderMiddleware<R1, StatusOpen, StatusOpen, number, string>
_.fromReaderEither(readerEither1)

//
// asksReaderMiddlewareW
//

// $ExpectType ReaderMiddleware<R1 & R2, StatusOpen, StatusOpen, string, boolean>
_.asksReaderMiddlewareW((r: R1) => _.of<R2, H.StatusOpen, string, boolean>(true))

//
// asksReaderMiddleware
//

// $ExpectType ReaderMiddleware<R1, StatusOpen, StatusOpen, string, boolean>
_.asksReaderMiddleware((r: R1) => _.of<R1, H.StatusOpen, string, boolean>(true))

// $ExpectError
_.asksReaderMiddleware((r: R1) => _.of<R2, H.StatusOpen, string, boolean>(true))

//
// fromReaderTaskK
//

// $ExpectType (a: boolean, b: number) => ReaderMiddleware<R1, StatusOpen, StatusOpen, never, string>
_.fromReaderTaskK((a: boolean, b: number) => readerTask1)

//
// fromReaderEitherK
//

// $ExpectType (a: boolean, b: number) => ReaderMiddleware<R1, StatusOpen, StatusOpen, number, string>
_.fromReaderEitherK((a: boolean, b: number) => readerEither1)

//
// fromReaderTaskEitherK
//

// $ExpectType (a: boolean, b: number) => ReaderMiddleware<R1, StatusOpen, StatusOpen, number, string>
_.fromReaderTaskEitherK((a: boolean, b: number) => readerTaskEither1)

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
// chainTaskOptionK
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, number>
pipe(
  middleware1,
  _.chainTaskOptionK(() => 1)((_: boolean) => TO.some(2))
)

pipe(
  middleware1,
  _.chainTaskOptionK(() => true)((_: boolean) => TO.some(2)) // $ExpectError
)

//
// chainTaskOptionKW
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, number>
pipe(
  middleware1,
  _.chainTaskOptionKW(() => 1)((_: boolean) => TO.some(2))
)

// $ExpectType ReaderMiddleware<R1, "one", "one", number | boolean, number>
pipe(
  middleware1,
  _.chainTaskOptionKW(() => true)((_: boolean) => TO.some(2))
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
// chainReaderTaskEitherKW
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, string>
pipe(
  middleware1,
  _.chainReaderTaskEitherKW(() => readerTaskEither1)
)

// $ExpectType ReaderMiddleware<R1 & R2, "one", "one", number | Error, string>
pipe(
  middleware1,
  _.chainReaderTaskEitherKW(() => readerTaskEither2)
)

//
// chainReaderTaskEitherK
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, string>
pipe(
  middleware1,
  _.chainReaderTaskEitherK(() => readerTaskEither1)
)

pipe(
  middleware1,
  _.chainReaderTaskEitherK(() => readerTaskEither2) // $ExpectError
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

//
// chainFirstReaderTaskEitherKW
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
pipe(
  middleware1,
  _.chainFirstReaderTaskEitherKW(() => readerTaskEither1)
)

// $ExpectType ReaderMiddleware<R1 & R2, "one", "one", number | Error, boolean>
pipe(
  middleware1,
  _.chainFirstReaderTaskEitherKW(() => readerTaskEither2)
)

//
// chainFirstReaderTaskEitherK
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
pipe(
  middleware1,
  _.chainFirstReaderTaskEitherK(() => readerTaskEither1)
)

pipe(
  middleware1,
  _.chainFirstReaderTaskEitherK(() => readerTaskEither2) // $ExpectError
)

//
// chainOptionK
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, number>
pipe(
  middleware1,
  _.chainOptionK(() => 1)((_: boolean) => O.some(2))
)

pipe(
  middleware1,
  _.chainOptionK(() => true)((_: boolean) => O.some(2)) // $ExpectError
)

//
// chainOptionKW
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, number>
pipe(
  middleware1,
  _.chainOptionKW(() => 1)((_: boolean) => O.some(2))
)

// $ExpectType ReaderMiddleware<R1, "one", "one", number | boolean, number>
pipe(
  middleware1,
  _.chainOptionKW(() => true)((_: boolean) => O.some(2))
)

//
// chainFirstTaskOptionK
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
pipe(
  middleware1,
  _.chainFirstTaskOptionK(() => 1)((_: boolean) => TO.some(2))
)

pipe(
  middleware1,
  _.chainFirstTaskOptionK(() => true)((_: boolean) => TO.some(2)) // $ExpectError
)

//
// chainFirstTaskOptionKW
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
pipe(
  middleware1,
  _.chainFirstTaskOptionKW(() => 1)((_: boolean) => TO.some(2))
)

// $ExpectType ReaderMiddleware<R1, "one", "one", number | boolean, boolean>
pipe(
  middleware1,
  _.chainFirstTaskOptionKW(() => true)((_: boolean) => TO.some(2))
)
