import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { z } from 'zod'
import { API_TAGS } from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'

export const STORAGE_ROUTES = {
  upload_file: createRoute({
    method: 'post',
    tags: [API_TAGS.STORAGE],
    path: '/upload',
    summary: 'Upload file to S3',
    description: 'Upload a file to S3 and return the public URL',
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              file: z.instanceof(File).openapi({
                description: 'File to upload',
                type: 'string',
                format: 'binary',
              }),
              directory: z.string().optional().openapi({
                description: 'Optional directory path in S3 bucket (e.g., "documents", "images")',
                example: 'documents',
              }),
            }),
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            url: z.string().openapi({
              description: 'Public URL of the uploaded file',
            }),
            key: z.string().openapi({
              description: 'S3 key/path of the uploaded file',
            }),
            uploadUrl: z.string().openapi({
              description: 'Presigned upload URL for direct upload (valid for 1 hour)',
            }),
            downloadUrl: z.string().openapi({
              description: 'Signed download URL for the uploaded file (valid for 7 days)',
            }),
            expiresAt: z.string().openapi({
              description: 'ISO timestamp when the download URL expires',
            }),
          }),
        }),
        'File uploaded successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Bad request - Invalid file or missing file'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
      [HttpStatusCodes.SERVICE_UNAVAILABLE]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'S3 storage not configured'
      ),
    },
  }),

  delete_files: createRoute({
    method: 'post',
    tags: [API_TAGS.STORAGE],
    path: '/delete',
    summary: 'Delete files from S3',
    description: 'Delete one or multiple files from S3 by their keys',
    request: {
      body: jsonContentRequired(
        z.object({
          keys: z
            .union([z.string(), z.array(z.string())])
            .openapi({
              description: 'S3 key(s) to delete. Can be a single key or an array of keys',
              example: ['documents/file1.pdf', 'documents/file2.pdf'],
            }),
        }),
        'Delete files payload'
      ),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
        }),
        'Files deleted successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Bad request'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
      [HttpStatusCodes.SERVICE_UNAVAILABLE]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'S3 storage not configured'
      ),
    },
  }),

  keys_to_signed_urls: createRoute({
    method: 'get',
    tags: [API_TAGS.STORAGE],
    path: '/keys-to-signed-urls',
    summary: 'Convert S3 keys to signed download URLs',
    description: 'Convert one or multiple S3 keys to signed download URLs',
    request: {
      query: z.object({
        keys: z
          .string()
          .openapi({
            description: 'S3 key(s) to convert. For multiple keys, use comma-separated values',
            example: 'documents/file1.pdf,documents/file2.pdf',
            param: { name: 'keys', in: 'query' },
          }),
        expiresIn: z.coerce.number().optional().openapi({
          description: 'URL expiration time in seconds (default: 604800 = 7 days)',
          example: 604800,
          param: { name: 'expiresIn', in: 'query' },
        }),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          success: z.boolean(),
          data: z.object({
            urls: z
              .union([z.string(), z.array(z.string())])
              .openapi({
                description: 'Signed URL(s). Returns string if single key, array if multiple keys',
              }),
          }),
        }),
        'Signed URLs generated successfully'
      ),
      [HttpStatusCodes.BAD_REQUEST]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Bad request'
      ),
      [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Unauthorized'
      ),
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'Internal server error'
      ),
      [HttpStatusCodes.SERVICE_UNAVAILABLE]: jsonContent(
        z.object({ message: z.string(), success: z.boolean() }),
        'S3 storage not configured'
      ),
    },
  }),
}

