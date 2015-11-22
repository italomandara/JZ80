var debug=true,
offset=0;
var debgr = function(obj){
	var css_class='notempty';
	$('#last-op').append(obj.name).append(' - ');
	$('#regs').html('');
	for(key in Z80.reg){
		$('#regs').append(['<div class="', Z80.reg[key] ? css_class : '' ,'">', key , ': ' , binary(Z80.reg[key], (key==='sp'||key==='pc') ? 16 : 8) , '</div>'].join(''));
	}
	if(obj.type === 'ready'){
		$('#last-op').html('');
		$('#mem').html('');
		for (i=obj.offset; i<Z80.mem.length/255+obj.offset; i++){
			$('#mem').append([
				'<div class="'
				, Z80.mem[i] ? css_class : ''
				,'">'
				, hex(i,16)
				,' : <span id="'
				, i 
				,'">'
				, hex(Z80.mem[i])
				, '</span></div>'
				].join(''));
		}
	}
		
}
$(function(){
	if(debug){
		$('body').html([
			'<div class="table">',
			'<div id="sel" ><select id="select"></select><a href="#" id="prev"><</a href="#"><a href="#" id="next">></a href="#"></div>',
				'<div id="mem" ></div>',
				'<div id="regs" ></div>',
				'<div id="input" >',
					'<button id="reset">Reset</button>',
					'<div id="oplist"></div>',
					'<label>op</label>',
					'<textarea id="op"></textarea>',
					'<button id="exec">Execute</button>',
				'</div>',
				'<div id="last-op" ></div>',
			'</div>'
			].join(''));
		for (i=0; i<Z80.mem.length/257; i++){
			$('#select').append([
				'<option value="'
				, i*256
				,'">'
				, i
				,'</option>'
				].join(''));
		}
		$('#oplist').html((Object.keys(Z80.op)).join(', '));
		debgr({name:'none', type:'ready', offset: 0 });
		$(document)
			.on('op', function(e,obj){
				debgr(obj);
				console.log(obj)
			})
			.on('click touchstart', '#prev' , function(e){
				e.preventDefault();
				debgr({name:'none', type:'ready', offset: offset>Z80.mem.length/257 ? offset -=Z80.mem.length/255 : 0});
			})
			.on('click touchstart', '#next' , function(e){
				e.preventDefault();
				debgr({name:'none', type:'ready', offset: offset<Z80.mem.length-(Z80.mem.length/257) ? offset +=Z80.mem.length/255: offset });
			})
			.on('click touchstart', '#exec' , function(e){
				e.preventDefault();
				var op = $('#op').val().match(/.{1,2}/g);
				for(var i=0; i<op.length; i++){
					Z80.mmu.wb(i,parseInt(op[i],16));
				}
				Z80.fetch();
				debgr({name:'none', type:'ready', offset: 0 });
			}).on('click touchstart', '#reset' , function(e){
				e.preventDefault();
				Z80.reset();
				debgr({name:'none', type:'ready', offset: 0 });
			}).on('change','#select', function(){
				offset = parseInt($(this).val(),10);
				debgr({name:'none', type:'ready', offset: offset });
			});
	}
});