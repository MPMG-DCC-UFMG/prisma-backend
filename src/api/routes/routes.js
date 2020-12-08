module.exports = (app) => {

    const entities = app.controllers.entities;

    app.route("/api/v1/entities").get(entities.getEntities);
    app.route("/api/v1/entity").get(entities.getEntity);
    app.route("/api/v1/entity").post(entities.editEntity);

  };
  