var util = require('util'); 
var EventEmitter = require('events').EventEmitter;

var PACKET_CONF = 0x55;
var ACK_CONF = 0x33;
var FIN_CONF = 0x16;

var ACK_CMD = 0x00;
var FIRMWARE_CMD = 0x01;
var IR_TX_CMD = 0x02;
var IR_RX_AVAIL_CMD = 0x03
var IR_RX_CMD = 0x04;
var RX_START_CMD = 0x05;
var RX_STOP_CMD = 0x06;
var MAX_SIGNAL_DURATION = 200;

var Infrared = function(hardware, callback) {

  this.spi = hardware.SPI({clockSpeed : 1000, mode:2});
  this.chipSelect = hardware.gpio(1);
  this.reset = hardware.gpio(2);
  this.irq = hardware.gpio(3);
  this.transmitting = false;
  this.listening = false;
  this.chipSelect.output().high();
  this.reset.output().high();
  this.irq.output().low();

  var self = this;

  // If we get a new listener
  this.on('newListener', function(event) {
    // And they are listening for rx data and we haven't been yet
    if (event == "length" && !this.listeners(event).length) {
        self.setListening(1);
    }
  });

  this.on('removeListener', function(event) {
    // If this was for the rx data event and there aren't any more listeners
    if (event == "length" && !this.listeners(event).length) {
        self.setListening(0);
    }
  });

  // Make sure we can communicate with the module
  this.establishCommunication(3, function(err, version) {
    if (err) {
      setImmediate(function() {
          self.emit('error', err);
      });
    }
    else {
      setImmediate(function() {
        self.emit('ready');
      });
    }
    // Make sure we aren't gathering rx data until someone is listening.
    self.setListening(0);

    // Start listening for IRQ interrupts
    self.irq.watch('high', self.IRQHandler.bind(self));

    // Complete the setup
    callback && callback(err, self);
  });
}

util.inherits(Infrared, EventEmitter);

Infrared.prototype.IRQHandler = function() {
    // If we are not in the middle of transmitting
    if (!this.transmitting) {
        // Receive the durations
        this.getRXDurationsLength();

        this.fetchRXDurations();

        // Start listening for IRQ interrupts
        self.irq.watch('high', self.IRQHandler.bind(self));

    } else {
        // If we are, check back in 1 seconds
        // TODO: reduce this timeout when we're running faster
        setTimeout(this.IRQHandler.bind(this), 1000);
    }
}

Infrared.prototype.setListening = function(set, callback) {
  var self = this;

  var cmd = set ? RX_START_CMD : RX_STOP_CMD;

  var response = this.SPITransfer(new Buffer([cmd, 0x00, 0x00]));

  self.validateResponse(response, [PACKET_CONF, cmd], function(valid) {
    
    if (!valid) {
        return callback && callback(new Error("Invalid response on setting rx on/off."));
    }
    else {
      self.listening = set ? true : false;

      if (callback) {
        callback();
      }
    }
  });
}

Infrared.prototype.getRXDurationsLength = function() {
    var self = this;
    // We have to pull chip select high in case we were in the middle of something else


    this.SPITransfer([IR_RX_AVAIL_CMD, 0x00, 0x00, 0x00], function(response) {
        // DO something smarter than this eventually

        self.validateResponse(response, [PACKET_CONF, IR_RX_AVAIL_CMD, 1], function(valid) {
            if (valid) {
                var numInt16 = response[3];
                self.emit('length', numInt16);
            }
        });
    });
}   

Infrared.prototype.fetchRXDurations = function() {
    var self = this;
    // We have to pull chip select high in case we were in the middle of something else

    // this.chipSelect.high();
    this.SPITransfer([IR_RX_AVAIL_CMD, 0x00, 0x00, 0x00], function(response) {
        // DO something smarter than this eventually

        self.validateResponse(response, [PACKET_CONF, IR_RX_AVAIL_CMD, 1], function(valid) {
            if (valid) {
                var numInt16 = response[3];

                // (We have two bytes per element...);
                var numBytes = numInt16 * 2;

                var rxHeader = [IR_RX_CMD, 0x00, 0x00];
                var packet = rxHeader.concat(EmptyArray(numBytes))


                // Push the stop bit on there.
                packet.push(FIN_CONF);

                self.SPITransfer(packet, function(response) {

                    var fin = response[response.length-1];

                    if (fin != FIN_CONF) {
                        console.log("Warning: Received Packet Out of Frame.");
                        return;
                    }

                    if (err){
                        return;// console.log("Issue sending dummy bytes...");
                    }

                    else {
                        // Remove the header echoes at the beginning
                        var arr = response.slice(rxHeader.length, response.length);

                        // Emit the buffer
                        self.emit('data', arr);
                    }
                })
            }
        })
    })
}

