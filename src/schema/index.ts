export * from "./experience.js";
export * from "./society.js";
export * from "./union.js";
export * from "./user.js";

import { queryType } from 'nexus'
import { ExperienceQueryDef } from './experience.js'
import { SocietyQueryDef } from './society.js'
import { UnionQueryDef } from './union.js'
import { UserQueryDef } from './user.js'

export const Query = queryType({
  definition(t) {
    const queryDefs = [
      ExperienceQueryDef,
      SocietyQueryDef,
      UnionQueryDef,
      UserQueryDef
    ]
    
    for (const func of queryDefs) { func(t) }

    // Hello Test
    t.string('hello', { resolve: () => "Hello there" })
  },
})