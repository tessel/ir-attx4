#Infrared
Driver for the ir-attx4 Tessel infrared module. The hardware documentation for this module can be found [here](https://github.com/tessel/hardware/blob/master/modules-overview.md#ir).

If you run into any issues you can ask for support on the [Relay Module Forums](http://forums.tessel.io/category/ir).

###Installation
```sh
npm install ir-attx4
```

###Example
```js
/*********************************************
This infrared module example transmits the
power signal sequence of an Insignia brand
television every three seconds, while also
listening for (and logging) any incoming
infrared data.
*********************************************/

var tessel = require('tessel');
var infrared = require('../').use(tessel.port['A']);  // Replace '../' with 'ir-attx4' in your own code

// When we're connected
infrared.on('ready', function() {
  if (!err) {
    console.log("Connected to IR!");
    // Start sending a signal every three seconds
    setInterval(function() {
      // Make a buffer of on/off durations (each duration is 16 bits)
      var powerBuffer = new Buffer([0, 178, 255, 168, 0, 12, 255, 246, 0, 13, 255, 225, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 225, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247, 0, 13, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 224, 0, 13, 255, 224, 0, 12, 255, 224, 0, 12, 255, 224, 0, 12]);
      // Send the signal at 38 kHz
      infrared.sendRawSignal(38, powerBuffer, function(err) {
        if (err) {
          console.log("Unable to send signal: ", err);
        } else {
          console.log("Signal sent!");
        }
      });
    }, 3000); // Every 3 seconds
  } else {
    console.log(err);
  }
});

// If we get data, print it out
infrared.on('data', function(data) {
	console.log("Received RX Data: ", data);
});
```

###Methods
&#x20;<a href="#api-infrared-sendRawSignal-frequency-signalDurations-callback-The-primary-method-for-sending-data-The-first-argument-is-a-frequency-of-signal-in-Hz-typically-38-but-can-range-from-36-to-40-The-second-argument-is-a-buffer-of-unsigned-16-bit-integers-representing-the-number-of-microseconds-the-transmission-should-be-on-The-max-length-of-the-signal-durations-is-100-durations" name="api-infrared-sendRawSignal-frequency-signalDurations-callback-The-primary-method-for-sending-data-The-first-argument-is-a-frequency-of-signal-in-Hz-typically-38-but-can-range-from-36-to-40-The-second-argument-is-a-buffer-of-unsigned-16-bit-integers-representing-the-number-of-microseconds-the-transmission-should-be-on-The-max-length-of-the-signal-durations-is-100-durations">#</a> infrared<b>.sendRawSignal</b>( frequency, signalDurations, callback ) The primary method for sending data. The first argument is a frequency of signal in Hz, typically 38 but can range from 36 to 40. The second argument is a buffer of unsigned 16 bit integers representing the number of microseconds the transmission should be on. The max length of the signal durations is 100 durations.  

&#x20;<a href="#api-infrared-setListening-set-callback-Determines-whether-the-module-is-listening-for-incoming-signals-Will-automatically-be-set-and-unset-depending-on-listeners-for-the-data-event" name="api-infrared-setListening-set-callback-Determines-whether-the-module-is-listening-for-incoming-signals-Will-automatically-be-set-and-unset-depending-on-listeners-for-the-data-event">#</a> infrared<b>.setListening</b>( set, callback ) Determines whether the module is listening for incoming signals. Will automatically be set and unset depending on listeners for the data event.  

###Events
&#x20;<a href="#api-infrared-on-data-callback-data-Emitted-when-an-infrared-signal-is-detected" name="api-infrared-on-data-callback-data-Emitted-when-an-infrared-signal-is-detected">#</a> infrared<b>.on</b>( 'data', callback(data) ) Emitted when an infrared signal is detected.  

&#x20;<a href="#api-infrared-on-error-callback-err-Emitted-when-there-is-an-error-communicating-with-the-module" name="api-infrared-on-error-callback-err-Emitted-when-there-is-an-error-communicating-with-the-module">#</a> infrared<b>.on</b>( 'error', callback(err) ) Emitted when there is an error communicating with the module.  

&#x20;<a href="#api-infrared-on-ready-callback-Emitted-upon-first-successful-communication-between-the-Tessel-and-the-module" name="api-infrared-on-ready-callback-Emitted-upon-first-successful-communication-between-the-Tessel-and-the-module">#</a> infrared<b>.on</b>( 'ready', callback() ) Emitted upon first successful communication between the Tessel and the module.  

###License
Released under the MIT and Apache 2.0 licenses.