import { DbConnector } from "../services/dbConnector";
import Project from "./project";

const { Sequelize, DataTypes } = require('sequelize');

const Entity = DbConnector.sequelize().define('entity', {
    // Model attributes are defined here
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    project_id: {
        type: DataTypes.UUID,
        references: {
            model: Project,
            key: 'id'
        }
    },
    label: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    color: {
        type: DataTypes.STRING
    },
    icon: {
        type: DataTypes.STRING
    }
}, {
  // Other model options go here
});

Entity.belongsTo(Project, { foreignKey: "project_id" });

(async () => {
    await Entity.sync();
})();


export default Entity;