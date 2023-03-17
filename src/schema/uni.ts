import { PrismaClient } from '@prisma/client'
import { objectType } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import { Node } from './helpers/index.js'

const prisma = new PrismaClient()

export const Uni = objectType({
  name: 'Uni',
  definition(t) {
    t.implements(Node)
    t.string('name')
  }
})

export const UniQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
  t.list.field('Uni', {
      type: Uni,
      resolve: () => prisma.uni.findMany()
    })
}