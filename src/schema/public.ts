import { interfaceType, objectType, unionType, enumType, nonNull, stringArg, list, arg, mutationField } from 'nexus'
import { PrismaClient, EventType, Prisma } from '@prisma/client'
import { createJWT, EventTypeEnum, Location, LocationTypeEnum, Node } from './helpers/index.js'
import { TypePredicateKind } from 'typescript'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import bcrypt from 'bcrypt'


const prisma = new PrismaClient()

const locationPublicFields: Prisma.locationSelect = {
    address: true,
    link: true,
    type: true
}

var eventPublicFields: Prisma.eventSelect = { 
    id: true,
    description: true,
    name: true,
    location: { select: locationPublicFields },
    tags: true, 
    date: true,
    thumbnailUrl: true, 
    bannerUrl: true, 
    eventImageUrls: true,
    registerLink: true, 
    likes: true
}

var societyPublicFields: Prisma.societySelect = {
    name: true, 
    shortName: true,
    description: true, 
    imageUrl: true,
    events: { select: eventPublicFields }
}

var unionPublicFields: Prisma.unionSelect = {
    name: true, 
    shortName: true,
    imageUrl: true,
    societies: { select: societyPublicFields },
    uni: true
}

eventPublicFields = { ...eventPublicFields, society: { select: societyPublicFields } }
societyPublicFields = { ...societyPublicFields, union: { select: unionPublicFields } }

// Public Event
export const PublicEvent = objectType({
  name: 'PublicEvent',
  definition(t) {
    t.implements(Node)
    t.string('name')
    t.string('description')
    t.list.field('tags', { type: EventTypeEnum })
    t.string('thumbnailUrl')
    t.string('bannerUrl')
    t.list.string('eventImageUrls')
    t.int('likes')
    t.string('date')
    t.string('registerLink')
    t.string('createdAt')
    t.string('updatedAt')
    t.field('location', {
      type: Location,
      resolve: (parent) => {
        return prisma.event
          .findUnique({ where: { id: parent.id } })
          .location({ select: locationPublicFields });
      },
    });
    t.field('society', {
      type: 'Society',
      resolve: (parent) => {
        return prisma.event
          .findUnique({ where: { id: parent.id } })
          .society({ select: societyPublicFields });
      },
    });
  }
})

export const PublicEventQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
     t.list.field('PublicEvent', {
      type: PublicEvent,
      args: {
        name: stringArg(),
        societyName: stringArg(),
        unionName: stringArg(),
        tags: arg({ type: list(EventTypeEnum)})
      },
      resolve: async (_, { name, societyName, unionName, tags }) => {
        const eTags: EventType[] = tags
        let where: Prisma.eventWhereInput = {};
        if(name) {
          where = { ...where, name };
        }
        if (societyName) {
          where = { ...where, society: { name: societyName } };
        }
        if (unionName) {
          where = { ...where, society: { union: { name: unionName } } };
        }
        if (eTags) { 
        where = {
          ...where,
          tags: { hasSome: eTags.map((tag: string) => EventType[tag]) },
        }
      }
        try {
          const events = await prisma.event.findMany({
            where,
            orderBy: {
              date: 'desc'
            },
            select: eventPublicFields
          });
          return events;
        } catch(err) {
          console.log(err)
        }
      },
    });

    t.list.field('FindPastPublicEvents', {
      type: PublicEvent,
      args: {
        name: stringArg(),
        societyName: stringArg(),
        unionName: stringArg(),
        tags: arg({ type: list(EventTypeEnum)})
      },
      resolve: async (_, { name, societyName, unionName, tags }) => {
        const eTags: EventType[] = tags
        let where: Prisma.eventWhereInput = {};
        if(name) {
          where = { ...where, name };
        }
        if (societyName) {
          where = { ...where, society: { name: societyName } };
        }
        if (unionName) {
          where = { ...where, society: { union: { name: unionName } } };
        }
         if (eTags) { 
            where = {
            ...where,
            tags: { hasSome: eTags.map((tag: string) => EventType[tag]) },
            }
        }

        try { 
          const now = new Date();
          const endOfDay = new Date(now.setHours(23, 59, 59, 999));
          const events = await prisma.event.findMany({
            where: {
              ...where,
              date: { lt: endOfDay },
            },
            select: eventPublicFields,
            orderBy: {
              date: 'desc',
            },
          });
          return events;
        } catch(err) {
          console.log(err)
          return null
        }
      },
    });

    t.list.field('FindSimilarPublicEvents', {
      type: PublicEvent,
      args: {
        eventId: nonNull(stringArg()),
      },
      resolve: async (_, { eventId }) => {
        const event = await prisma.event.findUnique({ where: { id: eventId }, select: eventPublicFields });
        if (!event) {
          throw new Error(`Event with ID ${eventId} not found.`);
        }
        const currentTime = new Date();
        const events = await prisma.event.findMany({
          select: eventPublicFields,
          where: {
            AND: [
              { id: { not: { equals: eventId } } },
              { tags: { hasSome: event.tags?.map((tag: string) => EventType[tag]) } },
              { date: { gt: currentTime }}
            ],
          },
        });
        const sortedEvents = events.sort((a, b) => {
          const aTags = a.tags?.filter((tag) => event.tags?.includes(tag)) || [];
          const bTags = b.tags?.filter((tag) => event.tags?.includes(tag)) || [];
          return bTags.length - aTags.length;
        });
        return sortedEvents;
      },
    });

    t.list.field('FindUnverifiedPublicEvents', {
      type: PublicEvent,
      resolve: async () => {
         let where: Prisma.eventWhereInput = {
            society: {
              unionId: null
            }
          }
        try { 
          const now = new Date();
          const endOfDay = new Date(now.setHours(23, 59, 59, 999));
          const events = await prisma.event.findMany({
            where: {
              ...where,
              date: { lt: endOfDay },
            },
            orderBy: {
              date: 'desc',
            },
            select: eventPublicFields
          });
          return events;
        } catch(err) {
          console.log(err)
          return null
        }
      },
    });
}

export const GeneratePublicUserToken = mutationField('generatePublicUserToken', {
  type: 'AuthenticatedUserResponse',
  args: {
    email: stringArg(),
    token: stringArg()
  },
  resolve: async(_, args) => {

    const { email, token } = args
    try {
      const user = await prisma.public_user.findUnique({ where: { email }})
      if(await bcrypt.compare(token, user.token)) {
        const jwt = createJWT({  
          id: user.id,
          email: user.email,
      })
        
        return { jwt }
      } else {
        return { jwt: null }
      }

    } catch (e) {
      throw e
    }
  }
})