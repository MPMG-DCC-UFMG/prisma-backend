import { DbConnector } from "../services/dbConnector";
import Project from "./project";
import User from "./user";

const { Sequelize, DataTypes } = require('sequelize');

const RelationshipType = DbConnector.sequelize().define('relationship_type', {
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
    }
}, {
  // Other model options go here
  paranoid: true
});

(async () => {
    await RelationshipType.sync({alter: true});
})();


export default RelationshipType;