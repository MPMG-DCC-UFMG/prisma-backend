import Paraphrase from "../models/paraphrase";
import ParaphraseRevision from "../models/paraphrase_revision";
import User from "../models/user";
import JSZip from "jszip";

var express = require('express');
var router = express.Router({ mergeParams: true });

const fs = require('fs');
const uploadPath = require('path').resolve('./') + '/public/json/';

router.get('/', (req: any, res: any) => {
    Paraphrase.findAll({ where: req.params })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/', (req: any, res: any) => {
    Paraphrase.create({ ...req.params, ...req.body })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/import', (req: any, res: any) => {

    const rawdata = fs.readFileSync(uploadPath + req.body.file);
    const data = JSON.parse(rawdata);

    Paraphrase.create({ ...req.params, ...{ text: data.text } })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.get('/export', async (req: any, res: any) => {

    const whereRevision: any = {};
    if (req.query.only_approved_revisions)
        whereRevision.approved = req.query.only_approved_revisions;

    console.log(req.query);

    const data = await Paraphrase.findAll({
        where: req.params,
        include: [{
            model: ParaphraseRevision,
            as: "revisions",
            where: whereRevision,
            attributes: ["id", "user_id", "revision", "approved", "createdAt", "updatedAt"],
            include: [{
                model: User,
                attributes: ["id", "photo", "name", "email"],
            }]
        }],
        order: [["createdAt", "ASC"]]
    })

    const zip = new JSZip();
    zip.file("paraphrase.json", JSON.stringify(data));

    zip.generateAsync({ type: 'base64' }).then(function (content) {
        res.send({
            filename: `export-${new Date().toISOString()}.zip`,
            data: content
        })
    })

});

router.get('/:id', (req: any, res: any) => {
    Paraphrase.findOne({
        where: req.params,
        include: [{
            model: ParaphraseRevision,
            as: "revisions",
            attributes: ["id", "user_id", "revision", "approved", "createdAt", "updatedAt"],
            include: [{
                model: User,
                attributes: ["id", "photo", "name", "email"],
            }]
        }],
        order: [["createdAt", "ASC"]]
    })
        .then(data => res.status(data ? 200 : 404).json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:id', (req: any, res: any) => {
    Paraphrase.findOne({ where: req.params }).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:id', (req: any, res: any) => {
    Paraphrase.findOne({ where: req.params }).then(data => {
        data?.destroy();
        res.send();
    })
});


router.post('/:paraphrase_id/revision', async (req: any, res: any) => {
    ParaphraseRevision.create({ ...req.params, ...req.body })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:paraphrase_id/revision/:id', async (req: any, res: any) => {
    const update = req.body;
    delete update.user_id;
    ParaphraseRevision.findOne({ where: req.params }).then(data => {
        data?.update(update)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:paraphrase_id/revision/:id', (req: any, res: any) => {
    ParaphraseRevision.findOne({ where: req.params }).then(data => {
        data?.destroy();
        res.send();
    })
});

module.exports = router;