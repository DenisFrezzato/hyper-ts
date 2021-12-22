# Changelog

> **Tags:**
>
> - [New Feature]
> - [Bug Fix]
> - [Breaking Change]
> - [Documentation]
> - [Internal]
> - [Polish]
> - [Experimental]

**Note**: Gaps between patch versions are faulty/broken releases. **Note**: A feature tagged as Experimental is in a
high state of flux, you're at risk of it changing without notice.

# 0.7.6

- **New Feature**
  - `Middleware`
    - Add `ichainFirst`, `ichainFirstW` (@thewilkybarkid)
  - `ReaderMiddleware`
    - Add `ichainFirst`, `ichainFirstW` (@thewilkybarkid)

# 0.7.5

- **New Feature**
  - `Middleware`
    - Add `altW`, `orElseW` (@DenisFrezzato)
  - `ReaderMiddleware`
    - Add `alt`, `altW` (@DenisFrezzato)

# 0.7.4

- **Bug Fix**
  - `Connection`
    - Fix `setBody` to accept `string | Buffer` (@DenisFrezzato)
  - `Middleware`
    - Fix `send` to accept `string | Buffer` (@DenisFrezzato)
  - `ReaderMiddleware`
    - Fix `send` to accept `string | Buffer` (@DenisFrezzato)

# 0.7.3

- **Bug Fix**
  - `Middleware`
    - Fix `pipeStream` stream type (@DenisFrezzato)
  - `ReaderMiddleware`
    - Add `pipeStream` (@DenisFrezzato)
    
# 0.7.2

- **New Feature**
  - `Middleware`
    - Add `flattenW`, `iflatten`, `iflattenW` (@mlegenhausen)
  - `ReaderMiddleware`
    - Add `flatten`, `flattenW`, `iflatten`, `iflattenW` (@mlegenhausen)
- **Deprecation**
  - `Middleware`/`ReaderMiddleware`
    - Deprecate `Do`, use `bindTo` instead (@DenisFrezzato)

# 0.7.1

- **New Feature**
  - `Middleware`
    - Add `apFirstW`
    - Add `apSecondW`
  - `ReaderMiddleware`
    - Add `apFirstW`
    - Add `apSecondW`

# 0.7.0

# 0.7.0-rc.1

* **Breaking change**
  * Upgrade to `fp-ts@2.10`
  * Add `fp-ts-contrib` as a peer-dependency
* **Deprecation**
  * Deprecate `Middleware` from `index.ts`, use `Middleware` module instead.
* **New Feature**
  * `Middleware`
    * Add `apS`
    * Add `apSW`
    * Add `chainEitherK`
    * Add `chainEitherKW`
    * Add `FromIO`
    * Add `fromIO`
    * Add `fromIOK`
    * Add `chainIOK`
    * Add `chainFirstIOK`
    * Add `FromTask`
    * Add `fromTask`
    * Add `fromTaskK`
    * Add `chainTaskK`
    * Add `chainFirstTaskK`
    * Add `chainTaskEitherK`
    * Add `chainTaskEitherKW`
    * Add `chainFirstTaskEitherK`
    * Add `chainFirstTaskEitherKW`
    * Add `imap`
    * Add `ibindTo`
    * Add `ibind`
    * Add `ibindW`
    * Add `iapS`
    * Add `iapSW`
  * `ReaderMiddleware`
    * Add `gets`
    * Add `fromConnection`
    * Add `modifyConnection`
    * Add `apFirst`
    * Add `apSecond`
    * Add `apS`
    * Add `apSW`
    * Add `FromEither`
    * Add `fromEither`
    * Add `chainEitherK`
    * Add `chainEitherKW`
    * Add `chainFirst`
    * Add `chainFirstW`
    * Add `chainFirstIOK`
    * Add `FromTask`
    * Add `fromTask`
    * Add `fromTaskK`
    * Add `chainTaskK`
    * Add `chainFirstTaskK`
    * Add `chainFirstTaskEitherK`
    * Add `chainFirstTaskEitherKW`
    * Add `chainFirstReaderTaskEitherK`
    * Add `chainFirstReaderTaskEitherKW`
    * Add `fromPredicate`
    * Add `filterOrElse`
    * Add `filterOrElseW`
    * Add `imap`
    * Add `ibindTo`
    * Add `ibind`
    * Add `ibindW`
    * Add `iapS`
    * Add `iapSW`
  * `express`
    * Improve `fromRequestHandler` #39
* **Bug Fix**
  * `ReaderMiddleware`
    * Add out type variable in `fromMiddleware`
    * Fix type signature of `apSW` adding widening or `R`
* **Internal**
  * Use `List` from `fp-ts-contrib`

# 0.6.5

- **Breaking change**
  - `ReaderMiddleware`
    - Rename `ichainMiddlewareW` to `ichainMiddlewareKW` (@DenisFrezzato)

# 0.6.4

- **Bug Fix**
  - `ReaderMiddleware`
    - Fix `ichainW` widening (@mlegenhausen)
- **New Feature**
  - `ReaderMiddleware`
    - Add `orElseW` (@mlegenhausen)

# 0.6.3

- **New feature** 
  - Add `ReaderMiddleware` #41 (@DenisFrezzato)

# 0.6.2

- **New feature** 
  - pipe stream to response, #38 (@DenisFrezzato)


# 0.6.1

- **New Feature**
  - add do notation, #37 (@kylegoetz)

# 0.6.0

- **Breaking Change**
  - add missing mainstream `status` codes, #29 (@matticala)
  - rename `ServerError` to `InternalServerError` (@gcanti)

# 0.5.3

- **Bug Fix**
  - don't set `target: es6` in `tsconfig.build-es6.json` (@gcanti)
- **Internal**
  - upgrade to latest `docs-ts` (@gcanti)

# 0.5.2

- **New Feature**
  - add build in ES6 format (@gcanti)

# 0.5.1

- **Bug Fix**
  - fix `setCookie` implementation, #23 (@DenisFrezzato)

# 0.5.0

- **Breaking Change**
  - upgrade to `fp-ts@2.x` and drop `class` encoding (@gcanti)

# 0.4.0

- **Breaking Change**
  - Complete redesign (@gcanti)

# 0.3.0

- **Breaking Change**
  - upgrade to `fp-ts@1.x.x` (@gcanti)

# 0.2.0

- **Breaking Change**
  - support koa as well as express (@leemhenson)
  - remove Status enum (@gcanti)

# 0.1.0

Initial release
