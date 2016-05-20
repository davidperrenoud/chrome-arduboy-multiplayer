var WIDTH = 128;
var HEIGHT = 64;

// ============================================================
// App logic
// ============================================================

var connectionIds = [];
var bytes_until_new_lines = [];
var bytes_to_canvas = [];

// Interprets an ArrayBuffer as UTF-8 encoded string data.
var ab2str = function(buf) {
  var bufView = new Uint8Array(buf);
  var encodedString = String.fromCharCode.apply(null, bufView);
  return decodeURIComponent(escape(encodedString));
};

function onReceive(receiveInfo) {
  // Send the received data (as bytes) to each serial port
  connectionIds.forEach(function(connectionId) {
    if (connectionId != receiveInfo.connectionId) {
      chrome.serial.send(connectionId, receiveInfo.data, function(){});
    }
  });
  
  // Log the received data (as a string)
  //log(receiveInfo.connectionId + ': ' + ab2str(receiveInfo.data));
  drawToCanvas(receiveInfo.data);
};

function onError(errorInfo) {
  log("Receive error on serial connection: " + errorInfo.error);
};

function onConnect(connectionInfo) {
  if (!connectionInfo) {
    log('Could not connect\n');
    return;
  }
  
  // Add the connection id to the list
  connectionIds.push(connectionInfo.connectionId);
  
  log('Connected to: ' + connectionInfo.connectionId + '\n');
  
  // Show the number of Arduboys connected on screen
  showNumberOfArduboyConnected();
};

function connectPorts(ports) {
  // Exclude Bluetooth and /dev/cu.* ports
  var eligiblePorts = ports.filter(function(port) {
    return !port.path.match(/([Bb]luetooth|cu.)/);
  });
  
  // Connect each serial port to Chrome
  eligiblePorts.forEach(function(port) {
    log('Port: ' + port.path + '\n');
    chrome.serial.connect(port.path, onConnect);
  });
}

function disconnectAndReconnectAllPorts() {
  // Disconnect all serial ports
  connectionIds.forEach(function(connectionId) {
    chrome.serial.disconnect(connectionId, function(){});
  });
  connectionIds = [];
  
  showNumberOfArduboyConnected();
  
  // Connect all serial ports
  chrome.serial.getDevices(function(ports) {
    connectPorts(ports);
  });
}

chrome.serial.onReceive.addListener(onReceive);
chrome.serial.onReceiveError.addListener(onError);

// ============================================================
// Screen logic
// ============================================================

function log(message) {
  // Add the last message to the console
  //console.log(message);
  
  // Show the last message in <pre>
  document.getElementById('console').innerText = message;
}

function drawToCanvas(byte_data) {
  var byte_data_view = new Uint8Array(byte_data);
  
  // Add the new received bytes to the buffer
  var tmp = new Uint8Array(bytes_until_new_lines.length + byte_data_view.length);
  tmp.set(bytes_until_new_lines, 0);
  tmp.set(byte_data_view, bytes_until_new_lines.length);
  bytes_until_new_lines = tmp;

  // Wait for buffer full
  if (bytes_until_new_lines.length >= 1024) {
    // Prepare a browser <canvas> image
    var canvas = document.querySelector('canvas');
    var canvas_context = canvas.getContext('2d');
    var canvas_image = canvas_context.createImageData(WIDTH, HEIGHT);
  
    // Walk the rows by steps of 8
    for (var y = 0; y < HEIGHT; y += 8) {
      // Walk the columns
      for (var x = 0; x < WIDTH; x += 1) {
        // Each row is 8 bits
        var pixel_octet = bytes_until_new_lines[x + (y / 8) * WIDTH];

        // Write the 8 bits to the canvas image
        for (var j = 0; j < 8; j += 1) {
          // Unpack the bit to either 0 or 255, starting from the rightest bit (LSB)
          var pixel_value = (pixel_octet >> j & 1) * 255;
  
          // Canvas format is left to right, then downward
          canvas_image.data[(x + (y + j) * WIDTH) * 4]     = pixel_value; // red
          canvas_image.data[(x + (y + j) * WIDTH) * 4 + 1] = pixel_value; // green
          canvas_image.data[(x + (y + j) * WIDTH) * 4 + 2] = pixel_value; // blue
          canvas_image.data[(x + (y + j) * WIDTH) * 4 + 3] = 255;         // alpha
        }
      }
    }

    // Draw the image
    canvas_context.putImageData(canvas_image, 0, 0);
  
    // Data drawn, we can drop it
    bytes_until_new_lines = [];
  }
}

function showNumberOfArduboyConnected() {
  document.getElementById('connected').innerText = connectionIds.length;
}

onload = function() {
  document.getElementById('connect').addEventListener('click', connect);
  disconnectAndReconnectAllPorts();
};
