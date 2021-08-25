import Classification from "../models/classification";
import ClassificationLabel from "../models/classification_label";
import ClassificationSegment from "../models/classification_segment";
import ClassificationSegmentLabel from "../models/classification_segment_label";
import ClassificationVariation from "../models/classification_variation";

const fs = require('fs');
var express = require('express');
var router = express.Router({ mergeParams: true });

const uploadPath = require('path').resolve('./') + '/public/json/';

// CLASSIFICACAO
router.get('/', (req: any, res: any) => {
    Classification.findAll({
        where: req.params
    })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/', async (req: any, res: any) => {
    const rawdata = fs.readFileSync(uploadPath + req.body.file);
    const data = JSON.parse(rawdata);

    for (const title in data) {
        const document = await Classification.create({ ...req.params, ...req.body, ...{ title: title } });
        for (const segment of data[title]) {
            await ClassificationSegment.create({
                ...req.params,
                ...req.body,
                ...{
                    classification_id: document.getDataValue('id'),
                    text: segment.materia,
                    ref_id: segment.id
                }
            });
        }
    }
    res.sendStatus(200);

});

router.get('/:id', (req: any, res: any) => {
    Classification.findOne({
        where: req.params,
        include: [{
            model: ClassificationSegment,
            as: "segments",
            order: ['created_at'],
            include: [{
                model: ClassificationSegmentLabel,
                as: "labels"
            }]
        }]
    })
        .then(data => res.status(data ? 200 : 404).json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:id', (req: any, res: any) => {
    Classification.findOne({ where: req.params }).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:id', (req: any, res: any) => {
    Classification.findOne({ where: req.params }).then(data => {
        data?.destroy();
        res.send();
    })
});

// REVISAO

router.post('/:classification_id/segment/:segment_id/label', async (req: any, res: any) => {

    const user_id = req.body.user_id;
    const classification_id = req.params.classification_id;
    const classification_segment_id = req.params.segment_id;
    const project_id = req.params.project_id;
    const classification_label_id = req.body.classification_label_id;

    ClassificationSegmentLabel.findOne({
        where: {
            user_id, classification_id, classification_segment_id
        }
    }).then(async obj => {
        console.log(obj);
        if (obj) {
            await obj.update({
                user_id, classification_id, classification_segment_id, project_id, classification_label_id
            })
            res.json(obj);
        } else {
            const data = await ClassificationSegmentLabel.create({
                user_id, classification_id, classification_segment_id, project_id, classification_label_id
            })
            res.json(data);
        }
    })


});


module.exports = router;