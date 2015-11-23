var debug=true,
offset=0,
select = [],
paginate_by=2048;
page_elements = Z80.mem.length/paginate_by;
var debgr = function(obj){
	var css_class='notempty';
	$('#last-op').append(obj.name ? ops_table[obj.name].name+' - ':'');
	$('#regs').html('');
	for(key in Z80.reg){
		$('#regs').append(['<div class="', Z80.reg[key] ? css_class : '' ,'">', key , ': ' , binary(Z80.reg[key], (key==='sp'||key==='pc') ? 16 : 8) , '</div>'].join(''));
	}
	// if(obj.type === 'ready'){
		$('#last-op').html('');
		$('#mem').html('');
		for (i=offset; i<Z80.mem.length/page_elements+offset; i++){
			$('#mem').append([
				'<div class="small-6 medium-4 large-2 column '
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
	// }		
}
$(function(){
	if(debug){
		$('body').html([
			'<div class="top-bar">',
				'<div class="top-bar-left">',
					'<ul class="dropdown menu" data-dropdown-menu>',
						'<li class="menu-text">Z80 Debugger</li>',
						'<li class="has-submenu">',
							'<a href="javascript:void(0);">CPU</a>',
							'<ul class="submenu menu vertical" data-submenu>',
								'<li><a class="js-reset" href="javascript:void(0);">Reset</a></li>',
								'<li><a href="javascript:void(0);" data-open="oplist" >Scan Opcodes</a></li>',
							'</ul>',
						'</li>',
						'<li><a class="js-reset" href="javascript:void(0);">Reset</a></li>',
						'<li><a data-open="oplist" href="javascript:void(0);">Scan opcodes</a></li>',
					'</ul>',
				'</div>',
			'</div>',
			'<div class="row mt40"><ul id="select" class="pagination" role="navigation" aria-label="Pagination"></ul></div>',
			'<div class="row">',
				'<div class="medium-6 large-7 column" ><div id="mem" class="row"></div></div>',
				'<div id="regs" class="medium-3 large-2 column" ></div>',
				'<div id="input" class="medium-3 large-3 column">',
					'<label>op</label>',
					'<textarea id="op"></textarea>',
					'<button class="button js-exec">Execute</button>',
					'<p id="last-op"></p>',

				'</div>',				
			'</div>',
			'<div class="reveal" id="oplist" data-reveal data-animation-in="spin-in" data-animation-out="spin-out">',
			'</div>'
			].join(''));
		select.push('<li><a href="#" class="disabled js-pageprev" aria-label="Prev page">Prev <span class="show-for-sr">page</span></a></li>');
		for (i=0; i<Z80.mem.length/(paginate_by+1); i++){
			select.push([
				'<li><a ',!i?'class="current"':'','data-page="'
				, i*paginate_by
				,'">'
				, i
				,'</a></li>'
				].join(''));
		}
		select.push('<li><a href="#" class="js-pagenext" aria-label="Next page">Next <span class="show-for-sr">page</span></a></li>');
		$('#select').append(select);
		select = []; 
		var oplist = [
		'<p class="lead">Available operations:</p>',
		'<p>In this table: on the left hexadecial code of the Operation, on the right </p>',
		'<table>',
			'<thead>',
				'<tr>',
					'<th width="200">Code</th>',
					'<th width="500">Operation</th>',
					'<th width="500">Description</th>',
				'</tr>',
			'</thead>',
		'<tbody>',
		];
		for (op in Z80.op){
			oplist.push([
				'<tr><td>',hex(parseInt(op,10)),'</td><td>',ops_table[op].name,'</td><td>',ops_table[op].description,'</td></tr>'
				].join(''));
		}
		oplist.push([
		'</tbody>',
		'</table>',		
				'<button class="close-button" data-close aria-label="Close reveal" type="button">',
				'<span aria-hidden="true">&times;</span>',
				'</button>',
				].join(''));
		$('#oplist').html(oplist.join(''));
		debgr({name:'', type:'ready', offset: 0 });
		$(document).foundation();
		$(document)
			.on('op', function(e,obj){
				debgr(obj);
			})
			.on('click touchstart', '.js-pageprev' , function(e){
				e.preventDefault();
				$('[data-page]').removeClass('current');
				$('.js-pagenext').removeClass('disabled');
				if(offset>Z80.mem.length/(paginate_by+1)) {
					$(this).removeClass('disabled');
					offset -=paginate_by;
				}else{
					offset =0;
					$(this).addClass('disabled');
				}		
				debgr({name:'', type:'ready', offset: offset});
				$('[data-page="' + offset + '"]').addClass('current');
			})
			.on('click touchstart', '.js-pagenext' , function(e){
				e.preventDefault();
				$('[data-page]').removeClass('current');
				$('.js-pageprev').removeClass('disabled');
				if(offset<=Z80.mem.length-(Z80.mem.length/(paginate_by+1))) {
					$(this).removeClass('disabled');
					offset +=paginate_by;
				}else{
					$(this).addClass('disabled');
				}
				debgr({name:'', type:'ready', offset: offset });
				$('[data-page="' + offset + '"]').addClass('current');
			})
			.on('click touchstart', '.js-exec' , function(e){
				e.preventDefault();
				var op = $('#op').val().match(/.{1,2}/g);
				for(var i=0; i<op.length; i++){
					Z80.mmu.wb(i,parseInt(op[i],16));
				}
				Z80.fetch();
				debgr({name:'', type:'ready', offset: 0 });
			}).on('click touchstart', '.js-reset' , function(e){
				e.preventDefault();
				Z80.reset();
				debgr({name:'', type:'ready', offset: 0 });
			}).on('click touchstart','[data-page]', function(){
				offset = parseInt($(this).attr('data-page'),10);
				if (offset) {
					$('.js-pageprev').removeClass('disabled');
				} else {
					$('.js-pageprev').addClass('disabled');
				}
				$('[data-page]').removeClass('current');
				$(this).addClass('current');
				debgr({name:'', type:'ready', offset: offset });
			});
	}
});