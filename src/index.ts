import path from 'path'
import {fileURLToPath} from 'url';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import {
  arg,
  enumType,
  intArg,
  interfaceType,
  makeSchema,
  objectType,
  queryType,
  stringArg,
  list,
} from 'nexus'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const Node = interfaceType({
  name: 'Node',
  definition(t) {
    t.id('id', { description: 'Unique identifier for the resource' })
  },
})
const Account = objectType({
  name: 'Account',
  isTypeOf(source) {
    return 'email' in source
  },
  definition(t) {
    t.implements(Node) // or t.implements("Node")
    t.string('username', { resolve: () => "Taiwonator" })
    t.string('email', { resolve: () => "JoeBlow@gmail.com" })
  },
})
const Event = objectType({
  name: 'Event',
  definition(t) {
    t.implements(Node)
    t.string('name')
    t.string('astroid')
  }
})
const StatusEnum = enumType(
    {
  name: 'StatusEnum',
  members: ['ACTIVE', 'DISABLED'],
})
const Query = queryType({
  definition(t) {
    t.list.field('account', {
      type: Account, // or "Account"
      args: {
        name: stringArg(),
        status: arg({ type: 'StatusEnum' }),
      },
      resolve: () => [{
        email: 'email',
        username: 'username'
      }]
    })
    t.list.field('event', {
      type: Event,
      resolve: () => prisma.event.findMany()
    })
    t.field('accountsById', {
      type: list(Account), // or "Account"
      args: {
        ids: list(intArg()),
      },
    })
    t.string('hello', { resolve: () => "Hello there" })
  },
})
// Recursively traverses the value passed to types looking for
// any valid Nexus or graphql-js objects to add to the schema,
// so you can be pretty flexible with how you import types here.
const schema = makeSchema({
  types: [Account, Event, Node, Query, StatusEnum],
  outputs: {
    schema: `${__dirname}/generated/schema.graphql`,
    typegen: `${__dirname}/generated/types.ts`
  }
})

const server = new ApolloServer({
  schema
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);