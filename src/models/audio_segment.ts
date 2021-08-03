import { DbConnector } from "../services/dbConnector";
import AudioTranscription from "./audio_transcription";
import Project from "./project";

const { Sequelize, DataTypes } = require('sequelize');

const AudioSegment = DbConnector.sequelize().define('audio_segment', {
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
    audio_transcription_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: AudioTranscription,
            key: 'id'
        }
    },
    file: {
        type: DataTypes.STRING,
        allowNull: false
    },
    full_audio: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    start_time: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    end_time: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
    
}, {
  // Other model options go here
  paranoid: true
});

AudioSegment.belongsTo(Project, {foreignKey: "project_id"});
AudioTranscription.hasMany(AudioSegment, {foreignKey: "audio_transcription_id", as: "segments"});

(async () => {
    await AudioSegment.sync({alter: true});
})();

export default AudioSegment;