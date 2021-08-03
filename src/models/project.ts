import { DbConnector } from "../services/dbConnector";
import ProjectUser from "./project_user";
import User from "./user";

const { Sequelize, DataTypes } = require('sequelize');

const Project = DbConnector.sequelize().define('projects', {
    // Model attributes are defined here
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    has_audio_transcription: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    has_entities_detection: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    has_paraphrases: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    color: {
        type: DataTypes.STRING
    },
    icon: {
        type: DataTypes.STRING
    },
    open: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
  // Other model options go here
  paranoid: true
});


(async () => {
    await Project.sync({alter: true});
})();


export default Project;