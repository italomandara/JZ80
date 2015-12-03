var Utils = function(that) {
	var S = that;
	this.dBy2W = function(arr) {
		return (arr[0] << 8) | arr[1];
	};
	this.Split8 = function(data) {
		return [data >> 8, data & 0xff];
	};
	this.SetBit = function(pos, num, set) {
		return set ? (1 << pos) | num : ~(1 << pos) & num;
	};
	this.rdBit = function(pos, num) {
		var mask = 1 << pos;
		return (num & mask) != 0 ? 1 : 0;
	};
	this.flag_S = function(state) {
		S.reg.f = S.utils.setBit(7, S.reg.f, state);
		return state;
	};
	this.flag_Z = function(state) {
		S.reg.f = S.utils.setBit(6, S.reg.f, state);
		return state;
	};
	this.flag_F5 = function(state) {
		S.reg.f = S.utils.setBit(5, S.reg.f, state);
		return state;
	};
	this.flag_H = function(state) {
		S.reg.f = S.utils.setBit(4, S.reg.f, state);
		return state;
	};
	this.flag_F3 = function(state) {
		S.reg.f = S.utils.setBit(3, S.reg.f, state);
		return state;
	};
	this.flag_V = function(state) {
		S.reg.f = S.utils.setBit(2, S.reg.f, state);
		return state;
	};
	this.flag_N = function(state) {
		S.reg.f = S.utils.setBit(1, S.reg.f, state);
		return state;
	};
	this.flag_C = function(state) {
		S.reg.f = S.utils.setBit(0, S.reg.f, state);
		return state;
	};
};
var Core = function(that) {
	var S = that;
	this.ldntor = function(reg_name, data) {
		S.reg[reg_name] = $.isArray(data) ? S.utils.dBy2W(data) : data;
		S.reg.pc += $.isArray(data) ? 3 : 2;
	};
	this.ldnntor = function(reg_name1, reg_name2, data) {
		S.reg[reg_name1] = data[0];
		S.reg[reg_name2] = data[1];
	};
	this.ld$nntorr = function(reg1, reg2) {
		var addr = S.utils.dBy2W(S.mmu.rw(S.reg.pc + 1));
		S.mmu.ww(addr, [S.reg[reg1], S.reg[reg2]]);
	};
	this.ld$mmtor = function(reg1, reg2) {
		var data = S.mmu.rw(S.utils.dBy2W(S.mmu.rw(S.reg.pc + 1)));
		S.reg[reg1] = data[0];
		S.reg[reg2] = data[1];
	};
	this.ldnntorr = function(reg) {
		S.reg[reg] = S.utils.dBy2W(S.mmu.rw(S.reg.pc + 1));
	};
	this.ldnto$rr = function(reg_ptr1, reg_ptr2, source) {
		var addr = S.utils.dBy2W([S.reg[reg_ptr1], S.reg[reg_ptr2]]);
		S.mmu.wb(addr, source);
	};
	this.ldnto$nn = function() {
		var addr = S.utils.dBy2W(S.mmu.rw(S.reg.pc + 1)),
			source = S.mmu.rb(S.reg.pc + 3);
		S.mmu.wb(addr, source);
	};
	this.ld$rrtor = function(reg_target, reg_ptr1, reg_ptr2) {
		var addr = S.utils.dBy2W([S.reg[reg_ptr1], S.reg[reg_ptr2]]);
		S.reg[reg_target] = S.mmu.rb(addr);
	};
	this.incrr = function(reg1, reg2) {
		S.reg[reg2]++;
		if (S.reg[reg2] > 0xff) {
			S.reg[reg1]++;
			S.reg[reg2] = 0;
		}
		if (S.reg[reg1] > 0xff) {
			S.reg[reg1] = 0;
		}
		S.reg.pc += 1;
		S.clock.m = 6;
	};
	this.decr = function(reg) {
		S.clock.m = 4;
		if (S.reg[reg] === 0xFF) {
			S.utils.flag_C(true);
			S.reg[reg] = 0;
			return 0x00;
		}
		if (S.reg[reg] >= 0x0F) {
			S.utils.flag_H(true);
		}
		S.reg[reg]--;
		S.reg.pc += 1;
	};
	this.inc = function(n, double) {
		if (arguments.length < 2) {
			n = (n + 1) & 0xff;
			S.utils.flag_N(false);
			S.utils.flag_C(n > 0xff);
			S.utils.flag_V(n > 0xff);
			S.utils.flag_S(n > 0x7f && n < 0xff);
			S.utils.flag_H(n > 0x0f);

			// S.utils.flag_F5(S.utils.rdBit(5,S.mem[pc]));
			// S.utils.flag_F3(S.utils.rdBit(3,S.mem[pc]));
			this.f3 = (n & 0x8);
			this.f5 = (n & 0x20);

			S.clock.m = 4;
			S.reg.pc += 1;
			return n
		} else {
			n++;
			S.reg.pc += 1;
			S.clock.m = 6;
			return n;
		}
	};
	this.add = function(n, double) {
		if (arguments.length < 2) {
			var t = (S.reg.a + n) & 0xff;
			S.utils.flag_N(false);
			S.utils.flag_C(n > 0xff);
			S.utils.flag_V(n > 0xff);
			S.utils.flag_S(n > 0x7f && n < 0xff);
			S.utils.flag_H(S.utils.rdBit(3, n) & S.utils.rdBit(3, S.reg.a));

			// S.utils.flag_F5(S.utils.rdBit(5,S.mem[pc]));
			// S.utils.flag_F3(S.utils.rdBit(3,S.mem[pc]));

			S.utils.flag_F3(t & 0x8);
			S.utils.flag_F5(t & 0x20);

			S.reg.pc += 1;
			return t
		} else {
			S.utils.flag_C(n > 0xffff);
			S.utils.flag_H(S.utils.rdBit(11, n) & S.utils.rdBit(11, S.reg.a));
			S.utils.flag_N(false);
			var t = (S.utils.dBy2W([S.reg.h, S.reg.l]) + n) & 0xffff;

			S.utils.flag_F3(t & 0x800);
			S.utils.flag_F5(t & 0x2000);

			S.reg.pc += 1;
			return t;
		}
	};
	this.swp = function(arr) {
		for (var i = 0; i < arr.length; i++) {
			S.reg[arr[i]] = S.reg[arr[i]] ^ S.reg[[arr[i], '1'].join('')], S.reg[[arr[i], '1'].join('')] = S.reg[arr[i]] ^ S.reg[[arr[i], '1'].join('')], S.reg[arr[i]] = S.reg[arr[i]] ^ S.reg[[arr[i], '1'].join('')];
		}
	};
	this.and = function(data) {
		S.reg.a = S.reg.a & data,
			S.utils.flag_V(!S.utils.rdBit(0, S.reg.a) && S.reg.a);
		S.utils.flag_Z(!S.reg.a);
	};
	this.or = function(data) {
		S.reg.a = S.reg.a | data,
			S.utils.flag_V(!S.utils.rdBit(0, S.reg.a) && S.reg.a);
		S.utils.flag_Z(!S.reg.a);
	};
	this.xor = function(data) {
		S.reg.a = S.reg.a ^ data,
			S.utils.flag_V(!S.utils.rdBit(0, S.reg.a) && S.reg.a);
		S.utils.flag_Z(!S.reg.a);
	};
};
var Op = function(that) {
	var S = that;
	this[0x00] = function() { // nop
		$(document).trigger('op', {
			name: '',
			type: 'ready'
		});
		S.clock.m = 4;
		return false;
	};
	this[0x01] = function() { // LD BC **
		S.core.ldnntor('b', 'c', S.mmu.rw(S.reg.pc + 1));
		S.reg.pc += 3;
		S.clock.m = 10;
		return 0x01;
	};
	this[0x02] = function() { // LD (BC), A
		S.core.ldnto$rr('b', 'c', S.reg.a)
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x02;
	};
	this[0x03] = function() { // INC BC
		S.core.incrr('b', 'c');
		return 0x03;
	};
	this[0x04] = function() { // INC B
		S.reg.b = S.core.inc(S.reg.b);
		return 0x04;
	};
	// this[0x05] = function(){//nop
	// 	S.reg.pc += 3;
	//S.clock.m = 4; 	
	//return 0x05;
	// };
	this[0x06] = function() { // LD B *
		S.core.ldntor('b', S.mmu.rb(S.reg.pc + 1));
		S.reg.pc += 2;
		S.clock.m = 7;
		return 0x06;
	};
	// this[0x07] = function(){//nop
	// 	S.reg.pc += 3;
	//S.clock.m = 4;	
	//return 0x07;
	// };
	this[0x08] = function() { //ex af, af'
		S.core.swp(['a', 'f']);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x08;
	};
	this[0x09] = function() { //add hl, bc
		S.reg.h = S.utils.split8(S.core.add(S.utils.dBy2W([S.reg.b, S.reg.c]), 16))[0];
		S.reg.l = S.utils.split8(S.core.add(S.utils.dBy2W([S.reg.b, S.reg.c]), 16))[1];
		S.clock.m = 11;
		return 0x09;
	};
	this[0x0a] = function() { // LD A, (BC)
		S.core.ld$rrtor('a', 'b', 'c');
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x0a;
	};
	// this[0x0b] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x0b;
	// };
	this[0x0c] = function() { // INC c
		S.reg.c = S.core.inc(S.reg.c);
		return 0x0c;
	};
	// this[0x0d] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x0d;
	// };
	this[0x0e] = function() { // LD C *
		S.core.ldntor('c', S.mmu.rb(S.reg.pc + 1));
		S.reg.pc += 2;
		S.clock.m = 7;
		return 0x0e;
	};
	// this[0x0f] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x0f;
	// };
	// this[0x10] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x10;
	// };
	this[0x11] = function() { // LD DE **
		S.core.ldnntor('d', 'e', S.mmu.rw(S.reg.pc + 1));
		S.reg.pc += 3;
		S.clock.m = 10;
		return 0x11;
	};
	this[0x12] = function() { //LD (DE), A
		S.core.ldnto$rr('d', 'e', S.reg.a)
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x12;
	};
	this[0x13] = function() { // INC de
		S.core.incrr('d', 'e');
		return 0x13;
	};
	this[0x14] = function() { // INC d
		S.reg.d = S.core.inc(S.reg.d);
		return 0x14;
	};
	// this[0x15] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x15;
	// };
	this[0x16] = function() { //LD d, *
		S.core.ldntor('d', S.mmu.rb(S.reg.pc + 1));
		S.reg.pc += 2;
		S.clock.m = 7;
		return 0x16;
	};
	// this[0x17] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x17;
	// };
	// this[0x18] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x18;
	// };
	this[0x19] = function() { //add hl, de
		S.reg.h = S.utils.split8(S.core.add(S.utils.dBy2W([S.reg.d, S.reg.e]), 16))[0];
		S.reg.l = S.utils.split8(S.core.add(S.utils.dBy2W([S.reg.d, S.reg.e]), 16))[1];
		S.clock.m = 11;
		return 0x19;
	};
	this[0x1a] = function() { //LD A, (DE)
		S.core.ld$rrtor('a', 'd', 'e');
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x1a;
	};
	// this[0x1b] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x1b;
	// };
	this[0x1c] = function() { // INC e
		S.reg.e = S.core.inc(S.reg.e);
		return 0x1c;
	};
	// this[0x1d] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x1d;
	// };
	this[0x1e] = function() { //LD e,*
		S.core.ldntor('e', S.mmu.rb(S.reg.pc + 1));
		S.reg.pc += 2;
		S.clock.m = 7;
		return 0x1e;
	};
	// this[0x1f] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x1f;
	// };
	// this[0x20] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x20;
	// };
	this[0x21] = function() { // LD HL **
		S.core.ldnntor('h', 'l', S.mmu.rw(S.reg.pc + 1));
		S.reg.pc += 3;
		S.clock.m = 10;
		return 0x21;
	};
	this[0x22] = function() { // LD (**) HL
		S.core.ld$nntorr('h', 'l');
		S.reg.pc += 3;
		S.clock.m = 16;
		return 0x22;
	};
	this[0x23] = function() { // INC hl
		S.core.incrr('h', 'l');
		return 0x23;
	};
	this[0x24] = function() { // INC h
		S.reg.h = S.core.inc(S.reg.h);
		return 0x24;
	};
	// this[0x25] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x25;
	// };
	this[0x26] = function() { // LD H *
		S.core.ldntor('h', S.mmu.rb(S.reg.pc + 1));
		S.reg.pc += 2;
		S.clock.m = 7;
		return 0x26;
	};
	// this[0x27] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x27;
	// };
	// this[0x28] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x28;
	// };
	this[0x29] = function() { ///add hl, hl
		S.reg.h = S.utils.split8(S.core.add(S.utils.dBy2W([S.reg.h, S.reg.l]), 16))[0];
		S.reg.l = S.utils.split8(S.core.add(S.utils.dBy2W([S.reg.h, S.reg.l]), 16))[1];
		S.clock.m = 11;
		return 0x29;
	};
	this[0x2a] = function() { // ld hl (**)
		S.core.ld$mmtor('h', 'l');
		S.reg.pc += 3;
		S.clock.m = 16;
		return 0x2a;
	};
	// this[0x2b] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x2b;
	// };
	this[0x2c] = function() { // INC l
		S.reg.l = S.core.inc(S.reg.l);
		return 0x2c;
	};
	// this[0x2d] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x2d;
	// };
	this[0x2e] = function() { // LD L *
		S.core.ldntor('l', S.mmu.rb(S.reg.pc + 1));
		S.reg.pc += 2;
		S.clock.m = 7;
		return 0x2e;
	};
	// this[0x2f] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x2f;
	// };
	// this[0x30] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x30;
	// };
	this[0x31] = function() { // LD HL **
		S.core.ldntor('sp', S.mmu.rw(S.reg.pc + 1));
		S.reg.pc += 3;
		S.clock.m = 10;
		return 0x31;
	};
	this[0x32] = function() { //LD (**),a
		S.core.ldnto$nn(S.mmu.rb(S.reg.pc + 1), S.reg.a);
		S.reg.pc += 3;
		S.clock.m = 13;
		return 0x32;
	};
	this[0x33] = function() { //inc sp
		S.reg.sp = S.core.inc(S.reg.sp, 16);
		return 0x33;
	};
	this[0x34] = function() { //inc (hl)
		S.mem[dBy2W([S.reg.h, S.reg.l])] = S.core.inc(S.mem[dBy2W([S.reg.h, S.reg.l])]);
		return 0x34;
	};
	// this[0x35] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x35;
	// };
	this[0x36] = function() { //LD (HL), *
		S.core.ldnto$rr('d', 'e', S.mmu.rb(S.reg.pc + 1));
		S.reg.pc += 2;
		S.clock.m = 10;
		return 0x36;
	};
	// this[0x37] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x37;
	// };
	// this[0x38] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x38;
	// };
	this[0x39] = function() { // add hl, sp
		S.reg.h = S.utils.split8(S.core.add(S.reg.sp, 16))[0];
		S.reg.l = S.utils.split8(S.core.add(S.reg.sp, 16))[1];
		S.clock.m = 11;
		return 0x39;
	};
	this[0x3a] = function() { // ld a,(**)
		S.core.ldntor('a', S.mem[S.utils.dBy2W(S.mmu.rw(S.reg.pc + 1))]);
		S.reg.pc += 3;
		S.clock.m = 13;
		return 0x3a;
	};
	// this[0x3b] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x3b;
	// };
	this[0x3c] = function() { // INC a
		S.reg.a = S.core.inc(S.reg.a);
		return 0x3c;
	};
	// this[0x3d] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x3d;
	// };
	this[0x3e] = function() { // LD A *
		S.core.ldntor('a', S.mmu.rb(S.reg.pc + 1));
		S.reg.pc += 2;
		S.clock.m = 7;
		return 0x3e;
	};
	// this[0x3f] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x3f;
	// };
	this[0x40] = function() { // ld b,b
		S.core.ldntor('b', S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x40;
	};
	this[0x41] = function() { // ld b,c
		S.core.ldntor('b', S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x41;
	};
	this[0x42] = function() { // ld b,d
		S.core.ldntor('b', S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x42;
	};
	this[0x43] = function() { // ld b,e
		S.core.ldntor('b', S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x43;
	};
	this[0x44] = function() { // ld b,h
		S.core.ldntor('b', S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x44;
	};
	this[0x45] = function() { // ld b,l
		S.core.ldntor('b', S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x45;
	};
	this[0x46] = function() { // ld b,(hl)
		S.core.ld$rrtor('h', 'l', 'b');
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x46;
	};
	this[0x47] = function() { // ld b,a
		S.core.ldntor('b', S.reg.a);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x47;
	};
	this[0x48] = function() { // ld c,b
		S.core.ldntor('c', S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x48;
	};
	this[0x49] = function() { // ld c,c
		S.core.ldntor('c', S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x49;
	};
	this[0x4a] = function() { // ld c,d
		S.core.ldntor('c', S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x4a;
	};
	this[0x4b] = function() { // ld c,e
		S.core.ldntor('c', S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x4b;
	};
	this[0x4c] = function() { // ld c,h
		S.core.ldntor('c', S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x4c;
	};
	this[0x4d] = function() { // ld c,l
		S.core.ldntor('c', S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x4d;
	};
	this[0x4e] = function() { // ld c,(hl)
		S.core.ld$rrtor('h', 'l', 'c');
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x4e;
	};
	this[0x4f] = function() { // ld c,a
		S.core.ldntor('c', S.reg.c);

		ret0x4fname;
	};
	this[0x50] = function() { // ld d,b
		S.core.ldntor('d', S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x50;
	};
	this[0x51] = function() { // ld d,c
		S.core.ldntor('d', S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x51;
	};
	this[0x52] = function() { // ld d,d
		S.core.ldntor('d', S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x52;
	};
	this[0x53] = function() { // ld d,e
		S.core.ldntor('d', S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x53;
	};
	this[0x54] = function() { // ld d,h
		S.core.ldntor('d', S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x54;
	};
	this[0x55] = function() { // ld d,l
		S.core.ldntor('d', S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x55;
	};
	this[0x56] = function() { // ld d,(hl)
		S.core.ld$rrtor('h', 'l', 'd');
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x56;
	};
	this[0x57] = function() { // ld d,a
		S.core.ldntor('d', S.reg.a);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x57;
	};
	this[0x58] = function() { // ld e,b
		S.core.ldntor('e', S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x58;
	};
	this[0x59] = function() { // ld e,c
		S.core.ldntor('e', S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x59;
	};
	this[0x5a] = function() { // ld e,d
		S.core.ldntor('e', S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x5a;
	};
	this[0x5b] = function() { // ld e,e
		S.core.ldntor('e', S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x5b;
	};
	this[0x5c] = function() { // ld e,h
		S.core.ldntor('e', S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x5c;
	};
	this[0x5d] = function() { // ld e,l
		S.core.ldntor('e', S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x5d;
	};
	this[0x5e] = function() { // ld e,(hl)
		S.core.ld$rrtor('h', 'l', 'e');
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x5e;
	};
	this[0x5f] = function() { // ld e,a
		S.core.ldntor('e', S.reg.a);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x5f;
	};
	this[0x60] = function() { // ld h,b
		S.core.ldntor('h', S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x60;
	};
	this[0x61] = function() { // ld h,c
		S.core.ldntor('h', S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x61;
	};
	this[0x62] = function() { // ld h,d
		S.core.ldntor('h', S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x62;
	};
	this[0x63] = function() { // ld h,e
		S.core.ldntor('h', S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x63;
	};
	this[0x64] = function() { // ld h,h
		S.core.ldntor('h', S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x64;
	};
	this[0x65] = function() { // ld h,l
		S.core.ldntor('h', S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x65;
	};
	this[0x66] = function() { // ld h,(hl)
		S.core.ld$rrtor('h', 'l', 'h');
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x66;
	};
	this[0x67] = function() { //ld h,a
		S.core.ldntor('h', S.reg.a);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x67;
	};
	this[0x68] = function() { // ld l,b
		S.core.ldntor('l', S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x68;
	};
	this[0x69] = function() { // ld l,c
		S.core.ldntor('l', S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x69;
	};
	this[0x6a] = function() { // ld l,d
		S.core.ldntor('l', S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x6a;
	};
	this[0x6b] = function() { // ld l,e
		S.core.ldntor('l', S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x6b;
	};
	this[0x6c] = function() { // ld l,h
		S.core.ldntor('l', S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x6c;
	};
	this[0x6d] = function() { // ld l,l
		S.core.ldntor('l', S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x6d;
	};
	this[0x6e] = function() { // ld l,(hl)
		S.core.ld$rrtor('h', 'l', 'l');
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x6e;
	};
	this[0x6f] = function() { //ld l,a
		S.core.ldntor('l', S.reg.a);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x6f;
	};
	// this[0x70] = function(){//nop
	// 	
	//S.reg.pc += 1; 	
	//	S.clock.m = 4;
	//	return 0x70;
	// };
	// this[0x71] = function(){//nop
	// 	
	//S.reg.pc += 1; 	
	//	S.clock.m = 4;
	//	return 0x71;
	// };
	// this[0x72] = function(){//nop
	// 	
	//S.reg.pc += 1; 	
	//	S.clock.m = 4;
	//	return 0x72;
	// };
	// this[0x73] = function(){//nop
	// 	
	//S.reg.pc += 1; 	
	//	S.clock.m = 4;
	//	return 0x73;
	// };
	// this[0x74] = function(){//nop
	// 	
	//S.reg.pc += 1; 	
	//	S.clock.m = 4;
	//	return 0x74;
	// };
	// this[0x75] = function(){//nop
	// 	
	//S.reg.pc += 1; 	
	//	S.clock.m = 4;
	//	return 0x75;
	// };
	this[0x76] = function() { // halt
		S.halt = true;
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x76;
	};
	// this[0x77] = function(){//nop
	// 	
	//S.reg.pc += 1;	
	//	S.clock.m = 4;
	//	return 0x77;
	// };
	this[0x78] = function() { // ld a,b
		S.core.ldntor('a', S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x78;
	};
	this[0x79] = function() { // ld a,c
		S.core.ldntor('a', S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x79;
	};
	this[0x7a] = function() { // ld a,d
		S.core.ldntor('a', S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x7a;
	};
	this[0x7b] = function() { // ld a,e
		S.core.ldntor('a', S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x7b;
	};
	this[0x7c] = function() { // ld a,h
		S.core.ldntor('a', S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x7c;
	};
	this[0x7d] = function() { // ld a,l
		S.core.ldntor('a', S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x7d;
	};
	this[0x7e] = function() { // ld a,(hl)
		S.core.ld$rrtor('h', 'l', 'a');
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x6e;
	};
	this[0x7f] = function() { // ld a,a
		S.core.ldntor('a', S.reg.a);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x7f;
	};
	this[0x80] = function() { // add a,b
		S.reg.a = S.core.add(S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x80;
	};
	this[0x81] = function() { // add a,c
		S.reg.a = S.core.add(S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x81;
	};
	this[0x82] = function() { // add a,d
		S.reg.a = S.core.add(S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x82;
	};
	this[0x83] = function() { // add a,e
		S.reg.a = S.core.add(S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x83;
	};
	this[0x84] = function() { // add a,h
		S.reg.a = S.core.add(S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x84;
	};
	this[0x85] = function() { //add a,l
		S.reg.a = S.core.add(S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x85;
	};
	this[0x86] = function() { //add a, (hl)
		S.reg.a = S.core.add(S.mmu.rb(S.utils.dBy2W([S.reg.h, S.reg.l])));
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0x86;
	};
	this[0x87] = function() { //nop
		S.reg.a = S.core.add(S.reg.a);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0x87;
	};
	// this[0x88] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x88;
	// };
	// this[0x89] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x89;
	// };
	// this[0x8a] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x8a;
	// };
	// this[0x8b] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x8b;
	// };
	// this[0x8c] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x8c;
	// };
	// this[0x8d] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x8d;
	// };
	// this[0x8e] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x8e;
	// };
	// this[0x8f] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x8f;
	// };
	// this[0x90] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x90;
	// };
	// this[0x91] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x91;
	// };
	// this[0x92] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x92;
	// };
	// this[0x93] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x93;
	// };
	// this[0x94] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x94;
	// };
	// this[0x95] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x95;
	// };
	// this[0x96] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x96;
	// };
	// this[0x97] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x97;
	// };
	// this[0x98] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x98;
	// };
	// this[0x99] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x99;
	// };
	// this[0x9a] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x9a;
	// };
	// this[0x9b] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x9b;
	// };
	// this[0x9c] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x9c;
	// };
	// this[0x9d] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x9d;
	// };
	// this[0x9e] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x9e;
	// };
	// this[0x9f] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0x9f;
	// };
	this[0xa0] = function() { // and b
		S.core.and(S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xa0;
	};
	this[0xa1] = function() { // and c
		S.core.and(S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xa1;
	};
	this[0xa2] = function() { // and d
		S.core.and(S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xa2;
	};
	this[0xa3] = function() { //and e
		S.core.and(S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xa3;
	};
	this[0xa4] = function() { //and h
		S.core.and(S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xa4;
	};
	this[0xa5] = function() { // and l
		S.core.and(S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xa5;
	};
	this[0xa6] = function() { // and (hl)
		S.core.and(S.mmu.rb(S.utils.dBy2W([S.reg.h, S.reg.l])));
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0xa6;
	};
	this[0xa7] = function() { // and a
		S.core.and(S.reg.a);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xa7;
	};
	this[0xa8] = function() { // xor b
		S.core.Sor(S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xa8;
	};
	this[0xa9] = function() { // xor c
		S.core.Sor(S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xa9;
	};
	this[0xaa] = function() { // xor d
		S.core.Sor(S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xaa;
	};
	this[0xab] = function() { // xor e
		S.core.Sor(S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xab;
	};
	this[0xac] = function() { // xor h
		S.core.Sor(S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xac;
	};
	this[0xad] = function() { // xor l
		S.core.Sor(S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xad;
	};
	this[0xae] = function() { // and (hl)
		S.core.Sor(S.mmu.rb(S.utils.dBy2W([S.reg.h, S.reg.l])));
		S.reg.pc += 1;
		S.clock.m = 7;
		return 0xae;
	};
	this[0xaf] = function() { // xor a
		S.core.Sor(S.reg.a);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xaf;
	};
	this[0xb0] = function() { //or b
		S.core.or(S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xb1;
	};
	this[0xb1] = function() { //or c
		S.core.or(S.reg.c);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xb2;
	};
	this[0xb2] = function() { //or d
		S.core.or(S.reg.d);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xb3;
	};
	this[0xb3] = function() { //or e
		S.core.or(S.reg.e);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xb4;
	};
	this[0xb4] = function() { //or h
		S.core.or(S.reg.h);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xb5;
	};
	this[0xb5] = function() { //or l
		S.core.or(S.reg.l);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xb5;
	};
	this[0xb6] = function() { //or (hl)
		S.core.or(S.mmu.rb(S.utils.dBy2W([S.reg.h, S.reg.l])));
		S.reg.pc += 1;
		S.clock.m = 7;
	};
	this[0xb7] = function() { //or 
		S.core.or(S.reg.b);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xb7;
	};
	// this[0xb8] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xb8;
	// };
	// this[0xb9] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xb9;
	// };
	// this[0xba] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xba;
	// };
	// this[0xbb] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xbb;
	// };
	// this[0xbc] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xbc;
	// };
	// this[0xbd] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xbd;
	// };
	// this[0xbe] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xbe;
	// };
	// this[0xbf] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xbf;
	// };
	// this[0xc0] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xc0;
	// };
	// this[0xc1] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xc1;
	// };
	// this[0xc2] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xc2;
	// };
	// this[0xc3] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xc3;
	// };
	// this[0xc4] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xc4;
	// };
	// this[0xc5] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xc5;
	// };
	this[0xc6] = function() { // add a, *
		S.reg.a = S.mmu.rb(S.reg.pc + 1);
		S.clock.m = 7;
		S.reg.pc += 1; // additional 1 increment for pc out of the original add8bit instruction
		return 0xc6;
	};
	// this[0xc7] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xc7;
	// };
	// this[0xc8] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xc8;
	// };
	// this[0xc9] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xc9;
	// };
	// this[0xca] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xca;
	// };
	this[0xcb] = function() { // cb prefixed instructions
		S.reg.pc++;
		return 0xcb00 | S.cbop[S.reg.pc];
	};
	// this[0xcc] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xcc;
	// };
	// this[0xcd] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xcd;
	// };
	// this[0xce] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xce;
	// };
	// this[0xcf] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xcf;
	// };
	// this[0xd0] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xd0;
	// };
	// this[0xd1] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xd1;
	// };
	// this[0xd2] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xd2;
	// };
	// this[0xd3] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xd3;
	// };
	// this[0xd4] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xd4;
	// };
	// this[0xd5] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xd5;
	// };
	// this[0xd6] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xd6;
	// };
	// this[0xd7] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xd7;
	// };
	// this[0xd8] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xd8;
	// };
	this[0xd9] = function() { // exx
		S.core.swp(['b', 'c', 'd', 'e', 'h', 'l']);
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xd9;
	};
	// this[0xda] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xda;
	// };
	// this[0xdb] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xdb;
	// };
	// this[0xdc] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xdc;
	// };
	this[0xdd] = function() { // dd prefixed instructions
		S.reg.pc++;
		return 0xdd | (S.ddop[S.reg.pc]() << 8);
	};
	// this[0xde] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xde;
	// };
	// this[0xdf] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xdf;
	// };
	// this[0xe0] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xe0;
	// };
	// this[0xe1] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xe1;
	// };
	// this[0xe2] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xe2;
	// };
	// this[0xe3] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xe3;
	// };
	// this[0xe4] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xe4;
	// };
	// this[0xe5] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xe5;
	// };
	// this[0xe6] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xe6;
	// };
	// this[0xe7] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xe7;
	// };
	// this[0xe8] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xe8;
	// };
	// this[0xe9] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xe9;
	// };
	// this[0xea] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xea;
	// };
	// this[0xeb] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xeb;
	// };
	// this[0xec] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xec;
	// };
	this[0xed] = function() { // ed prefixed instructions
		S.reg.pc++;
		return 0xed | (S.edop[S.reg.pc]() << 8);
	};
	// this[0xee] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xee;
	// };
	// this[0xef] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xef;
	// };
	// this[0xf0] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xf0;
	// };
	// this[0xf1] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xf1;
	// };
	// this[0xf2] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xf2;
	// };
	// this[0xf3] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xf3;
	// };
	// this[0xf4] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xf4;
	// };
	// this[0xf5] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xf5;
	// };
	// this[0xf6] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xf6;
	// };
	// this[0xf7] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xf7;
	// };
	// this[0xf8] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xf8;
	// };
	this[0xf9] = function() { // ld sp,hl
		S.core.ldntor('sp', S.utils.dBy2W([S.reg.h, S.reg.h]));
		S.reg.pc += 1;
		S.clock.m = 4;
		return 0xf9;
	};
	// this[0xfa] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xfa;
	// };
	// this[0xfb] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xfb;
	// };
	// this[0xfc] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xfc;
	// };
	this[0xfd] = function() { // fd prefixed instructions
		S.reg.pc++;
		return 0xfd | (S.fdop[S.reg.pc]() << 8);
	};
	// this[0xfe] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xfe;
	// };
	// this[0xff] = function(){//nop
	// 	S.reg.pc += 3;
	//	S.clock.m = 4; 	
	//	return 0xff;
	// };
};
var Cbop = function(that) {
	var S = that;
	// 0x00 = function(){// ld sp,hl
	// return 0x00;
	// },
};

var Edop = function(that) {
	var S = that;
	// 0x00 = function(){// ld sp,hl
	// return 0x00;
	// },
};

var Ddop = function(that) {
	var S = that;
	// 0x00 = function(){// ld sp,hl
	// return 0x00;
	// },
};

var Fdop = function(that) {
	var S = that;
	// 0x00 = function(){// ld sp,hl
	// return 0x00;
	// },
};

var Fdcbop = function(that) {
	var S = that;
	// 0x00 = function(){// ld sp,hl
	// return 0x00;
	// },
};


var Mmu = function(that) {
	var S = that;
	this.rb = function(addr) { //8bit read
		return S.mem[addr];
	};
	this.rw = function(addr) { //16bit read
		return [S.mem[addr + 1], S.mem[addr]]; // little endian?
	};
	this.wb = function(addr, data) { //8bit write
		S.mem[addr] = data;
		return true;
	};
	this.ww = function(addr, data) { //16bit write
		S.mem[addr + 1] = data[0]; // little endian?
		S.mem[addr] = data[1]; // little endian?
		return true;
	};
};

var _Z80 = function() {
	var S = this;
	
	this.utils = new Utils(S);
	this.cbop = new Cbop(S);
	this.edop = new Edop(S);
	this.ddop = new Ddop(S);
	this.fdop = new Fdop(S);
	this.fdcbop = new Fdcbop(S);
	this.core = new Core(S);
	this.op = new Op(S);
	this.mmu = new Mmu(S)
	this.reg = {
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
	};

	this.clock = {
		m: 0,
		t: 0,
	};

	this.mem = new Uint8ClampedArray(65535);
	this.halt = false;

	this.fetch = function() {
		this.reg.r++ && 0xff;
		if (typeof this.op[this.mmu.rb(this.reg.pc)] === typeof undefined) {
			$(document).trigger('op', {
				name: 'illegal or unsupported instruction',
				type: 'error'
			});
			return false;
		}
		var opname = this.op[this.mmu.rb(this.reg.pc)]();
		if (opname && !this.halt) {
			this.clock.t += this.clock.m;
			$(document).trigger('op', {
				name: opname,
				type: 'ready'
			});
			this.fetch();
		}
	};
	this.start = function() {
		this.fetch();
	};
	this.clk = function() {};
	this.reset = function() {
		for (key in this.reg) {
			this.reg[key] = 0;
		}
		this.clock.t = 0;
		this.clock.m = 0;
		this.mem = new Uint8ClampedArray(65535);
		if (debug) {
			$(document).trigger('op', {
				name: '',
				type: 'ready'
			});
		}
	};
};

var Z80 = new _Z80;