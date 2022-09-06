import { Sequelize, where } from "sequelize";
import AudioSegment from "../models/audio_segment";
import AudioSegmentRevision from "../models/audio_segment_revision";
import AudioTranscription from "../models/audio_transcription";
import User from "../models/user";
import JSZip from "jszip";
import Image from "../models/image";
import ImageRevision from "../models/image_revision";
const { exec } = require("child_process");
var { saveAs } = require("file-saver");
var fs = require("fs");
var express = require("express");
var router = express.Router({ mergeParams: true });
const uploadPath = require("path").resolve("./") + "/public/files/";

router.get("/", (req: any, res: any) => {
  console.log("HERE");
  Image.findAll({
    where: req.params,
    order: [["name", "ASC"]],
    include: [
      {
        model: ImageRevision,
        as: "revisions",
        attributes: ["id"],
      },
    ],
  })
    .then((data) => {
      console.log("DATA", data);
      return res.json(data);
    })
    .catch((error) => {
      console.log("ERROR!", error);
      return res.status(400).json(error);
    });
});

router.get("/export", async (req: any, res: any) => {
  const whereRevision: any = {};
  if (req.query.only_approved_revisions)
    whereRevision.approved = req.query.only_approved_revisions;

  const data = await Image.findAll({
    where: req.params,
    include: [
      {
        model: AudioSegment,
        as: "segments",
        attributes: ["id", "file"],
        include: [
          {
            model: ImageRevision,
            attributes: [
              "id",
              "user_id",
              "revision",
              "approved",
              "createdAt",
              "updatedAt",
            ],
            as: "revisions",
            include: [
              {
                model: User,
                attributes: ["id", "photo", "name", "email"],
              },
            ],
          },
        ],
      },
    ],
    order: [
      [{ model: AudioSegment, as: "segments" }, "start_time", "ASC"],
      [{ model: AudioSegment, as: "segments" }, "end_time", "DESC"],
      [
        { model: AudioSegment, as: "segments" },
        { model: AudioSegmentRevision, as: "revisions" },
        "createdAt",
        "ASC",
      ],
    ],
  });

  const zip = new JSZip();
  const files = [];

  for (const d of data as any) {
    for (const segment of d.dataValues.segments) {
      const file = segment.dataValues.file;
      let i = 0;
      zip.file(
        file.replace(".png", ".json"),
        JSON.stringify(segment.dataValues)
      );

      if (fs.existsSync(req.body.uploadPath + segment.dataValues.file)) {
        files.push({
          name: segment.dataValues.file,
          file: req.body.uploadPath + segment.dataValues.file,
        });
      }

      for (const revision of segment.dataValues.revisions) {
        let filename = file.replace(".png", "");
        if (i > 0) filename += "-" + i;
        zip.file(filename + ".txt", revision.dataValues.revision);
        i++;
      }
    }
  }

  const filesToExport = [];
  const date = new Date().toISOString();

  const content = await zip.generateAsync({ type: "base64" });
  fs.mkdirSync(`public/temp/`, { recursive: true });
  fs.writeFileSync(`public/temp/export-data.zip`, content, {
    encoding: "base64",
  });
  filesToExport.push(`export-data.zip`);

  const pageSize = 100;
  for (let i: number = 0; i < Math.ceil(files.length / pageSize); i++) {
    const f = files.slice(i * pageSize, i * pageSize + pageSize);

    const zip = new JSZip();
    for (const item of f) {
      zip.file(item.name, fs.readFileSync(item.file, { encoding: "base64" }), {
        base64: true,
      });
    }

    const content = await zip.generateAsync({ type: "base64" });
    fs.writeFileSync(`public/temp/export-files-${i + 1}.zip`, content, {
      encoding: "base64",
    });
    filesToExport.push(`export-files-${i + 1}.zip`);
  }

  res.send(filesToExport);
});

router.get("/:id", (req: any, res: any) => {
  console.log("BUSCA COM ID", req.body);
  Image.findOne({
    where: {
      id: req.params.id,
    },
  })
    .then((data) => res.status(data ? 200 : 404).json(data))
    .catch((error) => res.status(400).json(error));
});

router.put("/:id", (req: any, res: any) => {
  AudioTranscription.findOne({ where: req.params }).then((data) => {
    data
      ?.update(req.body)
      .then((data) => res.json(data))
      .catch((error) => res.status(400).json(error));
  });
});

router.delete("/:id", (req: any, res: any) => {
  AudioTranscription.findOne({ where: req.params }).then((data) => {
    data?.destroy();
    res.send();
  });
});

router.post("/", async (req: any, res: any) => {
  if (req.body) {
    const { name, file, user_id } = req.body;
    const { project_id } = req.params;
    const newImage: any = await Image.create({
      name,
      file,
      project_id,
    });

    const newImageRevision = await ImageRevision.create({
      image_id: newImage.id,
      user_id,
      project_id,
      revision: null,
      approved: false,
    });

    res.json({
      newImageRevision,
    });
  }
});

// router.delete("/:audio_transcription_id/segment/:id", (req: any, res: any) => {
//   AudioSegment.findOne({ where: req.params }).then((data) => {
//     data?.destroy();
//     res.send();
//   });
// });

// router.post(
//   "/:audio_transcription_id/segment/:audio_segment_id/revision",
//   async (req: any, res: any) => {
//     AudioSegmentRevision.create({ ...req.params, ...req.body })
//       .then((data) => res.json(data))
//       .catch((error) => res.status(400).json(error));
//   }
// );

// router.put(
//   "/:audio_transcription_id/segment/:audio_segment_id/revision/:id",
//   async (req: any, res: any) => {
//     console.log(req.params);
//     AudioSegmentRevision.findOne({ where: req.params }).then((data) => {
//       if (!data) res.sendStatus(404);
//       data
//         ?.update(req.body)
//         .then((data) => res.json(data))
//         .catch((error) => res.status(400).json(error));
//     });
//   }
// );

// router.delete(
//   "/:audio_transcription_id/segment/:audio_segment_id/revision/:id",
//   (req: any, res: any) => {
//     AudioSegmentRevision.findOne({ where: req.params }).then((data) => {
//       data?.destroy();
//       res.send();
//     });
//   }
// );

module.exports = router;
