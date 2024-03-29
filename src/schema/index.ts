export * from "./event.js";
export * from "./society.js";
export * from "./union.js";
export * from "./user.js";
export * from "./group.js";
export * from "./public.js";

import { queryType } from 'nexus'
import { EventQueryDef } from './event.js'
import { GroupQueryDef } from "./group.js";
import { SocietyQueryDef } from './society.js'
import { UniQueryDef } from './uni.js'
import { UnionQueryDef } from './union.js'
import { UserQueryDef } from './user.js'
import { PublicEventQueryDef } from './public.js'

export const Query = queryType({
  definition(t) {
    const queryDefs = [
      EventQueryDef,
      SocietyQueryDef,
      UniQueryDef,
      UnionQueryDef,
      UserQueryDef,
      GroupQueryDef,
      PublicEventQueryDef
    ]
    
    for (const func of queryDefs) { func(t) }

    // Hello Test
    t.string('hello', { resolve: () => "Hello there" })
  },
})

