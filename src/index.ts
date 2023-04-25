import path from 'path'
import {fileURLToPath} from 'url';
import { ApolloServer, ApolloServerOptions, BaseContext } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeSchema } from 'nexus'
import { applyMiddleware } from 'graphql-middleware';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as types from './schema/index.js'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express'
import http from 'http';
import { PrismaClient } from '@prisma/client';
import { embellishHeader } from './middleware/header-embellisher.js';
import { authenticateToken } from './middleware/token-authenticator.js';
import { applyPermissions } from './middleware/permissions.js';
import { graphqlMiddleware } from './middleware/graphql-middleware.js';

const client = new PrismaClient()

const app = express()
const httpServer = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schema = makeSchema({
  types,
  outputs: {
    schema: `${__dirname}/generated/schema.graphql`,
    typegen: `${__dirname}/generated/types.ts`
  },
  features: {
    abstractTypeStrategies: {
      resolveType: false
    }     
  },
})

interface MyContext {
  cookies: Record<string, string>;
}

const server = new ApolloServer<BaseContext>({
  schema: applyMiddleware(schema, applyPermissions),
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  csrfPrevention: false, // TEMP,
});

await server.start()
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))
app.use(express.urlencoded({
  extended: true
}))
app.use(cookieParser());
app.use(bodyParser.json())
app.use(embellishHeader);
app.use(authenticateToken);
app.use('/graphql', graphqlMiddleware(server, client));

await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000/`);
