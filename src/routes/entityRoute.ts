import Annotation from "../models/annotation";
import Document from "../models/document";
import Entity from "../models/entity";
import Sentence from "../models/sentence";
import _ from 'lodash';
import RelationshipType from "../models/relationship_type";
import AnnotationRelationship from "../models/annotation_relationship";

var express = require('express');
var router = express.Router({ mergeParams: true });

function cloneObject(obj:any){
    return JSON.parse(JSON.stringify(obj));
}

// ENTIDADES

router.get('/entity', (req: any, res: any) => { 
    Entity.findAll({
        where: {...req.params},
    })
    .then(data => res.status(data ? 200 : 404).json(data))
    .catch(error => res.status(400).json(error))
});

router.get('/entity/:id', (req: any, res: any) => { 
    Entity.findOne({
        where: {...req.params},
    })
    .then(data => res.status(data ? 200 : 404).json(data))
    .catch(error => res.status(400).json(error))
});

router.post('/entity', (req: any, res: any) => { 
    Entity.create({...req.params, ...req.body})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/entity/:id', (req: any, res: any) => { 
    Entity.findOne({where: req.params}).then(data => {
        if(!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});


// RELACIONAMENTOS

router.get('/relationship', (req: any, res: any) => { 
    RelationshipType.findAll({
        where: {...req.params},
    })
    .then(data => res.status(data ? 200 : 404).json(data))
    .catch(error => res.status(400).json(error))
});

router.get('/relationship/:id', (req: any, res: any) => { 
    RelationshipType.findOne({
        where: {...req.params},
    })
    .then(data => res.status(data ? 200 : 404).json(data))
    .catch(error => res.status(400).json(error))
});

router.post('/relationship', (req: any, res: any) => { 
    RelationshipType.create({...req.params, ...req.body})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/relationship/:id', (req: any, res: any) => { 
    RelationshipType.findOne({where: req.params}).then(data => {
        if(!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});


// DOCUMENTOS

router.get('/', (req: any, res: any) => { 
    Document.findAll({where: req.params})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/', (req: any, res: any) => { 
    Document.create({...req.params, ...req.body})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.get('/:id', (req: any, res: any) => { 

    const relationship = RelationshipType.findAll({
        where: {project_id: req.params.project_id}
    });

    const entity = Entity.findAll({
        where: {project_id: req.params.project_id}
    });

    const document = Document.findOne({
        where: {...req.params, ...req.body},
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
        }]
    })
    
    Promise.all([document, entity, relationship])
        .then((data:any[]) => res.status(data[0] ? 200 : 404).json({ 
            ...cloneObject(data[0]), 
            ...{entities: data[1]},
            ...{relationship_types: data[2]} 
        }))
        .catch(error => res.status(400).json(error))

});

router.put('/:id', (req: any, res: any) => { 
    Document.findOne({where: req.params}).then(data => {
        if(!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:id', (req: any, res: any) => { 
    Document.findOne({where: {...req.params, ...req.body}}).then(data => {
        data?.destroy();
        res.send();
    })
});


// Frases / Sentenças

router.post('/:document_id/sentence', (req: any, res: any) => { 
    Sentence.create({...req.params, ...req.body})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:document_id/sentence/:id', (req: any, res: any) => { 
    Sentence.findOne({where: req.params}).then(data => {
        if(!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

// Anotações

router.post('/:document_id/sentence/:sentence_id/annotation', (req: any, res: any) => { 
    Annotation.create({...req.params, ...req.body})
    .then(data => res.json(data))
    .catch(error => res.status(400).json(error))
});

router.put('/:document_id/sentence/:sentence_id/annotation/:id', (req: any, res: any) => { 
    const {sentence_id, id} = req.params;
    Annotation.findOne({where: { sentence_id, id }}).then(data => {
        if(!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:document_id/sentence/:sentence_id/annotation/:id', (req: any, res: any) => { 
    const {sentence_id, id} = req.params;
    Annotation.findOne({where: { sentence_id, id }}).then(data => {
        data?.destroy();
        res.send();
    })
});


// Relacionamento entre anotações

router.post('/:document_id/sentence/:sentence_id/relationship', (req: any, res: any) => { 
    AnnotationRelationship.create({...req.params, ...req.body})
    .then(data => res.json(data))
    .catch(error => res.status(400).json(error))
});

router.put('/:document_id/sentence/:sentence_id/relationship/:id', (req: any, res: any) => { 
    const {sentence_id, id} = req.params;
    AnnotationRelationship.findOne({where: { sentence_id, id }}).then(data => {
        if(!data) res.status(404).send()
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:document_id/sentence/:sentence_id/relationship/:id', (req: any, res: any) => { 
    const {sentence_id, id} = req.params;
    AnnotationRelationship.findOne({where: { sentence_id, id }}).then(data => {
        data?.destroy();
        res.send();
    })
});


module.exports = router;