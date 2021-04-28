const express = require('express');
const session = require('express-session');
const http = require('http');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const schedule = require('node-schedule');
const uuid = require('uuid').v4;
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const config = require('./config.js');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
// const refresh = require('passport-oauth2-refresh');

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// https://github.com/Automattic/mongoose
// https://www.npmjs.com/package/mongoose-findorcreate
// https://github.com/jaredhanson/passport-facebook/issues/152

const adapter = new FileSync('db.json');
const db = low(adapter);
const app = express();
const port = 8080;
const server_data = new Map();
const awesomeMapIconPlayer = 'user-o';
const PlayerPinColor = 'darkblue';
const awesomeMapIconTribe = 'home';
const TribePinColor = 'orange';
const TribePinColorExpired = 'red';
const scopes = ['identify', 'email'];

var discordStrat = new DiscordStrategy({
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    callbackURL: config.redirectUri,
    scope: scopes,
    prompt: 'consent'
  },
  function (accessToken, refreshToken, profile, done) {
    console.log(accessToken, refreshToken, profile);
    // User.findOrCreate({
    //   discordId: profile.id
    // }, function (err, user) {
    // });
    console.log(typeof profile);
    process.nextTick(function () {
      return done(null, profile);
    });
  });
passport.use(discordStrat);
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

db.defaults({
    servers: []
  })
  .write();

app.set('view engine', 'ejs');
app.use(bodyParser.json({
  limit: '50mb'
}))
app.use(bodyParser.json());
app.use('/images', express.static('views/images'));
app.use('/css', express.static('views/css'));
app.use('/js', express.static('views/js'));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/discord', passport.authenticate('discord', { scope: scopes, prompt: 'consent' }), function(req, res) {});
app.get('/auth/discord/callback', passport.authenticate('discord', { // redirect url for discord
  failureRedirect: '/'
}), function (req, res) {
  res.redirect('/info') // Successful auth
});

app.get('/info', checkAuth, function(req, res) {
  //console.log(req.user)
  res.json(req.user);
});
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.send('not logged in :(');
}

app.get('/:id', (req, res) => {
  if (req.params.id == 'favicon.ico') return;
  let json = server_data.get(req.params.id);
  if (typeof (json) != 'undefined') {
    var players = json.players;
    var tribes = json.tribes;
    var servername = json.servername;
    var tribe_markers = 'var tribe_mark = [';
    var markers = 'var mark = [';
    for (var key in players) {
      if (players.hasOwnProperty(key)) {
        markers += '[' + players[key].y + ',' + players[key].x + ',"' + awesomeMapIconPlayer + '","' + PlayerPinColor + '","' + players[key].playername + '","' + players[key].tribename + '",' + players[key].x_ue4 + ',' + players[key].y_ue4 + ',' + players[key].z_ue4 + '],';
      }
    }
    markers = markers.slice(0, -1); // slice the last ","
    markers += '];';
    for (var key in tribes) {
      if (tribes.hasOwnProperty(key)) {
        let lastStructureUpdateTime = (Math.trunc(tribes[key].elapsedTime) - Math.trunc(tribes[key].lastInAllyRangeTime)) / 60 / 60 / 24; // convert seconds to days
        let localTribePinColor
        if (lastStructureUpdateTime > 20) {
          localTribePinColor = TribePinColorExpired;
        } else {
          localTribePinColor = TribePinColor;
        }
        tribe_markers += '[' + tribes[key].y + ',' + tribes[key].x + ',"' + awesomeMapIconTribe + '","' + localTribePinColor + '","' + tribes[key].tribename + '","' + tribes[key].tribename + '",' + tribes[key].x_ue4 + ',' + tribes[key].y_ue4 + ',' + tribes[key].z_ue4 + ',' + lastStructureUpdateTime + '],';
      }
    }
    tribe_markers = tribe_markers.slice(0, -1); // slice the last ","
    tribe_markers += '];';
  }
  if (markers == 'var mark = ];' || markers == undefined) {
    markers = 'var mark = [];';
  }
  if (tribe_markers == 'var tribe_mark = ];' || tribe_markers == undefined) {
    tribe_markers = 'var tribe_mark = [];';
  }
  var mapName;
  if (typeof json === 'undefined') { // if no data is present from the server take ragnarok
    mapName = 'Ragnarok';
  } else {
    if (json.map == 'TestMapArea') { // debug on testmap also ragnarok
      mapName = 'Ragnarok';
    } else {
      mapName = json.map;
    }
  }
  console.log(mapName);
  res.render('pages/index', {
    map: mapName,
    mark: markers,
    tribe_markers: tribe_markers,
    title: servername
  });
});

