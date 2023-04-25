import { interfaceType, objectType, unionType, enumType } from 'nexus'
import jsonwebtoken from 'jsonwebtoken'
import { PrismaClient, EventType } from '@prisma/client'

const prisma = new PrismaClient()

export const Node = interfaceType({
  name: 'Node',
  definition(t) {
    t.id('id', { description: 'Unique identifier for the resource' })
  },
})

export const Token = interfaceType({
  name: 'Token',
  definition(t) {
    t.string('jwt')
  },
})

export const State = objectType({
  name: 'State',
  definition(t) {
    t.implements(Node)
    t.string('currentGroup')
    t.string('previouslyLoggedIn')
    t.field('user', {
      type: 'User',
      resolve: (parent) => {
        return prisma.user_state
          .findUnique({ where: { id: parent.id } })
          .user();
      },
    })
  },
})


export const Location = objectType({
  name: 'Location',
  definition(t) {
    t.implements(Node)
    t.string('type')
    t.string('address')
    t.string('link')
     t.field('event', {
      type: 'Event',
      resolve: (parent) => {
        return prisma.location
          .findUnique({ where: { id: parent.id } })
          .event();
      },
    });
  }
})

export const createJWT = (obj: object) => {
  const jwt = jsonwebtoken.sign(
      { ...obj },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
  )
  return jwt
}

export const EventTypeEnum = enumType({
  name: 'EventType',
  members: Object.values(EventType)
})

export const LocationTypeEnum = enumType({
  name: 'LocationType',
  members: ["ADDRESS", "ONLINE", "TBD"]
})
