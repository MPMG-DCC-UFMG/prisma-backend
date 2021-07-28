import { DbConnector } from "../services/dbConnector";
import Entity from "./entity";
import Sentence from "./sentence";
import User from "./user";

const { Sequelize, DataTypes } = require('sequelize');

const Annotation = DbConnector.sequelize().define('annotation', {
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
    entity_id: {
        type: DataTypes.UUID,
        references: {
            model: Entity,
            key: 'id'
        }
    },
    start: {
        type: DataTypes.INTEGER
    },
    end: {
        type: DataTypes.INTEGER
    },
    text: {
        type: DataTypes.STRING
    }
}, {
  // Other model options go here
});

Sentence.hasMany(Annotation, {foreignKey: "sentence_id"});


(async () => {
    await Annotation.sync();
})();


export default Annotation;