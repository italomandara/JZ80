# JZ80
## Another Javascript Zilog Z80 CPU emulator
this project started with a simple thought in mind: user experience, the aim is just make your emulator (gb, msx, ZX spectrum, etc. ) as playable as possible, the cpu will run at maximum emulated speed (Z80 clock not emulated, just storing in a special register the clock variables). The emulator is still in early development and is not fully functional, it has a basic debug console based on foundation.

##quick start
to test download the entire folder and run Z80.html

##how it works
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

