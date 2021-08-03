import AudioSegment from "../models/audio_segment";
import AudioSegmentRevision from "../models/audio_segment_revision";
import AudioTranscription from "../models/audio_transcription";
import User from "../models/user";
const { exec } = require("child_process");

var express = require('express');
var router = express.Router({ mergeParams: true });
const uploadPath = require('path').resolve('./') + '/public/files/';
var mp3Duration = require('mp3-duration');

router.get('/', (req: any, res: any) => { 
    AudioTranscription.findAll({ where: req.params})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.post('/', async(req: any, res: any) => { 

    mp3Duration(uploadPath+req.body.file, async (err: any, duration: number) => {
        
        const data = {
            total_time: Math.floor(duration)
        }
        
        const at: any = await AudioTranscription.create({...req.params, ...req.body, ...data});
        const as: any = await AudioSegment.create({
            project_id: at.project_id,
            audio_transcription_id: at.id,
            file: at.file,
            start_time: 0,
            end_time: at.total_time,
            full_audio: true
        })

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
            attributes: ["id", "file", "start_time", "end_time", "full_audio"],
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
            [ {model: AudioSegment, as: 'segments'}, 'start_time', 'ASC' ],
            [ {model: AudioSegment, as: 'segments'}, 'end_time', 'DESC' ],
            [ {model: AudioSegment, as: 'segments'}, {model: AudioSegmentRevision, as: 'revisions'}, 'createdAt', 'ASC' ]
        ]
    }).then(data => res.status(data ? 200 : 404).json(data))
      .catch(error => res.status(400).json(error))
});

router.put('/:id', (req: any, res: any) => { 
    AudioTranscription.findOne({where: req.params}).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:id', (req: any, res: any) => { 
    AudioTranscription.findOne({where: req.params}).then(data => {
        data?.destroy();
        res.send();
    })
});

router.post('/:id/segment', async (req: any, res: any) => { 

    let audio:any = await AudioTranscription.findOne({where: req.params});
    if(!audio) res.status(400).send();

    let segments = req.body.segments;
    let data = [];

    for(let i:number = 0; i<segments.length; i++){

        const start = segments[i][0];
        const end = segments[i][1];
        const duration = end-start;

        const newFile = audio.file.replace(`.mp3`, `-segment-${start}-${end}.mp3`);

        exec(`docker exec sox-container sox ${audio.file} ${newFile} trim ${start} ${duration}`, (error:any, stdout:any, stderr:any) => {});

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

router.post('/:id/segment/merge', async (req: any, res: any) => { 

    const data = await AudioSegment.findAll({
        where: { id: req.body.segment_ids },
        include: [{
            model: AudioSegmentRevision,
            attributes: ["id", "user_id", "revision", "approved", "createdAt", "updatedAt"],
            where: {approved: true},
            as: "revisions"
        }]
    });
    
    res.json(data);
    
});


router.delete('/:audio_transcription_id/segment/:id', (req: any, res: any) => { 
    AudioSegment.findOne({where: req.params}).then(data => {
        data?.destroy();
        res.send();
    })
});


router.post('/:audio_transcription_id/segment/:audio_segment_id/revision', async (req: any, res: any) => { 
    AudioSegmentRevision.create({...req.params, ...req.body})
        .then(data => res.json(data))
        .catch(error => res.status(400).json(error))
});

router.put('/:audio_transcription_id/segment/:audio_segment_id/revision/:id', async (req: any, res: any) => { 
    AudioSegmentRevision.findOne({where: req.params}).then(data => {
        data?.update(req.body)
            .then(data => res.json(data))
            .catch(error => res.status(400).json(error))
    })
});

router.delete('/:audio_transcription_id/segment/:audio_segment_id/revision/:id', (req: any, res: any) => { 
    AudioSegmentRevision.findOne({where: req.params}).then(data => {
        data?.destroy();
        res.send();
    })
});


module.exports = router;