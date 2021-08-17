import User from "../models/user";

const jwt = require('jsonwebtoken');

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.TOKEN_SECRET as string, async (err: any, user: any) => {

    if (err) return res.sendStatus(403)

    const dbUser = await User.findOne({where: {id: user.id}});
    if(dbUser?.getDataValue("role_changed")) {
      res.sendStatus(401);
    }

    req.user = user
    req.body.user_id = user.id;

    next()
  })
}

export {
    authenticateToken
}