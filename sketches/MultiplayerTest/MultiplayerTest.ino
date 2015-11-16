#include <SPI.h>
#include <EEPROM.h>
#include <Arduboy.h>

Arduboy arduboy;

void setup() {
  Serial.begin(9600);

  arduboy.start();
  arduboy.setFrameRate(60);
  arduboy.display();
}

void loop() {
  // Check if there are bytes on the Serial port
  if (Serial.available() > 0) {
    // Print the received text on the screen
    arduboy.println(Serial.readStringUntil('\n'));
    arduboy.display();
  }

  // Send text to the other Arduboys
  Serial.println("test");

  delay(1000);
}
