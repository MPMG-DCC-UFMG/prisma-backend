import { DbConnector } from "../services/dbConnector";
import Classification from "./classification";
import ClassificationCorresponding from "./classification_corresponding";
import ClassificationLabel from "./classification_label";
import Project from "./project";
import User from "./user";

const { Sequelize, DataTypes } = require('sequelize');

const ClassificationCorrespondingLabel = DbConnector.sequelize().define('classification_corresponding_label', {
    // Model attributes are defined here
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
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
        allowNull: true,
        references: {
            model: Classification,
            key: 'id'
        }
    },
    classification_corresponding_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: ClassificationCorresponding,
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
    classification_label_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: ClassificationLabel,
            key: 'id'
        }
    }
}, {
  // Other model options go here
  paranoid: true
});

ClassificationCorrespondingLabel.belongsTo(Project, {foreignKey: "project_id"});
ClassificationCorresponding.hasMany(ClassificationCorrespondingLabel, {foreignKey: "classification_corresponding_id", as: "labels"});
ClassificationCorrespondingLabel.belongsTo(ClassificationLabel, {foreignKey: {name: "classification_label_id"}});
ClassificationCorrespondingLabel.belongsTo(User, {foreignKey: "user_id"});

(async () => {
    await ClassificationCorrespondingLabel.sync({alter: true});
})();

export default ClassificationCorrespondingLabel;