import { Sequelize, Dialect } from 'sequelize';

require('dotenv').config();

export class DbConnector {


    private constructor() {}
    
    public static sequelize () {
        return new Sequelize(
            process.env.DB_NAME || 'postgres',
            process.env.DB_USER || 'postgres',
            process.env.DB_PASS || 'postgres',
            {
                dialect: 'postgres',
                port: 5432,
                logging: false
            }
        );
    }
}