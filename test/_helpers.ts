import * as querystring from 'qs'
import { ExpressConnection } from '../src/express'

export class MockRequest {
  query: querystring.ParsedQs

  constructor(
    readonly params?: unknown,
    readonly rawQuery: string = '',
    readonly body?: unknown,
    readonly headers: Record<string, string> = {},
    readonly originalUrl: string = '',
    readonly method: string = 'GET'
  ) {
    this.query = querystring.parse(rawQuery)
  }
  header(name: string) {
    return this.headers[name]
  }
}

export class MockConnection<S> extends ExpressConnection<S> {
  constructor(req: MockRequest) {
    super(req as any, null as any)
  }
}
