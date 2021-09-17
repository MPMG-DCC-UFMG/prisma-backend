import { DbConnector } from "../services/dbConnector";
import Document from "./document";
import Project from "./project";

const { Sequelize, DataTypes } = require('sequelize');

const Sentence = DbConnector.sequelize().define('sentence', {
    // Model attributes are defined here
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    document_id: {
        type: DataTypes.UUID,
        references: {
            model: Document,
            key: 'id'
        }
    },
    project_id: {
        type: DataTypes.UUID,
        references: {
            model: Project,
            key: 'id'
        }
    },
    sentence: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    order: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
    
}, {
  // Other model options go here
});

Document.hasMany(Sentence, {foreignKey: "document_id"});


(async () => {
    await Sentence.sync({alter: true});
})();

export default Sentence;