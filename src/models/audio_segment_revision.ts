import { DbConnector } from "../services/dbConnector";
import AudioSegment from "./audio_segment";
import AudioTranscription from "./audio_transcription";
import Project from "./project";
import User from "./user";

const { Sequelize, DataTypes } = require('sequelize');

const AudioSegmentRevision = DbConnector.sequelize().define('audio_segment_revision', {
    // Model attributes are defined here
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    audio_transcription_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: AudioTranscription,
            key: 'id'
        }
    },
    audio_segment_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: AudioSegment,
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    revision: {
        type: DataTypes.STRING,
        allowNull: false
    },
    approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
    
}, {
  // Other model options go here
  paranoid: true
});

AudioSegmentRevision.belongsTo(Project, {foreignKey: "project_id"});
AudioSegmentRevision.belongsTo(AudioTranscription, {foreignKey: "audio_transcription_id"});
AudioSegmentRevision.belongsTo(User, {foreignKey: "user_id"});
AudioSegment.hasMany(AudioSegmentRevision, {foreignKey: "audio_segment_id", as: "revisions"});

(async () => {
    await AudioSegmentRevision.sync({alter: true});
})();

export default AudioSegmentRevision;