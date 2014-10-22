// Copyright 2014 Technical Machine, Inc. See the COPYRIGHT
// file at the top-level directory of this distribution.
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

#include "../include/infrared-attx4.h"

volatile receiver_t receiver;
volatile transmitter_t transmitter;

// Program Flash Checksum
volatile unsigned short checksum = 0xffff;

// Pin toggling
uint8_t readIR_RX(void);
void setIRQ(uint8_t val);
uint8_t readIRQ(void);
uint8_t readCS(void);

// Initialization
void initializeIR(void);
void enableDIO(void);
void resetTransmitter(void);
void resetReceiver(void);

// SPI
void configureSPI(void);
void enableSPI(uint8_t enable);

// Receiving functionality
void configureReceiveTimerInterrupt(void);
void enableReceiveTimerInterrupt(uint8_t enable);
void enableReceive(uint8_t enable);

// Transmit functionality
void resetTransmitTimerRegisters(void);
void delayMicroseconds(uint32_t us);
void enablePWM(uint8_t enable);
void mark(uint32_t us);
void space(uint32_t us);
void enableIROut(uint8_t freq);
void transmitData(volatile uint8_t freq, volatile int time_array[], volatile uint8_t arr_length);

// WDT
void enableWatchdog(uint8_t enable);

extern void _exit();

/**************************************
main: The primary loop for transmitting.
**************************************/
int main(void) {

  // Set the checksum
  checksum = calculate_checksum( (unsigned short) _exit << 1 );

  // Get everything all configured
  initializeIR();

  // While we're not in an interrupt
  while(1) {

    // If a new transmission has been sent over
    if (transmitter.state == STATE_TX) {

      // Disable RX so we don't pick up the same thing we send...
      enableReceive(0);

      // Turn off SPI so we don't get interrupts
      enableSPI(0);

      // Send the data
      transmitData(transmitter.frequency, transmitter.txbuf, transmitter.txlen);

      // Loop until CS is pulled high again
      while (!readCS());

      // Reset our vars
      resetTransmitter();

      // If we were listening, re-enable receiving
      if (receiver.enabled) enableReceive(1);

      // Re-enable SPI
      enableSPI(1);
    }
  }

  return 0;
}

/**************************************
initializeIR: Set up state machine, digital I/O
and start up timers.
**************************************/
void initializeIR(void) {

  // Stop interrupts as we setup
  cli();

  // Turn the watchdog off, in case of weird crash
  enableWatchdog(0);

  // Reset the transmitter and receiver structs
  resetTransmitter();
  resetReceiver();
  
  // enable inputs and outputs
  enableDIO();

  // Enable SPI interrupts
  enableSPI(1);

  // Set the interrupts loose
  sei();
}

/**************************************
initializeParams: Reset transmitter machine.
**************************************/
void resetTransmitter(void) {
  transmitter.frequency = 0;
  transmitter.txlen = 0;
  transmitter.state = STATE_IDLE;
}

/**************************************
initializeParams: Reset transmitter machine.
**************************************/
void resetReceiver(void) {
  receiver.rxlen = 0;
  receiver.state = STATE_IDLE;
}

/**************************************
enableDIO: Set I/O to right directions/states.
**************************************/
void enableDIO(void) {

  // Set the led as output
  sbi(DDRA, IR_TX);

  // Make it low
  cbi(PINA, IR_TX);

  // Enable IRQ output
  sbi(DDRB, IRQ);

  // Set IR Detector as input
  cbi(DDRA, IR_RX);

  // Set MOSI to be an input
  cbi(DDRA, MOSI);

}

/**************************************
enableReceive: Set whether the receive timer
should be active.
**************************************/
void enableReceive(uint8_t enable) {

  // If we are enabling
  if (enable) {

    // Set up the timer with the right schema
    configureReceiveTimerInterrupt();

    // Let it loose
    enableReceiveTimerInterrupt(1);
  }
  // If not
  else {

    TCCR1B = 0;

    // Stop it
    enableReceiveTimerInterrupt(0);
  }
}

