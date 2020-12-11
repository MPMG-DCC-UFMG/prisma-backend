
module.exports = (app) => {

  const controller = {};
  var JDBC = require('jdbc');
  var jinst = require('jdbc/lib/jinst');

  if (!jinst.isJvmCreated()) {
    jinst.addOption('-Xrs')
    jinst.setupClasspath([
      './src/libs/phoenix-5.0.0.3.1.5.0-152-client.jar'
    ])
  }


  controller.getTranscriptions = (req, res) => {

    var config = {
      drivername: 'org.apache.phoenix.jdbc.PhoenixDriver',
      url: 'jdbc:phoenix:localhost:2181:/hbase-unsecure',
      user: 'ufmg.rdenubila',
      password: 'Rdg085055147',
      maxpoolsize: 100
    }

    var hsqldb = new JDBC(config);

    hsqldb.initialize(function(err) {
      if (err) {
        return res.status(400).json(err);
      }
      return res.status(200).json("FUNCIONOU");
    });

    /*
    client.version((error, version) => {
      return res.status(200).json({
        error: error, 
        data: version
      });
    })
    */

    /*
    client.tables((error, tables) => {
      console.info(tables)
      return res.status(200).json({
        error: error, 
        tables: tables
      });
    })
    */

    /*client
      .table('AUDIOWHATSHBASE')
      .schema((error, data) => {
        console.info(data)
        return res.status(200).json({
          error: error, 
          data: data
        });
    })
    */

    

  }
  
  return controller;
};
