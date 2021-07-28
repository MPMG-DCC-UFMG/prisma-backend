import Model from "../models/project";
import ProjectUser from "../models/project_user";
import User from "../models/user";

var express = require('express');
var router = express.Router({ mergeParams: true });

const filterResult = (req:any, data:any) => {
    if(req.user.role==='admin') return data;
    return  data.filter((project: any) => 
                    project.users.some((user: any) => 
                        user.id === req.body.user_id
                    )
                );
}

router.get('/', (req: any, res: any) => { 
    Model.findAll({
        include: [{
            model: User,
            as: "users",
            attributes: ["id", "name"],
            through: {attributes: []}
        }],
        logging: console.log
    }).then(data => res.json( filterResult(req, data) )
    ).catch(error => res.status(400).json(error))
});

router.post('/', (req: any, res: any) => { 
    Model.create(req.body)
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.get('/:id', (req: any, res: any) => { 
    Model.findOne({
        where: req.params,
        include: [{
            model: User,
            as: "users",
            attributes: ["id", "name"],
            through: { attributes: [] }
        }]
    })
        .then(data => res.status(data ? 200 : 404).json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:id', (req: any, res: any) => { 
    Model.findOne({where: req.params}).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:id', (req: any, res: any) => { 
    Model.findOne({where: req.params}).then(data => {
        data?.destroy();
        res.send();
    })
});

router.post('/:project_id/user/:user_id', (req: any, res: any) => { 
    ProjectUser.create(req.params)
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.delete('/:project_id/user/:user_id', (req: any, res: any) => { 
    ProjectUser.destroy({where: req.params}).then(data => {
        res.send();
    })
});

module.exports = router;