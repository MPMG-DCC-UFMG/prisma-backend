import Classification from "../models/classification";
import ClassificationLabel from "../models/classification_label";

var express = require('express');
var router = express.Router({ mergeParams: true });


router.get('/', (req: any, res: any) => { 
    ClassificationLabel.findAll({
        where: req.params
    })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/', (req: any, res: any) => { 
    ClassificationLabel.create({...req.params, ...req.body})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.get('/:id', (req: any, res: any) => { 
    ClassificationLabel.findOne({
        where: req.params
    })
        .then(data => res.status(data ? 200 : 404).json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:id', (req: any, res: any) => { 
    ClassificationLabel.findOne({where: req.params}).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:id', (req: any, res: any) => { 
    ClassificationLabel.findOne({where: req.params}).then(data => {
        data?.destroy();
        res.send();
    })
});


module.exports = router;