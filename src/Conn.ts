import * as express from 'express'

/** state changes are tracked by the phanton type `S` */
export class Conn<S> {
  // prettier-ignore
  readonly '_S': S
  constructor(readonly req: express.Request, readonly res: express.Response) {}
}
