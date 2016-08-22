#Infrared
Driver for the ir-attx4 Tessel infrared module. The hardware documentation for this module can be found [here](https://github.com/tessel/hardware/blob/master/modules-overview.md#infrared).

If you run into any issues you can ask for support on the [IR Module Forums](https://forums.tessel.io/c/modules/ir).

Note: This library is responsible for sending and receiving IR data but we've just started another library, [ir-codes](https://github.com/technicalmachine/ir-codes), to generate and parse IR signals from different manufacturers. It's currently missing most manufacturers so we encourage developers to help us build out that library.

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
var infraredlib = require('ir-attx4');
var infrared = infraredlib.use(tessel.port['A']); 

// When we're connected
infrared.on('ready', function() {
  if (!err) {
    console.log("Connected to IR!");
    // Start sending a signal every three seconds
    setInterval(function() {
      // Make a buffer of on/off durations (each duration is 16 bits, off durations are negative)
      var powerBuffer = new Buffer([0x22,0xc4,0xee,0xd0,0x2,0x58,0xfe,0xc,0x2,0x8a,0xf9,0xf2,0x2,0x8a,0xf9,0xc0,0x2,0x58,0xfe,0xc,0x2,0x58,0xfe,0xc,0x2,0x8a,0xfe,0x3e,0x2,0x8a,0xfe,0x3e,0x2,0x8a,0xf9,0xc0,0x2,0x58,0xf9,0xc0,0x2,0x8a,0xfe,0x3e,0x2,0x8a,0xf9,0xc0,0x2,0x58,0xfe,0xc,0x2,0x58,0xfe,0xc,0x2,0x58,0xfe,0xc,0x2,0x58,0xfe,0xc,0x2,0x8a,0xfe,0x3e,0x2,0x8a,0xf9,0xc0,0x2,0x58,0xf9,0xc0,0x2,0x8a,0xf9,0xf2,0x2,0x8a,0xf9,0xc0,0x2,0x58,0xfe,0xc,0x2,0x58,0xfe,0xc,0x2,0x8a,0xfe,0x3e,0x2,0x8a,0xfe,0x3e,0x2,0x8a,0xfe,0xc,0x2,0x58,0xfe,0xc,0x2,0x58,0xfe,0xc,0x2,0x58,0xfe,0xc,0x2,0x58,0xf9,0xc0,0x2,0x8a,0xf9,0xc0,0x2,0x58,0xf9,0xc0,0x2,0x58,0xf9,0xc0,0x2,0x58]); 
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
&#x20;<a href="#api-infrared-sendRawSignal-frequency-signalDurations-callback-The-primary-method-for-sending-data-The-first-argument-is-a-frequency-of-signal-in-Hz-typically-38-but-can-range-from-36-to-40-The-second-argument-is-a-buffer-of-unsigned-16-bit-integers-representing-the-number-of-microseconds-the-transmission-should-be-on-The-max-length-of-the-signal-durations-is-100-durations" name="api-infrared-sendRawSignal-frequency-signalDurations-callback-The-primary-method-for-sending-data-The-first-argument-is-a-frequency-of-signal-in-Hz-typically-38-but-can-range-from-36-to-40-The-second-argument-is-a-buffer-of-unsigned-16-bit-integers-representing-the-number-of-microseconds-the-transmission-should-be-on-The-max-length-of-the-signal-durations-is-100-durations">#</a> infrared<b>.sendRawSignal</b>( frequency, signalDurations, callback )  
The primary method for sending data. The first argument is a frequency of signal in Hz, typically 38 but can range from 36 to 40. The second argument is a buffer of 16 bit, 2's complement integers representing the number of microseconds the transmission should be on or off. On durations are positive numbers and off durations are negative numbers. The max length of the signal durations is 100 durations (200 bytes).   

###Events
&#x20;<a href="#api-infrared-on-data-callback-data-Emitted-when-an-infrared-signal-is-detected" name="api-infrared-on-data-callback-data-Emitted-when-an-infrared-signal-is-detected">#</a> infrared<b>.on</b>( 'data', callback(data) )  

Emitted when an infrared signal is detected. The returned data is an a buffer containing 16-bit words representing the number of microseconds a signal was on and off. For example, a buffer of `<0x22,0xc4,0xee,0xd0,0x2,0x58,0xfe,0xc>` represents four durations: on for 8900 uS (0x22c4), off for 4400 microseconds (0xeed0 as 2's compliment), on for 600 uS, then off for 320 microseconds. You can use the built-in [```Buffer.readInt16BE(byteIndex)```](http://nodejs.org/api/buffer.html#buffer_buf_readint16be_offset_noassert), to get the value from the data buffer (index 0 is the first value, index 2 is the second, etc.).

You may notice that some durations you received are occasionally off by 50 uS. That's because of the way the receiver logic is implemented. The state of a pin is checked on a 50uS timer and all of those timer ticks are multiplied by 50. If the timer is just a little bit off (or the light is reflected/transformed), it will miss the very start or end of a signal. IR detectors have a high margin of error so this usually has little effect.


&#x20;<a href="#api-infrared-on-error-callback-err-Emitted-when-there-is-an-error-communicating-with-the-module" name="api-infrared-on-error-callback-err-Emitted-when-there-is-an-error-communicating-with-the-module">#</a> infrared<b>.on</b>( 'error', callback(err) )  
Emitted when there is an error communicating with the module.  

&#x20;<a href="#api-infrared-on-ready-callback-Emitted-upon-first-successful-communication-between-the-Tessel-and-the-module" name="api-infrared-on-ready-callback-Emitted-upon-first-successful-communication-between-the-Tessel-and-the-module">#</a> infrared<b>.on</b>( 'ready', callback() )  
Emitted upon first successful communication between the Tessel and the module.  

###License
Released under the MIT and Apache 2.0 licenses.
