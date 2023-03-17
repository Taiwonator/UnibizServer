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
    t.nullable.field('uni', {
      type: 'Uni',
      resolve: (parent) => {
        return prisma.union.findUnique({
          where: {
            id: parent.id
          }
        }).uni()
      }
    })
     t.list.field('users', {
      type: 'User',
      resolve: (parent) => {
        return prisma.user.findMany({
          where: {
            unionIds: {
              hasSome: [parent.id]
            }
          }
        })
      }
    })
    t.list.field('societies', {
      type: 'Society',
      resolve: (parent) => {
        return prisma.society.findMany({
          where: {
            union: {
              id: parent.id
            }
          }
        })
      }
    })
    t.list.field('societyRequests', {
      type: 'Society',
      resolve: (parent) => {
        return prisma.society.findMany({
          where: {
            unionRequestIds: {
              hasSome: [parent.id]
            }
          }
        })
      }
    })
    t.list.field('userRequests', {
      type: 'User',
      resolve: (parent) => {
        return prisma.user.findMany({
          where: {
            unionRequestIds: {
              hasSome: [parent.id]
            }
          }
        })
      }
    })
  }
})

export const UnionQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
  t.list.field('Union', {
      type: Union,
      resolve: () => prisma.union.findMany()
    })
}