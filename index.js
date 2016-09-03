// Copyright 2014 Technical Machine, Inc. See the COPYRIGHT
// file at the top-level directory of this distribution.
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Attiny = require('attiny-common');
var MODULE_ID = 0x0B;
var TINY84_SIGNATURE = 0x930C;
var FIRMWARE_FILE = __dirname + '/firmware/src/infrared-attx4.hex';

// Confirmation Signals
var PACKET_CONF = 0x55;
var ACK_CONF = 0x33;
var FIN_CONF = 0x16;

// Available commands
var IR_TX_CMD = 0x02;
var IR_RX_AVAIL_CMD = 0x03;
var IR_RX_CMD = 0x04;
var RX_START_CMD = 0x05;
var RX_STOP_CMD = 0x06;
var CRC_CMD = 0x07;

// Module specific defines
var MAX_SIGNAL_DURATION = 200;

// Firmware release info. Updated with each release
var FIRMWARE_VERSION = 0x04;
var CRC = 47355;

var REBOOT_TIME = 300; // Empirically observed time needed to reboot and configure registers

var Infrared = function(hardware, callback) {

  var self = this;

  // Create a new tiny agent
  this.attiny = new Attiny(hardware);

  // Store our firmware checking and updating options
  var firmwareOptions = {
    firmwareFile : FIRMWARE_FILE,
    firmwareVersion : FIRMWARE_VERSION,
    moduleID : MODULE_ID,
    signature : TINY84_SIGNATURE,
    crc : CRC,
  }

  // Initialize (check firmware version, update as necessary)
  this.attiny.initialize(REBOOT_TIME, firmwareOptions, function(err) {

    // If there was an error
    if (err) {
      // Emit it
      self.emit('error', err);
      // Call the callback
      if (callback) callback(err);
      // Abort
      return;
    }
    // There was no error
    else {

      self.connected = true;

      // If we get a new listener
      self.on('newListener', function (event) {
        // And they are listening for rx data and we haven't been yet
        if (event == 'data' && !this.listeners(event).length) {
          // Enable GPIO Interrupts on IRQ
          self._setListening(1);
        }
      });

      // Someone stopped listening
      self.on('removeListener', function (event) {
        // If this was for the rx data event and there aren't any more listeners
        if (event == 'data' && !this.listeners(event).length) {
          // Disable gpio interrupts on IRQ
          self._setListening(0);
        }
      });

      setImmediate(function () {
        // Emit a ready event
        self.emit('ready');
        // Start listening for IRQ interrupts
        self.attiny.setIRQCallback(self._IRQHandler.bind(self));

      });

      // Make sure we aren't gathering rx data until someone is listening.
      var listening = self.listeners('data').length ? true : false;

      self._setListening(listening, function listeningSet(err) {
        // Complete the setup
        if (callback) {
          callback(err, self);
        }
      });
    }
  });
};

util.inherits(Infrared, EventEmitter);

Infrared.prototype._IRQHandler = function (callback) {
  var self = this;
  // If we are not in the middle of transmitting
  if (!self.transmitting) {
    // Receive the durations
    self._fetchRXDurations(function fetched () {
      // Start listening for IRQ interrupts again
      self.attiny.setIRQCallback(self._IRQHandler.bind(self));
    });
  } else {
    // If we are, check back in a little bit
    setTimeout(self._IRQHandler.bind(self), 500);
  }
};

Infrared.prototype._setListening = function (set, callback) {
  var self = this;

  var cmd = set ? RX_START_CMD : RX_STOP_CMD;
  self.attiny.transceive(new Buffer([cmd, 0x00, 0x00]), function listeningSet (err, response) {
    self.attiny._validateResponse(response, [PACKET_CONF, cmd], function (valid) {
      if (!valid) {
        callback && callback(new Error("Invalid response on setting rx on/off."));
      } else {
        self.listening = set ? true : false;
        // If we aren't listening any more
        if (!self.listening) {
          // Remove this GPIO interrupt
          self.attiny.irq.removeAllListeners();
        }
        else {
          // Make sure it calls the IRQ handler
          if (!self.attiny.irq.listeners('high').length) {
            self.attiny.irq.once('high', self._IRQHandler.bind(self));
          }
        }
        callback && callback();
      }
    });
  });
};

