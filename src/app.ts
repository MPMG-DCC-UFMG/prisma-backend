import express from 'express';
require('dotenv').config();

const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const routes = require('./routes/index');
const fileUpload = require('express-fileupload');


app.use(express.json());
app.use(cors());
app.use(fileUpload());
app.use((req, res, next) => {
  req.body.uploadPath = require('path').resolve('./') + '/public/files/';
  next();
})

app.get('/', (req, res) => res.send("Bem vindo"));
app.use('/api', routes);


app.listen(port, () => {
  return console.log(`server is listening on ${port}`);
});