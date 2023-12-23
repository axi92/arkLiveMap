var map = L.map('map', {
  crs: L.CRS.Simple,
  zoomControl: true,
  minZoom: 1,
  maxZoom: 20
});

L.imageOverlay(mapfile, bounds).addTo(map);

var obelIcon = L.Icon.extend({
  options: {
    iconSize: [20],
    iconAnchor: [10, 90],
    popupAnchor: [0, -88]
  }
});

var greenObelIcon = new obelIcon({
    iconUrl: 'images/obelisk_green.png'
  }),
  redObelIcon = new obelIcon({
    iconUrl: 'images/obelisk_red.png'
  }),
  blueObelIcon = new obelIcon({
    iconUrl: 'images/obelisk_blue.png'
  });

if (window.redObelisk) L.marker([100 - redObelisk[0], redObelisk[1]], {
  icon: redObelIcon
}).addTo(map).bindPopup(redObelisk[2] + '<br />' + redObelisk[0].toFixed(1) + ' / ' + redObelisk[1].toFixed(1));
if (window.blueObelisk) L.marker([100 - blueObelisk[0], blueObelisk[1]], {
  icon: blueObelIcon
}).addTo(map).bindPopup(blueObelisk[2] + '<br />' + blueObelisk[0].toFixed(1) + ' / ' + blueObelisk[1].toFixed(1));
if (window.greenObelisk) L.marker([100 - greenObelisk[0], greenObelisk[1]], {
  icon: greenObelIcon
}).addTo(map).bindPopup(greenObelisk[2] + '<br />' + greenObelisk[0].toFixed(1) + ' / ' + greenObelisk[1].toFixed(1));


var markerClusters = L.markerClusterGroup({
  disableClusteringAtZoom: 3
});
var tribeLayer = L.layerGroup();
var playerLayer = L.layerGroup();

markerLength = mark.length;
for (i = 0; i < markerLength; i++) {
  var m = L.marker([100 - mark[i][0], mark[i][1]], {
    icon: L.AwesomeMarkers.icon({
      icon: mark[i][2],
      prefix: 'fa',
      markerColor: mark[i][3]
    })
  }).bindPopup(mark[i][4] + '<br />cheat setplayerpos ' + Math.trunc(mark[i][6]) + ' ' + Math.trunc(mark[i][7]) + ' ' + (parseInt(Math.trunc(mark[i][8])) + parseInt(1000)) + '<br />' + mark[i][5]); // .addTo(map)
  markerClusters.addLayer( m );
  playerLayer.addLayer(m);
}

markerLength = tribe_mark.length;
for (i = 0; i < markerLength; i++) {
  var m = L.marker([100 - tribe_mark[i][0], tribe_mark[i][1]], {
    icon: L.AwesomeMarkers.icon({
      icon: tribe_mark[i][2],
      prefix: 'fa',
      markerColor: tribe_mark[i][3]
    })
  }).bindPopup(tribe_mark[i][4] + '<br />cheat setplayerpos ' + Math.trunc(tribe_mark[i][6]) + ' ' + Math.trunc(tribe_mark[i][7]) + ' ' + (parseInt(Math.trunc(tribe_mark[i][8])) + parseInt(1000)) + '<br />' + (tribe_mark[i][9]).toFixed(2) + ' days not updated'); // .addTo(map)
  markerClusters.addLayer( m );
  tribeLayer.addLayer(m);
}
var overlayMaps = {
  "Players": playerLayer,
  "Tribes": tribeLayer
};
L.control.layers(null, overlayMaps).addTo(map);

map.setView([50, 50], 3);
map.addLayer( markerClusters );

// Create sidebarjs instance
const sidebarjs = new SidebarJS.SidebarElement({
  /*
   * All available options:
   * https://github.com/SidebarJS/sidebarjs#options
   */
  position: 'right'
});


var positioned = L.easyButton('fa-bars', function(){
  document.getElementById("sidebar").style.zIndex = "9999";
  // alert('you clicked the circle')
  sidebarjs.toggle();
}, 'title', {
  position: 'topright'
});
positioned.addTo(map);