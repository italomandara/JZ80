# JZ80
## Another Javascript Zilog Z80 CPU emulator
this project started with a simple thought in mind: user experience, the aim is just make your emulator (gb, msx, ZX spectrum, etc. ) as playable as possible, the cpu will run at maximum emulated speed (Z80 clock not emulated, just storing in a special register the clock variables). The emulator is still in early development and is not fully functional, it has a basic debug console based on foundation.

##License
###The MIT License (MIT)

Copyright (c) 2015 by Italo Mandara

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

##Quick start
to test download the entire folder and run Z80.html

##How it works
here is the structure of the "class" _Z80:
```
_Z80
   |---utils (some binary function to simplify my life)
   |---core (reusable cpu routines used mostly by the dispatcher)
   |---op (primary dispatcher)
   |---cbop (secondary dispatcher)
   |---edop (secondary dispatcher)
   |---ddop (secondary dispatcher)
   |---fdop (secondary dispatcher)
   |---fdcbop (secondary dispatcher)
   |---mmu (memory management functions)
   |---reg (Z80 registers)
   |    |---a
   |    |---f
   |    |---b
   |    |---c
   |    |---d
   |    |---e
   |    |---h
   |    |---l
   |    |---a1
   |    |---f1
   |    |---b1
   |    |---c1
   |    |---d1
   |    |---e1
   |    |---h1
   |    |---l1
   |    |---i
   |    |---r
   |    |---m (unused)
   |    |---t (unused)
   |    |---ix  //16bit
   |    |---iy  //16bit
   |    |---sp  //16bit
   |    |---pc  //16bit
   |
   |---clock (stores clock cycles usage)
   |    |---m
   |    |---t
   |
   |---mem (random access memory array)
   |---halt (flag to pause the processor)
   |---fetch ( function used to fetch the instructions from memory)
   |---start ( function )
   |---clk (unused function)
    ---reset (function)
```
you can use the class as a boilerplate for a custom processor

```
var GB_cpu = new _Z80;
```

