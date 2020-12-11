
module.exports = (app) => {

  const controller = {};

  controller.getTranscriptions = (req, res) => {

    var JDBC = require('jdbc');
    var jinst = require('jdbc/lib/jinst');

    if (!jinst.isJvmCreated()) {
      jinst.addOption('-Xrs')
      jinst.setupClasspath([
        '/var/www/html/painelbi/software_anotacao_api/src/libs/phoenix-5.0.0.3.1.5.0-152-client.jar'
      ])
    }

    var config = {
      drivername: 'org.apache.phoenix.jdbc.PhoenixDriver',
      url: 'jdbc:phoenix:hadoopmn-gsi-prod01.mpmg.mp.br,hadoopmn-gsi-prod02.mpmg.mp.br,hadoopmn-gsi-prod01.mpmg.mp.br:2181:/hbase-unsecure',
      user: 'ufmg.rdenubila',
      password: 'Rdg085055147',
      maxpoolsize: 100
    }

    var db = new JDBC(config);

    db.initialize(function(err) {
      if (err) {
        return res.status(400).json(err);
      }

      db.reserve(function (err, connObj) {

        if (connObj) {
          console.log("Using JDBC connection: " + connObj.conn);
          var conn = connObj.conn;
          conn.createStatement(function(err, statement) {

            if (err) {
              return res.status(400).json(err);
            } else {
              statement.executeQuery("select DISTINCT('TABLE_NAME') from SYSTEM.CATALOG;", function(err, resultset) {
                if (err) {
                  return res.status(400).json(err);
                } else {
                  // Convert the result set to an object array.
                  resultset.toObjArray(function(err, results) {
                    return res.status(200).json(results);
                  });
                }
              });
            }
          });

        } else {
          return res.status(400).json(err);
        }
      
      });

    });

  }
  
  return controller;
};
