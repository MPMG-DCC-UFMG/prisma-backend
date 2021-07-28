import { DbConnector } from "../services/dbConnector";
import Project from "./project";

const { Sequelize, DataTypes } = require('sequelize');

const Document = DbConnector.sequelize().define('document', {
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
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
    
}, {
  // Other model options go here
});

Document.belongsTo(Project, {foreignKey: "project_id"});

(async () => {
    await Document.sync();
})();


export default Document;