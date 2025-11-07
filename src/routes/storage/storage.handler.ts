import * as HttpStatusCodes from 'stoker/http-status-codes'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import {
  deleteObjectsFromS3,
  generateDownloadUrl,
  generateUploadUrl,
  getS3ClientInstance,
  keysToSignedUrls,
} from '~/lib/s3'
import type { STORAGE_ROUTES } from '~/routes/storage/storage.routes'
import type { HandlerMapFromRoutes } from '~/types'

function getS3Config() {
  const bucketName = Bun.env.S3_BUCKET_NAME
  const region = Bun.env.S3_BUCKET_REGION
  const accessKeyId = Bun.env.S3_ACCESS_KEY
  const secretAccessKey = Bun.env.S3_SECRET_KEY
  const awsBucketUrl = Bun.env.AWS_BUCKET_URL

  if (!bucketName || !region || !accessKeyId || !secretAccessKey || !awsBucketUrl) {
    throw new Error('Missing required S3 environment variables')
  }

  return {
    bucketName,
    region,
    accessKeyId: accessKeyId.trim(),
    secretAccessKey: secretAccessKey.trim(),
    awsBucketUrl,
  }
}

export const STORAGE_ROUTE_HANDLER: HandlerMapFromRoutes<typeof STORAGE_ROUTES> = {
  upload_file: async c => {
    try {
      const user = c.get('user')
      if (!user?.id) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const formData = await c.req.formData()
      const file = formData.get('file')
      const directory = formData.get('directory') as string | null | undefined

      if (!file || !(file instanceof File)) {
        return c.json(
          { message: 'File is required', success: false },
          HttpStatusCodes.BAD_REQUEST
        )
      }

      const role = user.role?.toLowerCase() || 'user'
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const extension = file.type.split('/')[1] || file.name.split('.').pop() || 'bin'
      const uniqueKey = `${sanitizedFileName}-${Date.now()}.${extension}`
      const key = directory ? `${role}/${directory}/${uniqueKey}` : `${role}/${uniqueKey}`

      const config = getS3Config()
      const client = getS3ClientInstance()
      const buffer = Buffer.from(await file.arrayBuffer())

      try {
        await client.send(
          new PutObjectCommand({
            Bucket: config.bucketName,
            Key: key,
            Body: buffer,
            ContentType: file.type || 'application/octet-stream',
          })
        )
      } catch (error: any) {
        console.error('❌ [S3] Upload error details:', {
          bucket: config.bucketName,
          key,
          region: config.region,
          accessKeyId: config.accessKeyId.substring(0, 8) + '...',
          errorCode: error?.Code,
          errorMessage: error?.message,
          statusCode: error?.$metadata?.httpStatusCode,
        })

        if (error?.Code === 'SignatureDoesNotMatch' || error?.name === 'SignatureDoesNotMatch') {
          throw new Error(
            'S3 signature mismatch. Please verify your S3_ACCESS_KEY and S3_SECRET_KEY are correct and match each other. ' +
            `Access Key ID: ${config.accessKeyId.substring(0, 8)}... Check your .env file for typos, incorrect values, or trailing whitespace.`
          )
        }

        throw error
      }

      const url = `${config.awsBucketUrl}/${key}`

      const uploadUrl = await generateUploadUrl(key, 3600)

      const downloadExpiryTime = 7 * 24 * 3600
      const downloadUrl = await generateDownloadUrl(key, downloadExpiryTime)
      const expiresAt = new Date(Date.now() + downloadExpiryTime * 1000).toISOString()

      return c.json(
        {
          message: 'File uploaded successfully',
          success: true,
          data: {
            url,
            key,
            uploadUrl,
            downloadUrl,
            expiresAt,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error: any) {
      console.error('Error uploading file:', error)
      if (error?.message?.includes('Missing required S3 environment variables')) {
        return c.json(
          { message: 'S3 storage is not configured. Please configure S3 environment variables.', success: false },
          HttpStatusCodes.SERVICE_UNAVAILABLE
        )
      }
      if (error?.message?.includes('signature mismatch')) {
        return c.json(
          { message: error.message, success: false },
          HttpStatusCodes.INTERNAL_SERVER_ERROR
        )
      }
      return c.json(
        { message: error?.message || 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  delete_files: async c => {
    try {
      const userId = c.get('user')?.id
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const { keys } = c.req.valid('json')

      await deleteObjectsFromS3(keys)

      return c.json(
        {
          message: 'Files deleted successfully',
          success: true,
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error deleting files:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },

  keys_to_signed_urls: async c => {
    try {
      const userId = c.get('user')?.id
      if (!userId) {
        return c.json({ message: 'Unauthorized', success: false }, HttpStatusCodes.UNAUTHORIZED)
      }

      const { keys: keysParam, expiresIn } = c.req.valid('query')
      const keysArray = keysParam.includes(',') ? keysParam.split(',').map(k => k.trim()) : [keysParam]
      const keys = keysArray.length === 1 ? keysArray[0] : keysArray

      const urls = await keysToSignedUrls(keys, expiresIn)

      return c.json(
        {
          message: 'Signed URLs generated successfully',
          success: true,
          data: {
            urls,
          },
        },
        HttpStatusCodes.OK
      )
    } catch (error) {
      console.error('Error converting keys to signed URLs:', error)
      return c.json(
        { message: 'Internal server error', success: false },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  },
}

