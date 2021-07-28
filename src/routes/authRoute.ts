import User from "../models/user";

var express = require('express');
var router = express.Router({ mergeParams: true });
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

function generateAccessToken(data:any) {
    return jwt.sign(data, process.env.TOKEN_SECRET);
  }

router.post('/login', async (req: any, res: any) => { 
    const body = req.body;

    if (!(body.email && body.password)) {
        return res.status(400).send({ error: "E-mail and password are required" });
    }

    try {
        const user: any = await User.findOne({where: {email: body.email}});
        const validPassword = await bcrypt.compare(body.password, user.password);
        if (validPassword) {
            const token = generateAccessToken({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
            res.json({
                token_type: "Bearer",
                access_token: token
            });
        } else {
            res.status(400).json({ error: "Invalid Password" });
        }
        
    } catch {
        res.status(400).json({ error: "User not found" });
    }

});

module.exports = router;