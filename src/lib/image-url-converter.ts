import { keysToSignedUrls } from './s3'

/**
 * Extracts S3 key from a URL.
 * If it's already a key (no http/https), returns as is.
 * If it's a full URL, extracts the key portion.
 */
function extractS3Key(urlOrKey: string): string | null {
  if (!urlOrKey) {
    return null
  }

  // If it's already a key (no protocol), return as is
  if (!urlOrKey.startsWith('http://') && !urlOrKey.startsWith('https://')) {
    return urlOrKey
  }

  // Extract key from URL
  try {
    const url = new URL(urlOrKey)
    // Remove leading slash from pathname
    return url.pathname.replace(/^\//, '')
  } catch {
    // If URL parsing fails, try to extract from common S3 URL patterns
    const awsBucketUrl = process.env.AWS_BUCKET_URL || ''
    if (urlOrKey.startsWith(awsBucketUrl)) {
      return urlOrKey.replace(awsBucketUrl + '/', '')
    }
    // If it contains s3.amazonaws.com or similar, extract path
    const s3Match = urlOrKey.match(/s3[^/]*\/[^/]+\/(.+)/)
    if (s3Match) {
      return s3Match[1].split('?')[0] // Remove query params
    }
    return null
  }
}

/**
 * Checks if a value is an S3 URL or key that should be converted to signed URL
 */
function isS3UrlOrKey(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }
  const key = extractS3Key(value)
  return key !== null && key.length > 0
}

/**
 * Recursively converts S3 URLs/keys to signed URLs in an object or array
 */
export async function convertImagesToSignedUrls(
  data: any,
  expiresIn = 7 * 24 * 3600 // 7 days default
): Promise<any> {
  if (!data) {
    return data
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return Promise.all(
      data.map(item => convertImagesToSignedUrls(item, expiresIn))
    )
  }

  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const result: any = {}
    const imageFields = [
      'image',
      'logo',
      'Logo',
      'clinicLogo',
      'signature',
      'resume',
      'idemnityInsaurance',
      'other_documents',
      'otherDocuments',
      'companyRegistrationCertificate',
      'proofOfBusinessAddress',
      'registrationCertificate',
    ]

    for (const [key, value] of Object.entries(data)) {
      // Check if this is an image field
      if (imageFields.includes(key)) {
        if (typeof value === 'string' && isS3UrlOrKey(value)) {
          // Single URL/key
          const s3Key = extractS3Key(value)
          if (s3Key) {
            try {
              const signedUrl = await keysToSignedUrls(s3Key, expiresIn)
              result[key] = typeof signedUrl === 'string' ? signedUrl : signedUrl[0]
            } catch (error) {
              console.error(`Error converting ${key} to signed URL:`, error)
              result[key] = value // Fallback to original value
            }
          } else {
            result[key] = value
          }
        } else if (Array.isArray(value)) {
          // Array of URLs/keys
          const keys: string[] = []
          const nonKeys: any[] = []

          for (const item of value) {
            if (typeof item === 'string' && isS3UrlOrKey(item)) {
              const key = extractS3Key(item)
              if (key) {
                keys.push(key)
              } else {
                nonKeys.push(item)
              }
            } else {
              nonKeys.push(item)
            }
          }

          if (keys.length > 0) {
            try {
              const signedUrls = await keysToSignedUrls(keys, expiresIn)
              const urlArray = Array.isArray(signedUrls) ? signedUrls : [signedUrls]
              result[key] = [...urlArray, ...nonKeys]
            } catch (error) {
              console.error(`Error converting ${key} array to signed URLs:`, error)
              result[key] = value // Fallback to original value
            }
          } else {
            result[key] = value
          }
        } else if (typeof value === 'object' && value !== null) {
          // Recursively process nested objects
          result[key] = await convertImagesToSignedUrls(value, expiresIn)
        } else {
          result[key] = value
        }
      } else {
        // Recursively process nested objects and arrays
        result[key] = await convertImagesToSignedUrls(value, expiresIn)
      }
    }

    return result
  }

  // Return primitive values as is
  return data
}

