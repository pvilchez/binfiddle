var express = require('express');
var https = require('https');
var router = express.Router();
var config = require('../config.js');

/* GET home page. */
router.get('/', function(req, res, next) {

      res.render('index', { title: config.hostUrl, score: score});
});

module.exports = router;
