var express = require('express');
var router = express.Router();
var FB = require('fb');
var _ = require('underscore');
var https = require('https');
var config = require('../config.js');
var Redis = require('ioredis');

var redis = new Redis();
var sum = {};
var average = {};
var lastDate = {};
var length = {};
var count = {};

var headers = {
    'User-Agent': 'Super Agent/0.0.1',
    'Content-Type': 'application/x-www-form-urlencoded'
};
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
var getConversationSentiment = function(conversation, name) {
  sentiment = redis.get(name);
  if (sentiment !== null && sentiment !== 0 && sentiment !== undefined) {
    console.log("taking the easy way out, we already have a value for " + name);
    return;
  }
  console.log('convo sentiment:');
  if (sum[name] == undefined){
      sum[name] = 0;
  }
  if (average[name] == undefined){
      average[name] = 0;
  }
  if (lastDate[name] ==undefined){
      lastDate[name] = '';
  }
  if (length[name] == undefined) {
      length[name] = conversation.length;
  }
  if (count[name] == undefined) {
      count[name] = 0;
  }
  //console.log(name);
 // console.log(conversation);
  console.log('length:' + conversation.length);
  _.each(conversation, function(entry) {
      console.log(entry.message);
      lastDate[name] = entry.created_time;
      var text = getAnalyzeSentimentOpt(entry.message);
      var sent = https.get(text, function(response) {
        var str = '';
        response.on('data', function(chunk) {
          str += chunk;
        });
        response.on('end', function() {
          var json = JSON.parse(str);
          if (json.aggregate){
            average[name] += parseFloat(json.aggregate.score) / length[name];
            console.log(name + ' average (running):' + average[name]);
          }
          count[name] += 1;
          if (count[name] == length[name]) {
            redis.set(name, average[name]);
          }
//          var score = parseFloat(json.aggregate.score * 100).toFixed(2);
        });
        response.on('error', function(res) {
            console.log(res);
        });
      });

  });
  average[name] = sum[name] / length[name];

  console.log(name +' avg:' + average[name]);
  console.log(name +' sum:' + sum[name]);

  return {
    name: name,
    sentiment: average[name],
    last_communication: lastDate[name]
  };
}

var get_conversations = function(response) {
  var name, conversations = {};
  _.each(response.data, function(thread) {
    if (thread.comments) {
      _.each(thread.comments.data, function(comment) {
        name = comment.from.name;
        if (conversations[name] === undefined) {
          conversations[name] = [];
        }
        console.log("adding message to conversation with " + name);
        conversations[name].push({
          message: comment.message,
          created_time: comment.created_time
        });
      });
    }
  });
  //console.log(_.keys(conversations));
  return conversations;
}

/* GET home page. */
router.get('/facebook', function(req, res, next) {
  res.render('facebook');
});

router.get('/load_facebook', function(req, res, next) {
    console.log('load_fb');
  FB.api('/me/inbox', {access_token: req.cookies.token}, function(response) {
    console.log(_.keys(response.error));
    console.log('what what');
    var conversations = get_conversations(response);
    var aggregate = [];
    var i=0;
    _.each(conversations, function(conversation, name){
      if (i != 0 && i < 2){
        aggregate.push(getConversationSentiment(conversation, name));
      }
      i++;
    });
    console.log(aggregate);
    _.keys(conversations, function() {
    
    console.log(average[name]);
    });
    res.render('index', {conversations: conversations});
  });
});

module.exports = router;
