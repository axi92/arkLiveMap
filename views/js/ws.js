var ws = new WebSocket(`ws://localhost:8080`);

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
  console.log(event.data);
}