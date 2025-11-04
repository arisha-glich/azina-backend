/**
 * Script to show which roles have the extra permissions
 * Run with: bun run scripts/show-role-permissions.ts
 */

import prisma from '../src/lib/prisma'

// The 17 permissions that were skipped during cleanup
const skippedPermissions = [
  'appointment.create',
  'appointment.update',
  'appointment.delete',
  'appointment.view',
  'appointment.list',
  'appointment.manage',
  'invoice.create',
  'invoice.update',
  'invoice.delete',
  'invoice.view',
  'invoice.list',
  'invoice.approve',
  'invoice.pay',
  'approval_request.create',
  'approval_request.list',
  'approval_request.manage',
  'subscription.manage',
]

async function showRolePermissions() {
  console.log('🔍 Checking which roles have the extra permissions...\n')

  // Get all permissions
  const allPermissions = await prisma.permission.findMany({
    include: {
      roles: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      },
    },
  })

  const rolesWithPermissions: Record<string, Set<string>> = {}

  for (const perm of allPermissions) {
    const permKey = `${perm.resource}.${perm.action}`
    if (skippedPermissions.includes(permKey)) {
      for (const rolePerm of perm.roles) {
        const roleName = rolePerm.role.name || rolePerm.role.displayName
        if (!rolesWithPermissions[roleName]) {
          rolesWithPermissions[roleName] = new Set()
        }
        rolesWithPermissions[roleName].add(permKey)
      }
    }
  }

  console.log('📋 Roles with extra permissions:\n')
  for (const [roleName, perms] of Object.entries(rolesWithPermissions)) {
    console.log(`Role: ${roleName}`)
    console.log(`  Permissions (${perms.size}):`)
    Array.from(perms).forEach((p) => {
      console.log(`    - ${p}`)
    })
    console.log('')
  }

  console.log('\n💡 To remove these permissions from roles:')
  console.log('   1. Use PATCH /api/v1/admin/roles/{id} to update each role')
  console.log('   2. Send only the permission IDs you want to keep')
  console.log('   3. Then run cleanup again: bun run seed:permissions:cleanup\n')
}

showRolePermissions()
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

