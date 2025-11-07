import * as z from 'zod'

// Create zod schema for env variables
const envSchema = z.object({
  PORT_NO: z.coerce.number(),
  // S3 Configuration (optional - for storage functionality)
  S3_BUCKET_NAME: z.string().optional(),
  S3_BUCKET_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  AWS_BUCKET_URL: z.string().optional(), // Made optional without URL validation to prevent errors
})

export async function parseENV() {
  try {
    envSchema.parse(Bun.env)
  } catch (err) {
    console.error('Invalid Env variables Configuration::::', err)
    process.exit(1)
  }
}

declare module 'bun' {
  interface Env extends z.TypeOf<typeof envSchema> {}
}
