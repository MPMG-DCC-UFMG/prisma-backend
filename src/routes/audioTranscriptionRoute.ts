import { Sequelize, where } from "sequelize";
import AudioSegment from "../models/audio_segment";
import AudioSegmentRevision from "../models/audio_segment_revision";
import AudioTranscription from "../models/audio_transcription";
import User from "../models/user";
import JSZip from "jszip";

const { exec } = require("child_process");
var fs = require('fs');
var express = require('express');
var router = express.Router({ mergeParams: true });
const uploadPath = require('path').resolve('./') + '/public/files/';
var mp3Duration = require('mp3-duration');

router.get('/', (req: any, res: any) => {
    AudioTranscription.findAll({
        where: req.params,
        order: [
            ['name', 'ASC']
        ],
        include: [{
            model: AudioSegmentRevision,
            as: "revisions",
            attributes: ['id']
        }],
    })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});


router.get('/export', async (req: any, res: any) => {

    const whereRevision: any = {};
    if (req.query.only_approved_revisions)
        whereRevision.approved = req.query.only_approved_revisions

    const data = await AudioTranscription.findAll({
        where: req.params,
        include: [{
            model: AudioSegment,
            as: "segments",
            attributes: ["id", "file", "start_time", "end_time", "full_audio", "is_merge", "merge_data"],
            include: [{
                model: AudioSegmentRevision,
                attributes: ["id", "user_id", "revision", "approved", "createdAt", "updatedAt"],
                as: "revisions",
                include: [{
                    model: User,
                    attributes: ["id", "name", "email"],
                }]
            }]
        }],
        order: [
            [{ model: AudioSegment, as: 'segments' }, 'start_time', 'ASC'],
            [{ model: AudioSegment, as: 'segments' }, 'end_time', 'DESC'],
            [{ model: AudioSegment, as: 'segments' }, { model: AudioSegmentRevision, as: 'revisions' }, 'createdAt', 'ASC']
        ]
    })

    const zip = new JSZip();

    for (const d of (data as any)) {
        for (const segment of d.dataValues.segments) {
            const file = segment.dataValues.file;
            let i = 0;
            zip.file(file.replace(".mp3", ".json"), JSON.stringify(segment.dataValues));
            zip.file(
                segment.dataValues.file, 
                fs.readFileSync(req.body.uploadPath + segment.dataValues.file, {encoding: 'base64'}), 
                {base64: true}
            );

            for (const revision of segment.dataValues.revisions) {
                let filename = file.replace(".mp3", "");
                if (i > 0) filename += "-" + i;
                zip.file(filename + ".txt", revision.dataValues.revision);
                i++;
            }
        }
    }

    zip.generateAsync({ type: 'base64' }).then(function (content) {
        res.send({
            filename: `export-${ new Date().toISOString() }.zip`,
            data: content
        })
    })
});

router.post('/', async (req: any, res: any) => {

    mp3Duration(uploadPath + req.body.file, async (err: any, duration: number) => {

        const data = {
            total_time: Math.floor(duration)
        }

        const at: any = await AudioTranscription.create({ ...req.params, ...req.body, ...data });
        const as: any = await AudioSegment.create({
            project_id: at.project_id,
            audio_transcription_id: at.id,
            file: at.file,
            start_time: 0,
            end_time: at.total_time,
            full_audio: true
        })

        if (req.body.txt) {
            const txt = fs.readFileSync(req.body.publicPath + "other/" + req.body.txt, 'utf8');

            const newRevision = await AudioSegmentRevision.create({
                project_id: at.project_id,
                audio_transcription_id: at.id,
                audio_segment_id: as.id,
                user_id: req.body.user_id,
                revision: txt
            })
        }

        res.json({
            audioTranscription: at,
            audioSegment: as
        })
    });
});

