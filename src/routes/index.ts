import { authenticateToken } from "../middlewares/authToken";

var express = require("express");
var router = express.Router({ mergeParams: true });

const authRoute = require("./authRoute");
const uploadRoute = require("./uploadRoute");
const filesRoute = require("./filesRoute");
const userRoute = require("./userRoute");
const projectRoute = require("./projectRoute");
const entityRoute = require("./entityRoute");
const audioTranscriptionRoute = require("./audioTranscriptionRoute");
const paraphraseRoute = require("./paraphraseRoute");
const classificationRoute = require("./classificationRoute");
const classificationLabelRoute = require("./classificationLabelRoute");
const imageRoute = require("./imageRoute");

router.get("/", (req: any, res: any) => {
  res.send("API do Software de Anotação");
});
router.use("/", authRoute);
router.use("/upload", authenticateToken, uploadRoute);
router.use("/files", filesRoute);
router.use("/user", authenticateToken, userRoute);
router.use("/project", authenticateToken, projectRoute);
router.use(
  "/project/:project_id/entity_detection",
  authenticateToken,
  entityRoute
);
router.use(
  "/project/:project_id/audio_transcription",
  authenticateToken,
  audioTranscriptionRoute
);
router.use(
  "/project/:project_id/paraphrase",
  authenticateToken,
  paraphraseRoute
);
router.use(
  "/project/:project_id/classification",
  authenticateToken,
  classificationRoute
);
router.use(
  "/project/:project_id/classification_label",
  authenticateToken,
  classificationLabelRoute
);
router.use("/project/:project_id/image", authenticateToken, imageRoute);

module.exports = router;
