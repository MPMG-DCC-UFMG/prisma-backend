import { DbConnector } from "../services/dbConnector";

const bcrypt = require("bcrypt");

const { Sequelize, DataTypes } = require('sequelize');

const User = DbConnector.sequelize().define('user', {
    // Model attributes are defined here
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    photo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
    },
    role_changed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    // Other model options go here
    paranoid: true
});

User.beforeCreate(async (user: any, options) => {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
});

User.beforeUpdate(async (user: any, options) => {
    const salt = await bcrypt.genSalt(10);
    if (user.changed('password'))
        user.password = await bcrypt.hash(user.password, salt);
    if (user.changed('role'))
        user.role_changed = true;
});

(async () => {
    await User.sync({ alter: true });
})();

export default User;