import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function populateUnis() {
  const data = fs.readFileSync('./data/unis.json', 'utf8')
  const unis = JSON.parse(data)

  console.log(unis.length)

  for (const uni of unis) {
    const existingUni = await prisma.uni.findUnique({
      where: {
        name: uni.name,
      },
    })

    if (!existingUni) {
      await prisma.uni.create({
        data: {
          name: uni.name,
        },
      })
    }
  }

  await prisma.$disconnect()
}

populateUnis()