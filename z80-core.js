var Z80 = {
	utils: {
		dBy2W : function(arr){
			return (arr[0] * 256)+arr[1];
		},
		split8 : function(data){
			return data.toString(16).match(/.{1,2}/g);
		},
		setBit: function(pos,num,set){
			return set? Math.pow(2, pos) | num : ~Math.pow(2, pos) & num;
		},
		rdBit: function(pos,num){
			var mask = 1 << pos;
			return (num & mask) != 0 ? 1 : 0 ;
		},
		flag_S: function(set){
			Z80.reg.f = Z80.utils.setBit(7,Z80.reg.f,set);
		},
		flag_Z: function(set){
			Z80.reg.f = Z80.utils.setBit(6,Z80.reg.f,set);
		},
		flag_H: function(set){
			Z80.reg.f = Z80.utils.setBit(4,Z80.reg.f,set);
		},
		flag_PV: function(set){
			Z80.reg.f = Z80.utils.setBit(2,Z80.reg.f,set);
		},
		flag_N: function(set){
			Z80.reg.f = Z80.utils.setBit(1,Z80.reg.f,set);
		},
		flag_C: function(set){
			Z80.reg.f = Z80.utils.setBit(0,Z80.reg.f,set);
		},
	},
	core: {
		ld8toReg : function(reg_name){
			var data = Z80.mmu.rb(Z80.reg.pc+1);
			Z80.reg[reg_name] = data;
			Z80.reg.pc += 2;
		},
		ld16toReg : function(reg_name1,reg_name2){
			var data = Z80.mmu.rw(Z80.reg.pc+1);
			Z80.reg[reg_name1] = data[0];
			Z80.reg[reg_name2] = data[1];
			Z80.reg.pc += 3;
		},
		ldReg16toMem : function(reg1,reg2){
			var addr = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc+1));
			Z80.mmu.ww(addr,[Z80.reg[reg1],Z80.reg[reg2]]);
			Z80.reg.pc += 3;
		},
		ldRegtoMemDir : function(reg){
			var addr = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc+1));
			Z80.mmu.wb(addr,Z80.reg[reg]);
			Z80.reg.pc += 3;
		},
		ldMem16toReg : function(reg1,reg2){
			var data = Z80.mmu.rw(Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc+1)));
			Z80.reg[reg1] = data[0];
			Z80.reg[reg2] = data[1];
			Z80.reg.pc += 3;
		},
		ld16toReg16 : function(reg){
			Z80.reg[reg] = Z80.utils.dBy2W(Z80.mmu.rw(Z80.reg.pc+1));
			Z80.reg.pc += 3;
		},
		ldRegtoMem : function(reg_ptr1,reg_ptr2,reg_source){
			var addr = Z80.utils.dBy2W([Z80.reg[reg_ptr1],Z80.reg[reg_ptr2]]);
			Z80.mmu.wb(addr,Z80.reg[reg_source]);
			Z80.reg.pc ++;
		},
		ldMemtoReg : function(reg_target,reg_ptr1,reg_ptr2){
			var addr = Z80.utils.dBy2W([Z80.reg[reg_ptr1],Z80.reg[reg_ptr2]]);
			Z80.reg[reg_target] = Z80.mmu.rb(addr);
			Z80.reg.pc ++;
		},
	},
	op: {
		0x00: function() { // nop
			if(debug){$(document).trigger('op', {name:'nop'});}
			return false;
		},
		0x01: function() { // LD BC **
			Z80.core.ld16toReg('b','c');
			if(debug){
				$(document).trigger('op', {name:'LD BC **'});
			}
			return true;
		},
		0x02: function() { // LD (BC), A
			Z80.core.ldRegtoMem('b','c','a')			
			if(debug){$(document).trigger('op', {name:'LD (BC), A'});}
			return true;
		},
		0x03: function() { // INC BC
			Z80.reg.c ++;
			if(Z80.reg.c > 0xff){
				Z80.reg.b ++;
				Z80.reg.c =0;
				Z80.reg.f = 0xFF;
			}
			if(Z80.reg.b > 0xff){
				Z80.reg.b = 0;
				Z80.reg.f = 0xFF;
			}
			Z80.reg.pc ++;
			if(debug){$(document).trigger('op', {name:'INC BC'});}
			return true;
		},
		0x04: function() { // INC B
			if (Z80.reg.b === 0xFF){
				Z80.reg.f = 0xFF;
			}
			Z80.reg.b++;
			Z80.reg.pc ++;
			if(debug){$(document).trigger('op', {name:'INC B'});}
			return true;
		},
		// 0x05: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x06: function() { // LD B *
			Z80.core.ld8toReg('b');
			if(debug){
				$(document).trigger('op', {name:'LD B *'});
			}
			return true;
		},
		// 0x07: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x08: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x09: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x0a: function() { // LD A, (BC)
			Z80.core.ldMemtoReg('a','b','c');
			if(debug){$(document).trigger('op', {name:'LD A, (BC)'});}
			return true;
		},
		// 0x0b: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x0c: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x0d: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x0e: function() { // LD C *
			Z80.core.ld8toReg('c');
			if(debug){
				$(document).trigger('op', {name:'LD C *'});
			}
			return true;
		},
		// 0x0f: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x10: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x11: function() { // LD DE **
			Z80.core.ld16toReg('d','e');
			if(debug){
				$(document).trigger('op', {name:'LD DE **'});
			}
			return true;
		},
		0x12: function(){//LD (DE), A
			Z80.core.ldRegtoMem('d','e','a')			
			if(debug){$(document).trigger('op', {name:'LD (DE), A'});}
			return true;
		},
		// 0x13: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x14: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x15: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x16: function(){//nop
			Z80.core.ld8toReg('d');
			if(debug){$(document).trigger('op', {name:'LD d, *'});}
			return true;
		},
		// 0x17: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x18: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x19: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x1a: function(){//nop
			Z80.core.ldMemtoReg('a','d','e');
			if(debug){$(document).trigger('op', {name:'LD A, (DE)'});}
			return true;
		},
		// 0x1b: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x1c: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x1d: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x1e: function(){//nop
			Z80.core.ld8toReg('e');
			if(debug){$(document).trigger('op', {name:'LD e, *'});}
			return true;
		},
		// 0x1f: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x20: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x21: function() { // LD HL **
			Z80.core.ld16toReg('h','l');
			if(debug){
				$(document).trigger('op', {name:'LD HL **'});
			}
			return true;
		},
		0x22: function(){// LD (**) HL
			Z80.core.ldReg16toMem('h','l');
			if(debug){$(document).trigger('op', {name:'LD (**) HL'});}
			return true;
		},
		// 0x23: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x24: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x25: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x26: function() { // LD H *
			Z80.core.ld8toReg('h');
			if(debug){
				$(document).trigger('op', {name:'LD H *'});
			}
			return true;
		},
		// 0x27: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x28: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x29: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x2a: function(){// ld hl (**)
			Z80.core.ldMem16toReg('h','l');
			if(debug){$(document).trigger('op', {name:'LD HL (**)'});}
			return true;
		},
		// 0x2b: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x2c: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x2d: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x2e: function() { // LD L *
			Z80.core.ld8toReg('l');
			if(debug){
				$(document).trigger('op', {name:'LD L *'});
			}
			return true;
		},
		// 0x2f: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x30: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		0x31: function(){// ld SP **
			Z80.core.ld16toReg16('sp');
			if(debug){$(document).trigger('op', {name:'LD SP **'});}
			return true;
		},
		0x32: function(){//LD (**),a
			Z80.core.ldRegtoMemDir('a');
			if(debug){$(document).trigger('op', {name:'LD (**), A'});}
			return true;
		},
		// 0x33: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x34: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x35: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x36: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x37: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x38: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x39: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x3a: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x3b: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x3c: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x3d: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x3e: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x3f: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x40: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x41: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x42: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x43: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x44: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x45: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x46: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x47: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x48: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x49: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x4a: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x4b: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x4c: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x4d: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x4e: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x4f: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x50: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x51: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x52: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x53: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x54: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x55: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x56: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x57: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x58: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x59: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x5a: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x5b: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x5c: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x5d: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x5e: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x5f: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x60: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x61: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x62: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x63: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x64: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x65: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x66: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x67: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x68: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x69: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x6a: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x6b: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x6c: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x6d: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x6e: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x6f: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x70: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x71: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x72: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x73: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x74: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x75: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x76: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x77: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x78: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x79: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x7a: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x7b: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x7c: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x7d: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x7e: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x7f: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x80: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x81: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x82: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x83: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x84: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x85: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x86: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x87: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x88: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x89: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x8a: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x8b: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x8c: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x8d: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x8e: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x8f: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x90: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x91: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x92: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x93: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x94: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x95: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x96: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x97: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x98: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x99: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x9a: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x9b: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x9c: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x9d: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x9e: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0x9f: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xa0: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xa1: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xa2: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xa3: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xa4: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xa5: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xa6: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xa7: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xa8: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xa9: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xaa: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xab: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xac: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xad: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xae: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xaf: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xb0: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xb1: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xb2: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xb3: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xb4: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xb5: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xb6: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xb7: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xb8: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xb9: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xba: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xbb: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xbc: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xbd: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xbe: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xbf: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xc0: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xc1: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xc2: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xc3: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xc4: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xc5: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xc6: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xc7: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xc8: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xc9: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xca: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xcb: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xcc: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xcd: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xce: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xcf: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xd0: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xd1: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xd2: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xd3: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xd4: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xd5: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xd6: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xd7: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xd8: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xd9: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xda: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xdb: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xdc: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xdd: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xde: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xdf: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xe0: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xe1: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xe2: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xe3: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xe4: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xe5: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xe6: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xe7: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xe8: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xe9: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xea: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xeb: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xec: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xed: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xee: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xef: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xf0: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xf1: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xf2: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xf3: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xf4: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xf5: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xf6: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xf7: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xf8: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xf9: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xfa: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xfb: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xfc: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xfd: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xfe: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
		// },
		// 0xff: function(){//nop
		// 	if(debug){$(document).trigger('op', {name:''});}
		// 	return false;
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
		ix: 0,
		iy: 0,
		sp: 0, //16bit
		pc: 0 //16bit
	},
	mem: new Uint8ClampedArray(65535),
	mmu: {
		rb: function(addr){//8bit read
			if(debug){console.log('rb',addr);}
			return Z80.mem[addr];
		},
		rw: function(addr){//16bit read
			if(debug){console.log('rw',addr);}
			return [Z80.mem[addr+1],Z80.mem[addr]]; // little endian?
		},
		wb: function(addr,data){//8bit write
			if(debug){console.log('wb',hex(addr,16),hex(data));}
			Z80.mem[addr] = data
			return true;
		}, 
		ww: function(addr,data){//16bit write
			if(debug){console.log('ww',hex(addr,16),hex(data));}
			Z80.mem[addr+1] = data[0]; // little endian?
			Z80.mem[addr] = data[1]; // little endian?
			return true;
		}, 
	},
	queue: {
		f: [],
		exec: function(){
			if (typeof this.f[0] === 'function'){
					if(this.f[0]()){
					this.f.shift();
					Z80.fetch();
					} else {
						this.f = [];
					}
			}
		},
	},
	fetch: function(){
		Z80.queue.f.push(Z80.op[Z80.mmu.rb(Z80.reg.pc)])
	},
	clk: setInterval(function(){Z80.queue.exec();},1000),
	reset: function(){
		Z80.queue.f = [];
		for(key in Z80.reg){
			Z80.reg[key] = 0;
		}
		for (i=0; i < Z80.mem.length; i++){
			Z80.mem[i] = 0;
		}
		if(debug){$(document).trigger('op', {name:'ready'});}
	}
};
