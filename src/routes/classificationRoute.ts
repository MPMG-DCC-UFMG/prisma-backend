import Classification from "../models/classification";
import ClassificationLabel from "../models/classification_label";
import ClassificationVariation from "../models/classification_variation";
import Paraphrase from "../models/paraphrase";
import ParaphraseRevision from "../models/paraphrase_revision";

var express = require('express');
var router = express.Router({ mergeParams: true });


// CLASSIFICACAO
router.get('/', (req: any, res: any) => { 
    Classification.findAll()
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/', (req: any, res: any) => { 
    Classification.create({...req.params, ...req.body})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.get('/:id', (req: any, res: any) => { 
    Classification.findOne({
        where: req.params,
        include: [{
            model: ClassificationLabel,
            attributes: ["id", "label"]
        },{
            model: ClassificationVariation,
            as: "variations",
            attributes: ["id", "text", "user_id"],
            include: [{
                model: ClassificationLabel,
                attributes: ["id", "label"]
            }]
        }]
    })
        .then(data => res.status(data ? 200 : 404).json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:id', (req: any, res: any) => { 
    Classification.findOne({where: req.params}).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:id', (req: any, res: any) => { 
    Classification.findOne({where: req.params}).then(data => {
        data?.destroy();
        res.send();
    })
});

// REVISAO

router.post('/:classification_id/variation', async (req: any, res: any) => { 
    ClassificationVariation.create({...req.params, ...req.body})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:classification_id/variation/:id', async (req: any, res: any) => { 
    ClassificationVariation.findOne({where: req.params}).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:classification_id/variation/:id', (req: any, res: any) => { 
    ClassificationVariation.findOne({where: req.params}).then(data => {
        data?.destroy();
        res.send();
    })
});

module.exports = router;