router.get('/:id', (req: any, res: any) => {
    AudioTranscription.findOne({
        where: req.params,
        include: [{
            model: AudioSegment,
            as: "segments",
            attributes: ["id", "file", "start_time", "end_time", "full_audio", "is_merge", "merge_data"],
            include: [{
                model: AudioSegmentRevision,
                attributes: ["id", "user_id", "revision", "approved", "createdAt", "updatedAt"],
                as: "revisions",
                include: [{
                    model: User,
                    attributes: ["id", "name", "email"],
                }]
            }]
        }],
        order: [
            [{ model: AudioSegment, as: 'segments' }, 'start_time', 'ASC'],
            [{ model: AudioSegment, as: 'segments' }, 'end_time', 'DESC'],
            [{ model: AudioSegment, as: 'segments' }, { model: AudioSegmentRevision, as: 'revisions' }, 'createdAt', 'ASC']
        ]
    }).then(data => res.status(data ? 200 : 404).json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:id', (req: any, res: any) => {
    AudioTranscription.findOne({ where: req.params }).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:id', (req: any, res: any) => {
    AudioTranscription.findOne({ where: req.params }).then(data => {
        data?.destroy();
        res.send();
    })
});

router.post('/:id/segment', async (req: any, res: any) => {

    let audio: any = await AudioTranscription.findOne({ where: req.params });
    if (!audio) res.status(400).send();

    let segments = req.body.segments;
    let data = [];

    for (let i: number = 0; i < segments.length; i++) {

        const start = segments[i][0];
        const end = segments[i][1];
        const duration = end - start;

        const newFile = audio.file.replace(`.mp3`, `-segment-${start}-${end}.mp3`);

        exec(`docker exec sox-container sox ${audio.file} ${newFile} trim ${start} ${duration}`, (error: any, stdout: any, stderr: any) => { });

        data.push(await AudioSegment.create({
            project_id: req.params.project_id,
            audio_transcription_id: audio.id,
            file: newFile,
            start_time: start,
            end_time: end
        }));
    }

    res.json(data);

});

router.put('/:audio_transcription_id/segment/:id', async (req: any, res: any) => {

    let audio: any = await AudioTranscription.findOne({ where: { id: req.params.audio_transcription_id } });
    if (!audio) res.status(400).send();

    if (req.body.start_time != null && req.body.end_time != null) {
        const start = req.body.start_time;
        const end = req.body.end_time;
        const duration = end - start;

        const newFile = audio.file.replace(`.mp3`, `-segment-${start}-${end}.mp3`);

        req.body.file = newFile;

        exec(`docker exec sox-container sox ${audio.file} ${newFile} trim ${start} ${duration}`, (error: any, stdout: any, stderr: any) => { });
    }

    AudioSegment.findOne({ where: req.params }).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.post('/:id/segment/merge', async (req: any, res: any) => {

    const audio: any = await AudioTranscription.findOne({ where: { id: req.params.id } })

    const data: any = await AudioSegment.findAll({
        where: { id: req.body.segment_ids },
        include: [{
            model: AudioSegmentRevision,
            attributes: ["id", "user_id", "revision", "approved", "createdAt", "updatedAt"],
            where: { approved: true },
            limit: 1,
            as: "revisions"
        }]
    });

    const revisions: string[] = data.map((d: any) => d.revisions[0].revision);
    const starts: number[] = data.map((d: any) => d.start_time);
    const ends: number[] = data.map((d: any) => d.end_time);
    const files: string[] = data.map((d: any) => d.file);

    const newFile = audio.file.replace(`.mp3`, `-merge-${joinMultipleTimes(starts, ends, '-')}.mp3`);
    exec(`docker exec sox-container sox ${files.join(" ")} ${newFile}`, (error: any, stdout: any, stderr: any) => { });

    const newSegment: any = await AudioSegment.create({
        project_id: req.params.project_id,
        audio_transcription_id: audio?.id,
        file: newFile,
        start_time: Math.min(...starts),
        end_time: Math.max(...ends),
        is_merge: true,
        merge_data: JSON.stringify(data.map((d: any) => ({ id: d.id, start_time: d.start_time, end_time: d.end_time })))
    });

    const newRevision = await AudioSegmentRevision.create({
        audio_transcription_id: audio.id,
        project_id: audio.project_id,
        audio_segment_id: newSegment.id,
        user_id: req.body.user_id,
        revision: revisions.join(" ")
    })

    res.json({
        newSegment,
        newRevision
    });

});

const joinMultipleTimes = (starts: number[], ends: number[], separator: string): string => {
    let res = [];
    for (let i: number = 0; i < starts.length; i++) {
        res.push(`${starts[i]}${separator}${ends[i]}`);
    }
    return res.join(separator);
}


router.delete('/:audio_transcription_id/segment/:id', (req: any, res: any) => {
    AudioSegment.findOne({ where: req.params }).then(data => {
        data?.destroy();
        res.send();
    })
});


router.post('/:audio_transcription_id/segment/:audio_segment_id/revision', async (req: any, res: any) => {
    AudioSegmentRevision.create({ ...req.params, ...req.body })
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:audio_transcription_id/segment/:audio_segment_id/revision/:id', async (req: any, res: any) => {
    console.log(req.params);
    AudioSegmentRevision.findOne({ where: req.params }).then(data => {
        if (!data) res.sendStatus(404);
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:audio_transcription_id/segment/:audio_segment_id/revision/:id', (req: any, res: any) => {
    AudioSegmentRevision.findOne({ where: req.params }).then(data => {
        data?.destroy();
        res.send();
    })
});


module.exports = router;