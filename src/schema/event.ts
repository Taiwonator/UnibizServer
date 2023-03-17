import { PrismaClient } from '@prisma/client'
import { objectType } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import { Node } from './helpers/index.js'

const prisma = new PrismaClient()

export const Event = objectType({
  name: 'Event',
  definition(t) {
    t.implements(Node)
    t.string('name')
    t.string('type')
    t.field('society', {
      type: 'Society',
      resolve: (parent) => {
        return prisma.event
          .findUnique({ where: { id: parent.id } })
          .society();
      },
    });

  }
})

export const EventQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
  t.list.field('Event', {
      type: Event,
      resolve: () => prisma.event.findMany()
    })
}