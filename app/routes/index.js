var express = require('express');
var https = require('https');
var router = express.Router();
var config = require('../config.js');

/* GET home page. */
router.get('/', function(req, res, next) {

  var headers = {
    'User-Agent': 'Super Agent/0.0.1',
    'Content-Type': 'application/x-www-form-urlencoded'
  };
  var text = "this is awesome!"
  var getAnalyzeSentimentOpt = function(text) {
    return {
      host: config.hpHostUrl,
      port: 443,
      path: '/1/api/sync/analyzesentiment/v1?text=' +
        encodeURIComponent(text).replace(/%20/g,'+') +
        '&apikey=' + config.hpApiKey,
      headers: headers
    };
  };
  var sent = https.get(getAnalyzeSentimentOpt(text), function(response) {
    var str = '';
    response.on('data', function(chunk) {
      str += chunk;
    });
    response.on('end', function() {
      var json = JSON.parse(str);

      global_sentiment = json;
      console.log(global_sentiment);
      console.log(json.aggregate.score);
      var score = parseFloat(json.aggregate.score * 100).toFixed(2);
      res.render('index', { title: config.hostUrl, score: score});
    });
  });
});

module.exports = router;
