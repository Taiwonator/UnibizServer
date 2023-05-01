import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const saltRounds = 10

async function createPublicUsers() {

  // Create 
  for(var i = 0; i < 10; i++) {  
    const token = 'abc123'
    const hash = await bcrypt.hash(token, saltRounds)
    await prisma.public_user.create({ 
        data: {
            email: `email${i}@gmail.com`,
            token: hash
        }
    })
  }

  await prisma.$disconnect()
}

createPublicUsers()