import Project from "../models/project";
import User from "../models/user";

var express = require('express');
var router = express.Router({ mergeParams: true });

router.get("/", async (req: any, res: any) => {
  User.findAll({
    attributes: ['id', 'name', 'email', 'role', 'description', 'active', 'createdAt'],
    order: [['name', 'ASC']]
  }).then(data => res.json(data))
    .catch(error => res.status(400).json(error))
});

router.get('/:id', (req: any, res: any) => { 

  const id = req.params.id=="me" ? req.user.id : req.params.id;

  User.findOne({
      where: {id: id},
      attributes: {exclude: ['password']},
      include: [{
        model: Project,
        as: "projects",
        attributes: ["id", "name", "color", "icon"],
        through: { attributes: [] }
    }]
  })
      .then(data => res.status(data ? 200 : 404).json(data))
      .catch(error => res.status(400).json(error))
});

router.post("/", async (req: any, res: any) => {
  const body = req.body;

  if (!(body.email && body.password && body.name)) {
      return res.status(400).send({ error: "Data not formatted properly" });
  }

  User.create(body)
      .then(data => res.json(data))
      .catch(error => res.status(400).json(error))

});

router.put('/:id', (req: any, res: any) => { 
  User.findOne({where: req.params}).then(data => {
      data?.update(req.body)
          .then(data => res.json(data))
          .catch(error => res.status(400).json(error))
  })
});

router.delete('/:id', (req: any, res: any) => { 
  User.findOne({where: req.params}).then(data => {
      data?.destroy();
      res.send();
  })
});


module.exports = router;