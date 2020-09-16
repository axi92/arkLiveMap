const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const schedule = require('node-schedule');

const app = express();
const port = 8080;
const server_data = new Map();
const static_map_data = new Map();
const awesomeMapIconName = 'user-o';
const MapPinColor = 'darkblue';
var connections = [];
// static_map_data.set('Ragnarok', {
//   bounds: [
//     [-700000, -700000],
//     [700000, 700000]
//   ],
//   'obelisks': {
//     'blue': [-427363, -416936, 'Blue obelisk'],
//     'red': [92034, -155512, 'Green obelisk'],
//     'green': [-196153, 467466, 'Red obelisk']
//   }
// });

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use('/images', express.static('views/images'));
app.use('/css', express.static('views/css'));
app.use('/js', express.static('views/js'));
app.get('/:id', (req, res) => {
  if (req.params.id == 'favicon.ico') return;
  let json = server_data.get(req.params.id);
  var players = json.players;
  // let map_defaults = static_map_data.get('Ragnarok');
  var markers = 'var mark = [';
  for (var key in players) {
    if (players.hasOwnProperty(key)) {
      markers += '[' + players[key].x + ',' + players[key].y + ',"' + awesomeMapIconName + '","' + MapPinColor + '","' + players[key].playername + '","' + players[key].tribename + '",' + players[key].z + '],';
    }
  }
  markers = markers.slice(0, -1); // slice the last ","
  markers += '];';
  if (markers == 'var mark = ];') {
    markers = 'var mark = [];';
  }

  res.render('pages/index', {
    map: 'Ragnarok',
    // redObelisk: map_defaults.obelisks.redObelisk,
    // greenObelisk: map_defaults.obelisks.greenObelisk,
    // blueObelisk: map_defaults.obelisks.blueObelisk,
    mark: markers
  });
});

app.post('/rest/v1', function (req, res) {
  // console.log(req.body);
  console.log('data incomming...');
  server_data.set(req.body.serverid, req.body);
  // console.log(server_data);
  // res.send('Got a POST request')
  // console.log('Map:', server_data);
});

// app.post('/', function (req, res) {

//   let message = req.body.message;
//   console.log('Regular POST message: ', message);
//   return res.json({
//     answer: 42
//   });
// });


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


  ws.on('message', function (message) {
    //
    // Here we can now use session parameters.
    //
    console.log(`Received message ${message}`);
  });

  ws.on('close', function () {
    console.log('ws.on close');
  });
});




schedule.scheduleJob('*/15 * * * * *', async function () {
  if(wss.clients != undefined){
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('test');
      }
    });
  } else {
    console.log('no clients connected');
  }

});

server.listen(port, function () {
  console.log(`Listening on http://localhost:${port}`);
});

