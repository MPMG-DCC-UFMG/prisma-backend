import { DbConnector } from "../services/dbConnector";
import Annotation from "./annotation";
import Project from "./project";
import RelationshipType from "./relationship_type";
import Sentence from "./sentence";
import User from "./user";

const { Sequelize, DataTypes } = require('sequelize');

const AnnotationRelationship = DbConnector.sequelize().define('annotation_relationship', {
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
    sentence_id: {
        type: DataTypes.UUID,
        references: {
            model: Sentence,
            key: 'id'
        }
    },
    relationship_type_id: {
        type: DataTypes.UUID,
        references: {
            model: RelationshipType,
            key: 'id'
        }
    },
    from_annotation_id: {
        type: DataTypes.UUID
    },
    to_annotation_id: {
        type: DataTypes.UUID
    }
}, {
  // Other model options go here
});

Sentence.hasMany(AnnotationRelationship, {foreignKey: "sentence_id"});
AnnotationRelationship.belongsTo(RelationshipType, {foreignKey: "relationship_type_id"});

(async () => {
    await AnnotationRelationship.sync();
})();


export default AnnotationRelationship;