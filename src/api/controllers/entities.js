
module.exports = (app) => {

const fs = require('fs');
const path = require('path');

  function walkSync (dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
      const dirFile = path.join(dir, file);
      try {
        filelist = walkSync(dirFile, filelist);
      }
      catch (err) {
        if (err.code === 'ENOTDIR' || err.code === 'EBUSY') filelist = [...filelist, dirFile];
        else throw err;
      }
    });
    return filelist;
  }

  function getFilename(filename){
    filename = filename.split('\\');
    filename = filename[filename.length-1];
    filename = filename.split('.').slice(0, -1).join('.');
    return filename;
  }

  const testFolder = './api/data';
  const controller = {};

  controller.getEntities = async (req, res) => {

    let result = [];

    let files = walkSync(testFolder);
    files.forEach(file=>{
      let rawdata = fs.readFileSync(file);
      let d = JSON.parse(rawdata);

      let count = 0;

      if(d.sentences) {
        d.sentences.forEach(element => {
          if(element.annotations) count++;
        });
      }

      result.push({
        name: getFilename(file),
        file: file,
        annotations: count,
        sentences_count: d.sentences.length,
        progress: count/d.sentences.length*100
      });

    })
    
    return res.status(200).json({
      count: files.length,
      list: result
    });

  }

  controller.getEntity = async (req, res) => {
    
    let file = req.query.file;
    
    let rawdata = fs.readFileSync(file);
    return res.status(200).json( JSON.parse(rawdata) );
    
  }
  
  controller.editEntity = async (req, res) => {
  
  fs.writeFile(req.body.file, JSON.stringify(req.body.data), (err) => {
    if (err) {
      return res.status(400).json(err);
    }
    return res.status(200).json("JSON data is saved.");
  });


  }
  
  
  return controller;
};
