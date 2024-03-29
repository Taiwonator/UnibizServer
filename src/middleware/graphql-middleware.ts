import { expressMiddleware } from '@apollo/server/express4';

export const graphqlMiddleware = (server, client) => expressMiddleware(server, {
    context: async ({ req }) => {
     const user = (req as any).user
     const pUser = (req as any).pUser
      return ({ client, user, pUser })
    }
  }
)