app.post('/rest/v1', function (req, res) {
  console.log('incomming data from:', req.body.servername);
  var entry = db.get('servers')
    .find({
      privateid: req.body.privateid
    })
    .value();
  if (entry === undefined) {
    res.send('{ response: 1, error: "Not authorized" }');
  } else {
    server_data.set(entry.publicid, req.body);
    // if(req.body.servername == 'The Sunny Side of ARK:TEST') {
    // if(req.body.servername == 'The Sunny Side of ARK:Center[T5/XP5/B30/H6]') {
    //   console.log(req.body.tribes);
    // }
    res.send('{ response: 0, error: "" }');
  }
});


const server = http.createServer(app);
const wss = new WebSocket.Server({
  clientTracking: true,
  noServer: true
});


server.on('upgrade', function (request, socket, head) {
  console.log('ws open');

  wss.handleUpgrade(request, socket, head, function (ws) {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', function (ws, request) {
  // console.log('wss on connection');
  ws.id = wss.getUniqueID();
  // console.log('websocket client id:', ws.id);
  ws.send(JSON.stringify({
    id: ws.id
  }));
  // console.log(request);

  ws.on('message', function (message) {
    console.log(`Received message ${message}`);
    var json = JSON.parse(message);
    if (typeof (json.server_id) != 'undefined') {
      ws.server_id = json.server_id;
    }
  });

  ws.on('close', function () {
    console.log('ws.on close');
  });
});

wss.getUniqueID = function () {
  return uuid();
};

schedule.scheduleJob('*/15 * * * * *', async function () {
  if (wss.clients != undefined) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        let json = server_data.get(client.server_id);
        if (typeof (json) != 'undefined') {
          // Players
          var players = json.players;
          var markers = [];
          for (var key in players) {
            if (players.hasOwnProperty(key)) {
              markers.push([players[key].x, players[key].y, awesomeMapIconPlayer, PlayerPinColor, players[key].playername, players[key].tribename, players[key].x_ue4, players[key].y_ue4, players[key].z_ue4]);
            }
          }
          // Tribes
          var tribes = json.tribes;
          var tribe_markers = [];
          for (var key in tribes) {
            if (tribes.hasOwnProperty(key)) {
              let lastStructureUpdateTime = (Math.trunc(tribes[key].elapsedTime) - Math.trunc(tribes[key].lastInAllyRangeTime)) / 60 / 60 / 24; // convert seconds to days
              let localTribePinColor
              if (lastStructureUpdateTime >= 17) {
                localTribePinColor = TribePinColorExpired;
              } else {
                localTribePinColor = TribePinColor;
              }
              tribe_markers.push([tribes[key].x, tribes[key].y, awesomeMapIconTribe, localTribePinColor, tribes[key].tribename, tribes[key].tribename, tribes[key].x_ue4, tribes[key].y_ue4, tribes[key].z_ue4, lastStructureUpdateTime]);
            }
          }
          // Serverclock
          var serverclock = '??:??'
          if (typeof (json.serverclock) != 'undefined') {
            serverclock = json.serverclock;
          }
        }
        //console.log('Markers:', markers);
        //console.log('Tribes:', tribe_markers);
        client.send(JSON.stringify({
          marker: markers,
          tribe_markers: tribe_markers,
          serverclock: serverclock
        }));
      }
    });
  } else {
    console.log('no clients connected');
  }
});

server.listen(port, function () {
  console.log(`Listening on http://localhost:${port}`);
});