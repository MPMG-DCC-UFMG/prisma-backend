import { DbConnector } from "../services/dbConnector";
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
    type: {
        type: DataTypes.STRING,
        defaultValue: 'classification'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
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

(async () => {
    await Classification.sync({alter: true});
})();

export default Classification;