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
    }
}, {
  // Other model options go here
});

(async () => {
    await RelationshipType.sync();
})();


export default RelationshipType;