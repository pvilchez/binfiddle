var express = require('express');
var router = express.Router();
var FB = require('fb');
var _ = require('underscore');

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
  console.log(_.keys(conversations));
  return conversations;
}

/* GET home page. */
router.get('/facebook', function(req, res, next) {
  res.render('facebook');
});

router.post('/load_facebook', function(req, res, next) {
  FB.api('/me/inbox', {access_token: req.cookies.token}, function(response) {
    res.render('messages', {conversations: get_conversations(response)});
  });
});

module.exports = router;
