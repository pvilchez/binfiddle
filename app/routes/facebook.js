var express = require('express');
var router = express.Router();
var FB = require('fb');
var _ = require('underscore');

var get_threads = function(response) {
  return _.map(response.data, function(thread) {
    if (thread.comments) {
      var messages = _.map(thread.comments.data, function(comment) {
        return {
          name: comment.from.name,
          message: comment.message,
          created_time: comment.created_time
        }
      });
      return {
        messages: messages
      }
    }
  });
}

/* GET home page. */
router.get('/facebook', function(req, res, next) {
  res.render('facebook');
});

router.post('/load_facebook', function(req, res, next) {
  FB.api('/me/inbox', {access_token: req.cookies.token}, function(response) {
    res.render('messages', {threads: get_threads(response)});
  });
});

module.exports = router;
