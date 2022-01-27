import { DbConnector } from "../services/dbConnector";
import Classification from "./classification";
import ClassificationLabel from "./classification_label";
import ClassificationSegment from "./classification_segment";
import Project from "./project";

const { Sequelize, DataTypes } = require('sequelize');

const ClassificationCorresponding = DbConnector.sequelize().define('classification_corresponding', {
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
    classification_id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: true,
        references: {
            model: Classification,
            key: 'id'
        }
    },
    classification_segment_id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: true,
        references: {
            model: ClassificationSegment,
            key: 'id'
        }
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            try {
                return JSON.parse(this.getDataValue('text'))
            } catch {
                return this.getDataValue('text');
            }
        }
    },
    formatted_text: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            try {
                return JSON.parse(this.getDataValue('formatted_text'))
            } catch {
                return this.getDataValue('formatted_text');
            }
        }
    },
    ref_id: {
        type: DataTypes.STRING
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

ClassificationCorresponding.belongsTo(Project, { foreignKey: "project_id" });
ClassificationSegment.hasMany(ClassificationCorresponding, { foreignKey: { name: "classification_segment_id", allowNull: true }, as: "correspondings" });

(async () => {
    await ClassificationCorresponding.sync({ alter: true });
})();

export default ClassificationCorresponding;