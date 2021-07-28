import { DbConnector } from "../services/dbConnector";
import Project from "./project";
import User from "./user";

const { Sequelize, DataTypes } = require('sequelize');

const ProjectUser = DbConnector.sequelize().define('project_user', {
    // Model attributes are defined here
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    user_id: {
        type: DataTypes.UUID,
        references: {
            model: User,
            key: 'id'
        }
    },
    project_id: {
        type: DataTypes.UUID,
        references: {
            model: Project,
            key: 'id'
        }
    }
}, {
  // Other model options go here,
  underscored: true
});

Project.belongsToMany(User, { 
    through: ProjectUser, 
    as: "users"
});

(async () => {
    await ProjectUser.sync();
})();


export default ProjectUser;