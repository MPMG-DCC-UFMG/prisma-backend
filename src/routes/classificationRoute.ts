import Classification from "../models/classification";
import ClassificationCorresponding from "../models/classification_corresponding";
import ClassificationCorrespondingLabel from "../models/classification_corresponding_label";
import ClassificationSegment from "../models/classification_segment";
import ClassificationSegmentLabel from "../models/classification_segment_label";
import JSZip from "jszip";
import User from "../models/user";
import ClassificationLabel from "../models/classification_label";
import { AnnotationService } from "../services/annotationService";

var slugify = require('slugify')
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

    const type = Array.isArray(data) ? 'classification_relationship' : 'classification';

    if (type === "classification") {
        for (const title in data) {
            const document = await Classification.create({ ...req.params, ...req.body, ...{ type, title: title } });
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
    } else if (type === "classification_relationship") {
        const document = await Classification.create({ ...req.params, ...req.body, ...{ type, title: req.body.file } });
        for (const segment of data) {
            const segmentData = await ClassificationSegment.create({
                ...req.params,
                ...req.body,
                ...{
                    classification_id: document.getDataValue('id'),
                    text: segment.text,
                    description: segment.description,
                    ref_id: segment._id
                }
            });
            for (const corresponding of segment.corresponding) {
                await ClassificationCorresponding.create({
                    ...req.params,
                    ...req.body,
                    ...{
                        classification_id: document.getDataValue('id'),
                        classification_segment_id: segmentData.getDataValue('id'),
                        text: corresponding.text,
                    }
                });
            }
        }
    }

    res.sendStatus(200);

});

router.get('/export', async (req: any, res: any) => {

    const data = await Classification.findAll({
        where: req.params,
        include: [{
            model: ClassificationSegment,
            as: "segments",
            order: ['created_at'],
            include: [{
                model: ClassificationSegmentLabel,
                as: "labels",
                include: [User, ClassificationLabel]
            }, {
                model: ClassificationCorresponding,
                as: "correspondings",
                include: [{
                    model: ClassificationCorrespondingLabel,
                    as: "labels",
                    required: req.query.only_labeled_segments,
                    include: [User, ClassificationLabel]
                }]
            }]
        }]
    })

    // res.send(data);
    // return;

    const zip = new JSZip();

    for (const d of (data as any)) {

        const file = slugify(d.title).replace(".json", "");
        let content;

        if (d.type === "classification_relationship") {
            content = d.segments.map((segment: any) => ({
                _id: segment.ref_id,
                text: segment.text,
                description: segment.description,
                corresponding: segment.correspondings.map((c: any) => ({
                    text: c.text,
                    labels: c.labels.map((label: any) => ({
                        label: {
                            id: label.classification_label.id,
                            name: label.classification_label.label,
                        },
                        user: {
                            id: label.user.id,
                            name: label.user.name
                        }
                    }))
                }))
            }));
        } else if (d.type === "classification") {
            content = d.segments.map((segment: any) => ({
                id: segment.ref_id,
                materia: segment.text,
                labels: segment.labels.map((label: any) => ({
                    label: {
                        id: label.classification_label.id,
                        name: label.classification_label.label,
                    },
                    user: {
                        id: label.user.id,
                        name: label.user.name
                    }
                }))
            }));
            // res.send(content);
            // return;
        }

        if (content && content.length > 0)
            zip.file(file + ".json", JSON.stringify(content));

    }

    zip.generateAsync({ type: 'base64' }).then(function (content) {
        res.send({
            filename: `export-${new Date().toISOString()}.zip`,
            data: content
        })
    })
});

router.get('/:id', async (req: any, res: any) => {
    try {
        const data = await Classification.findOne({
            where: req.params,
            include: [{
                model: ClassificationSegment,
                as: "segments",
                order: ['created_at'],
                include: [{
                    model: ClassificationSegmentLabel,
                    as: "labels"
                }, {
                    model: ClassificationCorresponding,
                    as: "correspondings",
                    include: [{
                        model: ClassificationCorrespondingLabel,
                        as: "labels"
                    }]
                }]
            }]
        });

        if (!data) res.sendStatus(404);

        const annotationService = new AnnotationService();

        if (!data?.getDataValue('annotation_model_created')) {
            const models = await annotationService.getModels();
            const strategies = await annotationService.getStrategies();

            const segments = await ClassificationSegment.findAll({
                where: {
                    classification_id: data?.getDataValue("id")
                }
            });

            const json_file = {
                segments: segments.map(segment => ({
                    id: segment.getDataValue('ref_id'),
                    materia: segment.getDataValue('text')
                }))
            };

            fs.writeFileSync(`./annotation_service/data/${data?.getDataValue('id')}.json`, JSON.stringify(json_file));

            const created = await annotationService.createModel(
                data?.getDataValue('id'),
                `${data?.getDataValue('id')}.json`,
                models[0],
                strategies[0],
            );

            if (created == "created") {
                data?.update({
                    annotation_model_created: true
                })
            }
        }

        res.json(data);

    } catch (error) {
        res.status(400).json(error);
    }
});

router.get('/:id/query', async (req: any, res: any) => {
    const annotationService = new AnnotationService();
    try {
        const response = await annotationService.query(req.params.id);
        res.json(response);
    } catch (e) {
        res.status(500).json(e);
    }
});

router.get('/:id/scores', async (req: any, res: any) => {
    const annotationService = new AnnotationService();
    try {
        const response = await annotationService.scores(req.params.id);
        res.json(response);
    } catch (e) {
        res.status(500).json(e);
    }
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


router.post('/:classification_id/segment/:segment_id/label', async (req: any, res: any) => {

    const user_id = req.body.user_id;
    const classification_id = req.params.classification_id;
    const classification_segment_id = req.params.segment_id;
    const project_id = req.params.project_id;
    const classification_label_id = req.body.classification_label_id;
    const ref_id = req.body.ref_id;

    const label = await ClassificationLabel.findOne({ where: { id: classification_label_id } });

    const annotationService = new AnnotationService();
    const teachResponse = await annotationService.teach(
        classification_id,
        ref_id,
        label?.getDataValue('label')
    );

    ClassificationSegmentLabel.findOne({
        where: {
            user_id, classification_id, classification_segment_id
        }
    }).then(async obj => {
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

router.post('/:classification_id/corresponding/:corresponding_id/label', async (req: any, res: any) => {

    const user_id = req.body.user_id;
    const classification_id = req.params.classification_id;
    const classification_corresponding_id = req.params.corresponding_id;
    const project_id = req.params.project_id;
    const classification_label_id = req.body.classification_label_id;

    ClassificationCorrespondingLabel.findOne({
        where: {
            user_id, classification_id, classification_corresponding_id
        }
    }).then(async obj => {
        if (obj) {
            await obj.update({
                user_id, classification_id, classification_corresponding_id, project_id, classification_label_id
            })
            res.json(obj);
        } else {
            const data = await ClassificationCorrespondingLabel.create({
                user_id, classification_id, classification_corresponding_id, project_id, classification_label_id
            })
            res.json(data);
        }
    })

});


module.exports = router;