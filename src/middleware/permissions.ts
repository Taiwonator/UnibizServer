import { PrismaClient } from "@prisma/client";
import { rule, shield } from "graphql-shield";

const rules = {
  isAuthenticatedUser: rule()(async(parent, args, ctx, info) => {
    console.log('ctx, auth ', ctx.user)
    return Boolean(!!ctx.user);
  }),
  isAdmin: rule()((parent, args, ctx) => {
    return Boolean(!!ctx.user);
  }),
  isSocietyAdmin: rule()((parent, args, ctx) => {
    return Boolean(!!ctx.user);
  }),
   isUnionAdmin: rule()((parent, args, ctx) => {
    return Boolean(!!ctx.user);
  }),
   isProspect : rule()((parent, args, ctx) => {
    return Boolean(true)
  }),
  isPublic: rule()((parent, args, ctx) => {
    console.log('user: ', ctx.user)
    return Boolean(true)
  }),
  isNever: rule()(() => false)
};

export const applyPermissions = shield({
  Query: {
    Event: rules.isPublic,
    User: rules.isPublic,
  },
  Mutation: {
    loginCredentialsUser: rules.isPublic,
    createUser: rules.isPublic,
    createEvent: rules.isPublic,
  }
});