/**************************************
configureReceiveTimerInterrupt: configure
the receive timer to tick at 50uS.
**************************************/
void configureReceiveTimerInterrupt(void) {
  
  // Turn off any interrupts
  cli();

  // No PWM output
  TCCR1A = 0; 

  // Set the timer top to 0CR1A and set divider to 8
  sbi(TCCR1B, CS11);
  sbi(TCCR1B, WGM12);

  // Set the top so that we have int. every 50 uS
  OCR1A = 50; 

// enable interrupts
  sei();  
  
}

/**************************************
enableReceiveTimerInterrupt: Turn the RX
timer on or off.
**************************************/
void enableReceiveTimerInterrupt(uint8_t enable) {

  // turn off interrupts
  cli();

  // Clear the counter
  TCNT1 = 0; 

  //Timer1 Overflow Interrupt Enable
  enable ? sbi(TIMSK1, OCIE1A) : cbi(TIMSK1, OCIE1A);

  // turn on interrupts
  sei();

}

/**************************************
configureSPI: set SPI to slave with CS as input.
**************************************/
void configureSPI(void) {

  // configure: interrupt on INT0 pin falling edge
  MCUCR = (1<<ISC01);

  // Set CS as INPUT
  cbi(DDRB, CS);

  // Set up pull up to keep CS high
  sbi(PORTB, CS);

  // disable spi counter overflow enable
  USICR&= ~(1<<USIOIE);
  USICR&= ~(1<<USIWM0);
}

/**************************************
enableSPI: Turn SPI on/off
**************************************/
void enableSPI(uint8_t enable) {

  // If SPI is to be enabled
  if (enable) {
    // configure it...
    configureSPI();

    // Turn on the interrupt for the pin
    sbi(GIMSK, INT0);
  }
  // If disabled
  else {
    // Turn off the interrupt for the pin
    cbi(GIMSK, INT0);
  }
}

/**************************************
resetTransmitTimerRegisters: Reset 
transmit PWM timers.
**************************************/
void resetTransmitTimerRegisters(void) {
  // Stop the clock, set waveform generation to normal, and set output mode to normal
  TCCR0B = (0<<FOC0A) | (0<<FOC0B) | (0<<WGM02) | (0<<CS02) | (0<<CS01) | (0<<CS00);
  TCCR0A = (0<<COM0A1) | (0<<COM0A0) | (0<<COM0B1) | (0<<COM0B0) | (0<<WGM01) | (0<<WGM00);
  
  // Reset the count to zero
  TCNT0 = 0;
  
  // Disable all Timer0 interrupts
  TIMSK0 = 0;
  
  // Clear the Timer0 interrupt flags
  TIFR0 |= 0b111;
  
  // Disconnect PWM output
  cbi(TCCR0A, COM0A1);
  cbi(TCCR0A, COM0A0);
  cbi(TCCR0A, COM0B1);
  cbi(TCCR0A, COM0B0);
}

/**************************************
delayMicroseconds: Delay executation for 
so many microseconds. (from Arduino lib)
**************************************/
void delayMicroseconds(uint32_t us) {
    // for the 8 MHz internal clock on the ATmega168

  // for a one- or two-microsecond delay, simply return.  the overhead of
  // the function calls takes more than two microseconds.  can't just
  // subtract two, since us is unsigned; we'd overflow.
  if (--us == 0)
    return;
  if (--us == 0)
    return;

  // the following loop takes half of a microsecond (4 cycles)
  // per iteration, so execute it twice for each microsecond of
  // delay requested.
  us <<= 1;
    
  // partially compensate for the time taken by the preceeding commands.
  // we can't subtract any more than this or we'd overflow w/ small delays.
  us--;

    // busy wait
  __asm__ __volatile__ (
    "1: sbiw %0,1" "\n\t" // 2 cycles
    "brne 1b" : "=w" (us) : "0" (us) // 2 cycles
  );
}

