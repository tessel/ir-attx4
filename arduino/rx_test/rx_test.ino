#include <SPI.h>

#define SS 9
#define IRQ 8

#define ACK_CMD 0
#define FIRMWARE_CMD 1
#define TX_CMD 2
#define RX_CMD 3
#define IR_TX_ON 4
#define IR_TX_OFF 5
#define TX_RD_CMD 7


#define MAX_BUFFER_SIZE 100
int receive_buffer[MAX_BUFFER_SIZE] = {0};


void setup() {
  // put your setup code here, to run once:
  pinMode(SS,OUTPUT);
  SPI.setClockDivider(SPI_CLOCK_DIV128);
  SPI.setDataMode(SPI_MODE0);
  SPI.setBitOrder(MSBFIRST);
  SPI.begin();
  Serial.begin(115200);

}

void loop() {
  //Test ACK
  
  
  digitalWrite(SS,LOW);
  delayMicroseconds(100);
  Serial.print("Alive: ");
  Serial.println(SPI.transfer(ACK_CMD));
  delayMicroseconds(100);
  Serial.print("CMD Echo: ");
  Serial.println(SPI.transfer(0x00));
  delayMicroseconds(100);
  Serial.print("ACK BIT: ");
  Serial.println(SPI.transfer(0x00));
  digitalWrite(SS,HIGH);
  
  digitalWrite(SS,LOW);
  delayMicroseconds(100);
  Serial.print("ALIVE: ");
  Serial.println(SPI.transfer(FIRMWARE_CMD));
  delayMicroseconds(100);
  Serial.print("CMD Echo: ");
  Serial.println(SPI.transfer(0x01));
  delayMicroseconds(100);
  Serial.print("Firmware Version: ");
  Serial.println(SPI.transfer(0x00));
  digitalWrite(SS,HIGH);

  delayMicroseconds(500);

  if (digitalRead(IRQ)) {

    digitalWrite(SS, LOW);
    delayMicroseconds(100);

    // Receive ALIVE
    Serial.print("Alive: ");
    Serial.println(SPI.transfer(RX_CMD));
    delayMicroseconds(100);

    // Receive Command ECHO
    Serial.print("CMD ECHO: ");
    Serial.println(SPI.transfer(0x00));
    delayMicroseconds(100);
    // Receive whether anything has been received
    Serial.print("Read Anything: ");
    int read = SPI.transfer(0x00);
    Serial.println(read);
    delayMicroseconds(100);

    // Receive whether anything has been received
    if (read) {
      Serial.print("What's the length? ");
      int length = SPI.transfer(0x00);
      Serial.println(length);
      delayMicroseconds(100);

      for (int i = 0; i < length; i++) {
        receive_buffer[i] = SPI.transfer(0x00) << 8;
        delayMicroseconds(100);
        receive_buffer[i] |= SPI.transfer(0x00);
        delayMicroseconds(100);
        Serial.print("RX ");
        Serial.print(i);
        Serial.print(": ");
        Serial.println(receive_buffer[i]);
      }

      Serial.print("FIN: ");
      Serial.println(SPI.transfer(0x00));
    }

    // Receive the length
    digitalWrite(SS, HIGH);
    delayMicroseconds(100);

    Serial.println("");
  }

  
//  
//  delay(2000);
//  
//  digitalWrite(SS, LOW);
//  delayMicroseconds(500);
//  Serial.println(SPI.transfer(IR_TX_OFF));
//  delayMicroseconds(500);
//  Serial.println(SPI.transfer(0x00));
//  delayMicroseconds(500);
//  digitalWrite(SS, HIGH);
//  delayMicroseconds(500);
// 

 // TX Reading

  delay(1000);
}

