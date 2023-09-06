import * as child_process from 'child_process'
import { left, right } from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { run } from './run'

const DIST = 'dist'

const exec =
  (cmd: string, args?: child_process.ExecOptions): TE.TaskEither<Error, void> =>
  () =>
    new Promise((resolve) => {
      child_process.exec(cmd, args, (err) => {
        if (err !== null) {
          return resolve(left(err))
        }

        return resolve(right(undefined))
      })
    })

export const main = exec(`npm publish --otp=${process.env.NPM_OTP}`, {
  cwd: DIST,
})

run(main)
