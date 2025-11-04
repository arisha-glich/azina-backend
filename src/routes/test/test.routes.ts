import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { API_TAGS } from '~/config/tags'
import { zodResponseSchema } from '~/lib/zod-helper'
import { UserSchema } from '~/zod/models'
export const TEST_ROUTES = {
  get_test: createRoute({
    method: 'post',
    tags: [API_TAGS.TEST],
    path: '/test',
    summary: 'Get Test',
    request: {
      body: jsonContentRequired(UserSchema, 'something'),
    },
    responses: {
      [HttpStatusCodes.OK]: jsonContent(zodResponseSchema(UserSchema), 'Some description'),
    },
  }),
}
