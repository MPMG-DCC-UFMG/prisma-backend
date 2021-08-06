import fs from 'fs';
const express = require('express');
const router = express.Router({ mergeParams: true });
const slugify = require('slugify')
const FileType = require('file-type');
const uploadPath = require('path').resolve('./') + '/public/files/';
const { exec } = require("child_process");

const toMp3 = async (filename: string) => {

    const file = `${filename}`;
    const fileType = await FileType.fromFile(`./public/files/${file}`);

    console.log(fileType);

    const toConvert:string[] = ["audio/ogg", "audio/wav", "audio/vnd.wave", "audio/webm"];

    if(fileType && toConvert.includes(fileType.mime)) {

        const newFile = file.replace(fileType.ext, "mp3");
        console.log(newFile);

        try {
            exec(`docker exec sox-container sox ${file} ${newFile}`, (error:any, stdout:any, stderr:any) => {});
        } catch (error) {
            throw error;
        }

        return filename.replace(fileType.ext, "mp3");
    } else {
        return filename;
    }

    
}

router.post('/', async (req: any, res: any) => { 
    let sampleFile;

    if (!req.files || Object.keys(req.files).length === 0)
        return res.status(400).send('No files were uploaded.');


    sampleFile = req.files.file;

    if(!fs.existsSync(req.body.uploadPath))
        fs.mkdirSync(req.body.uploadPath, { recursive: true} );

    const date: Date = new Date();
    let filename = [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()].join('')+'-'+slugify(sampleFile.name);

    sampleFile.mv(req.body.uploadPath + filename, async function(err: any) {
        if (err)
            return res.status(500).send(err);

        filename = await toMp3(filename);

        res.json({
            "name": filename,
            "status": "done",
            "url": filename
        });
    })
});

module.exports = router;