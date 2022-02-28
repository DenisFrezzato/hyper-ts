import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import * as _ from '../../src/Middleware'

declare const middleware1: _.Middleware<'one', 'one', number, boolean>
declare const middleware2a: _.Middleware<'one', 'two', number, string>
declare const middleware2b: _.Middleware<'one', 'two', Error, string>
declare const middleware3: _.Middleware<'two', 'three', number, string>
declare const decoderU: (value: unknown) => E.Either<number, boolean>
declare const decoderS: (value: string) => E.Either<number, boolean>

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
