// A function to display and manipulate the map


// define the map
var map = L.map('map', {
  crs: L.CRS.Simple,
  zoomControl: true,
  minZoom: -15,
  maxZoom: 20
});

// define the background of the map
// cheat TPCoords 0 0 0
// cheat TPCoords 100 100 0
// var bounds = [[-655123,-655123], [654877,654877]];
// TODO: need to change bounds
// var bounds = [
//   [-700000, -700000],
//   [700000, 700000]
// ];
var image = L.imageOverlay(mapfile, bounds).addTo(map);

// define custom icons for obelisks
var obelIcon = L.Icon.extend({
  options: {
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -8]
  }
});
var greenObelIcon = new obelIcon({
    iconUrl: 'images/obelisk-green.png'
  }),
  redObelIcon = new obelIcon({
    iconUrl: 'images/obelisk-red.png'
  }),
  blueObelIcon = new obelIcon({
    iconUrl: 'images/obelisk-blue.png'
  });


// define custom icon for event
var eventIcon = L.icon({
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -10],
  iconUrl: 'design/event.png'
});


// place obelisk pins
if (window.redObelisk) L.marker([100 - redObelisk[0], redObelisk[1]], {
  icon: redObelIcon
}).addTo(map).bindPopup(redObelisk[2] + '<br />' + redObelisk[0].toFixed(1) + ' / ' + redObelisk[1].toFixed(1));
if (window.blueObelisk) L.marker([100 - blueObelisk[0], blueObelisk[1]], {
  icon: blueObelIcon
}).addTo(map).bindPopup(blueObelisk[2] + '<br />' + blueObelisk[0].toFixed(1) + ' / ' + blueObelisk[1].toFixed(1));
if (window.greenObelisk) L.marker([100 - greenObelisk[0], greenObelisk[1]], {
  icon: greenObelIcon
}).addTo(map).bindPopup(greenObelisk[2] + '<br />' + greenObelisk[0].toFixed(1) + ' / ' + greenObelisk[1].toFixed(1));


// var mark = [
//   [117466.01, -387739.6, "pagelines", "darkblue", "TeRRor HüHneR", "BP_CropPlot_Large_C_0", -12199.616],
//   [197187.1, -446354.1, "pagelines", "darkblue", "Syndicate", "BP_CropPlot_Large_C_1", -13649.749],
//   [116832.914, -387102.47, "pagelines", "darkblue", "TeRRor HüHneR", "BP_CropPlot_Large_C_10", -12199.616],
// ];


var markerClusters = L.markerClusterGroup();

// place standard pins
fLen = mark.length;
for (i = 0; i < fLen; i++) {
  var m = L.marker([100 - mark[i][0], mark[i][1]], {
    icon: L.AwesomeMarkers.icon({
      icon: mark[i][2],
      prefix: 'fa',
      markerColor: mark[i][3]
    })
  }).bindPopup(mark[i][4] + '<br />cheat setplayerpos ' + mark[i][1].toFixed(0) + ' ' + mark[i][0].toFixed(0) + ' ' + (mark[i][6] + 50).toFixed(0) + '<br />' + mark[i][5]); // .addTo(map)
  markerClusters.addLayer( m );
}

map.setView([0, 0], -10);
map.addLayer( markerClusters );
// set initial map view