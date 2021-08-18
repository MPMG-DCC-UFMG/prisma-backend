import fs from 'fs';
import Jimp from 'jimp';

const express = require('express');
const router = express.Router({ mergeParams: true });
const slugify = require('slugify')
const FileType = require('file-type');
const uploadPath = require('path').resolve('./') + '/public/files/';
const { exec } = require("child_process");

const toMp3 = async (filename: string) => {

    const file = `${filename}`;
    const fileType = await FileType.fromFile(`./public/files/${file}`);

    const toConvert: string[] = ["audio/ogg", "audio/wav", "audio/vnd.wave", "audio/webm"];

    if (fileType && toConvert.includes(fileType.mime)) {

        const newFile = file.replace(fileType.ext, "mp3");
        console.log(newFile);

        try {
            exec(`docker exec sox-container sox ${file} ${newFile}`, (error: any, stdout: any, stderr: any) => { });
        } catch (error) {
            throw error;
        }

        return filename.replace(fileType.ext, "mp3");
    } else {
        return filename;
    }

}

const resizeImage = async (filename: string) => {
    new Promise<void>((resolve, reject) => {
        Jimp.read('./public/image/'+filename)
            .then((img) => {
                img.resize(500, Jimp.AUTO) // resize
                    .quality(60) // set JPEG quality
                    .write('./public/image/'+filename); // save
                resolve();
            })
            .catch((err: any) => {
                console.error(err);
                reject();
            });
    })
}

router.post('/', async (req: any, res: any) => {
    let sampleFile: any;

    if (!req.files || Object.keys(req.files).length === 0)
        return res.status(400).send('No files were uploaded.');


    sampleFile = req.files.file;

    const dir = sampleFile.mimetype.indexOf('image') >= 0 ? req.body.publicPath + 'image/' : req.body.uploadPath;

    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });

    const date: Date = new Date();
    let filename = [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()].join('') + '-' + slugify(sampleFile.name);

    sampleFile.mv(dir + filename, async function (err: any) {
        if (err)
            return res.status(500).send(err);

        if (sampleFile.mimetype.indexOf('audio') >= 0) {
            filename = await toMp3(filename);
        } else if (sampleFile.mimetype.indexOf('image') >= 0) {
            await resizeImage(filename);
        }

        res.json({
            "name": filename,
            "status": "done",
            "url": filename
        });
    })
});

module.exports = router;