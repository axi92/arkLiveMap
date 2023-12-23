import express from 'express';
import session from 'express-session';
import * as http from 'http';
import bodyParser from 'body-parser';
import WebSocket, {
  WebSocketServer
} from 'ws';
import * as schedule from 'node-schedule';
import {
  v4 as uuid
} from 'uuid';
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import lodash from 'lodash';
import {
  config as config
} from './config.js';
import passport from 'passport';
import {
  Strategy as SteamStrategy
} from 'passport-steam';

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// console.log('stringwith " some signes "'.replace(/\"/g, '\\"'));
// https://github.com/Automattic/mongoose
// https://www.npmjs.com/package/mongoose-findorcreate
// https://github.com/jaredhanson/passport-facebook/issues/152

const adapter = new JSONFile('db.json');
const db = new Low(adapter);
const app = new express();
const port = 8080;
const server_data = new Map();
const awesomeMapIconPlayer = 'user-o';
const PlayerPinColor = 'darkblue';
const awesomeMapIconTribe = 'home';
const TribePinColor = 'green';
const TribePinColorExpired = 'red';
const TribePinColorExpiredCount = 17
const TribePinColorOrange = 'orange';
const TribePinColorOrangeCount = 10;
const scopes = ['identify', 'email'];

// var discordStrat = new DiscordStrategy({
//     clientID: config.discord.clientId,
//     clientSecret: config.discord.clientSecret,
//     callbackURL: config.discord.redirectUri,
//     scope: scopes,
//     prompt: 'consent'
//   },
//   function (accessToken, refreshToken, profile, done) {
//     console.log(accessToken, refreshToken, profile);
//     // User.findOrCreate({
//     //   discordId: profile.id
//     // }, function (err, user) {
//     // });
//     console.log(typeof profile);
//     process.nextTick(function () {
//       return done(null, profile);
//     });
//   });

var steamStrat = new SteamStrategy({
  returnURL: config.steam.redirectUri,
  realm: config.steam.realm,
  apiKey: config.steam.apiKey
},
  function (identifier, profile, done) {
    // User.findByOpenID({
    //   openId: identifier
    // }, function (err, user) {
    //   return done(err, user);
    // });
    console.log(typeof profile);
    process.nextTick(function () {
      return done(null, profile);
    });
  }
)

// passport.use(discordStrat);
passport.use(steamStrat);
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

await db.read();
db.data = db.data || {
  servers: []
}
await db.write();
db.chain = lodash.chain(db.data);

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

// app.get('/auth/discord', passport.authenticate('discord', {
//   scope: scopes,
//   prompt: 'consent'
// }), function (req, res) {});
// app.get('/auth/discord/callback', passport.authenticate('discord', { // redirect url for discord
//   failureRedirect: '/'
// }), function (req, res) {
//   res.redirect('/info') // Successful auth
// });

app.get('/auth/steam', passport.authenticate('steam'), function (req, res) {
  // The request will be redirected to Steam for authentication, so
  // this function will not be called.
});
app.get('/auth/steam/callback', passport.authenticate('steam', {
  failureRedirect: '/login'
}),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/info');
  });

