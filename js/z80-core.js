var Z80 = {
	utils: {
		dBy2W: function(arr) {
			return (arr[0] << 8) | arr[1];
		},
		split8: function(data) {
			return [data >> 8,data & 0xff];
		},
		setBit: function(pos, num, set) {
			return set ? (1 << pos) | num : ~(1 << pos) & num;
		},
		rdBit: function(pos, num) {
			var mask = 1 << pos;
			return (num & mask) != 0 ? 1 : 0;
		},
		flag_S: function(state) {
			Z80.reg.f = Z80.utils.setBit(7, Z80.reg.f, state);
		},
		flag_Z: function(state) {
			Z80.reg.f = Z80.utils.setBit(6, Z80.reg.f, state);
		},
		flag_H: function(state) {
			Z80.reg.f = Z80.utils.setBit(4, Z80.reg.f, state);
		},
		flag_V: function(state) {
			Z80.reg.f = Z80.utils.setBit(2, Z80.reg.f, state);
		},
		flag_N: function(state) {
			Z80.reg.f = Z80.utils.setBit(1, Z80.reg.f, state);
		},
		flag_C: function(state) {
			Z80.reg.f = Z80.utils.setBit(0, Z80.reg.f, state);
		},
	},
	core: {
		ldntor: function(reg_name, data) {
			Z80.reg[reg_name] = $.isArray(data) ? Z80.utils.dBy2W(data) : data;
			Z80.reg.pc += $.isArray(data) ? 3 : 2;
		},
		ldnntor: function(reg_name1, reg_name2, data) {
			Z80.reg[reg_name1] = data[0];
			Z80.reg[reg_name2] = data[1];
		},
		ld$nntorr: function(reg1, reg2) {
			var addr = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1));
			Z80.mmu.ww(addr, [Z80.reg[reg1], Z80.reg[reg2]]);
		},
		ldRegtoMemDir: function(reg) {
			var addr = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1));
			Z80.mmu.wb(addr, Z80.reg[reg]);
		},
		ld$mmtor: function(reg1, reg2) {
			var data = Z80.mmu.rw(Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1)));
			Z80.reg[reg1] = data[0];
			Z80.reg[reg2] = data[1];
		},
		ldnntorr: function(reg) {
			Z80.reg[reg] = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1));
		},
		ldnto$rr: function(reg_ptr1, reg_ptr2, source) {
			var addr = Z80.utils.dBy2W([Z80.reg[reg_ptr1], Z80.reg[reg_ptr2]]);
			Z80.mmu.wb(addr, source);
		},
		ldnto$nn: function() {
			var addr = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1)),
			source = Z80.mmu.rb(Z80.reg.pc + 3);
			Z80.mmu.wb(addr, source);
		},
		ld$rrtor: function(reg_target, reg_ptr1, reg_ptr2) {
			var addr = Z80.utils.dBy2W([Z80.reg[reg_ptr1], Z80.reg[reg_ptr2]]);
			Z80.reg[reg_target] = Z80.mmu.rb(addr);
		},
		incrr: function(reg1,reg2){
			Z80.reg[reg2]++;
			if (Z80.reg[reg2] > 0xff) {
				Z80.reg[reg1]++;
				Z80.reg[reg2] = 0;
			}
			if (Z80.reg[reg1] > 0xff) {
				Z80.reg[reg1] = 0;
			}
			Z80.reg.pc += 1;
			Z80.clock.m = 6;
		},
		incr: function(reg){
			Z80.clock.m = 4;
			if (Z80.reg[reg] === 0xFF) {
				Z80.utils.flag_C(true);
				Z80.reg[reg] = 0;
				return 0x04;
			}
			if (Z80.reg[reg] >= 0x0F) {
				Z80.utils.flag_H(true);
			}
			Z80.reg[reg]++;
			Z80.reg.pc += 1;
		},
		decr: function(reg){
			Z80.clock.m = 4;
			if (Z80.reg[reg] === 0xFF) {
				Z80.utils.flag_C(true);
				Z80.reg[reg] = 0;
				return 0x04;
			}
			if (Z80.reg[reg] >= 0x0F) {
				Z80.utils.flag_H(true);
			}
			Z80.reg[reg]++;
			Z80.reg.pc += 1;
		},
		inc: function(n,double){
			n++;
			if (arguments.length<2){
				Z80.clock.m = 11;
				if (n === 0x80) {
					Z80.utils.flag_C(true);
					n = 0;
					return 0x04;
				}
				if (n >= 0x0F) {
					Z80.utils.flag_H(true);
				}
				Z80.reg.pc += 1;
				return n
			} else {
				Z80.reg.pc += 1;
				Z80.clock.m = 6;
				return n;
			}			
		},
		swp: function(arr){
			for(var i=0; i < arr.length; i++){
				Z80.reg[arr[i]] = Z80.reg[arr[i]] ^ Z80.reg[[arr[i],'1'].join('')], Z80.reg[[arr[i],'1'].join('')] = Z80.reg[arr[i]] ^ Z80.reg[[arr[i],'1'].join('')], Z80.reg[arr[i]] = Z80.reg[arr[i]] ^ Z80.reg[[arr[i],'1'].join('')];
			}
		},
		and: function(data){
			Z80.reg.a = Z80.reg.a & data,
			Z80.utils.flag_V(!Z80.utils.rdBit(0,Z80.reg.a) && Z80.reg.a);
			Z80.utils.flag_Z(!Z80.reg.a);
		},
		or: function(data){
			Z80.reg.a = Z80.reg.a | data,
			Z80.utils.flag_V(!Z80.utils.rdBit(0,Z80.reg.a) && Z80.reg.a);
			Z80.utils.flag_Z(!Z80.reg.a);
		},
		xor: function(data){
			Z80.reg.a = Z80.reg.a ^ data,
			Z80.utils.flag_V(!Z80.utils.rdBit(0,Z80.reg.a) && Z80.reg.a);
			Z80.utils.flag_Z(!Z80.reg.a);
		},
	},
	op: {
		0x00: function() { // nop
			$(document).trigger('op', {
				name: '',
				type: 'ready'
			});		
			Z80.clock.m = 4;
			return false;
		},
		0x01: function() { // LD BC **
			Z80.core.ldnntor('b', 'c', Z80.mmu.rw(Z80.reg.pc + 1));
			Z80.reg.pc += 3;
			Z80.clock.m = 10;
			return 0x01;
		},
		0x02: function() { // LD (BC), A
			Z80.core.ldnto$rr('b', 'c', Z80.reg.a)
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x02;
		},
		0x03: function() { // INC BC
			Z80.core.incrr('b','c');
			return 0x03;
		},
		0x04: function() { // INC B
			Z80.core.incr('b');
			return 0x04;
		},
		// 0x05: function(){//nop
		// 	Z80.reg.pc += 3;
		//Z80.clock.m = 4; 	
		//return 0x05;
		// },
		0x06: function() { // LD B *
			Z80.core.ldntor('b', Z80.mmu.rb(Z80.reg.pc + 1));
			Z80.reg.pc += 2;
			Z80.clock.m = 7;
			return 0x06;
		},
		// 0x07: function(){//nop
		// 	Z80.reg.pc += 3;
		//Z80.clock.m = 4;	
		//return 0x07;
		// },
		0x08: function(){//ex af, af'
			Z80.core.swp(['a','f']);
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x08;
		},
		// 0x09: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x09;
		// },
		0x0a: function() { // LD A, (BC)
			Z80.core.ld$rrtor('a', 'b', 'c');
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x0a;
		},
		// 0x0b: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x0b;
		// },
		0x0c: function(){ // INC c
			Z80.core.incr('c');	
			return 0x0c;
		},
		// 0x0d: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x0d;
		// },
		0x0e: function() { // LD C *
			Z80.core.ldntor('c', Z80.mmu.rb(Z80.reg.pc + 1));
			Z80.reg.pc += 2;
			Z80.clock.m = 7;
			return 0x0e;
		},
		// 0x0f: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x0f;
		// },
		// 0x10: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x10;
		// },
		0x11: function() { // LD DE **
			Z80.core.ldnntor('d', 'e', Z80.mmu.rw(Z80.reg.pc + 1));
			Z80.reg.pc += 3;
			Z80.clock.m = 10;
			return 0x11;
		},
		0x12: function() { //LD (DE), A
			Z80.core.ldnto$rr('d', 'e', Z80.reg.a)
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x12;
		},
		0x13: function() { // INC de
			Z80.core.incrr('d','e');
			return 0x13;
		},
		0x14: function(){ // INC d
			Z80.core.incr('d');	
			return 0x14;
		},
		// 0x15: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x15;
		// },
		0x16: function() { //LD d, *
			Z80.core.ldntor('d', Z80.mmu.rb(Z80.reg.pc + 1));
			Z80.reg.pc += 2;
			Z80.clock.m = 7;
			return 0x16;
		},
		// 0x17: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x17;
		// },
		// 0x18: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x18;
		// },
		// 0x19: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x19;
		// },
		0x1a: function() { //LD A, (DE)
			Z80.core.ld$rrtor('a', 'd', 'e');
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x1a;
		},
		// 0x1b: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x1b;
		// },
		0x1c: function(){ // INC e
			Z80.core.incr('e');
			return 0x1c;
		},
		// 0x1d: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x1d;
		// },
		0x1e: function() { //LD e,*
			Z80.core.ldntor('e', Z80.mmu.rb(Z80.reg.pc + 1));
			Z80.reg.pc += 2;
			Z80.clock.m = 7;
			return 0x1e;
		},
		// 0x1f: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x1f;
		// },
		// 0x20: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x20;
		// },
		0x21: function() { // LD HL **
			Z80.core.ldnntor('h', 'l', Z80.mmu.rw(Z80.reg.pc + 1));
			Z80.reg.pc += 3;
			Z80.clock.m = 10;
			return 0x21;
		},
		0x22: function() { // LD (**) HL
			Z80.core.ld$nntorr('h', 'l');
			Z80.reg.pc += 3;
			Z80.clock.m = 16;
			return 0x22;
		},
		0x23: function(){ // INC de
			Z80.core.incrr('d','e'); 	
			return 0x23;
		},
		0x24: function(){ // INC h
			Z80.core.incr('h');	
			return 0x24;
		},
		// 0x25: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x25;
		// },
		0x26: function() { // LD H *
			Z80.core.ldntor('h', Z80.mmu.rb(Z80.reg.pc + 1));
			Z80.reg.pc += 2;
			Z80.clock.m = 7;
			return 0x26;
		},
		// 0x27: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x27;
		// },
		// 0x28: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x28;
		// },
		// 0x29: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x29;
		// },
		0x2a: function() { // ld hl (**)
			Z80.core.ld$mmtor('h', 'l');
			Z80.reg.pc += 3;
			Z80.clock.m = 16;
			return 0x2a;
		},
		// 0x2b: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x2b;
		// },
		0x2c: function(){ // INC l
			Z80.core.incr('l');	
			return 0x2c;
		},
		// 0x2d: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x2d;
		// },
		0x2e: function() { // LD L *
			Z80.core.ldntor('l', Z80.mmu.rb(Z80.reg.pc + 1));
			Z80.reg.pc += 2;
			Z80.clock.m = 7;
			return 0x2e;
		},
		// 0x2f: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x2f;
		// },
		// 0x30: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x30;
		// },
		0x31: function() { // LD HL **
			Z80.core.ldntor('sp', Z80.mmu.rw(Z80.reg.pc + 1));
			Z80.reg.pc += 3;
			Z80.clock.m = 10;
			return 0x31;
		},
		0x32: function() { //LD (**),a
			Z80.core.ldnto$nn(Z80.mmu.rb(Z80.reg.pc + 1), Z80.reg.a);
			Z80.reg.pc += 3;
			Z80.clock.m = 13;
			return 0x32;
		},
		0x33: function(){//inc sp
			Z80.reg.sp = Z80.core.inc(Z80.reg.sp,16);
			return 0x33;
		},
		0x34: function(){//inc (hl)
			Z80.mem[dBy2W([Z80.reg.h,Z80.reg.l])] = Z80.core.inc(Z80.mem[dBy2W([Z80.reg.h,Z80.reg.l])]);
			return 0x34;
		},
		// 0x35: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x35;
		// },
		0x36: function() { //LD (HL), *
			Z80.core.ldnto$rr('d', 'e', Z80.mmu.rb(Z80.reg.pc + 1));
			Z80.reg.pc += 2;
			Z80.clock.m = 10;
			return 0x36;
		},
		// 0x37: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x37;
		// },
		// 0x38: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x38;
		// },
		// 0x39: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x39;
		// },
		0x3a: function() { // ld a,(**)
			Z80.core.ldntor('a', Z80.mem[Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1))]);
			Z80.reg.pc += 3;
			Z80.clock.m = 13;
			return 0x3a;
		},
		// 0x3b: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x3b;
		// },
		0x3c: function(){// INC a
			incr('a'); 	
			return 0x3c;
		},
		// 0x3d: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x3d;
		// },
		0x3e: function() { // LD A *
			Z80.core.ldntor('a', Z80.mmu.rb(Z80.reg.pc + 1));
			Z80.reg.pc += 2;
			Z80.clock.m = 7;
			return 0x3e;
		},
		// 0x3f: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x3f;
		// },
		0x40: function(){// ld b,b
			Z80.core.ldntor('b', Z80.reg.b);
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x40;
		},
		0x41: function(){// ld b,c
			Z80.core.ldntor('b', Z80.reg.c);			
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x41;
		},
		0x42: function(){// ld b,d
			Z80.core.ldntor('b', Z80.reg.d);			
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x42;
		},
		0x43: function(){// ld b,e
			Z80.core.ldntor('b', Z80.reg.e);			
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x43;
		},
		0x44: function(){// ld b,h
			Z80.core.ldntor('b', Z80.reg.h);			
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x44;
		},
		0x45: function(){// ld b,l
			Z80.core.ldntor('b', Z80.reg.l);			
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x45;
		},
		0x46: function(){// ld b,(hl)
			Z80.core.ld$rrtor('h', 'l', 'b');
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x46;
		},
		0x47: function(){// ld b,a
			Z80.core.ldntor('b', Z80.reg.a);	
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x47;
		},
		0x48: function(){// ld c,b
			Z80.core.ldntor('c', Z80.reg.b);	
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x48;
		},
		0x49: function(){// ld c,c
			Z80.core.ldntor('c', Z80.reg.c);	
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x49;
		},
		0x4a: function(){// ld c,d
			Z80.core.ldntor('c', Z80.reg.d);	
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x4a;
		},
		0x4b: function(){// ld c,e
			Z80.core.ldntor('c', Z80.reg.e);	
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x4b;
		},
		0x4c: function(){// ld c,h
			Z80.core.ldntor('c', Z80.reg.h);	
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x4c;
		},
		0x4d: function(){// ld c,l
			Z80.core.ldntor('c', Z80.reg.l);	
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x4d;
		},
		0x4e: function(){// ld c,(hl)
			Z80.core.ld$rrtor('h', 'l', 'c');
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x4e;
		},
		0x4f: function(){// ld c,a
			Z80.core.ldntor('c', Z80.reg.c);
			
			ret0x4fname;
		},
		0x50: function(){// ld d,b
			Z80.core.ldntor('d', Z80.reg.b);			
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x50;
		},
		0x51: function(){// ld d,c
			Z80.core.ldntor('d', Z80.reg.c);			
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x51;
		},
		0x52: function(){// ld d,d
			Z80.core.ldntor('d', Z80.reg.d);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x52;
		},
		0x53: function(){// ld d,e
			Z80.core.ldntor('d', Z80.reg.e);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x53;
		},
		0x54: function(){// ld d,h
			Z80.core.ldntor('d', Z80.reg.h);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x54;
		},
		0x55: function(){// ld d,l
			Z80.core.ldntor('d', Z80.reg.l);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x55;
		},
		0x56: function(){// ld d,(hl)
			Z80.core.ld$rrtor('h', 'l', 'd');
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x56;
		},
		0x57: function(){// ld d,a
			Z80.core.ldntor('d', Z80.reg.a);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x57;
		},
		0x58: function(){// ld e,b
			Z80.core.ldntor('e', Z80.reg.b);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x58;
		},
		0x59: function(){// ld e,c
			Z80.core.ldntor('e', Z80.reg.c);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x59;
		},
		0x5a: function(){// ld e,d
			Z80.core.ldntor('e', Z80.reg.d);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x5a;
		},
		0x5b: function(){// ld e,e
			Z80.core.ldntor('e', Z80.reg.e);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x5b;
		},
		0x5c: function(){// ld e,h
			Z80.core.ldntor('e', Z80.reg.h);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x5c;
		},
		0x5d: function(){// ld e,l
			Z80.core.ldntor('e', Z80.reg.l);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x5d;
		},
		0x5e: function(){// ld e,(hl)
			Z80.core.ld$rrtor('h', 'l', 'e');
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x5e;
		},
		0x5f: function(){// ld e,a
			Z80.core.ldntor('e', Z80.reg.a);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x5f;
		},
		0x60: function(){// ld h,b
			Z80.core.ldntor('h', Z80.reg.b);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x60;
		},
		0x61: function(){// ld h,c
			Z80.core.ldntor('h', Z80.reg.c);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x61;
		},
		0x62: function(){// ld h,d
			Z80.core.ldntor('h', Z80.reg.d);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x62;
		},
		0x63: function(){// ld h,e
			Z80.core.ldntor('h', Z80.reg.e);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x63;
		},
		0x64: function(){// ld h,h
			Z80.core.ldntor('h', Z80.reg.h);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x64;
		},
		0x65: function(){// ld h,l
			Z80.core.ldntor('h', Z80.reg.l);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x65;
		},
		0x66: function(){// ld h,(hl)
			Z80.core.ld$rrtor('h', 'l', 'h');
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x66;
		},
		0x67: function(){//ld h,a
			Z80.core.ldntor('h', Z80.reg.a);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x67;
		},
		0x68: function(){// ld l,b
			Z80.core.ldntor('l', Z80.reg.b);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x68;
		},
		0x69: function(){// ld l,c
			Z80.core.ldntor('l', Z80.reg.c);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x69;
		},
		0x6a: function(){// ld l,d
			Z80.core.ldntor('l', Z80.reg.d);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x6a;
		},
		0x6b: function(){// ld l,e
			Z80.core.ldntor('l', Z80.reg.e);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x6b;
		},
		0x6c: function(){// ld l,h
			Z80.core.ldntor('l', Z80.reg.h);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x6c;
		},
		0x6d: function(){// ld l,l
			Z80.core.ldntor('l', Z80.reg.l);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x6d;
		},
		0x6e: function(){// ld l,(hl)
			Z80.core.ld$rrtor('h', 'l', 'l');
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x6e;
		},
		0x6f: function(){//ld l,a
			Z80.core.ldntor('l', Z80.reg.a);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x6f;
		},
		// 0x70: function(){//nop
		// 	
		//Z80.reg.pc += 1; 	
		//	Z80.clock.m = 4;
		//	return 0x70;
		// },
		// 0x71: function(){//nop
		// 	
		//Z80.reg.pc += 1; 	
		//	Z80.clock.m = 4;
		//	return 0x71;
		// },
		// 0x72: function(){//nop
		// 	
		//Z80.reg.pc += 1; 	
		//	Z80.clock.m = 4;
		//	return 0x72;
		// },
		// 0x73: function(){//nop
		// 	
		//Z80.reg.pc += 1; 	
		//	Z80.clock.m = 4;
		//	return 0x73;
		// },
		// 0x74: function(){//nop
		// 	
		//Z80.reg.pc += 1; 	
		//	Z80.clock.m = 4;
		//	return 0x74;
		// },
		// 0x75: function(){//nop
		// 	
		//Z80.reg.pc += 1; 	
		//	Z80.clock.m = 4;
		//	return 0x75;
		// },
		0x76: function(){// halt
			Z80.halt = true;
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x76;
		},
		// 0x77: function(){//nop
		// 	
		//Z80.reg.pc += 1;	
		//	Z80.clock.m = 4;
		//	return 0x77;
		// },
		0x78: function(){// ld a,b
			Z80.core.ldntor('a', Z80.reg.b);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x78;
		},
		0x79: function(){// ld a,c
			Z80.core.ldntor('a', Z80.reg.c);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x79;
		},
		0x7a: function(){// ld a,d
			Z80.core.ldntor('a', Z80.reg.d);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x7a;
		},
		0x7b: function(){// ld a,e
			Z80.core.ldntor('a', Z80.reg.e);			
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x7b;
		},
		0x7c: function(){// ld a,h
			Z80.core.ldntor('a', Z80.reg.h);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x7c;
		},
		0x7d: function(){// ld a,l
			Z80.core.ldntor('a', Z80.reg.l);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x7d;
		},
		0x7e: function(){// ld a,(hl)
			Z80.core.ld$rrtor('h', 'l', 'a');
			Z80.reg.pc += 1;
			Z80.clock.m = 7;
			return 0x6e;
		},
		0x7f: function(){// ld a,a
			Z80.core.ldntor('a', Z80.reg.a);				
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0x7f;
		},
		// 0x80: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x80;
		// },
		// 0x81: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x81;
		// },
		// 0x82: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x82;
		// },
		// 0x83: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x83;
		// },
		// 0x84: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x84;
		// },
		// 0x85: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x85;
		// },
		// 0x86: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x86;
		// },
		// 0x87: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x87;
		// },
		// 0x88: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x88;
		// },
		// 0x89: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x89;
		// },
		// 0x8a: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x8a;
		// },
		// 0x8b: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x8b;
		// },
		// 0x8c: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x8c;
		// },
		// 0x8d: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x8d;
		// },
		// 0x8e: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x8e;
		// },
		// 0x8f: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x8f;
		// },
		// 0x90: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x90;
		// },
		// 0x91: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x91;
		// },
		// 0x92: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x92;
		// },
		// 0x93: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x93;
		// },
		// 0x94: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x94;
		// },
		// 0x95: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x95;
		// },
		// 0x96: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x96;
		// },
		// 0x97: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x97;
		// },
		// 0x98: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x98;
		// },
		// 0x99: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x99;
		// },
		// 0x9a: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x9a;
		// },
		// 0x9b: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x9b;
		// },
		// 0x9c: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x9c;
		// },
		// 0x9d: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x9d;
		// },
		// 0x9e: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x9e;
		// },
		// 0x9f: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0x9f;
		// },
		0xa0: function(){// and b
			Z80.core.and(Z80.reg.b);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xa0;
		},
		0xa1: function(){// and c
			Z80.core.and(Z80.reg.c);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xa1;
		},
		0xa2: function(){// and d
			Z80.core.and(Z80.reg.d);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xa2;
		},
		0xa3: function(){//and e
			Z80.core.and(Z80.reg.e);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xa3;
		},
		0xa4: function(){//and h
			Z80.core.and(Z80.reg.h);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xa4;
		},
		0xa5: function(){// and l
			Z80.core.and(Z80.reg.l);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xa5;
		},
		0xa6: function(){// and (hl)
			Z80.core.and(Z80.mmu.rb(Z80.utils.dBy2W([Z80.reg.h,Z80.reg.l])));
			Z80.reg.pc += 1;
			Z80.clock.m = 7; 	
			return 0xa6;
		},
		0xa7: function(){// and a
			Z80.core.and(Z80.reg.a);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xa7;
		},
		0xa8: function(){// xor b
			Z80.core.xor(Z80.reg.b);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xa8;
		},
		0xa9: function(){// xor c
			Z80.core.xor(Z80.reg.c);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xa9;
		},
		0xaa: function(){// xor d
			Z80.core.xor(Z80.reg.d);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xaa;
		},
		0xab: function(){// xor e
			Z80.core.xor(Z80.reg.e);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xab;
		},
		0xac: function(){// xor h
			Z80.core.xor(Z80.reg.h);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xac;
		},
		0xad: function(){// xor l
			Z80.core.xor(Z80.reg.l);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xad;
		},
		0xae: function(){// and (hl)
			Z80.core.xor(Z80.mmu.rb(Z80.utils.dBy2W([Z80.reg.h,Z80.reg.l])));
			Z80.reg.pc += 1;
			Z80.clock.m = 7; 	
			return 0xae;
		},
		0xaf: function(){// xor a
			Z80.core.xor(Z80.reg.a);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xaf;
		},
		0xb0: function(){//or b
			Z80.core.or(Z80.reg.b);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 		
			return 0xb1;
		},
		0xb1: function(){//or c
			Z80.core.or(Z80.reg.c);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xb2;
		},
		0xb2: function(){//or d
			Z80.core.or(Z80.reg.d);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xb3;
		},
		0xb3: function(){//or e
			Z80.core.or(Z80.reg.e);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xb4;
		},
		0xb4: function(){//or h
			Z80.core.or(Z80.reg.h);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xb5;
		},
		0xb5: function(){//or l
			Z80.core.or(Z80.reg.l);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xb5;
		},
		0xb6: function(){//or (hl)
			Z80.core.or(Z80.mmu.rb(Z80.utils.dBy2W([Z80.reg.h,Z80.reg.l])));
			Z80.reg.pc += 1;
			Z80.clock.m = 7; 
		},
		0xb7: function(){//or 
			Z80.core.or(Z80.reg.b);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xb7;
		},
		// 0xb8: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xb8;
		// },
		// 0xb9: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xb9;
		// },
		// 0xba: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xba;
		// },
		// 0xbb: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xbb;
		// },
		// 0xbc: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xbc;
		// },
		// 0xbd: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xbd;
		// },
		// 0xbe: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xbe;
		// },
		// 0xbf: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xbf;
		// },
		// 0xc0: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xc0;
		// },
		// 0xc1: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xc1;
		// },
		// 0xc2: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xc2;
		// },
		// 0xc3: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xc3;
		// },
		// 0xc4: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xc4;
		// },
		// 0xc5: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xc5;
		// },
		// 0xc6: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xc6;
		// },
		// 0xc7: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xc7;
		// },
		// 0xc8: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xc8;
		// },
		// 0xc9: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xc9;
		// },
		// 0xca: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xca;
		// },
		// 0xcb: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xcb;
		// },
		// 0xcc: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xcc;
		// },
		// 0xcd: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xcd;
		// },
		// 0xce: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xce;
		// },
		// 0xcf: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xcf;
		// },
		// 0xd0: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xd0;
		// },
		// 0xd1: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xd1;
		// },
		// 0xd2: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xd2;
		// },
		// 0xd3: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xd3;
		// },
		// 0xd4: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xd4;
		// },
		// 0xd5: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xd5;
		// },
		// 0xd6: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xd6;
		// },
		// 0xd7: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xd7;
		// },
		// 0xd8: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xd8;
		// },
		0xd9: function(){// exx
			Z80.core.swp(['b','c','d','e','h','l']);
			Z80.reg.pc += 1;
			Z80.clock.m = 4; 	
			return 0xd9;
		},
		// 0xda: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xda;
		// },
		// 0xdb: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xdb;
		// },
		// 0xdc: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xdc;
		// },
		// 0xdd: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xdd;
		// },
		// 0xde: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xde;
		// },
		// 0xdf: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xdf;
		// },
		// 0xe0: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xe0;
		// },
		// 0xe1: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xe1;
		// },
		// 0xe2: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xe2;
		// },
		// 0xe3: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xe3;
		// },
		// 0xe4: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xe4;
		// },
		// 0xe5: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xe5;
		// },
		// 0xe6: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xe6;
		// },
		// 0xe7: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xe7;
		// },
		// 0xe8: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xe8;
		// },
		// 0xe9: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xe9;
		// },
		// 0xea: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xea;
		// },
		// 0xeb: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xeb;
		// },
		// 0xec: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xec;
		// },
		// 0xed: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xed;
		// },
		// 0xee: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xee;
		// },
		// 0xef: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xef;
		// },
		// 0xf0: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xf0;
		// },
		// 0xf1: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xf1;
		// },
		// 0xf2: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xf2;
		// },
		// 0xf3: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xf3;
		// },
		// 0xf4: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xf4;
		// },
		// 0xf5: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xf5;
		// },
		// 0xf6: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xf6;
		// },
		// 0xf7: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xf7;
		// },
		// 0xf8: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xf8;
		// },
		0xf9: function(){// ld sp,hl
			Z80.core.ldntor('sp',Z80.utils.dBy2W([Z80.reg.h,Z80.reg.h]));
			Z80.reg.pc += 1;
			Z80.clock.m = 4;
			return 0xf9;
		},
		// 0xfa: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xfa;
		// },
		// 0xfb: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xfb;
		// },
		// 0xfc: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xfc;
		// },
		// 0xfd: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xfd;
		// },
		// 0xfe: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xfe;
		// },
		// 0xff: function(){//nop
		// 	Z80.reg.pc += 3;
		//	Z80.clock.m = 4; 	
		//	return 0xff;
		// },
	},
	reg: {
		a: 0,
		f: 0,
		b: 0,
		c: 0,
		d: 0,
		e: 0,
		h: 0,
		l: 0,
		a1: 0,
		f1: 0,
		b1: 0,
		c1: 0,
		d1: 0,
		e1: 0,
		h1: 0,
		l1: 0,

		i: 0,
		r: 0,
		m: 0,
		t: 0,
		ix: 0, //16bit
		iy: 0, //16bit
		sp: 0, //16bit
		pc: 0 //16bit
	},
	clock: {
		m: 0,
		t: 0,
	},
	mem: new Uint8ClampedArray(65535),
	mmu: {
		rb: function(addr) { //8bit read
			return Z80.mem[addr];
		},
		rw: function(addr) { //16bit read
			return [Z80.mem[addr + 1], Z80.mem[addr]]; // little endian?
		},
		wb: function(addr, data) { //8bit write
			Z80.mem[addr] = data;
			return true;
		},
		ww: function(addr, data) { //16bit write
			Z80.mem[addr + 1] = data[0]; // little endian?
			Z80.mem[addr] = data[1]; // little endian?
			return true;
		},
	},

	halt: false,

	fetch: function() {
		this.reg.r ++ && 0xff;
		if(typeof this.op[this.mmu.rb(this.reg.pc)] ===  typeof undefined){
			$(document).trigger('op', {
				name: 'illegal or unsupported instruction',
				type: 'error'
			});
			return false;
		}
		if(this.op[this.mmu.rb(this.reg.pc)]() && !this.halt){
			this.clock.t += this.clock.m; 
			this.fetch();
		}
	},
	start: function() {
		this.fetch();
	},
	clk: function(){},
	reset: function() {
		for (key in this.reg) {
			this.reg[key] = 0;
		}
		Z80.mem = new Uint8ClampedArray(65535);
		if (debug) {
			$(document).trigger('op', {
				name: '',
				type: 'ready'
			});
		}
	},
};