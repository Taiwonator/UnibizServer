import { AuthenticationMethod, Prisma, PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { objectType, mutationType, stringArg, mutationField, nonNull } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import { createJWT, Node, Token, State } from './helpers/index.js'

const prisma = new PrismaClient()

const saltRounds = 10;

export const User = objectType({
  name: 'User',
  definition(t) {
    t.implements(Node)
    t.string('email')
    t.string('name')
    t.list.string('type')
    t.field('state', {
      type: State,
      resolve: async(parent) => {
        return prisma.user_state.findUnique({
          where: {
            userId: parent.id
          }
        })
      }
    })

    t.list.string('interestedEventIds', {
      resolve: (parent) => {
        return prisma.user.findUnique({
          where: {
            id: parent.id,
          },
        }).interestedEvents({
          select: {
            id: true,
          },
        }).then((events) => events.map((interestedEvent) => interestedEvent.id));
      },
    })

      t.list.field('interestedEvents', {
      type: 'Event',
      resolve: (parent) => {
        return prisma.event.findMany({
          where: {
            interestedUserIds: {
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
  }),
  t.field('FindUserById', {
    type: User,
    args: {
      id: stringArg()
    },
    resolve: async(_, { id }) => { 
      const user = await prisma.user.findUnique({where: { id }}) 
      return user
    }
  })
  t.field('FindUserByEmail', {
    type: User,
    args: {
      email: stringArg()
    },
    resolve: async(_, { email }) => { 
      const user = await prisma.user.findUnique({where: { email }}) 
      return user
    }
  })
}

export const AuthenticatedUserResponse = objectType({
    name: "AuthenticatedUserResponse",
    definition(t) {
        t.implements(Token)
    }
})

export const LoginCredentialsUser = mutationField('loginCredentialsUser', {
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
          type: true,
          name: true,
          auths: true
        }
      })
      const credentialsAuthMethod = user.auths.find(auth => auth.method === AuthenticationMethod.CREDENTIALS)
      if(credentialsAuthMethod) {
        const credentialsUser = await prisma.credentials_user.findUnique({
          where: {
            id: credentialsAuthMethod.authId
          },
          select: {
            password: true
          }
        })
      if(await bcrypt.compare(password, credentialsUser.password)) {
        const jwt = createJWT({  
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type,
        })
        
        return { jwt }
      } else {
        return { jwt: null }
      }
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
      },
      async resolve(_, args) {
        const { email, password, name } = args
        const hash: string = await bcrypt.hash(password, saltRounds)

        const existingUserWithEmail = await prisma.user.findUnique({
          where: { email }
        })
        // USER ALREADY EXISTS
        if(existingUserWithEmail) {
          console.log(`user with id ${existingUserWithEmail} already exists`)
          const createdCredentialsUser = await prisma.credentials_user.create({ data: { password: hash } })
          const updatedUser = await prisma.user.update({ where: { id: existingUserWithEmail.id }, 
            data: { 
              auths: {
                create: {
                  method: "CREDENTIALS",
                  authId: createdCredentialsUser.id
                }
              }
            }
          })
          // Find auth mode, and add new created google 
          const jwt = createJWT({ 
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
            })
          return { jwt }
        }



        try {
            const user: Prisma.userCreateInput = { 
              email,
              name,
            }
            const createdCredentialsUser = await prisma.credentials_user.create({ 
              data: { password: hash }
            })
            try {
              const createdUser = await prisma.user.create({ data: user })
              await prisma.auth_method.create({ 
                data: { 
                  method: "CREDENTIALS",
                  authId: createdCredentialsUser.id,
                  userId: createdUser.id 
                }
              })
              await prisma.user_state.create({ data: { userId: createdUser.id } })
              const jwt = createJWT({ 
                  id: createdUser.id,
                  email: createdUser.email,
                  name: createdUser.name,
              })
              return { jwt }
            } catch(e) {
              console.log(e)
            }
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

export const PasswordlessUserCreateMutation = mutationField('createPasswordlessUser', {
      type: 'AuthenticatedUserResponse',
      args: {
         email: stringArg(),
         name: stringArg(),
      },
      async resolve(_, args) {
        const { email, name } = args
        const existingUserWithEmail = await prisma.user.findUnique({
          where: { email }
        })
        // USER ALREADY EXISTS
        if(existingUserWithEmail) {
          console.log(`user with id ${existingUserWithEmail} already exists`)
          const createdGoogleUser = await prisma.google_user.create({ data: {} })
          const updatedUser = await prisma.user.update({ where: { id: existingUserWithEmail.id }, 
            data: { 
              auths: {
                create: {
                  method: "GOOGLE",
                  authId: createdGoogleUser.id
                }
              }
            }
          })
          
          const jwt = createJWT({ 
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
            })
          return { jwt }
        }


        // NEW USER
        try {
            const user: Prisma.userCreateInput = { 
              email,
              name,
              state: {
                create: {}
              }
            }
            const createdGoogleUser = await prisma.google_user.create({ data: {} })
            try {
              const createdUser = await prisma.user.create({ data: user })
              await prisma.auth_method.create({ 
                data: { 
                  method: "GOOGLE",
                  authId: createdGoogleUser.id,
                  userId: createdUser.id 
                }
              })
              const jwt = createJWT({ 
                  id: createdUser.id,
                  email: createdUser.email,
                  name: createdUser.name,
              })
              return { jwt }
            } catch(e) {
              console.log(e)
            }
        } catch(e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === 'P2002') { console.log('There is a unique constraint violation, a new user cannot be created with this email') }
            }
            throw e
        }
      },
    })

export const setUserCurrentGroup = mutationField('setUserCurrentGroup', {
  type: State,
  args: {
    userId: stringArg(),
    groupId: stringArg()
  },
  resolve: async(_, { userId, groupId }) => {
    let updatedState = await prisma.user_state.update({
        where: { userId: userId },
        data: { currentGroup: groupId }
    })
    return updatedState
  }
})

export const UpdateUserNameMutation = mutationField('updateUserName', {
  type: User,
  args: {
    id: nonNull(stringArg()),
    name: stringArg(),
  },
  resolve: async (_, args) => {
    const user = await prisma.user.findUnique({ where: { id: args.id } })
    try {
      const updatedUser = await prisma.user.update({
        where: { id: args.id },
        data: { name: args.name ?? user.name }
      });
      return updatedUser;
    } catch (e) {
      throw e;
    }
  },
});