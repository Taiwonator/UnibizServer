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
    t.list.field('users', {
      type: 'User',
      resolve: (parent) => {
        console.log(parent.id)
        return prisma.user.findMany({
          where: {
            societyIds: {
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
            societyRequests: {
              some: {
                id: parent.id
              }
            }
          }
        })
      }
    })
    t.list.field('union', {
      type: 'Union',
      resolve: (parent) => {
        return prisma.union.findMany({
          where: {
            societies: {
              some: {
                id: parent.id
              }
            }
          }
        })
      }
    })

    t.list.field('unionRequests', {
      type: 'Union',
      resolve: (parent) => {
        return prisma.union.findMany({
          where: {
            societyRequestIds: {
              hasSome: [parent.id]
            }
          }
        })
      }
    })
    t.list.field('events', {
      type: 'Event',
      resolve: (parent) => {
        return prisma.event.findMany({
          where: {
            societyId: parent.id
          }
        })
      }
    })
  }
})

export const SocietyQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
  t.list.field('Society', {
      type: Society,
      resolve: () => prisma.society.findMany()
    })
}