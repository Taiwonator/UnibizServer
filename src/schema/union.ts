import { PrismaClient } from '@prisma/client'
import { objectType, mutationField, nonNull, stringArg, booleanArg } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import { Node } from './helpers/index.js'

const prisma = new PrismaClient()

const FAQ = objectType({
  name: 'FAQ',
  definition(t) {
    t.implements(Node)
    t.string('question');
    t.string('answer');
  },
});

export const Union = objectType({
  name: 'Union',
  definition(t) {
    t.implements(Node)
    t.string('name')
    t.string('shortName')
    t.string('imageUrl')
    t.string('createdAt')
    t.string('updatedAt')
    t.list.field('faqs', {
      type: FAQ,
      resolve(parent) {
        return prisma.faqs.findMany({
          where: {
            union: {
              id: parent.id
            }
          }
        })
      },
    });
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
    t.list.string('societyIds', {
      resolve: (parent) => {
        return prisma.union.findUnique({
          where: {
            id: parent.id,
          },
        }).societies({
          select: {
            id: true,
          },
        }).then((societies) => societies.map((society) => society.id));
      },
    })
    t.list.string('userIds', {
      resolve: (parent) => {
        return prisma.union.findUnique({
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
    t.list.string('userRequestIds', {
      resolve: (parent) => {
        return prisma.union.findUnique({
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
    t.list.string('societyRequestIds', {
      resolve: (parent) => {
        return prisma.union.findUnique({
          where: {
            id: parent.id,
          },
        }).societyRequests({
          select: {
            id: true,
          },
        }).then((societyRequests) => societyRequests.map((request) => request.id));
      },
    })
  }
})

export const UnionQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
  t.list.field('Union', {
      type: Union,
      resolve: () => prisma.union.findMany()
    })
}

export const EditUnionMutation = mutationField('editUnion', {
  type: Union,
  args: {
    id: nonNull(stringArg()),
    name: stringArg(),
    shortName: stringArg(),
    imageUrl: stringArg(),
  },
  async resolve(_, args) {
    const union = await prisma.union.findUnique({ where: { id: args.id } })

    if (!union) {
      throw new Error(`Society with ID ${args.id} does not exist`)
    }

    const unionArgs = {
      name: args.name ?? union.name,
      shortName: args.shortName ?? union.shortName,
      imageUrl: args.imageUrl ?? union.imageUrl,
    }

    try {
      const updatedUnion = await prisma.union.update({
        where: { id: args.id },
        data: unionArgs,
      })
      return updatedUnion
    } catch (err) {
      console.log(err)
    }
  },
})

export const CreateFAQMutation = mutationField('createFAQ', {
  type: FAQ,
  args: {
    unionId: nonNull(stringArg()),
    question: nonNull(stringArg()),
    answer: nonNull(stringArg()),
  },
  async resolve(_, { unionId, question, answer }) {
    const union = await prisma.union.findUnique({ where: { id: unionId } })

    if (!union) {
      throw new Error(`Union with ID ${unionId} does not exist`)
    }

    const faq = await prisma.faqs.create({
      data: {
        question,
        answer,
        union: { connect: { id: unionId } },
      },
    })

    return faq
  },
})

export const DeleteFAQMutation = mutationField('deleteFAQ', {
  type: FAQ,
  args: {
    id: nonNull(stringArg()),
  },
  async resolve(_, { id }) {
    const faq = await prisma.faqs.findUnique({ where: { id } })

    if (!faq) {
      throw new Error(`FAQ with ID ${id} does not exist`)
    }

    try {
      const deletedFAQ = await prisma.faqs.delete({
        where: { id },
      })
      return deletedFAQ
    } catch (err) {
      console.log(err)
    }
  },
})

export const EditFAQMutation = mutationField('editFAQ', {
  type: FAQ,
  args: {
    id: nonNull(stringArg()),
    question: stringArg(),
    answer: stringArg(),
  },
  async resolve(_, args) {
    const faq = await prisma.faqs.findUnique({ where: { id: args.id } })

    if (!faq) {
      throw new Error(`FAQ with ID ${args.id} does not exist`)
    }

    const faqArgs = {
      question: args.question ?? faq.question,
      answer: args.answer ?? faq.answer,
    }

    try {
      const updatedFAQ = await prisma.faqs.update({
        where: { id: args.id },
        data: faqArgs,
      })
      return updatedFAQ
    } catch (err) {
      console.log(err)
    }
  },
})

export const RequestUnionFromUserMutation = mutationField('requestUnionFromUser', {
  type: 'User',
  args: {
    userId: nonNull(stringArg()),
    unionId: nonNull(stringArg()),
  },
  async resolve(_, { userId, unionId }) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        throw new Error(`User with ID ${userId} does not exist`)
      }
    } catch(e) {
      console.log(e)
    }

    const union = await prisma.union.findUnique({ where: { id: unionId } })
    if (!union) {
      throw new Error(`Union with ID ${unionId} does not exist`)
    }

    try {
      const userRequests = await prisma.user.update({
        where: { id: userId },
        data: {
          unionRequests: {
            connect: { id: unionId },
          },
        },
      })
      return userRequests
    } catch(e) {
      console.log(e)
    }
  },
})

export const RequestUnionFromSocietyMutation = mutationField('requestUnionFromSociety', {
  type: 'Society',
  args: {
    societyId: nonNull(stringArg()),
    unionId: nonNull(stringArg()),
  },
  async resolve(_, { societyId, unionId }) {
    console.log('1')
    const society = await prisma.society.findUnique({ where: { id: societyId } })
    if (!society) {
      throw new Error(`Society with ID ${societyId} does not exist`)
    }

    const union = await prisma.union.findUnique({ where: { id: unionId } })
    if (!union) {
      throw new Error(`Union with ID ${unionId} does not exist`)
    }

    try {
      const societyRequests = await prisma.society.update({
        where: { id: societyId },
        data: {
          unionRequests: {
            connect: { id: unionId },
          },
        },
      })
      return societyRequests
    } catch (e) {
      console.log(e)
    }
  },
})

export const RemoveSocietyFromUnionMutation = mutationField('removeSocietyFromUnion', {
  type: Union,
  args: {
    societyId: nonNull(stringArg()),
    unionId: nonNull(stringArg()),
  },
  async resolve(_, { societyId, unionId }) {
    const society = await prisma.society.findUnique({ where: { id: societyId } })
    if (!society) {
      throw new Error(`User with ID ${societyId} does not exist`)
    }

    const union = await prisma.union.findUnique({ where: { id: unionId } })
    if (!union) {
      // throw new Error(`Union with ID ${unionId} does not exist`)
    } else {
      const updatedUnion = await prisma.union.update({
        where: { id: unionId },
        data: {
          societies: { disconnect: { id: societyId } }
        },
      })
      return updatedUnion
    }
  },
})

export const ProcessSocietyRequestMutation = mutationField('processSocietyRequest', {
  type: Union,
  args: {
    societyId: nonNull(stringArg()),
    unionId: nonNull(stringArg()),
    accept: nonNull(booleanArg()),
  },
  async resolve(_, { societyId, unionId, accept }) {
    const society = await prisma.society.findUnique({ where: { id: societyId } })
    if (!society) {
      throw new Error(`User with ID ${societyId} does not exist`)
    }

    const union = await prisma.union.findUnique({ where: { id: unionId } })
    if (!union) {
      // throw new Error(`Society with ID ${groupId} does not exist`)
    } else {
      if(accept) {
        const updatedUnion = await prisma.union.update({
          where: { id: unionId },
          data: {
            societies: { connect: { id: societyId } },
            societyRequests: { disconnect: { id: societyId } },
          },
        })
        return updatedUnion
      } else {
        const updatedSociety = await prisma.union.update({
          where: { id: unionId },
          data: {
            societyRequests: { disconnect: { id: societyId } },
          },
        })
        return updatedSociety
      }
    }
  },
})