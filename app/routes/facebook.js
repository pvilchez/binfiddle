var express = require('express');
var router = express.Router();
var FB = require('fb');
var _ = require('underscore');
var https = require('https');
var config = require('../config.js');
var Redis = require('ioredis');
var redis = new Redis(config.redis);

var sum = {};
var average = {};
var lastDate = {};
var length = {};
var count = {};

var getAnalyzeSentimentOpt = function(text) {
  var headers = {
    'User-Agent': 'Super Agent/0.0.1',
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  return {
    host: config.hpHostUrl,
    port: 443,
    path: '/1/api/sync/analyzesentiment/v1?text=' +
      encodeURIComponent(text).replace(/%20/g,'+') +
      '&apikey=' + config.hpApiKey,
    headers: headers
  };
};

var getConversationSentiment = function(conversation, name) {
  console.log('calculating convo sentiment for: ' + name);
  if (sum[name] == undefined){
      sum[name] = 0;
  }
  if (average[name] == undefined){
      average[name] = 0;
  }
  if (lastDate[name] == undefined){
      lastDate[name] = '';
  }
  if (length[name] == undefined) {
      length[name] = conversation.length;
  }
  if (count[name] == undefined) {
      count[name] = 0;
  }
  _.each(conversation, function(entry) {
    lastDate[name] = entry.created_time;
    var sent = https.get(getAnalyzeSentimentOpt(entry.message), function(response) {
      var str = '';

      response.on('data', function(chunk) {
        str += chunk;
      });

      response.on('end', function() {
        var json = JSON.parse(str);

        if (json.aggregate){
          average[name] += parseFloat(json.aggregate.score) / length[name];
        }

        count[name] += 1;
        if (count[name] == length[name]) {
          redis.set(name, average[name]);
          console.log('convo sentiment for: ' + name + " set to " + average[name]);
        }
      });

      response.on('error', function(res) {
        console.log(res);
      });
    });
  });
}

var get_conversations = function(response) {
  var name, conversations = {};
  _.each(response.data, function(thread) {
    if (thread.comments) {
      _.each(thread.comments.data, function(comment) {
        name = comment.from.name;
        if (conversations[name] === undefined) {
          conversations[name] = [];
          console.log("adding conversation with " + name + ".");
        }
        conversations[name].push({
          message: comment.message,
          created_time: comment.created_time
        });
      });
    }
  });
  return conversations;
}

var load_sentiments = function(conversations) {
  _.each(conversations, function(conversation, name){
    redis.get(name).then(function (sentiment) {
      if (sentiment === null || sentiment === 0 && sentiment === undefined) {
        getConversationSentiment(conversation, name);
      }
    });
  });
}

/* GET home page. */
router.get('/facebook', function(req, res, next) {
  res.render('facebook', {application_id: config.facebook.application_id});
});

router.get('/load_facebook', function(req, res, next) {
  FB.api('/me/inbox', {access_token: req.cookies.token}, function(response) {
    var conversations = get_conversations(response);
    load_sentiments(conversations);
    res.render('index', {conversations: conversations});
  });
});

module.exports = router;
