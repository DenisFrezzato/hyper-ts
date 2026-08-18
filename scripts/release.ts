import * as child_process from 'child_process'
import { left, right } from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { parseArgs } from 'util'
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

const { otp } = parseArgs({
  options: { otp: { type: 'string' } },
}).values

if (otp === undefined || !/^[0-9]{6,}$/.test(otp)) {
  throw new Error('--otp is required and must be a numeric one-time password')
}

export const main = exec(`npm publish --otp ${otp}`, {
  cwd: DIST,
})

run(main)