app.get('/info', checkAuth, function (req, res) {
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
        markers += '[' + players[key].y_pos + ',' + players[key].x_pos + ',"' + awesomeMapIconPlayer + '","' + PlayerPinColor + '","' + players[key].playername.replace(/\"/g, '\\"') + '","' + players[key].tribename.replace(/\"/g, '\\"') + '",' + players[key].x_ue4 + ',' + players[key].y_ue4 + ',' + players[key].z_ue4 + '],';
      }
    }
    markers = markers.slice(0, -1); // slice the last ","
    markers += '];';
    for (var key in tribes) {
      if (tribes.hasOwnProperty(key)) {
        let lastStructureUpdateTime = (Math.trunc(tribes[key].elapsedTime) - Math.trunc(tribes[key].lastInAllyRangeTime)) / 60 / 60 / 24; // convert seconds to days
        let localTribePinColor = GetTribePinColor(lastStructureUpdateTime);
        tribe_markers += '[' + tribes[key].y_pos + ',' + tribes[key].x_pos + ',"' + awesomeMapIconTribe + '","' + localTribePinColor + '","' + tribes[key].tribename.replace(/\"/g, '\\"') + '","' + tribes[key].tribename.replace(/\"/g, '\\"') + '",' + tribes[key].x_ue4 + ',' + tribes[key].y_ue4 + ',' + tribes[key].z_ue4 + ',' + lastStructureUpdateTime + '],';
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
  if (typeof json === 'undefined') { // if no data is present from the server take the asa Island
    mapName = 'TheIsland_WP'; // default map
    // mapName = 'Svartalfheim_WP'; // dev map
  } else {
    if (json.map == 'TestMapArea') { // debug on testmap also asa Island
      mapName = 'TheIsland_WP';
    } else {
      mapName = json.map;
    }
  }
  var auth = 0;
  if (req.isAuthenticated()) {
    auth = 1;
  }
  console.log(mapName);
  res.render('pages/index', {
    map: mapName,
    mark: markers,
    tribe_markers: tribe_markers,
    title: servername,
    auth: auth,
    authdata: req.user
  });
});

app.post('/rest/v1', function (req, res) {
  console.log('incomming data from:', req.body.servername);

  // Function to rename old x and y to x_pos and y_pos
  function renameXandY(object) {
    for (const key in object) {
      if(object[key].x != undefined){
        object[key].x_pos = object[key].x;
        object[key].y_pos = object[key].y;
      }
    }
    return object;
  }

  var entry = db.chain.get('servers')
    .find({
      privateid: req.body.privateid
    })
    .value();
  if (entry === undefined) {
    res.send('{ response: 1, error: "Not authorized" }');
  } else {
    renameXandY(req.body.tribes);
    renameXandY(req.body.players);
    server_data.set(entry.publicid, req.body);
    // if(req.body.servername == 'The Sunny Side of ARK:TEST') {
    //   console.log(req.body);
    // }
    res.send('{ response: 0, error: "" }');
  }
});


const server = http.createServer(app);
const wss = new WebSocketServer({
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
  sendData();
});

function sendData() {
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
              markers.push([players[key].x_pos, players[key].y_pos, awesomeMapIconPlayer, PlayerPinColor, players[key].playername.replace(/\"/g, '\\"'), players[key].tribename.replace(/\"/g, '\\"'), players[key].x_ue4, players[key].y_ue4, players[key].z_ue4]);
            }
          }
          // Tribes
          var tribes = json.tribes;
          var tribe_markers = [];
          for (var key in tribes) {
            if (tribes.hasOwnProperty(key)) {
              let lastStructureUpdateTime = (Math.trunc(tribes[key].elapsedTime) - Math.trunc(tribes[key].lastInAllyRangeTime)) / 60 / 60 / 24; // convert seconds to days
              let localTribePinColor = GetTribePinColor(lastStructureUpdateTime);
              tribe_markers.push([tribes[key].x_pos, tribes[key].y_pos, awesomeMapIconTribe, localTribePinColor, tribes[key].tribename.replace(/\"/g, '\\"'), tribes[key].tribename.replace(/\"/g, '\\"'), tribes[key].x_ue4, tribes[key].y_ue4, tribes[key].z_ue4, lastStructureUpdateTime]);
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
}

server.listen(port, function () {
  console.log(`Listening on http://localhost:${port}`);
});

function GetTribePinColor(lastStructureUpdateTime) {
  let localTribePinColor;
  if (lastStructureUpdateTime > TribePinColorExpiredCount) {
    localTribePinColor = TribePinColorExpired;
  } else if (lastStructureUpdateTime > TribePinColorOrangeCount && lastStructureUpdateTime < TribePinColorExpiredCount) {
    localTribePinColor = TribePinColorOrange;
  } else {
    localTribePinColor = TribePinColor;
  }
  return localTribePinColor;
}