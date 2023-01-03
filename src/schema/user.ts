import { Prisma, PrismaClient } from '@prisma/client'
import { objectType, mutationType, stringArg } from 'nexus'
import { arg, ObjectDefinitionBlock } from 'nexus/dist/core'
import { Node } from './helpers/index.js'

const prisma = new PrismaClient()

export const User = objectType({
  name: 'User',
  definition(t) {
    t.implements(Node)
    t.string('email')
    t.string('firstName')
    t.string('lastName')
    t.string('token')
    t.string('password')
  }
})

export const UserQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
  t.list.field('User', {
      type: User,
      resolve: () => prisma.user.findMany()
    })
}

export const UserCreateMutation = mutationType({
  definition(t) {
    t.field('createUser', {
      type: 'User',
      args: {
         email: stringArg(),
         password: stringArg(),
         token: stringArg(),
         firstName: stringArg(),
         lastName: stringArg(),
      },
      async resolve(_, args) {
        const user: Prisma.userCreateInput = { ...args }
        try {
            const createdUser = await prisma.user.create({ data: user })
            return createdUser
        } catch(e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === 'P2002') { console.log('There is a unique constraint violation, a new user cannot be created with this email') }
            }
            throw e
        }
      },
    })
  },
})