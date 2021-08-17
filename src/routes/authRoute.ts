import User from "../models/user";

var express = require('express');
var router = express.Router({ mergeParams: true });
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

function generateAccessToken(data: any) {
    return jwt.sign(data, process.env.TOKEN_SECRET);
}

router.post('/login', async (req: any, res: any) => {
    const body = req.body;

    if (!(body.email && body.password)) {
        return res.status(400).send({ error: "E-mail and password are required" });
    }

    try {
        const user: any = await User.findOne({ where: { email: body.email } });

        if (!user.active)
            res.status(400).json({ error: "Seu cadastro encontra-se em aprovação. Solicite ao administrador do sistema a ativação do seu cadastro" });

        if (user?.getDataValue("role_changed"))
            user.update({ role_changed: false });


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
            res.status(400).json({ error: "Usuário e/ou senha inválidos" });
        }

    } catch {
        res.status(400).json({ error: "Usuário e/ou senha inválidos" });
    }

});

router.post('/register', async (req: any, res: any) => {
    const body = req.body;

    if (!(body.email && body.password && body.name)) {
        return res.status(400).send({ error: "Data not formatted properly" });
    }

    User.create(body)
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

module.exports = router;