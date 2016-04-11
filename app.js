var express = require('express');
var passport = require('passport');
var util = require('util');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var FitbitStrategy = require( 'passport-fitbit-oauth2' ).FitbitOAuth2Strategy;;

var partials = require('express-partials');
var http = require('http');
var path = require('path');

var FITBIT_CLIENT_ID = "227H8F";
var FITBIT_CLIENT_SECRET = "42ca4105de9a9d154ad3417d42898424";


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Fitbit profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the FitbitStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Fitbit
//   profile), and invoke a callback with a user object.
passport.use(new FitbitStrategy({
    clientID: FITBIT_CLIENT_ID,
    clientSecret: FITBIT_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/fitbit/callback"
  },
  function(token, tokenSecret, profile, cb) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Fitbit profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Fitbit account with a user record in your database,
      // and return that user instead.

      
      return cb(null, profile);
    });
  }
));




var app = express();

// configure Express

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('port', process.env.PORT || 3000);



app.use(partials());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/fitbit
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Fitbit authentication will involve redirecting
//   the user to fitbit.com.  After authorization, Fitbit will redirect the user
//   back to this application at /auth/fitbit/callback
app.get('/auth/fitbit',
  passport.authenticate('fitbit', { scope: ['activity','heartrate','location','profile']}),
  function(req, res){
    // The request will be redirected to Fitbit for authentication, so this
    // function will not be called.
  });



// GET /auth/fitbit/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/fitbit/callback',
  passport.authenticate('fitbit', { 

    successRedirect: '/',
    failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}