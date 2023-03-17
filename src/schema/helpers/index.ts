import { interfaceType } from 'nexus'
import jsonwebtoken from 'jsonwebtoken'

export const Node = interfaceType({
  name: 'Node',
  definition(t) {
    t.id('id', { description: 'Unique identifier for the resource' })
  },
})

export const Token = interfaceType({
  name: 'Token',
  definition(t) {
    t.string('jwt')
  },
})

export const createJWT = (obj: object) => {
  const jwt = jsonwebtoken.sign(
      { ...obj },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
  )
  return jwt
}
