import { PrismaClient } from "@prisma/client"
import { unionType, stringArg, objectType, nonNull, mutationField, booleanArg } from "nexus"
import { ObjectDefinitionBlock } from "nexus/dist/core"
import { Society } from "./society.js"
import { Union } from "./union.js"

const prisma = new PrismaClient()

export const Group = unionType({
  name: 'Group',
  definition(t) {
    t.members(Society, Union)
  },
  resolveType(value) {
    if ('unionId' in value) {
      return 'Society'
    } else if ('societyIds' in value) {
      return 'Union'
    } else {
      throw new Error('Could not determine object type')
    }
  },
})


export const GroupQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
   t.field('FindGroupById', {
    type: Group,
    args: {
        id: stringArg()
    },
    resolve: async(_, { id }) => {
        const union = await prisma.union.findUnique({where: { id }})
        if(union) return union
        const society = await prisma.society.findUnique({where: { id }})
        if(society) return society
        return null
    },
   })
}

export const LeaveGroupMutation = mutationField('leaveGroup', {
  type: Group,
  args: {
    userId: nonNull(stringArg()),
    groupId: nonNull(stringArg()),
  },
  async resolve(_, { userId, groupId }) {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new Error(`User with ID ${userId} does not exist`)
    }

    const society = await prisma.society.findUnique({ where: { id: groupId } })

    if (society) {
      try {
        const updatedSociety = await prisma.society.update({
          where: { id: groupId },
          data: {
            users: { disconnect: { id: userId } },
          },
        })
        return updatedSociety
      } catch (err) {
        console.log(err)
      }
    }

    const union = await prisma.union.findUnique({ where: { id: groupId } })
    if (union) {
      try {
        const updatedUnion = await prisma.union.update({
          where: { id: groupId },
          data: {
            users: { disconnect: { id: userId } },
          },
        })
        return updatedUnion
      } catch (err) {
        console.log(err)
      }
    }

    throw new Error(`Group with ID ${groupId} does not exist`)
  },
})

export const ProcessUserRequestMutation = mutationField('processUserRequest', {
  type: Group,
  args: {
    userId: nonNull(stringArg()),
    groupId: nonNull(stringArg()),
    accept: nonNull(booleanArg()),
  },
  async resolve(_, { userId, groupId, accept }) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error(`User with ID ${userId} does not exist`)
    }

    const society = await prisma.society.findUnique({ where: { id: groupId } })
    if (!society) {
      // throw new Error(`Society with ID ${groupId} does not exist`)
    } else {
      if(accept) {
        const updatedSociety = await prisma.society.update({
          where: { id: groupId },
          data: {
            users: { connect: { id: userId } },
            userRequests: { disconnect: { id: userId } },
          },
        })
        return updatedSociety
      } else {
        const updatedSociety = await prisma.society.update({
          where: { id: groupId },
          data: {
            userRequests: { disconnect: { id: userId } },
          },
        })
        return updatedSociety
      }
    }

    const union = await prisma.union.findUnique({ where: { id: groupId } })
    if (!union) {
      // throw new Error(`Union with ID ${groupId} does not exist`)
    } else {
      if(accept) {
        const updatedUnion = await prisma.union.update({
          where: { id: groupId },
          data: {
            users: { connect: { id: userId } },
            userRequests: { disconnect: { id: userId } },
          },
        })
        return updatedUnion
      } else {
        const updatedUnion = await prisma.union.update({
          where: { id: groupId },
          data: {
            userRequests: { disconnect: { id: userId } },
          },
        })
        return updatedUnion
      }
    }

    if (accept) {
      const updatedSociety = await prisma.society.update({
        where: { id: groupId },
        data: {
          users: { connect: { id: userId } },
          userRequests: { disconnect: { id: userId } },
        },
      })
      return updatedSociety
    } else {
      const updatedSociety = await prisma.society.update({
        where: { id: groupId },
        data: {
          userRequests: { disconnect: { id: userId } },
        },
      })
      return updatedSociety
    }
  },
})

export const RemoveUserFromGroupMutation = mutationField('removeUserFromGroup', {
  type: Group,
  args: {
    userId: nonNull(stringArg()),
    groupId: nonNull(stringArg()),
  },
  async resolve(_, { userId, groupId }) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error(`User with ID ${userId} does not exist`)
    }

    const society = await prisma.society.findUnique({ where: { id: groupId } })
    if (!society) {
      // throw new Error(`Society with ID ${groupId} does not exist`)
    } else {
      const updatedSociety = await prisma.society.update({
        where: { id: groupId },
        data: {
          users: { disconnect: { id: userId } }
        },
      })
      return updatedSociety
    }

    const union = await prisma.union.findUnique({ where: { id: groupId } })
    if (!union) {
      // throw new Error(`Union with ID ${groupId} does not exist`)
    } else {
      const updatedUnion = await prisma.union.update({
        where: { id: groupId },
        data: {
          users: { disconnect: { id: userId } }
        },
      })
      return updatedUnion
    }
  },
})