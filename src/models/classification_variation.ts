import { DbConnector } from "../services/dbConnector";
import Classification from "./classification";
import ClassificationLabel from "./classification_label";
import Project from "./project";
import User from "./user";

const { Sequelize, DataTypes } = require('sequelize');

const ClassificationVariation = DbConnector.sequelize().define('classification_variation', {
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
    user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    classification_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Classification,
            key: 'id'
        }
    },
    classification_label_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: ClassificationLabel,
            key: 'id'
        }
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: true
    }
    
}, {
  // Other model options go here
});

ClassificationVariation.belongsTo(Project, {foreignKey: "project_id"});
ClassificationVariation.belongsTo(ClassificationLabel, {foreignKey: "classification_label_id"});
Classification.hasMany(ClassificationVariation, {foreignKey: "classification_id", as: "variations"});

(async () => {
    await ClassificationVariation.sync();
})();

export default ClassificationVariation;