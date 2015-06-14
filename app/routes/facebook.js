var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/facebook', function(req, res, next) {
  res.render('facebook');
});

router.post('/load_facebook', function(req, res, next) {
	var token = req.cookies.token;
	res.send("token is " + token);
});

module.exports = router;
