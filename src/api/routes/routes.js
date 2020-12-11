module.exports = (app) => {

    const entities = app.controllers.entities;
    const audioTranscription = app.controllers.audioTranscription;

    app.route("/api/v1/entities").get(entities.getEntities);
    app.route("/api/v1/entity").get(entities.getEntity);
    app.route("/api/v1/entity").post(entities.editEntity);
    
    app.route("/api/v1/audioTranscriptions").get(audioTranscription.getTranscriptions);

  };
  