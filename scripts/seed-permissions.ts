/**
 * Seed script to create all permissions in the database
 * Run with: bun run scripts/seed-permissions.ts
 * Or: bun run seed:permissions
 *
 * This script creates permissions based on auth-permissions.ts statement configuration
 *
 * To clean up and only keep seeded permissions, run with CLEANUP=true:
 * CLEANUP=true bun run scripts/seed-permissions.ts
 */

import prisma from '../src/lib/prisma'
import { SEEDED_PERMISSIONS, SEEDED_PERMISSIONS_SET } from '../src/config/seeded-permissions'

// All permissions based on auth-permissions.ts statement configuration
// Matches the resources and actions defined in src/lib/auth-permissions.ts
const permissions = SEEDED_PERMISSIONS

// Use the seeded permissions set from config
const validPermissions = SEEDED_PERMISSIONS_SET

async function cleanupPermissions() {
  console.log('🧹 Cleaning up permissions not in seed list...\n')

  // Get all permissions from database
  const allPermissions = await prisma.permission.findMany({
    include: {
      roles: {
        select: {
          roleId: true,
        },
      },
    },
  })

  const permissionsToDelete = allPermissions.filter(
    (perm) => !validPermissions.has(`${perm.resource}:${perm.action}`)
  )

  if (permissionsToDelete.length === 0) {
    console.log('✅ No permissions to clean up. All permissions are valid.\n')
    return 0
  }

  console.log(`📋 Found ${permissionsToDelete.length} permissions to delete:\n`)

  let deletedCount = 0
  let skippedCount = 0
  for (const perm of permissionsToDelete) {
    // Check if permission is assigned to any roles
    if (perm.roles.length > 0) {
      console.log(
        `⚠️  Skipping ${perm.resource}.${perm.action} (ID: ${perm.id}) - assigned to ${perm.roles.length} role(s)`
      )
      skippedCount++
      continue
    }

    try {
      await prisma.permission.delete({
        where: { id: perm.id },
      })
      console.log(`🗑️  Deleted: ${perm.resource}.${perm.action} (ID: ${perm.id})`)
      deletedCount++
    } catch (error: any) {
      console.error(
        `❌ Error deleting ${perm.resource}.${perm.action}:`,
        error.message
      )
    }
  }

  console.log(`\n✨ Cleanup complete!`)
  console.log(`   Deleted: ${deletedCount} permissions`)
  console.log(`   Skipped: ${skippedCount} permissions (assigned to roles)\n`)

  return deletedCount
}

async function seedPermissions() {
  // Check for CLEANUP flag from environment variable or command line argument
  const shouldCleanup = process.env.CLEANUP === 'true' || process.argv.includes('--cleanup')

  if (shouldCleanup) {
    await cleanupPermissions()
  }

  console.log('🌱 Starting permission seeding...\n')

  let created = 0
  let skipped = 0
  const createdPermissions: Array<{
    id: string
    resource: string
    action: string
  }> = []
  const skippedPermissions: Array<{
    id: string
    resource: string
    action: string
  }> = []

  for (const perm of permissions) {
    try {
      // Try to create the permission (will fail if it already exists due to unique constraint)
      const permission = await prisma.permission.create({
        data: perm,
      })
      console.log(`✅ Created: ${perm.resource}.${perm.action} (ID: ${permission.id})`)
      created++
      createdPermissions.push({
        id: permission.id,
        resource: permission.resource,
        action: permission.action,
      })
    } catch (error: any) {
      // Check if error is due to unique constraint (permission already exists)
      if (error.code === 'P2002') {
        // Fetch existing permission to get its ID
        const existing = await prisma.permission.findUnique({
          where: {
            resource_action: {
              resource: perm.resource,
              action: perm.action,
            },
          },
        })
        if (existing) {
          console.log(`⏭️  Skipped: ${perm.resource}.${perm.action} (ID: ${existing.id}) - already exists`)
          skippedPermissions.push({
            id: existing.id,
            resource: existing.resource,
            action: existing.action,
          })
        } else {
          console.log(`⏭️  Skipped: ${perm.resource}.${perm.action} - already exists`)
        }
        skipped++
      } else {
        console.error(`❌ Error creating ${perm.resource}.${perm.action}:`, error.message)
        throw error
      }
    }
  }

  console.log(`\n✨ Seeding complete!`)
  console.log(`   Created: ${created} permissions`)
  console.log(`   Skipped: ${skipped} permissions (already exist)`)
  console.log(`   Total: ${permissions.length} permissions\n`)

  // Summary by resource
  const byResource: Record<string, number> = {}
  ;[...createdPermissions, ...skippedPermissions].forEach((p) => {
    byResource[p.resource] = (byResource[p.resource] || 0) + 1
  })

  console.log('📊 Summary by resource:')
  Object.entries(byResource)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([resource, count]) => {
      console.log(`   ${resource}: ${count} permissions`)
    })

  console.log('\n💡 Next steps:')
  console.log('   1. Use GET /api/v1/admin/permissions?grouped=true to fetch all permissions')
  console.log('   2. Create roles with permission IDs using POST /api/v1/admin/roles\n')

  if (!shouldCleanup) {
    console.log('💡 Tip: Run with cleanup flag to remove permissions not in seed list:')
    console.log('   PowerShell: $env:CLEANUP="true"; bun run seed:permissions')
      console.log('   Or: bun run seed:permissions:cleanup')
  }
}

// Run the seed function
seedPermissions()
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
