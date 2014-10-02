var tessel = require('tessel');
var test = require('tinytap');
var async = require('async');

var portName1 = process.argv[2] || 'A';
var portName2 = process.argv[3] || 'B';
var infraredLib = require('../index');
var infrared1;
var infrared2;

var testSignal = new Buffer([0x22, 0xc4, 0xee, 0xd0, 0x02, 0x58, 0xfe, 0x0c, 0x02, 0x8a, 0xf9, 0xf2, 0x02, 0x8a]);

test.count(9);

async.series([

  // Make sure the callback to use works properly
  test('connecting to first module using a callback', function(t) {
    // Connect the module to the port
    infrared1 = infraredLib.use(tessel.port[portName1], function(err, infrared) {
      // Confirm the infrared object was returned
      t.ok(infrared, 'infrared object not returned in use statement.');
      // Confirm there was no error
      t.equal(err, undefined, 'error returned in connecting to first module.');
      t.end();
    });
  }),

  // Make sure the ready and error events work properly
  test('connecting to second module using an event', function(t) {
    // Timeout that will fail the test 
    // Cancelled by the ready event
    var timeout = setTimeout(function eventNotCalled() {
      t.fail("Ready event never fired on module 2 connection.");
    }, 30000);

    // Connect to the port
    infrared2 = infraredLib.use(tessel.port[portName2]);

    // When it's ready
    infrared2.once('ready', function() {
      // Stop the failure timeout
      clearTimeout(timeout);
      t.end();
    });

    // If there is an error
    infrared2.once('error', function(err) {
      // Fail the test because it didn't connect properly.
      t.fail("Error thrown on connecting to module 2.");
    }); 
  }),

  // Make sure the error event is thrown for bad module ports
  test('connecting to non-existant third module', function(t) {
    // Timeout that will fail the test 
    // Cancelled by the ready event
    var timeout = setTimeout(function eventNotCalled() {
      t.fail("Error event never fired on module 2 connection.");
    }, 2000);

    // Connect to the port
    var notReal = infraredLib.use(tessel.port['C']);

    // If it's ready
    notReal.once('ready', function() {
      // Fail the test because it somehow connected to wrong port.
      t.fail("Ready thrown on connecting to non-existant module.");
    });

    // Once there is an error
    notReal.once('error', function(err) {
      // Stop the failure timeout
      clearTimeout(timeout);
      // Pass the test
      t.end();
    }); 
  }),


  test('removing listeners should stop IRQs', function(t) {

    infrared1.removeAllListeners('data');

    setImmediate(function() {
      // If infrared1 gets data
      infrared1.attiny.irq.once('high', function testFailed() {
        t.fail("removing listeners doesn't stop it from picking up data");
      });

      // Set a timeout that gets called to pass this test
      var timeout = setTimeout(function testPassed() {
        infrared1.removeAllListeners('data');
        infrared1.attiny.irq.removeAllListeners('high');
        t.end();
      }, 1000);

      // Tell infrared2 to send a signal
      infrared2.sendRawSignal(38, testSignal, function(err) {
        t.equal(err, undefined, 'error thrown on signal sending.');
      });
    });
  }),

  test('listening for data should enable IRQs', function(t) {

    // Set a timeout that gets called to pass this test
    var timeout = setTimeout(function testPassed() {
      // Then it didn't stop listening properly
      t.fail("_setListening with true doesn't cause it to pick up data.");
    }, 1000);

    // If infrared2 gets data
    infrared1.once('data', function(data) {
      clearTimeout(timeout);
      // Then it didn't stop listening properly
      t.ok(data, "_setListening with true calls data event with no data.");
      t.end();
    });

    // Tell infrared1 to send a signal
    infrared2.sendRawSignal(38, testSignal, function(err) {
      t.equal(err, undefined, 'error thrown on signal sending.');
    });
  }),

  test('received data is the same as sent data', function(t) {

    // Set a timeout that gets called to pass this test
    var timeout = setTimeout(function testPassed() {
      // Then it didn't stop listening properly
      t.fail("no data was picked up within time window.");
    }, 2000);

    // If infrared2 gets data
    infrared2.once('data', function(data) {
      clearTimeout(timeout);
      // Then it didn't stop listening properly
      t.ok(data, "_setListening with true doesn't pick up data");
      console.log('got this data', data);
      // Test that the length of the received and sent signals are the same
      t.equal(data.length, testSignal.length, 'received and sent signals are different lengths.');

      // Test that all of the bytes are the same
      var numLrg = 0;
      for (var i = 0; i < data.length; i++) {
        if (Math.abs(data[i] - testSignal[i] > 50)) {
          numLrg++;
        }
      }

      if (numLrg > 3) {
        t.fail('received and sent signals have payloads differing beyond the expectations of normal interference: ' + numLrg);
      }

      t.end();
    });

    // Tell infrared1 to send a signal
    infrared1.sendRawSignal(38, testSignal, function(err) {
      t.equal(err, undefined, 'error thrown on signal sending.');
    });
  }),
  
  test('error should be thrown on buffers greater than 100 16-bit words', function(t) {
    infrared2.sendRawSignal(36, new Buffer((100 * 2) + 1), function(err) {
      t.ok(err, 'No error was thrown on a buffer that is too large to handle');
      t.end();
    });
  }),

],
function (err) {
  return console.log('error with tests', err);
});