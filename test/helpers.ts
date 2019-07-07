import * as querystring from 'qs'

export class MockRequest {
  constructor(
    readonly params?: unknown,
    readonly query: string = '',
    readonly body?: unknown,
    readonly headers: Record<string, string> = {},
    readonly originalUrl: string = '',
    readonly method: string = 'GET'
  ) {
    this.query = querystring.parse(query)
  }
  header(name: string) {
    return this.headers[name]
  }
}
