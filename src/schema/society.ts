import { PrismaClient } from '@prisma/client'
import { objectType } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import { Node } from './helpers/index.js'

const prisma = new PrismaClient()

export const Society = objectType({
  name: 'Society',
  definition(t) {
    t.implements(Node)
    t.string('name')
  }
})

export const SocietyQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
  t.list.field('Society', {
      type: Society,
      resolve: () => prisma.society.findMany()
    })
}