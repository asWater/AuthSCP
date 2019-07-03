const express = require('express');
const os = require('os');
const passport = require('passport');
const passportHttp = require('passport-http');
const xsenv = require('@sap/xsenv'); 
const JWTStrategy = require('@sap/xssec').JWTStrategy;
const port = process.env.PORT || 3000;
const caiAuth = require('./lib/credentials').CAI_BASIC_AUTH;

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname));
app.use(passport.initialize());

const hostName = os.hostname();
console.log( `>>> hostName is ${hostName}` );

if ( hostName !== "localhost" 
     && hostName !== "127.0.0.1" 
     && hostName !== "TYON50941719A" ){
  console.log(`>>> Host is not localhost <<<`);

  //const services = xsenv.getServices({ uaa: 'myuaa' });
  //passport.use(new JWTStrategy( services.uaa ));
  //app.use(passport.authenticate('JWT', { session: false }));
}

app.all('/*', (req, res, next) => {
  console.log(`>>> Path is ${req.path} <<<`);
  switch ( req.path ){
		case '/chat':
    case '/chat/':
        console.log(`>>> Specific procedure for ${req.path} <<<`);
        passport.use(new JWTStrategy( xsenv.getServices({ uaa: 'myuaa' }).uaa ));
        break;
		case '/cai':
    case '/cai/':
        console.log(`>>> Specific procedure for ${req.path} <<<`);
        passport.use(new passportHttp.BasicStrategy( 
          function (username, password, done){
            if ( username === caiAuth.USER && password === caiAuth.PASS ){
              console.log(`>>> Basic Authentication for the path ${req.path} is OK <<<`);
              return done(null, true);
            }
            else {
              console.error(`!!! Basic Authentication for the path ${req.path} is failed !!!`);
              return done(null, false);
            }
          }
        ));
        break;
    default:
        console.log(`>>> Default procedure for ${req.path} <<<`);
        break;
  }
  next();
});

app.get('/', (req, res) => {
  res.status(200).send("iITSM root path (Normally this page should not be shown)");
});

app.get('/chat', passport.authenticate('JWT', { session: false }), (req, res, next) => {
    console.log(`>>> The contents of request >>> ${req}`);
    //res.send('Application user: ' + req.user.id);
    //res.sendFile('public/index.html');
    const userId = ( req.user ) ? req.user.id : "Unknown";

    res.render( 'index', { userId: userId });
});

app.post('/cai', passport.authenticate('basic', { session: false }), (req, res) => {
  res.send({
    replies: [
      {
        type: 'text',
        content: `The message from Node run on ${hostName}.`
      }]
    });
})

app.listen(port, function () {
  console.log('myapp listening on port ' + port);
});
