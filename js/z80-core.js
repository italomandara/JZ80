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
		flag_PV: function(state) {
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
			Z80.reg[reg_name] = data;
			Z80.reg.pc += 2;
		},
		ldnntor: function(reg_name1, reg_name2, data) {
			Z80.reg[reg_name1] = data[0];
			Z80.reg[reg_name2] = data[1];
			Z80.reg.pc += 3;
		},
		ld$rrtom: function(reg1, reg2) {
			var addr = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1));
			Z80.mmu.ww(addr, [Z80.reg[reg1], Z80.reg[reg2]]);
			Z80.reg.pc += 3;
		},
		ldRegtoMemDir: function(reg) {
			var addr = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1));
			Z80.mmu.wb(addr, Z80.reg[reg]);
			Z80.reg.pc += 3;
		},
		ld$mmtor: function(reg1, reg2) {
			var data = Z80.mmu.rw(Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1)));
			Z80.reg[reg1] = data[0];
			Z80.reg[reg2] = data[1];
			Z80.reg.pc += 3;
		},
		ldnntorr: function(reg) {
			Z80.reg[reg] = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1));
			Z80.reg.pc += 3;
		},
		ldnto$rr: function(reg_ptr1, reg_ptr2, source) {
			var addr = Z80.utils.dBy2W([Z80.reg[reg_ptr1], Z80.reg[reg_ptr2]]);
			Z80.mmu.wb(addr, source);
			Z80.reg.pc++;
		},
		ldnto$nn: function(ptr1, ptr2, source) {
			var addr = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1));
			Z80.mmu.wb(addr, source);
			Z80.reg.pc += 2;
		},
		ld$rrtor: function(reg_target, reg_ptr1, reg_ptr2) {
			var addr = Z80.utils.dBy2W([Z80.reg[reg_ptr1], Z80.reg[reg_ptr2]]);
			Z80.reg[reg_target] = Z80.mmu.rb(addr);
			Z80.reg.pc++;
		},
	},
	op: {
		0x00: function(name) { // nop			
			return false;
		},
		0x01: function(name) { // LD BC **
			Z80.core.ldnntor('b', 'c', Z80.mmu.rw(Z80.reg.pc + 1));

			return 0x01;
		},
		0x02: function(name) { // LD (BC), A
			Z80.core.ldnto$rr('b', 'c', Z80.reg.a)

			return 0x02;
		},
		0x03: function(name) { // INC BC
			Z80.reg.c++;
			if (Z80.reg.c > 0xff) {
				Z80.reg.b++;
				Z80.reg.c = 0;
				Z80.reg.f = 0xFF;
			}
			if (Z80.reg.b > 0xff) {
				Z80.reg.b = 0;
				Z80.reg.f = 0xFF;
			}
			Z80.reg.pc++;

			return 0x03;
		},
		0x04: function(name) { // INC B
			if (Z80.reg.b === 0xFF) {
				Z80.reg.f = 0xFF;
			}
			Z80.reg.b++;
			Z80.reg.pc++;

			return 0x04;
		},
		// 0x05: function(name){//nop
		// 	
		// 	return name;
		// },
		0x06: function(name) { // LD B *
			Z80.core.ldntor('b', Z80.mmu.rb(Z80.reg.pc + 1));
			return 0x06;
		},
		// 0x07: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x08: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x09: function(name){//nop
		// 	
		// 	return name;
		// },
		0x0a: function(name) { // LD A, (BC)
			Z80.core.ld$rrtor('a', 'b', 'c');

			return 0x0a;
		},
		// 0x0b: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x0c: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x0d: function(name){//nop
		// 	
		// 	return name;
		// },
		0x0e: function(name) { // LD C *
			Z80.core.ldntor('c', Z80.mmu.rb(Z80.reg.pc + 1));

			return 0x0e;
		},
		// 0x0f: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x10: function(name){//nop
		// 	
		// 	return name;
		// },
		0x11: function(name) { // LD DE **
			Z80.core.ldnntor('d', 'e', Z80.mmu.rw(Z80.reg.pc + 1));

			return 0x11;
		},
		0x12: function(name) { //LD (DE), A
			Z80.core.ldnto$rr('d', 'e', Z80.reg.a)

			return 0x12;
		},
		// 0x13: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x14: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x15: function(name){//nop
		// 	
		// 	return name;
		// },
		0x16: function(name) { //nop
			Z80.core.ldntor('d', Z80.mmu.rb(Z80.reg.pc + 1));
			return 0x16;
		},
		// 0x17: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x18: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x19: function(name){//nop
		// 	
		// 	return name;
		// },
		0x1a: function(name) { //LD A, (DE)
			Z80.core.ld$rrtor('a', 'd', 'e');
			return 0x1a;
		},
		// 0x1b: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x1c: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x1d: function(name){//nop
		// 	
		// 	return name;
		// },
		0x1e: function(name) { //LD e,*
			Z80.core.ldntor('e', Z80.mmu.rb(Z80.reg.pc + 1));
			return 0x1e;
		},
		// 0x1f: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x20: function(name){//nop
		// 	
		// 	return name;
		// },
		0x21: function(name) { // LD HL **
			Z80.core.ldnntor('h', 'l', Z80.mmu.rw(Z80.reg.pc + 1));

			return 0x21;
		},
		0x22: function(name) { // LD (**) HL
			Z80.core.ld$rrtom('h', 'l');
			return 0x22;
		},
		// 0x23: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x24: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x25: function(name){//nop
		// 	
		// 	return name;
		// },
		0x26: function(name) { // LD H *
			Z80.core.ldntor('h', Z80.mmu.rb(Z80.reg.pc + 1));

			return 0x26;
		},
		// 0x27: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x28: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x29: function(name){//nop
		// 	
		// 	return name;
		// },
		0x2a: function(name) { // ld hl (**)
			Z80.core.ld$mmtor('h', 'l');
			return 0x2a;
		},
		// 0x2b: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x2c: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x2d: function(name){//nop
		// 	
		// 	return name;
		// },
		0x2e: function(name) { // LD L *
			Z80.core.ldntor('l', Z80.mmu.rb(Z80.reg.pc + 1));
			return 0x2e;
		},
		// 0x2f: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x30: function(name){//nop
		// 	
		// 	return name;
		// },
		0x31: function(name) { // ld SP **
			Z80.core.ldnntorr('sp');
			return 0x31;
		},
		0x32: function(name) { //LD (**),a
			Z80.core.ldnto$nn(Z80.mmu.rw(Z80.reg.pc + 1), Z80.reg.a);
			Z80.reg.pc++;
			return 0x32;
		},
		// 0x33: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x34: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x35: function(name){//nop
		// 	
		// 	return name;
		// },
		0x36: function(name) { //LD (HL), *
			Z80.core.ldnto$rr('d', 'e', Z80.mmu.rb(Z80.reg.pc + 1));
			Z80.reg.pc++;
			return 0x36;
		},
		// 0x37: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x38: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x39: function(name){//nop
		// 	
		// 	return name;
		// },
		0x3a: function(name) { // ld a,(**)
			Z80.core.ldntor('a', Z80.mem[Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc + 1))]);
			Z80.reg.pc++;
			return 0x3a;
		},
		// 0x3b: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x3c: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x3d: function(name){//nop
		// 	
		// 	return name;
		// },
		0x3e: function(name) { // LD A *
			Z80.core.ldntor('a', Z80.mmu.rb(Z80.reg.pc + 1));
			return 0x3e;
		},
		// 0x3f: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x40: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x41: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x42: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x43: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x44: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x45: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x46: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x47: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x48: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x49: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x4a: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x4b: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x4c: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x4d: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x4e: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x4f: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x50: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x51: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x52: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x53: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x54: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x55: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x56: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x57: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x58: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x59: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x5a: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x5b: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x5c: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x5d: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x5e: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x5f: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x60: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x61: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x62: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x63: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x64: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x65: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x66: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x67: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x68: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x69: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x6a: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x6b: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x6c: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x6d: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x6e: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x6f: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x70: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x71: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x72: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x73: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x74: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x75: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x76: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x77: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x78: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x79: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x7a: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x7b: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x7c: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x7d: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x7e: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x7f: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x80: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x81: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x82: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x83: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x84: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x85: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x86: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x87: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x88: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x89: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x8a: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x8b: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x8c: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x8d: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x8e: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x8f: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x90: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x91: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x92: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x93: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x94: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x95: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x96: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x97: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x98: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x99: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x9a: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x9b: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x9c: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x9d: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x9e: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0x9f: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xa0: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xa1: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xa2: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xa3: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xa4: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xa5: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xa6: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xa7: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xa8: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xa9: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xaa: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xab: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xac: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xad: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xae: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xaf: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xb0: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xb1: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xb2: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xb3: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xb4: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xb5: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xb6: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xb7: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xb8: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xb9: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xba: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xbb: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xbc: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xbd: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xbe: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xbf: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xc0: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xc1: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xc2: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xc3: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xc4: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xc5: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xc6: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xc7: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xc8: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xc9: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xca: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xcb: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xcc: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xcd: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xce: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xcf: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xd0: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xd1: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xd2: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xd3: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xd4: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xd5: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xd6: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xd7: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xd8: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xd9: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xda: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xdb: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xdc: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xdd: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xde: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xdf: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xe0: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xe1: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xe2: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xe3: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xe4: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xe5: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xe6: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xe7: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xe8: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xe9: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xea: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xeb: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xec: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xed: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xee: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xef: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xf0: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xf1: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xf2: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xf3: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xf4: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xf5: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xf6: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xf7: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xf8: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xf9: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xfa: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xfb: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xfc: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xfd: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xfe: function(name){//nop
		// 	
		// 	return name;
		// },
		// 0xff: function(name){//nop
		// 	
		// 	return name;
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
			Z80.mem[addr] = data
			return name;
		},
		ww: function(addr, data) { //16bit write
			Z80.mem[addr + 1] = data[0]; // little endian?
			Z80.mem[addr] = data[1]; // little endian?
			return name;
		},
	},

	halt: false,

	fetch: function() {
		if(typeof this.op[this.mmu.rb(this.reg.pc)] ===  typeof undefined){
			$(document).trigger('op', {
				name: 'illegal or unsupported instruction',
				type: 'error'
			});
			return false;
		}
		if(this.op[this.mmu.rb(this.reg.pc)]() && !this.halt){
			$(document).trigger('op', {
				name: '',
				type: 'ready'
			});
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