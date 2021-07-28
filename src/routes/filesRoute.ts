import fs from 'fs';
var express = require('express');
var router = express.Router({ mergeParams: true });

router.get('/:file', async (req: any, res: any) => { 
    res.sendFile( require('path').resolve('./') + '/public/files/' + req.params.file )
});

module.exports = router;