/**************************************
enablePWM: Turn Transmit PWM on/off.
**************************************/
void enablePWM(uint8_t enable) {
  enable ? sbi(TCCR0A, COM0B1) : cbi(TCCR0A, COM0B1);
}


/**************************************
enableIROut: Set up PWM frequency.
**************************************/
void enableIROut(uint8_t freq) {
  // Disable interrupts
  cli();

  // Reset all the timer registers
  resetTransmitTimerRegisters();

  // Set wave generation modes to pwm phase mode
  sbi(TCCR0A, WGM00);
  sbi(TCCR0B, WGM02);

  // Set clock divisor to none
  sbi(TCCR0B, CS00);

  // Figure out what the compare value should be
  uint8_t pwmval = SYSCLOCK / KHz / 2 / freq;
  OCR0A = pwmval; 
  OCR0B = pwmval / 3; 

  // Enable Interrupts
  sei();
}

/**************************************
transmitData: Transmit data via IR LED.
**************************************/
void transmitData(volatile uint8_t freq, volatile int time_array[], volatile uint8_t arr_length) {
  //takes in a frequency and an array of microseconds
  //microseconds array: [length_on, length_off, length_on...]
  //turns the IR LED on-freq and off-freq for us specified

  // Enable PWM Out
  enableIROut(freq);

  int current_time;

  // For each element
  for (int i = 0; i < arr_length; i++) {

    // Grab the duration
    current_time = time_array[i];

    if (current_time == 0) continue;

    // If it's negative
    if (current_time & 0x8000) {
      // Convert it to positive and make a space
      space(-(current_time));
    } else {
      // Turn on watchdog to prevent burning out LED
      enableWatchdog(1);
      // Enable PWM
      mark(current_time);
      // Turn off watchdog to prevent unneccessary reset
      enableWatchdog(0);
    }
  }

  // Turn the pwm back off
  enablePWM(0);
}

/**************************************
mark: Turn PWM high.
**************************************/
void mark(uint32_t us) {
  // Sends an IR mark for the specified number of microseconds.
  // The mark output is modulated at the PWM frequency.
  enablePWM(1);
  delayMicroseconds(us);
}

/**************************************
mark: Turn PWM low.
**************************************/
void space(uint32_t us) {
  // Sends an IR space for the specified number of microseconds.
  // A space is no output, so the PWM output is disabled.
  enablePWM(0);
  delayMicroseconds(us);
}

/**************************************
enableWatchdog: Turn the watchdog on or off
**************************************/
void enableWatchdog(uint8_t enable) {

  if (!enable) {
    cbi(MCUSR, WDRF); // Clear the WDT reset flag
    WDTCSR |= (_BV(WDCE) | _BV(WDE));   // Enable the WD Change Bit (these have to be set in the same operation)
    WDTCSR = 0x00;  
  } 
  else {
      // Set up Watch Dog Timer for Inactivity
      WDTCSR = 0x00; // Timer bits set to 0 -> fires every ~16ms
      WDTCSR |= (_BV(WDCE) | _BV(WDE));   // Enable the WD Change Bit
  }
}

