import { DbConnector } from "../services/dbConnector";
import AudioSegment from "./audio_segment";
import AudioTranscription from "./audio_transcription";
import Image from "./image";
import Project from "./project";
import User from "./user";

const { Sequelize, DataTypes } = require("sequelize");

const ImageRevision = DbConnector.sequelize().define(
  "image_revision",
  {
    // Model attributes are defined here
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    image_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Image,
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Project,
        key: "id",
      },
    },
    revision: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    // Other model options go here
    paranoid: true,
  }
);

ImageRevision.belongsTo(Project, { foreignKey: "project_id" });
ImageRevision.belongsTo(Image, { foreignKey: "image_id" });
ImageRevision.belongsTo(User, { foreignKey: "user_id" });
Image.hasMany(ImageRevision, { foreignKey: "image_id", as: "revisions" });

(async () => {
  await ImageRevision.sync({ alter: true });
})();

export default ImageRevision;
