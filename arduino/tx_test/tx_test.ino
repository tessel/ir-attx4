#include <SPI.h>

#define SS 9

void printInvalid(int expected, int actual, int index);

//uint8_t delays[] = {1,-2,3,-4,5,-6,7,-8,9,-10,11,-12,13,-14,15,-16,17,-18,19,-20,21,-22,23,-24,25,-26,27,-28,29,-30,31,-32,33,-34,35,-36,37,-38,39,-40,41,-42,43,-44,45,-46,47,-48,49,-50,51,-52,53,-54,55,-56,57,-58,59,-60,61,-62,63,-64,65,-66,67,-68,69,-70,71,-72,73,-74,75,-76,77,-78,79,-80,81,-82,83,-84,85,-86,87,-88,89,-90,91,-92,93,-94,95. -96};
// uint8_t delays[] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99};
int delays[] = {4011, -3875, 561, -1906, 561, -1906, 561, -1906, 561, -1906, 561, -921, 561, -921, 561, -1906, 561, -921, 561, -1906, 561, -921, 561, -1906, 561, -921, 561, -921, 561, -921, 561, -921, 561, -921, 561, -1906, 561, -921, 561, -1906, 561, -921, 561, -921, 561, -921, 561, -1000, 1000, -1000};
const char tx_length = 100;
int temp;

#define ACK_CMD 0
#define FIRMWARE_CMD 1
#define TX_CMD 2
#define RX_CMD 3
#define IR_TX_ON 4
#define IR_TX_OFF 5
#define TX_RD_CMD 7


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
  delayMicroseconds(00);
  Serial.print("CMD Echo: ");
  Serial.println(SPI.transfer(0x01));
  delayMicroseconds(100);
  Serial.print("Firmware Version: ");
  Serial.println(SPI.transfer(0x00));
  digitalWrite(SS,HIGH);
//  
//  delayMicroseconds(500);
//  
//  digitalWrite(SS, LOW);
//  delayMicroseconds(500);
//  Serial.println(SPI.transfer(IR_TX_ON));
//  delayMicroseconds(500);
//  Serial.println(SPI.transfer(0x00));
//  delayMicroseconds(500);
//  digitalWrite(SS, HIGH);
//  delayMicroseconds(500);
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

 // TX Sending
  Serial.println("SENDING...");
  digitalWrite(SS,LOW);
  delayMicroseconds(100);
  Serial.print("Alive: ");
  Serial.println(SPI.transfer(TX_CMD));
  delayMicroseconds(100);
  Serial.print("CMD ECHO: ");
  Serial.println(SPI.transfer(38));
  delayMicroseconds(100);
  Serial.print("Frequency ECHO: ");
  Serial.println(SPI.transfer(tx_length));
  delayMicroseconds(100);
  
  for (int i = 0; i < tx_length; i++) {
   if (i == 0) {
     Serial.print("Length Echo: ");
     Serial.println(SPI.transfer(delays[i] >> 8));
     delayMicroseconds(100);
   } else {
     temp |= SPI.transfer(delays[i] >> 8); 
     if (temp != delays[i-1]) {
       printInvalid(delays[i-1], temp, i-1);
     }
     delayMicroseconds(100);
   }
   
   temp = SPI.transfer(delays[i]) << 8;
   delayMicroseconds(500);
   
  }
  // Transfer that last bottom bit
  temp |= SPI.transfer(0x00);
  if (temp != delays[tx_length - 1]) {
     printInvalid(delays[tx_length - 1], temp, tx_length - 1);
  }
  
  // FIN
  Serial.print("FIN: ");
  Serial.println(SPI.transfer(0x16));
  delayMicroseconds(100);
  
  digitalWrite(SS,HIGH);
  Serial.println("");
  delay(2500);
  
 // TX Reading
 temp = 0;
 Serial.println("VERIFYING..."); 
 digitalWrite(SS,LOW);
 delayMicroseconds(100);
 Serial.print("Alive: ");
 Serial.println(SPI.transfer(TX_RD_CMD));
 delayMicroseconds(100);
 Serial.print("CMD Echo: ");
 Serial.println(SPI.transfer(0x00));
 delayMicroseconds(100);
 Serial.print("Length: ");
 Serial.println(SPI.transfer(0x00), DEC);
 delayMicroseconds(100);
 
 for (int i = 0; i < tx_length; i++) {
  temp = SPI.transfer(0x00) << 8;
  delayMicroseconds(100);
  temp |= SPI.transfer(0x00);
  delayMicroseconds(100);

  if (temp != delays[i]) {
    printInvalid(delays[i], temp, i);
  }

 }

 Serial.print("FIN: ");
 Serial.println(SPI.transfer(0x16), DEC);
 digitalWrite(SS,HIGH);  
  
  Serial.println("");
  Serial.println("");
  delay(2500);
}

void printInvalid(int expected, int actual, int index) {
    Serial.print(" Invalid Number at index ");
    Serial.print(index);
    Serial.print(": actual ");
    Serial.print(actual);
    Serial.print(" != expected ");
    Serial.println(expected);
}

