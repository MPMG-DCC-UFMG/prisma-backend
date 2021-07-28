import { DbConnector } from "../services/dbConnector";
import ClassificationLabel from "./classification_label";
import Project from "./project";

const { Sequelize, DataTypes } = require('sequelize');

const Classification = DbConnector.sequelize().define('classification', {
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
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "created"
    }
    
}, {
  // Other model options go here
});

Classification.belongsTo(Project, {foreignKey: "project_id"});
Classification.belongsTo(ClassificationLabel, {foreignKey: "classification_label_id"});

(async () => {
    await Classification.sync();
})();

export default Classification;