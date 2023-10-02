import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as TO from 'fp-ts/TaskOption'
import { pipe } from 'fp-ts/function'
import * as H from '../../src'
import * as _ from '../../src/Middleware'

declare const middleware1: _.Middleware<'one', 'one', number, boolean>
declare const middleware2a: _.Middleware<'one', 'two', number, string>
declare const middleware2b: _.Middleware<'one', 'two', Error, string>
declare const middleware3: _.Middleware<'two', 'three', number, string>
declare const decoderU: (value: unknown) => E.Either<number, boolean>
declare const decoderS: (value: string) => E.Either<number, boolean>
declare const status: H.Status
declare const statusRedirection: H.RedirectionStatus

//
// decodeParam
//

// $ExpectType Middleware<StatusOpen, StatusOpen, number, boolean>
_.decodeParam('foo', decoderU)
// $ExpectType Middleware<"one", "one", number, boolean>
_.decodeParam<'one', number, boolean>('foo', decoderU)

//
// decodeParams
//

// $ExpectType Middleware<StatusOpen, StatusOpen, number, boolean>
_.decodeParams(decoderU)
// $ExpectType Middleware<"one", "one", number, boolean>
_.decodeParams<'one', number, boolean>(decoderU)

//
// decodeQuery
//

// $ExpectType Middleware<StatusOpen, StatusOpen, number, boolean>
_.decodeQuery(decoderU)
// $ExpectType Middleware<"one", "one", number, boolean>
_.decodeQuery<'one', number, boolean>(decoderU)

//
// decodeBody
//

// $ExpectType Middleware<StatusOpen, StatusOpen, number, boolean>
_.decodeBody(decoderU)
// $ExpectType Middleware<"one", "one", number, boolean>
_.decodeBody<'one', number, boolean>(decoderU)

//
// decodeMethod
//

// $ExpectType Middleware<StatusOpen, StatusOpen, number, boolean>
_.decodeMethod(decoderS)
// $ExpectType Middleware<"one", "one", number, boolean>
_.decodeMethod<'one', number, boolean>(decoderS)

//
// decodeHeader
//

// $ExpectType Middleware<StatusOpen, StatusOpen, number, boolean>
_.decodeHeader('foo', decoderU)
// $ExpectType Middleware<"one", "one", number, boolean>
_.decodeHeader<'one', number, boolean>('foo', decoderU)

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

//
// redirect
//

// $ExpectType Middleware<StatusOpen, HeadersOpen, never, void>
_.redirect('http://www.example.com/')

// $ExpectType Middleware<StatusOpen, HeadersOpen, Error, void>
_.redirect<Error>('http://www.example.com/')

// $ExpectType Middleware<StatusOpen, HeadersOpen, never, void>
_.redirect('http://www.example.com/', statusRedirection)

// $ExpectError
_.redirect('http://www.example.com/', status)

//
// chainOptionK
//

// $ExpectType Middleware<"one", "one", number, number>
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

// $ExpectType Middleware<"one", "one", number, number>
pipe(
  middleware1,
  _.chainOptionKW(() => 1)((_: boolean) => O.some(2))
)

// $ExpectType Middleware<"one", "one", number | boolean, number>
pipe(
  middleware1,
  _.chainOptionKW(() => true)((_: boolean) => O.some(2))
)

//
// chainTaskOptionK
//

// $ExpectType Middleware<"one", "one", number, number>
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

// $ExpectType Middleware<"one", "one", number, number>
pipe(
  middleware1,
  _.chainTaskOptionKW(() => 1)((_: boolean) => TO.some(2))
)

// $ExpectType Middleware<"one", "one", number | boolean, number>
pipe(
  middleware1,
  _.chainTaskOptionKW(() => true)((_: boolean) => TO.some(2))
)

//
// chainFirstTaskOptionK
//

// $ExpectType Middleware<"one", "one", number, boolean>
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

// $ExpectType Middleware<"one", "one", number, boolean>
pipe(
  middleware1,
  _.chainFirstTaskOptionKW(() => 1)((_: boolean) => TO.some(2))
)

// $ExpectType Middleware<"one", "one", number | boolean, boolean>
pipe(
  middleware1,
  _.chainFirstTaskOptionKW(() => true)((_: boolean) => TO.some(2))
)
