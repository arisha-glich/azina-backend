import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getS3Config() {
  const bucketName = Bun.env.S3_BUCKET_NAME
  const region = Bun.env.S3_BUCKET_REGION
  const accessKeyId = Bun.env.S3_ACCESS_KEY
  const secretAccessKey = Bun.env.S3_SECRET_KEY
  const awsBucketUrl = Bun.env.AWS_BUCKET_URL

  if (!bucketName || !region || !accessKeyId || !secretAccessKey || !awsBucketUrl) {
    const error = new Error('Missing required S3 environment variables. Please set S3_BUCKET_NAME, S3_BUCKET_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, and AWS_BUCKET_URL in your .env file.')
    console.error('❌ [S3] Missing environment variables:', error.message)
    throw error
  }

  if (accessKeyId.length < 16 || accessKeyId.length > 128) {
    console.warn('⚠️ [S3] Access key length seems unusual:', accessKeyId.length)
  }

  if (accessKeyId.includes(' ') || secretAccessKey.includes(' ')) {
    console.warn('⚠️ [S3] Warning: Credentials may contain spaces - check for leading/trailing whitespace')
  }
  return {
    bucketName,
    region,
    accessKeyId: accessKeyId.trim(),
    secretAccessKey: secretAccessKey.trim(),
    awsBucketUrl,
  }
}

let s3ClientInstance: S3Client | null = null
let s3ConfigInstance: ReturnType<typeof getS3Config> | null = null
let s3ConfigError: Error | null = null

function getS3Client() {
  if (s3ConfigError) {
    throw s3ConfigError
  }
  if (!s3ClientInstance) {
    try {
      const config = getS3Config()
      s3ConfigInstance = config
      s3ClientInstance = new S3Client({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      })
    } catch (error) {
      s3ConfigError = error as Error
      console.error('❌ [S3] Error initializing S3 client:', error)
      throw error
    }
  }
  return s3ClientInstance
}

function getS3ConfigInstance() {
  if (s3ConfigError) {
    throw s3ConfigError
  }
  if (!s3ConfigInstance) {
    try {
      s3ConfigInstance = getS3Config()
    } catch (error) {
      s3ConfigError = error as Error
      throw error
    }
  }
  return s3ConfigInstance
}

export function getS3ClientInstance() {
  return getS3Client()
}

export const s3Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    return getS3Client()[prop as keyof S3Client]
  },
})

export const uploadFileToS3 = async (file: File, directory?: string): Promise<string> => {
  const config = getS3ConfigInstance()
  const client = getS3Client()

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const extension = file.type.split('/')[1] || 'bin'
  const uniqueKey = `${sanitizedFileName}-${Date.now()}.${extension}`
  const key = directory ? `${directory}/${uniqueKey}` : uniqueKey

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
    return `${config.awsBucketUrl}/${key}`
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
}

export const deleteObjectsFromS3 = async (keys: string | string[]): Promise<void> => {
  const config = getS3ConfigInstance()
  const client = getS3Client()
  const keysArray = Array.isArray(keys) ? keys : [keys]

  await client.send(
    new DeleteObjectsCommand({
      Bucket: config.bucketName,
      Delete: {
        Objects: keysArray.map(key => ({ Key: key })),
        Quiet: false,
      },
    })
  )
}

export const generateUploadUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  const config = getS3ConfigInstance()
  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn })
}

export const generateDownloadUrl = async (
  key: string,
  expiresIn = 3600,
  options?: { download?: boolean; filename?: string }
): Promise<string> => {
  const config = getS3ConfigInstance()
  const client = getS3Client()
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ...(options?.download
      ? {
          ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
            options.filename ?? key.split('/').pop() ?? 'download'
          )}"`,
        }
      : {}),
  })

  return getSignedUrl(client, command, { expiresIn })
}

export const generatePublicUploadUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  const config = getS3ConfigInstance()
  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn })
}

export const getPublicAssetUrl = (key: string): string => {
  const config = getS3ConfigInstance()
  return `${config.awsBucketUrl}/${key}`
}

export const keysToSignedUrls = async (
  keys: string | string[],
  expiresIn = 7 * 24 * 3600,
  options?: { download?: boolean }
): Promise<string | string[]> => {
  if (typeof keys === 'string') {
    return generateDownloadUrl(keys, expiresIn, options)
  }

  return Promise.all(keys.map(key => generateDownloadUrl(key, expiresIn, options)))
}

