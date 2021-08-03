import { DbConnector } from "../services/dbConnector";
import AudioSegment from "./audio_segment";
import Project from "./project";

const { Sequelize, DataTypes } = require('sequelize');

const AudioTranscription = DbConnector.sequelize().define('audio_transcription', {
    // Model attributes are defined here
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    project_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Project,
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file: {
        type: DataTypes.STRING,
        allowNull: false
    },
    allow_download: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    total_time: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "created"
    },
    is_merge: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    merge_ids: {
        type: DataTypes.STRING,
        allowNull: true
    },
    merge_times: {
        type: DataTypes.STRING,
        allowNull: true
    }
    
}, {
  // Other model options go here
  paranoid: true
});

AudioTranscription.belongsTo(Project, {foreignKey: "project_id"});

(async () => {
    await AudioTranscription.sync({alter: true});
})();

export default AudioTranscription;