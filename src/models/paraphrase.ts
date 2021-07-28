import { DbConnector } from "../services/dbConnector";
import AudioSegment from "./audio_segment";
import Project from "./project";

const { Sequelize, DataTypes } = require('sequelize');

const Paraphrase = DbConnector.sequelize().define('paraphrase', {
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
    text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "created"
    }
    
}, {
  // Other model options go here
});

Paraphrase.belongsTo(Project, {foreignKey: "project_id"});

(async () => {
    await Paraphrase.sync();
})();

export default Paraphrase;