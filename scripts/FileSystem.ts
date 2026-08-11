import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { promises as fsp } from 'fs'
import G from 'glob'

export interface FileSystem {
  readonly readFile: (path: string) => TE.TaskEither<Error, string>
  readonly writeFile: (path: string, content: string) => TE.TaskEither<Error, void>
  readonly copyFile: (from: string, to: string) => TE.TaskEither<Error, void>
  readonly glob: (pattern: string) => TE.TaskEither<Error, ReadonlyArray<string>>
  readonly mkdir: (path: string) => TE.TaskEither<Error, void>
}

const readFile = (path: string): TE.TaskEither<Error, string> =>
  TE.tryCatch(() => fsp.readFile(path, 'utf8'), E.toError)

const writeFile = (path: string, content: string): TE.TaskEither<Error, void> =>
  TE.tryCatch(() => fsp.writeFile(path, content), E.toError)

const copyFile = (from: string, to: string): TE.TaskEither<Error, void> =>
  TE.tryCatch(() => fsp.copyFile(from, to), E.toError)

const glob = TE.taskify<string, Error, ReadonlyArray<string>>(G)

const mkdir = (path: string): TE.TaskEither<Error, void> =>
  TE.tryCatch(() => fsp.mkdir(path).then(() => undefined), E.toError)

export const fileSystem: FileSystem = {
  readFile,
  writeFile,
  copyFile,
  glob,
  mkdir,
}
