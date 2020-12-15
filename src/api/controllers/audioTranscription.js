module.exports = (app) => {

  const druid = app.services.druid;
  const hdfs = app.services.hdfs;
  const controller = {};

  controller.getTranscriptions = async(req, res) => {

    const dataSource = "transcricao_audio";
    let interval = await druid.timeBoundary(dataSource);

    let resultados = await druid.scan(dataSource, interval, {});

    for(let i=0; i<resultados.length; i++){
      resultados[i].tem_correcoes = (await hdfs.fileStatus(resultados[i].hdfs_path+".json")) ? true : false;
    }

    res.status(200).json(resultados);

  }

  controller.getTranscription = async(req, res) => {

    const dataSource = "transcricao_audio";
    let interval = await druid.timeBoundary(dataSource);

    let resultados = await druid.scan(dataSource, interval, {
      filter: {
        "type": "selector",
        "dimension": "hdfs_path",
        "value": req.query.file,
      }
    });

    let data = await hdfs.getFile(req.query.file+".json").catch(err=>{
      res.status(400).json(err);
    });
    
    res.status(200).json({
      transcricao: resultados[0],
      correcoes: data || []
    });
  }

  controller.saveTranscription = async(req, res) => {

    
    let data = await hdfs.saveFile(req.query.file+".json", req.body.data).catch(err=>{
      res.status(400).json("ERRO: " + err);
    });
    
    res.status(200).json(data);
    
  }

  controller.getAudio = async(req, res) => {

    let arquivos = await hdfs.listFolder(req.query.file);
    let filename = arquivos.FileStatuses.FileStatus[0].pathSuffix;

    let data = await hdfs.getAudioUrl(req.query.file+"/"+filename)
    .catch(err=>{
      res.status(400).json(err);
    });
    
    res.status(200).json({
      url: data
    });
  }
  
  return controller;
};
