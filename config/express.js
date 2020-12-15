require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const consign = require("consign");

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Security
const helmet = require('helmet');

module.exports = () => {
  const app = express();
  const port = process.env.PORT || 7000;

  app.set("port", port);

  app.use(helmet());
  app.disable('x-powered-by');
  
  // MIDDLEWARES
  app.use(bodyParser.json());
  app.use(cors());
  consign({ cwd: "api" })
    .then("services")
    .then("controllers")
    .then("routes")
    .into(app);

  return app;
};
