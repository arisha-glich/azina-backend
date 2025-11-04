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
  // Only process admin create-user endpoint
  if (context.req.path === '/api/auth/admin/create-user' && context.req.method === 'POST') {
    // Check if response is successful
    if (response.ok) {
      try {
        // Clone response to read body without consuming it
        const clonedResponse = response.clone()
        const data = await clonedResponse.json()

        // If user was created successfully, create profile if needed
        if (data?.user?.id && data?.user?.role) {
          // Run in background (don't await to avoid blocking response)
          profileAutoCreateService
            .createProfileIfNeeded(data.user.id, data.user.role)
            .catch((error: unknown) => {
              console.error('Error creating profile after user creation:', error)
            })
        }
      } catch (error: unknown) {
        // If response is not JSON or parsing fails, continue normally
        console.error('Error intercepting admin create-user:', error)
      }
    }
  }

  return response
}
