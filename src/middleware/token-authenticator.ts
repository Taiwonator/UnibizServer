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

  // If token is valid 

  const token = req.headers["authorization"].split(' ')[1]
  if(token) {
     jwt.verify(token, process.env.JWT_SECRET as string, (err: any, pUser: any) => {
      if (err) return console.error(err)
      req.pUser = pUser
    })
  }

  next()
}

