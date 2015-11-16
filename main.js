var connectionIds = [];

/* Interprets an ArrayBuffer as UTF-8 encoded string data. */
var ab2str = function(buf) {
  var bufView = new Uint8Array(buf);
  var encodedString = String.fromCharCode.apply(null, bufView);
  return decodeURIComponent(escape(encodedString));
};

function onReceive(receiveInfo) {
  connectionIds.forEach(function(connectionId) {
    if (connectionId != receiveInfo.connectionId) {
      chrome.serial.send(connectionId, receiveInfo.data, function(){});
    }
  });
  
  log(receiveInfo.connectionId + ': ' + ab2str(receiveInfo.data));
};

function onError(errorInfo) {
  log("Receive error on serial connection: " + errorInfo.error);
};

function onConnect(connectionInfo) {
  if (!connectionInfo) {
    log('Could not connect\n');
    return;
  }
  
  connectionIds.push(connectionInfo.connectionId);
  log('Connected to: ' + connectionInfo.connectionId + '\n');
  updateArduboysConnected();
};

function connectPorts(ports) {
  var eligiblePorts = ports.filter(function(port) {
    return !port.path.match(/([Bb]luetooth|cu.)/);
  });
  
  eligiblePorts.forEach(function(port) {
    log('Port: ' + port.path + '\n');
    chrome.serial.connect(port.path, onConnect);
  });
}

function connect() {
  connectionIds.forEach(function(connectionId) {
    chrome.serial.disconnect(connectionId, function(){});
  });
  connectionIds = [];
  updateArduboysConnected();
  
  chrome.serial.getDevices(function(ports) {
    connectPorts(ports);
  });
}

function log(text) {
  document.getElementById('console').innerText = text + document.getElementById('console').innerText;
}

function updateArduboysConnected() {
  document.getElementById('connected').innerText = connectionIds.length;
}

onload = function() {
  document.getElementById('connect').addEventListener('click', connect);
  updateArduboysConnected();
  connect();
};

chrome.serial.onReceive.addListener(onReceive);
chrome.serial.onReceiveError.addListener(onError);
