var url = window.location.href;
url = url.replace('http://', '');
url = url.replace('https://', '');
var ws = new WebSocket('ws://' + url);
var id;

ws.onerror = function () {
  console.log('ws onerror');
};
ws.onopen = function () {
  console.log('ws onopen');
};
ws.onclose = function () {
  console.log('ws onclose');
  ws = null;
};

ws.onmessage = function (event) {
  var json = JSON.parse(event.data);
  if(typeof(json.id) != 'undefined'){
    id = json.id;
    let temp = window.location.href;
    temp = temp.split('/');
    let server_id = temp[temp.length - 1];
    ws.send(JSON.stringify({ server_id: server_id }));
  } else if(typeof(json.marker) != 'undefined'){
    markerClusters.clearLayers(); // Clear all markers on map
    mark = json.marker;
    markerLength = mark.length;
    for (i = 0; i < markerLength; i++) {
      var m = L.marker([100 - parseFloat(mark[i][0]), parseFloat(mark[i][1])], {
        icon: L.AwesomeMarkers.icon({
          icon: mark[i][2],
          prefix: 'fa',
          markerColor: mark[i][3]
        })
      }).bindPopup(mark[i][4] + '<br /><!-- cheat setplayerpos ' + parseFloat(mark[i][1]).toFixed(0) + ' ' + parseFloat(mark[i][0]).toFixed(0) + ' ' + (parseFloat(mark[i][6]) + 50).toFixed(0) + '--><br />' + mark[i][5]);
      markerClusters.addLayer( m );
    }
  }
}
