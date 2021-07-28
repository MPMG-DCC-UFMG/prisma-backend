import { DbConnector } from "../services/dbConnector";
import Paraphrase from "./paraphrase";
import Project from "./project";
import User from "./user";

const { Sequelize, DataTypes } = require('sequelize');

const ParaphraseRevision = DbConnector.sequelize().define('paraphrase_revision', {
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
    paraphrase_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Paraphrase,
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
    revision: {
        type: DataTypes.STRING,
        allowNull: false
    }
    
}, {
  // Other model options go here
});

Paraphrase.hasMany(ParaphraseRevision, {foreignKey: "paraphrase_id", as: "revisions"});

(async () => {
    await ParaphraseRevision.sync();
})();

export default ParaphraseRevision;