/**************************************
TIM1_COMPA_vect: IR Receive Timer.
**************************************/
ISR(TIM1_COMPA_vect)
{
  // Our photodetector has an active low
  uint8_t irdata = !readIR_RX();

  // One more 50us tick
  receiver.timer++; 

  // If our receive length just hit the limit of our buffer
  if (receiver.state != STATE_RX_STOP && receiver.rxlen >= MAX_BUF_LEN) {
    // We have a buffer overflow
    receiver.state = STATE_RX_STOP;
    // Notify MCU with IRQ
    setIRQ(1);
  }
  // Switch based on the state machine
  switch(receiver.state) {

  // If we're in the middle of a gap...
  case STATE_IDLE: 
    // And we get a mark
    if (irdata == MARK) {
      // Check if the gap was big enough
      if (receiver.timer < GAP_TICKS) {
        // Not big enough to be a gap.
        receiver.timer = 0;
      } 
      // If it is, this is a new packet
      else {
        // gap just ended, record duration and start recording transmission
        receiver.rxlen = 0;
        // reseet the timer
        receiver.timer = 0;
        // We're now on a mark
        receiver.state = STATE_RX_MARK;
      }
    }
    break;

  // If we're on a mark
  case STATE_RX_MARK: 
    // And the mark just ended
    if (irdata == SPACE) {
      // Record the number of ticks
      receiver.rxbuf[receiver.rxlen++] = receiver.timer * USECPERTICK;
      // Reset the timer
      receiver.timer = 0;
      // We're on a space now
      receiver.state = STATE_RX_SPACE;
    }
    break;

  // If we're on a space
  case STATE_RX_SPACE: 
    // and we get a mark
    if (irdata == MARK) { 
      // Save the time because we're on a mark now!
      receiver.rxbuf[receiver.rxlen++] = -(receiver.timer * USECPERTICK);
      // Reset the timer
      receiver.timer = 0;
      // We're on a mark
      receiver.state = STATE_RX_MARK;
    } 
    // If we get a space
    else { 
      // If the space was long enough to be a gap between commands
      if (receiver.timer > GAP_TICKS) {
        // Mark current code as ready for processing
        // Switch to STOP
        // Don't reset timer; keep counting space width
        receiver.state = STATE_RX_STOP;

        // Notify MCU with IRQ
        setIRQ(1);
      } 
    }
    break;
  // If we have data ready
  case STATE_RX_STOP: 
    // And we get a mark
    if (irdata == MARK) { 
      // reset gap timer
      receiver.timer = 0;
    }
    break;
  }
}

/**************************************
WDT_vect: Watchdog Timer Interrupt. If it
gets fired, it means a pwm has been on
for more than 17 ms
**************************************/
ISR(WDT_vect)
{
  // Turn of PWM
  enablePWM(0);
}

