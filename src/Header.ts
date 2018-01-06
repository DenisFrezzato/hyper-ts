import { MediaType } from './MediaType'

export type Header = [string, string]

export const contentType = (mediaType: MediaType): Header => ['Content-Type', mediaType]

export const location = (uri: string): Header => ['Location', uri]
