import Paraphrase from "../models/paraphrase";
import ParaphraseRevision from "../models/paraphrase_revision";

var express = require('express');
var router = express.Router({ mergeParams: true });

router.get('/', (req: any, res: any) => { 
    Paraphrase.findAll()
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/', (req: any, res: any) => { 
    Paraphrase.create({...req.params, ...req.body})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.get('/:id', (req: any, res: any) => { 
    Paraphrase.findOne({
        where: req.params,
        include: [{
            model: ParaphraseRevision,
            as: "revisions",
            attributes: ["id", "user_id", "revision", "createdAt", "updatedAt"]
        }]
    })
        .then(data => res.status(data ? 200 : 404).json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:id', (req: any, res: any) => { 
    Paraphrase.findOne({where: req.params}).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:id', (req: any, res: any) => { 
    Paraphrase.findOne({where: req.params}).then(data => {
        data?.destroy();
        res.send();
    })
});


router.post('/:paraphrase_id/revision', async (req: any, res: any) => { 
    ParaphraseRevision.create({...req.params, ...req.body})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:paraphrase_id/revision/:id', async (req: any, res: any) => { 
    ParaphraseRevision.findOne({where: req.params}).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:paraphrase_id/revision/:id', (req: any, res: any) => { 
    ParaphraseRevision.findOne({where: req.params}).then(data => {
        data?.destroy();
        res.send();
    })
});

module.exports = router;