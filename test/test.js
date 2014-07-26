var tessel = require('tessel');
var test = require('tinytap');
var async = require('async');

var portName1 = process.argv[2] || 'A';
var portName2 = process.argv[3] || 'B';
var infraredLib = require('../index');
var infrared1;
var infrared2;

var testSignal = new Buffer([0, 178, 255, 168, 0, 12, 255, 246, 0, 13, 255, 225, 0, 13]);

test.count(11);

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
    }, 10000);

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


  test('calling setListening with false', function(t) {

    // If infrared1 gets data
    infrared1.once('data', function(data) {
      console.log('this console log doesnt even work!');
      console.log('shit i got data', data);
      // Then it didn't stop listening properly
      t.fail("setListening with false doesn't stop it from picking up data");
    });

    // Tell the first infrared to not listen
    console.log('setting listening to', false);
    infrared1.setListening(false, function(err) {

      // Make sure there was no error
      t.equal(err, undefined, 'Error when setting listener to false');

      // Set a timeout that gets called to pass this test
      var timeout = setTimeout(function testPassed() {
        infrared1.removeAllListeners('data');
        t.end();
      }, 500);

      // Tell infrared2 to send a signal
      infrared2.sendRawSignal(38, testSignal, function(err) {
        t.equal(err, undefined, 'error thrown on signal sending.');
      });
    });
  }),

  test('calling setListening with true', function(t) {
    // Tell the infrared2 to  listen
    infrared2.setListening(true, function(err) {

      // Make sure there was no error
      t.equal(err, undefined, 'Error when setting listener to true');

      // Set a timeout that gets called to pass this test
      var timeout = setTimeout(function testPassed() {
        // Then it didn't stop listening properly
        t.fail("setListening with true doesn't cause it to pick up data.");
      }, 5000);

      // If infrared2 gets data
      infrared2.once('data', function(data) {
        clearTimeout(timeout);
        // Then it didn't stop listening properly
        t.ok(data, "setListening with true calls data event with no data.");
        t.end();
      });

      console.log('are we listneing?', infrared2.listening);

      // Tell infrared1 to send a signal
      infrared1.sendRawSignal(38, testSignal, function(err) {
        t.equal(err, undefined, 'error thrown on signal sending.');
      });
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
      t.ok(data, "setListening with true doesn't pick up data");
      console.log('rx', data);
      console.log('tx', testSignal);
      // Test that the length of the received and sent signals are the same
      t.equal(data.length, testSignal.length, 'received and sent signals are different lengths.');

      // Test that all of the bytes are the same
      for (var i = 0; i < data.length; i++) {
        if (Math.abs(data[i] - testSignal[i] > 5)) {
          t.fail('received and sent signals have wildly different payloads.');
        }
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