import { Prisma, PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { objectType, mutationType, stringArg, mutationField } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import { createJWT, Node, Token } from './helpers/index.js'

const prisma = new PrismaClient()

const saltRounds = 10;

export const User = objectType({
  name: 'User',
  definition(t) {
    t.implements(Node)
    t.string('email')
    t.string('name')
    t.list.string('type')
    t.string('password')
    t.list.field('societies', {
      type: 'Society',
      resolve: (parent) => {
        return prisma.society.findMany({
          where: {
            userIds: {
              hasSome: [parent.id]
            }
          }
        })
      }
    })
    t.list.field('unions', {
      type: 'Union',
      resolve: (parent) => {
        return prisma.union.findMany({
          where: {
            userIds: {
              hasSome: [parent.id]
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
            userRequestIds: {
              hasSome: [parent.id]
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
            userRequestIds: {
              hasSome: [parent.id]
            }
          }
        })
      }
    })

  }
})

export const UserQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
  t.list.field('User', {
      type: User,
      resolve: () => prisma.user.findMany()
    })
}

export const AuthenticatedUserResponse = objectType({
    name: "AuthenticatedUserResponse",
    definition(t) {
        t.implements(Token)
    }
})

export const LoginUser = mutationField('loginUser', {
  type: 'AuthenticatedUserResponse',
  args: {
    email: stringArg(),
    password: stringArg()
  },
  resolve: async(_, args) => {
    let user
    const { email, password } = args
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          type: true,
          name: true
        }
      })
      if(await bcrypt.compare(password, user.password)) {
        const jwt = createJWT({  
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type
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

export const UserCreateMutation = mutationType({
  definition(t) {
    t.field('createUser', {
      type: 'AuthenticatedUserResponse',
      args: {
         email: stringArg(),
         password: stringArg(),
         name: stringArg(),
         type: stringArg()
      },
      async resolve(_, args) {
        const { email, password, name, type } = args
        const hash: string = await bcrypt.hash(password, saltRounds)
        const user: Prisma.userCreateInput = { ...args, email, name, type, password: hash }
        try {
            const createdUser = await prisma.user.create({ data: user })
            const jwt = createJWT({ 
                id: createdUser.id,
                email: createdUser.email,
                name: createdUser.name,
                type: createdUser.type
            })
            return { jwt }
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