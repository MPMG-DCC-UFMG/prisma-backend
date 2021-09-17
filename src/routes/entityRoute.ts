import Annotation from "../models/annotation";
import Document from "../models/document";
import Entity from "../models/entity";
import Sentence from "../models/sentence";
import _, { add } from 'lodash';
import RelationshipType from "../models/relationship_type";
import AnnotationRelationship from "../models/annotation_relationship";
import { Tracing } from "trace_events";
import slugify from "slugify";
import JSZip from "jszip";

var express = require('express');
var router = express.Router({ mergeParams: true });
const fs = require('fs');

function cloneObject(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

const uploadPath = require('path').resolve('./') + '/public/json/';
const fixFileName = (name: string) => name.split("-").slice(1).join("-").replace(".json", "").replace(/\.[^/.]+$/, "").replace(/_/g, ' ').replace(/-/g, ' ');

const getEntities = async (project_id: string) => await Entity.findAll({ where: { project_id } });
const addEntity = async (project_id: string, label: string, color?: string, icon?: string) => await Entity.create({
    project_id, label, color, icon
})

const getEntityByLabel = async (project_id: string, label: string) => {
    try {
        let entity = await Entity.findOne({
            where: {
                project_id,
                label
            }
        });
        if (!entity) entity = await addEntity(project_id, label);
        return entity?.getDataValue("id");
    } catch {
        const entity = await addEntity(project_id, label);
        return entity?.getDataValue("id");
    }
}

// ENTIDADES

router.get('/entity', async (req: any, res: any) => {
    try {
        const data = await getEntities(req.params.project_id);
        res.status(data ? 200 : 404).json(data);
    } catch (error: any) {
        res.status(400).json(error);
    }
});

router.get('/entity/:id', (req: any, res: any) => {
    Entity.findOne({
        where: { ...req.params },
    })
        .then(data => res.status(data ? 200 : 404).json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/entity', (req: any, res: any) => {
    Entity.create({ ...req.params, ...req.body })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/entity/:id', (req: any, res: any) => {
    Entity.findOne({ where: req.params }).then(data => {
        if (!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});


// RELACIONAMENTOS

router.get('/relationship', (req: any, res: any) => {
    RelationshipType.findAll({
        where: { ...req.params },
    })
        .then(data => res.status(data ? 200 : 404).json(data))
        .catch(error => res.status(400).json(error))
});

router.get('/relationship/:id', (req: any, res: any) => {
    RelationshipType.findOne({
        where: { ...req.params },
    })
        .then(data => res.status(data ? 200 : 404).json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/relationship', (req: any, res: any) => {
    RelationshipType.create({ ...req.params, ...req.body })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/relationship/:id', (req: any, res: any) => {
    RelationshipType.findOne({ where: req.params }).then(data => {
        if (!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/relationship/:id', (req: any, res: any) => {
    RelationshipType.findOne({ where: req.params }).then(data => {
        data?.destroy();
        res.send();
    })
});


// DOCUMENTOS

router.get('/', (req: any, res: any) => {
    Document.findAll({ where: req.params })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/', async (req: any, res: any) => {

    const rawdata = fs.readFileSync(uploadPath + req.body.file);
    const data = JSON.parse(rawdata);

    const document = await Document.create({
        ...req.params,
        ...{
            name: fixFileName(req.body.file)
        }
    })

    let i = 0;
    for (const sentence of data.sentences) {
        //res.send(sentence);

        const newSentence = await Sentence.create({
            ...req.params,
            ...{
                document_id: document.getDataValue('id'),
                sentence: sentence.text,
                order: i
            }
        });
        i++;

        for (const entity of sentence.entities) {
            const entity_id = await getEntityByLabel(req.params.project_id, entity.label);
            const annotation = await Annotation.create({
                ...req.params,
                ...{
                    entity_id,
                    document_id: document.getDataValue('id'),
                    sentence_id: newSentence.getDataValue('id'),
                    start: entity.start,
                    end: entity.end,
                    text: entity.entity
                }
            });
        }
    }

    res.sendStatus(200);

});

router.get('/export', async (req: any, res: any) => {

    const relationship = await RelationshipType.findAll({
        where: { project_id: req.params.project_id }
    });

    const entity = await Entity.findAll({
        where: { project_id: req.params.project_id }
    });

    const document = await Document.findAll({
        where: { project_id: req.params.project_id },
        include: [{
            model: Sentence,
            include: [{
                model: Annotation,
                attributes: ['id', 'user_id', 'entity_id', 'start', 'end', 'text'],
                include: [Entity]
            },
            {
                model: AnnotationRelationship,
                attributes: ['id', 'user_id', 'relationship_type_id', 'from_annotation_id', 'to_annotation_id'],
                include: [RelationshipType]
            }],
            attributes: ['id', 'sentence']
        }],
        order: [
            [Sentence, 'order', 'asc']
        ]
    })

    const zip = new JSZip();

    for (const d of (document as any)) {

        const file = slugify(d.name).replace(".json", "");
        const content = {
            name: d.name,
            entities: d.sentences.map((s: any) => ({
                sentence: s.sentence,
                annotations: s.annotations.map((a: any) => ({
                    id: a.id,
                    start: a.start,
                    end: a.end,
                    entity: a.text,
                    label: a.entity.label,
                })),
                relationships: s.annotation_relationships.map((r: any) => ({
                    from_annotation_id: r.from_annotation_id,
                    to_annotation_id: r.to_annotation_id,
                    label: r.relationship_type.label,
                }))
            }))
        }

        if (content)
            zip.file(file + ".json", JSON.stringify(content));

    }

    zip.generateAsync({ type: 'base64' }).then(function (content) {
        res.send({
            filename: `export-${new Date().toISOString()}.zip`,
            data: content
        })
    })
});

router.get('/:id', (req: any, res: any) => {

    const relationship = RelationshipType.findAll({
        where: { project_id: req.params.project_id }
    });

    const entity = Entity.findAll({
        where: { project_id: req.params.project_id }
    });

    const document = Document.findOne({
        where: { ...req.params },
        include: [{
            model: Sentence,
            include: [{
                model: Annotation,
                attributes: ['id', 'user_id', 'entity_id', 'start', 'end', 'text']
            },
            {
                model: AnnotationRelationship,
                attributes: ['id', 'user_id', 'relationship_type_id', 'from_annotation_id', 'to_annotation_id']
            }],
            attributes: ['id', 'sentence']
        }],
        order: [
            [Sentence, 'order', 'asc']
        ]
    })

    Promise.all([document, entity, relationship])
        .then((data: any[]) => res.status(data[0] ? 200 : 404).json({
            ...cloneObject(data[0]),
            ...{ entities: data[1] },
            ...{ relationship_types: data[2] }
        }))
        .catch(error => res.status(400).json(error))

});

router.put('/:id', (req: any, res: any) => {
    Document.findOne({ where: req.params }).then(data => {
        if (!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:id', (req: any, res: any) => {
    Document.findOne({ where: { ...req.params, ...req.body } }).then(data => {
        data?.destroy();
        res.send();
    })
});



// Anotações

router.post('/:document_id/sentence/:sentence_id/annotation', (req: any, res: any) => {
    Annotation.create({ ...req.params, ...req.body })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:document_id/sentence/:sentence_id/annotation/:id', (req: any, res: any) => {
    const { sentence_id, id } = req.params;
    Annotation.findOne({ where: { sentence_id, id } }).then(data => {
        if (!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:document_id/sentence/:sentence_id/annotation/:id', (req: any, res: any) => {
    const { sentence_id, id } = req.params;
    Annotation.findOne({ where: { sentence_id, id } }).then(data => {
        data?.destroy();
        res.send();
    })
});


// Relacionamento entre anotações

router.post('/:document_id/sentence/:sentence_id/relationship', (req: any, res: any) => {
    AnnotationRelationship.create({ ...req.params, ...req.body })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:document_id/sentence/:sentence_id/relationship/:id', (req: any, res: any) => {
    const { sentence_id, id } = req.params;
    AnnotationRelationship.findOne({ where: { sentence_id, id } }).then(data => {
        if (!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:document_id/sentence/:sentence_id/relationship/:id', (req: any, res: any) => {
    const { sentence_id, id } = req.params;
    AnnotationRelationship.findOne({ where: { sentence_id, id } }).then(data => {
        data?.destroy();
        res.send();
    })
});


module.exports = router;