// Remove once Array class works...
function EmptyArray(size) {
    var arr = [];

    for (var i = 0; i < size; i++) {
        arr[i] = 0;
    }

    return arr;
}

Infrared.prototype.sendRawSignal = function(frequency, signalDurations, callback) {
    if (frequency <= 0) {
        setImmediate(function() {
            callback && callback(new Error("Invalid frequency. Must be greater than zero. Works best between 36-40."));
        });
    } 
    else if (signalDurations.length > MAX_SIGNAL_DURATION) {
        setImmediate(function() {
            callback && callback(new Error("Invalid buffer length. Must be between 1 and ", MAX_SIGNAL_DURATION));
        })
    } else {

        this.transmitting = true;

        var self = this;

        // Make the packet
        var tx = this.constructTXPacket(frequency, signalDurations);

        // Send it over
        this.SPITransfer(tx, function(response) {

            self.transmitting = false;
            console.log('raw response', response);
            // If there was an error already, set immediate on the callback
            if (err) {
                setImmediate(function() {
                    callback && callback(err);
                });
                return;
            }
            else if (!self.validateResponse(response, [PACKET_CONF, IR_TX_CMD, frequency, signalDurations.length/2])) {
                err = new Error("Invalid response from raw signal packet: " + response);
            }

            setImmediate(function() {
                callback && callback(err);
            });
        });
    }
}

Infrared.prototype.constructTXPacket = function(frequency, signalDurations) {
    // Create array
    var tx = [];
    // Add command 
    tx.push(IR_TX_CMD);
    // Frequency of PWN
    tx.push(frequency);

    // Add length of signal durations in terms of int16s
    tx.push(signalDurations.length/2)

    // For each signal duration
    for (var i = 0; i < signalDurations.length; i++) {
        // Send upper and lower bits
        tx.push(signalDurations.readUInt8(i));
    }
    // Put a dummy bit to get the last echo
    tx.push(0x00);

    // Put the finish confirmation
    tx.push(FIN_CONF);

    tx = new Buffer(tx);

    // return
    return tx;
};

Infrared.prototype.establishCommunication = function(retries, callback){
  var self = this;
  // Grab the firmware version
  self.getFirmwareVersion(function(err, version) {
    // If it didn't work
    if (err) {
      // Subtract number of retries
      retries--;
      // If there are no more retries possible
      if (!retries) {
        // Throw an error and return
        return callback && callback(new Error("Can't connect with module..."));
      }
      // Else call recursively
      else {
        self.establishCommunication(retries, callback);
      }
    }
    // If there was no error
    else {
      // Connected successfully
      self.connected = true;
      // Call callback with version
      if (callback) {
        callback(null, version);
      }
    }
  });
};  

Infrared.prototype.getFirmwareVersion = function(callback) {
  var self = this;

  self.SPITransfer(new Buffer([FIRMWARE_CMD, 0x00, 0x00]), function(response) {
    if (err) {
      return callback(err, null);
    }
    else if (self.validateResponse(response, [false, FIRMWARE_CMD]) && response.length === 3) 
    {
      if (callback) {
        callback(null, response[2]);
      }
    } 
    else 
    { 
      if (callback) {
        callback(new Error("Error retrieving Firmware Version"));
      }
    }
  });
};    

Infrared.prototype.validateResponse = function(values, expected, callback) {

  var res = true;

  for (var index = 0; index < expected.length; index++) {

    if (expected[index] === false) continue;

    if (expected[index] != values[index]) {
      res = false;
      break;
    }
  }

  if (callback) {
    callback(res);
  }

  return res;
};

Infrared.prototype.SPITransfer = function(data, callback) {
    
  // Pull Chip select down prior to transfer
  this.chipSelect.low();

  // Send over the data
  var ret = this.spi.transferSync(data); 

  // Pull chip select back up
  this.chipSelect.high();

  // Call any callbacks
  if (callback) {
    callback(ret);
  }

  // Return the data
  return ret;
}

exports.Infrared = Infrared;
exports.use = function (hardware, callback) {
    return new Infrared(hardware, callback);
};