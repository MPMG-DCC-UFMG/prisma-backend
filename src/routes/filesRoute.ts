import fs from 'fs';
var express = require('express');
var router = express.Router({ mergeParams: true });

router.get('/:file', async (req: any, res: any) => { 
    res.sendFile( require('path').resolve('./') + '/public/files/' + req.params.file )
});

router.get('/temp/:file', async (req: any, res: any) => { 
    res.sendFile( require('path').resolve('./') + '/public/temp/' + req.params.file )
});

router.get('/image/:file', async (req: any, res: any) => { 
    res.sendFile( require('path').resolve('./') + '/public/image/' + req.params.file )
});

module.exports = router;