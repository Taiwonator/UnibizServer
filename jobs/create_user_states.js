import { PrismaClient } from '@prisma/client'
import fs from 'fs'

// ONLY APPROPRIATE FOR OLD DATABASE

const prisma = new PrismaClient()

async function migrateCredentials() {

  console.log('migrating finished...')
  // Iterate all Users
  const users = await prisma.user.findMany()

  // Create a credentials User for each user (password only)
  // Use Id from credentials_user + userId to create a authMethod

  for(const user of users) {
    await prisma.user_state.create({
      data: { 
        userId: user.id,
        currentGroup: null, 
        previouslyLoggedIn: null
      }
    })
  }   

  await prisma.$disconnect()
}

migrateCredentials()