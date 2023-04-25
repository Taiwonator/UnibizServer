import { PrismaClient } from '@prisma/client'
import { objectType, stringArg, mutationField, nonNull, booleanArg } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import { Node } from './helpers/index.js'

const prisma = new PrismaClient()

export const EventImage = objectType({
  name: 'EventImage',
  definition(t) {
    t.string('eventId')
    t.string('eventImageUrl')
  }
})

export const Society = objectType({
  name: 'Society',
  definition(t) {
    t.implements(Node)
    t.string('name')
    t.string('shortName')
    t.string('description')
    t.string('imageUrl')
    t.string('createdAt')
    t.string('updatedAt')
    t.list.field('eventImageUrls', {
      type: 'EventImage',
      resolve: async (parent) => {
      const events = await prisma.event.findMany({
          where: {
            societyId: parent.id
          },
          select: {
            id: true,
            eventImageUrls: true
          }
        })
        return events.flatMap(event => event.eventImageUrls.map(imageUrl => ({ eventId: event.id, eventImageUrl: imageUrl })))
      }
    })
     t.int('totalEventLikes', {
      resolve: async (parent) => {
        const events = await prisma.event.findMany({
          where: {
            societyId: parent.id
          },
          select: {
            likes: true
          }
        });
        return events.reduce((totalLikes, event) => totalLikes + event.likes, 0);
      }
    });
    t.list.string('userIds', {
      resolve: (parent) => {
        return prisma.society.findUnique({
          where: {
            id: parent.id,
          },
        }).users({
          select: {
            id: true,
          },
        }).then((users) => users.map((user) => user.id));
      },
    })
    t.list.field('users', {
      type: 'User',
      resolve: (parent) => {
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
    t.list.string('userRequestIds', {
      resolve: (parent) => {
        return prisma.society.findUnique({
          where: {
            id: parent.id,
          },
        }).userRequests({
          select: {
            id: true,
          },
        }).then((userRequests) => userRequests.map((request) => request.id));
      },
    })
    t.field('union', {
      type: 'Union',
      resolve: async(parent) => {
        const union = await prisma.union.findMany({
          where: {
            societies: {
              some: {
                id: parent.id
              }
            }
          }
        })
        return union[0]
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
    t.list.string('eventIds', {
      resolve: (parent) => {
        return prisma.society.findUnique({
          where: {
            id: parent.id,
          },
        }).events({
          select: {
            id: true,
          },
        }).then((events) => events.map((request) => request.id));
      },
    })
  }
})

export const SocietyQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
     t.list.field('Society', {
      type: Society,
      args: {
        verified: booleanArg(),
      },
      resolve: (_, { verified }) => {
        const where = verified
          ? {
              union: {
                isNot: null,
              },
            }
          : {};
        return prisma.society.findMany({ where });
      },
    });
    t.field('FindSocietyById', {
      type: Society,
      args: {
        id: stringArg()
      },
      resolve: async(_, { id }) => { 
        const society = await prisma.society.findUnique({where: { id }}) 
        return society
      }
    })
}

export const EditSocietyMutation = mutationField('editSociety', {
  type: Society,
  args: {
    id: nonNull(stringArg()),
    name: stringArg(),
    shortName: stringArg(),
    description: stringArg(),
    imageUrl: stringArg(),
  },
  async resolve(_, args) {
    const society = await prisma.society.findUnique({ where: { id: args.id } })

    if (!society) {
      throw new Error(`Society with ID ${args.id} does not exist`)
    }

    const societyArgs = {
      name: args.name ?? society.name,
      shortName: args.shortName ?? society.shortName,
      description: args.description ?? society.description,
      imageUrl: args.imageUrl ?? society.imageUrl,
    }

    try {
      const updatedSociety = await prisma.society.update({
        where: { id: args.id },
        data: societyArgs,
      })
      return updatedSociety
    } catch (err) {
      console.log(err)
    }
  },
})

export const CreateSocietyMutation = mutationField('createSociety', {
  type: Society,
  args: {
    name: nonNull(stringArg()),
    shortName: nonNull(stringArg()),
    description: stringArg(),
    imageUrl: stringArg(),
    userId: nonNull(stringArg()),
  },
  async resolve(_, { name, shortName, description, imageUrl, userId }) {
    try {
      const createdSociety = await prisma.society.create({
        data: {
          name,
          shortName,
          description,
          imageUrl,
          users: {
            connect: { id: userId },
          },
        },
      })
      return createdSociety
    } catch (err) {
      console.log(err)
    }
  },
})

export const DeleteSocietyMutation = mutationField('deleteSociety', {
  type: Society,
  args: {
    id: nonNull(stringArg()),
  },
  async resolve(_, { id }) {
    const society = await prisma.society.findUnique({ where: { id } })

    if (!society) {
      throw new Error(`Society with ID ${id} does not exist`)
    }

    try {
      const deletedSociety = await prisma.society.delete({ where: { id } })
      return deletedSociety
    } catch (err) {
      console.log(err)
    }
  },
})

export const LeaveSocietyMutation = mutationField('leaveSociety', {
  type: Society,
  args: {
    userId: nonNull(stringArg()),
    societyId: nonNull(stringArg()),
  },
  async resolve(_, { userId, societyId }) {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new Error(`User with ID ${userId} does not exist`)
    }

    if (!societyId) {
      throw new Error(`Society with ID ${societyId} does not exist`)
    }

    try {
      const updatedSociety = await prisma.society.update({
        where: { id: societyId },
        data: {
          users: { disconnect: { id: userId } },
        },
      })
      return updatedSociety
    } catch (err) {
      console.log(err)
    }
  },
})

export const RequestSocietyFromUserMutation = mutationField('requestSocietyFromUser', {
  type: 'User',
  args: {
    userId: nonNull(stringArg()),
    societyId: nonNull(stringArg()),
  },
  async resolve(_, { userId, societyId }) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error(`User with ID ${userId} does not exist`)
    }

    const society = await prisma.society.findUnique({ where: { id: societyId } })
    if (!society) {
      throw new Error(`Society with ID ${societyId} does not exist`)
    }

    try {
      const userRequests = await prisma.user.update({
        where: { id: userId },
        data: {
          societyRequests: {
            connect: { id: societyId }
          },
        },
      })
      return userRequests
    } catch (e) {
      console.log(e)
    }

  },
})

// accept, deny, remove