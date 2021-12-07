import { DbConnector } from "../services/dbConnector";
import Classification from "./classification";
import ClassificationLabel from "./classification_label";
import Project from "./project";

const { Sequelize, DataTypes } = require('sequelize');

const ClassificationSegment = DbConnector.sequelize().define('classification_segment', {
    // Model attributes are defined here
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    classification_id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: true,
        references: {
            model: Classification,
            key: 'id'
        }
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
    formatted_text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ref_id: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "created"
    }
    
}, {
  // Other model options go here
  paranoid: true
});

ClassificationSegment.belongsTo(Project, {foreignKey: "project_id"});
//ClassificationSegment.belongsTo(ClassificationLabel, {foreignKey: {name: "classification_label_id", allowNull: true}});
Classification.hasMany(ClassificationSegment, {foreignKey: {name: "classification_id", allowNull: true}, as: "segments"});

(async () => {
    await ClassificationSegment.sync({alter: true});
})();

export default ClassificationSegment;