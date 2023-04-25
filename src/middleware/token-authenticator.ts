import jwt from 'jsonwebtoken'

export function authenticateToken(req, _, next) {
  const cookies = req.cookies
  const accessToken = cookies['custom.access_token']

  if(accessToken) {
    jwt.verify(accessToken, process.env.JWT_SECRET as string, (err: any, user: any) => {
      if (err) return console.error(err)
      req.user = user
    })
  }

  next()
}

