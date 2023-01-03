import { PrismaClient } from '@prisma/client'
import { objectType } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import { Node } from './helpers/index.js'

const prisma = new PrismaClient()

export const Union = objectType({
  name: 'Union',
  definition(t) {
    t.implements(Node)
    t.string('name')
  }
})

export const UnionQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
  t.list.field('Union', {
      type: Union,
      resolve: () => prisma.union.findMany()
    })
}