Infrared.prototype._fetchRXDurations = function (callback) {
  var self = this;
  // We have to pull chip select high in case we were in the middle of something else
  self.attiny.transceive(new Buffer([IR_RX_AVAIL_CMD, 0x00, 0x00, 0x00]), function spiComplete (err, response) {
    // DO something smarter than this eventually

    self.attiny._validateResponse(response, [PACKET_CONF, IR_RX_AVAIL_CMD, 1], function (valid) {
      if (valid) {
        var numInt16 = response[3];

        // (We have two bytes per element...);
        var numBytes = numInt16 * 2;

        var rxHeader = [IR_RX_CMD, 0x00, 0x00];
        var packet = rxHeader.concat(new Array(numBytes));

        // Push the stop bit on there.
        packet.push(FIN_CONF);

        self.attiny.transceive(new Buffer(packet), function spiComplete (err, response) {
          var fin = response[response.length - 1];

          if (fin != FIN_CONF) {
            console.warn("Warning: Received Packet Out of Frame.");

            callback && callback();
          } else {

            // Remove the header echoes at the beginning and stop bit
            var buf = response.slice(rxHeader.length, response.length - 1);

            // Emit the buffer
            self.emit('data', buf);
            callback && callback();
          }
        });
      }
      else {
        if (callback) {
          var err = new Error("Invalid response when checking if data was available to read");
          setImmediate(function() {
            self.emit('error', err);
          });
          callback(err);
        }
      }
    });
  });
};

Infrared.prototype.sendRawSignal = function (frequency, signalDurations, callback) {
  if (frequency <= 0) {
    callback && callback(new Error("Invalid frequency. Must be greater than zero. Works best between 36-40."));
    return;
  }

  if (signalDurations.length > MAX_SIGNAL_DURATION) {
    callback && callback(new Error("Invalid buffer length. Must be between 1 and " + MAX_SIGNAL_DURATION));
    return;
  }

  if (signalDurations.length % 2 != 0) {
    if (callback) {
      callback(new Error("Invalid buffer size. Transmission buffers must be an even length of 8 bit values representing 16-bit words."));
    }
  }

  this.transmitting = true;

  var self = this;

  // Make the packet
  var tx = this._constructTXPacket(frequency, signalDurations);

  // Send it over
  this.attiny.transceive(tx, function spiComplete (err, response) {
    self.transmitting = false;

    // If there was an error already, set immediate on the callback
    var err = null;
    if (!self.attiny._validateResponse(response, [PACKET_CONF, IR_TX_CMD, frequency, signalDurations.length/2])) {
      err = new Error("Invalid response from raw signal packet.");
    }

    callback && callback(err);
  });
};

Infrared.prototype._constructTXPacket = function (frequency, signalDurations) {
  // Create array
  var tx = [];
  // Add command
  tx.push(IR_TX_CMD);
  // Frequency of PWN
  tx.push(frequency);

  // Add length of signal durations in terms of int16s
  tx.push(signalDurations.length / 2);

  // For each signal duration
  for (var i = 0; i < signalDurations.length; i++) {
    // Send upper and lower bits
    tx.push(signalDurations.readUInt8(i));
  }
  // Put a dummy bit to get the last echo
  tx.push(0x00);

  // Put the finish confirmation
  tx.push(FIN_CONF);

  return new Buffer(tx);
};



function use (hardware, callback) {
  return new Infrared(hardware, callback);
}

/**
 * Public API
 */

exports.Infrared = Infrared;
exports.use = use;