/**************************************
INT0_vect: SPI Receive Interrupt
**************************************/
ISR(INT0_vect, ISR_NOBLOCK) {  //nested interrupts, aka stacks on stacks of interrupts.
  // Disable Receive for now.
  enableReceive(0);

  // Start up SPI slave
  spiX_initslave(0);

  // If we were in the middle of reading a transmission
  if (receiver.state == STATE_RX_MARK || receiver.state == STATE_RX_SPACE) {

    // Reset the state
    resetReceiver();
  }

  //re-enable USI
  USICR|=(1<<USIOIE)|(1<<USIWM0); 

  // First response is the alive code
  spiX_put(ALIVE_CODE); 
  spiX_wait();

  // Grab the command
  char command = spiX_get();

  // Echo it back
  spiX_put(command);
  spiX_wait();

  int temp;

  // Switch by the command given
  switch(command){

  // If they want an ACK
  case ACK_CMD:
    // Send them an ACK
    spiX_put(ACK_CODE); 
    spiX_wait();
    break;

  // If they want firmware version
  case FIRMWARE_CMD:
    // Send the firmware version
    spiX_put(read_firmware_version()); 
    spiX_wait();
    break;
  // If they want firmware version
  case MODULE_ID_CMD:
    // Send the firmware version
    spiX_put(read_module_id()); 
    spiX_wait();
    break;

  // Transmit data command
  case TX_DATA_CMD:

    // Grab the frequency 
    transmitter.frequency = spiX_get();

    // Echo it
    spiX_put(transmitter.frequency);
    spiX_wait();

    // Grab the length
    transmitter.txlen = spiX_get();

    // Make sure it's not longer than our max
    transmitter.txlen = transmitter.txlen > MAX_BUF_LEN ? MAX_BUF_LEN : transmitter.txlen;

    // Echo the length
    spiX_put(transmitter.txlen);
    spiX_wait();

    // Each receive is a half an integer (8 bytes)
    for (int i = 0; i < transmitter.txlen; i++) {

      // Save the first 8 bits
      temp = (spiX_get() << 8);
      
      // Echo
      spiX_put(temp >> 8);
      spiX_wait();

      // Save next 8 bytes
      temp |= spiX_get();

      // Echo
      spiX_put(temp & 0xFF);
      spiX_wait();

      // Save to buffer
      transmitter.txbuf[i] = temp;
    }

    // Put the finish code
    spiX_put(FIN_CODE);
    spiX_wait();

    // Change the state so that we're ready
    // to transmit when we break out of interrupt
    transmitter.state = STATE_TX;
    break;

  case RX_DATA_AVAIL_CMD:
    
    // If there is data ready
    if (receiver.state == STATE_RX_STOP) {

      // Confirm that data is ready
      spiX_put(1);
      spiX_wait();

      // Send the length of the data
      spiX_put(receiver.rxlen);
      spiX_wait();

      // Turn off IRQ until next receive
      setIRQ(0);
    }
    else {
      spiX_put(-1);
      spiX_wait();
    }
    break;


  // Read a transmission
  case RX_DATA_CMD:

    // If there is data ready
    if (receiver.state == STATE_RX_STOP) {

      // Send the length of the data
      spiX_put(receiver.rxlen);
      spiX_wait();

      // For each integer
      for (int i = 0; i < receiver.rxlen; i++) {
        temp = receiver.rxbuf[i];
        
        // Send first 8 bits
        spiX_put(temp >> 8);
        spiX_wait();

        // Then second 8 bits
        spiX_put(temp & 0xFF);
        spiX_wait();
      }

      // Reset state machine
      resetReceiver();

      // Put finish code so we're in sync
      spiX_put(FIN_CODE);
      spiX_wait();

    } else {
      spiX_put(-1);
      spiX_wait();
    } 
    break;

  // If they want the LED on
  case START_RX_CMD:
    // Make sure IRQ isn't asserted yet
    setIRQ(0);
    resetReceiver();
    receiver.enabled = 1;
    // Comfirm the value we set
    spiX_put(1);
    spiX_wait();
    break;

  // If they want it off
  case STOP_RX_CMD:
    // Turn it off
    receiver.enabled = 0;
    // Make sure IRQ isn't asserted
    setIRQ(0);
    // Comfirm the value was set
    spiX_put(0);
    spiX_wait();
    break;

  case CRC_CMD:
    spiX_put((checksum >> 8) & 0xff);
    spiX_wait();
    spiX_put((checksum >> 0) & 0xff);
    spiX_wait();
    break;
  }

  //disable USI
  USICR&= ~(1<<USIOIE);  
  USICR&= ~(1<<USIWM0);

  // Re-enable receiving.
  enableReceive(receiver.enabled);

  // Set MOSI and MISO to be inputs so it doesn't 
  // interfere with SPI communications for other modules
  cbi(DDRA, MOSI);
  cbi(DDRA, MISO);

}

/**************************************
setIRQ: Set IRQ high or low.
**************************************/
void setIRQ(uint8_t val) {
  // If IRQ should be on, turn it on, else off
  val ? sbi(PORTB, IRQ) : cbi(PORTB, IRQ);
}

/**************************************
readIR_RX: Read current state of receive line.
**************************************/
uint8_t readIRQ(void) {
  // Read the correct register in PINA
  return PINB & (1 << IRQ);
}


/**************************************
readIR_RX: Read current state of receive line.
**************************************/
uint8_t readIR_RX(void) {
  // Read the correct register in PINA
  return PINA & (1 << IR_RX);
}

/**************************************
readIR_RX: Read current state of chip select
**************************************/
uint8_t readCS(void) {
  return PINB & (1 << CS);
}