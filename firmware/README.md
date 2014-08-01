You have to first set the fuse bit to run at 8MHz:
```
avrdude -p attiny84 -P /dev/cu.usbmodem1421 -c avrisp -b 19200 -U lfuse:w:0xe2:m -u
```

For pushing the code:
```
make all; avrdude -p attiny84 -P /dev/cu.usbmodem1421 -c avrisp -b 19200 -U flash:w:infrared-attx4.hex;
```