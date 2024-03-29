import { DbConnector } from "../services/dbConnector";
import ProjectUser from "./project_user";
import User from "./user";

const { Sequelize, DataTypes } = require("sequelize");

const Project = DbConnector.sequelize().define(
  "projects",
  {
    // Model attributes are defined here
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    has_audio_transcription: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    has_image: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    has_entities_detection: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    has_paraphrases: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    has_classification: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    classification_multiple_labels: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    classification_users_per_segment: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    audio_allow_download: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    entities_allow_relationship: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    color: {
      type: DataTypes.STRING,
    },
    icon: {
      type: DataTypes.STRING,
    },
    open: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    // Other model options go here
    paranoid: true,
  }
);

(async () => {
  await Project.sync({ alter: true });
})();

export default Project;
