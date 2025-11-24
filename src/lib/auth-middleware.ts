import type { Context } from 'hono'
import { profileAutoCreateService } from '~/services/profile-auto-create.service'

/**
 * Middleware to intercept admin create-user responses and auto-create profiles
 * Runs profile creation in the background when admin creates users with DOCTOR or CLINIC roles
 */
export async function handleAdminCreateUser(
  response: Response,
  context: Context
): Promise<Response> {
  if (context.req.path === '/api/auth/admin/create-user' && context.req.method === 'POST') {
    // Check if response is successful
    if (response.ok) {
      try {
        const clonedResponse = response.clone()
        const data = await clonedResponse.json()
        if (data?.user?.id && data?.user?.role) {
          profileAutoCreateService
            .createProfileIfNeeded(data.user.id, data.user.role)
            .catch((error: unknown) => {
              console.error('Error creating profile after user creation:', error)
            })
        }
      } catch (error: unknown) {
        console.error('Error intercepting admin create-user:', error)
      }
    }
  }

  return response
}
