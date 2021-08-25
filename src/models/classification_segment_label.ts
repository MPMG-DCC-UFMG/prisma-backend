import { DbConnector } from "../services/dbConnector";
import Classification from "./classification";
import ClassificationLabel from "./classification_label";
import ClassificationSegment from "./classification_segment";
import Project from "./project";
import User from "./user";

const { Sequelize, DataTypes } = require('sequelize');

const ClassificationSegmentLabel = DbConnector.sequelize().define('classification_segment_label', {
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
    classification_segment_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: ClassificationSegment,
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

ClassificationSegmentLabel.belongsTo(Project, {foreignKey: "project_id"});
ClassificationSegment.hasMany(ClassificationSegmentLabel, {foreignKey: "classification_segment_id", as: "labels"});
ClassificationSegmentLabel.belongsTo(ClassificationLabel, {foreignKey: {name: "classification_label_id"}});
ClassificationSegmentLabel.belongsTo(User, {foreignKey: "user_id"});

(async () => {
    await ClassificationSegmentLabel.sync({alter: true});
})();

export default ClassificationSegmentLabel;