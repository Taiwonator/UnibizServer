import { PrismaClient } from '@prisma/client'
import { objectType } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import { Node } from './helpers/index.js'

const prisma = new PrismaClient()


export const Experience = objectType({
  name: 'Experience',
  definition(t) {
    t.implements(Node)
    t.string('name')
    t.string('astroid')
  }
})

export const ExperienceQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
  t.list.field('Experience', {
      type: Experience,
      resolve: () => prisma.experience.findMany()
    })
}