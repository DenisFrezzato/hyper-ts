import {
    APIGatewayProxyEvent,
    APIGatewayProxyCallback,
    APIGatewayProxyHandler,
    Context,
    APIGatewayProxyResult
} from 'aws-lambda'
import {
    Connection,
    CookieOptions,
    Middleware,
    HeadersOpen,
    ResponseEnded,
    Status,
    execMiddleware
} from '.'
import {
    Action,
    LinkedList,
    nil,
    cons,
    toArray
} from './express'
import { pipe } from 'fp-ts/lib/pipeable'
import * as E from 'fp-ts/lib/Either'

/**
 * @internal
 * just repeat https://github.com/gcanti/hyper-ts/blob/master/src/express.ts#L71
 */
const endResponse: Action = { type: 'endResponse' }

export class ServerlessConnection<S> implements Connection<S> {
    readonly _S!: S
    constructor(
        readonly event: APIGatewayProxyEvent,
        readonly context: Context,
        readonly callback: APIGatewayProxyCallback,
        readonly resp: APIGatewayProxyResult,
        readonly actions: LinkedList<Action> = nil,
        readonly ended: boolean = false
    ) { }

    /**
     * @since 0.5.0
     */
    chain<T>(action: Action, ended: boolean = false): ServerlessConnection<T> {
        return new ServerlessConnection<T>(this.event, this.context, this.callback, this.resp, cons(action, this.actions), ended)
    }

    getRequest(): APIGatewayProxyEvent {
        return this.event
    }

    getBody(): unknown {
        return this.event.body
    }

    getHeader(name: string): Array<String> | string | undefined {
        return this.event.headers[name] ?? this.event.multiValueHeaders[name]
    }

    getParams(): { [name: string]: string } {
        return this.event.pathParameters ?? {}
    }

    getQuery(): { [name: string]: string | Array<String> } {
        return Object.assign({}, this.event.queryStringParameters, this.event.multiValueQueryStringParameters)
    }

    getOriginalUrl(): string {
        // TODO: How to get orignal Url?
        return this.event.path
    }

    getMethod(): string {
        return this.event.httpMethod
    }

    setCookie(name: string, value: string, options: CookieOptions): ServerlessConnection<HeadersOpen> {
        return this.chain({ type: 'setCookie', name, value, options })
    }

    clearCookie(name: string, options: CookieOptions): ServerlessConnection<HeadersOpen> {
        return this.chain({ type: 'clearCookie', name, options })
    }

    setHeader(name: string, value: string): ServerlessConnection<HeadersOpen> {
        return this.chain({ type: 'setHeader', name, value })
    }

    setStatus(status: Status): ServerlessConnection<HeadersOpen> {
        return this.chain({ type: 'setStatus', status })
    }

    setBody(body: unknown): ServerlessConnection<ResponseEnded> {
        return this.chain({ type: 'setBody', body }, true)
    }

    endResponse(): ServerlessConnection<ResponseEnded> {
        return this.chain(endResponse, true)
    }
}

function run(res: APIGatewayProxyResult, action: Action): APIGatewayProxyResult {
    switch (action.type) {
        case 'clearCookie':
            // TODO: support cookie clear
            return res
        case 'endResponse':
            return res
        case 'setBody':
            res.body = action.body as string
            return res
        case 'setCookie':
            // TODO: support cookie set
            return res
        case 'setHeader':
            if (res.headers === undefined) res.headers = {}
            res.headers[action.name] = action.value
            return res
        case 'setStatus':
            res.statusCode = action.status
            return res
    }
}

const errorHanlder = (callback: APIGatewayProxyCallback) => (err?: any) => {
    callback(err)
}

function exec<I, O, E>(
    middleware: Middleware<I, O, E, void>,
    event: APIGatewayProxyEvent,
    context: Context,
    callback: APIGatewayProxyCallback,
    resp: APIGatewayProxyResult
): Promise<void> {
    return execMiddleware(middleware, new ServerlessConnection<I>(event, context, callback, resp))().then(e =>
        pipe(
            e,
            E.fold(errorHanlder(callback), c => {
                const { actions: list, resp, ended } = c as ServerlessConnection<O>
                const len = list.length
                const actions = toArray(list)
                for (let i = 0; i < len; i++) {
                    run(resp, actions[i])
                }
                if (!ended) {
                    errorHanlder(callback)(new Error('unexpected middleware status: no response generated!'))
                } else {
                    callback(null, resp)
                }
            })
        )
    )
}

export function toRequestHandler<I, O, E>(middleware: Middleware<I, O, E, void>): APIGatewayProxyHandler {
    return (event, context, callback) => {
        // create default response here
        exec(middleware, event, context, callback, {
            statusCode: 200,
            body: ""
        })
    }
}