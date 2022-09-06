import { DbConnector } from "../services/dbConnector";
import AudioSegment from "./audio_segment";
import Project from "./project";

const { Sequelize, DataTypes } = require("sequelize");

const Image = DbConnector.sequelize().define(
  "image",
  {
    // Model attributes are defined here
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Project,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "created",
    },
  },
  {
    // Other model options go here
    paranoid: true,
  }
);

Image.belongsTo(Project, { foreignKey: "project_id" });

(async () => {
  await Image.sync({ alter: true });
})();

export default Image;
