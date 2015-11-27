var debug=true,
offset=0,
paginate_by=256;
page_elements = Z80.mem.length/paginate_by;
var debgr = function(obj){
	var css_class='notempty';
	$('#last-op').append(obj.name ? ops_table[obj.name].name+' - ':'');
	$('#regs').html('');
	for(key in Z80.reg){
		$('#regs').append(['<div class="input-group ', Z80.reg[key] ? css_class : '' ,'"><span class="input-group-label">', key , ':</span><input class="input-group-field" type="text" data-reg="',key,'" value="' , binary(Z80.reg[key], (key==='sp'||key==='pc'||key==='ix'||key==='iy') ? 16 : 8) , '"><a class="input-group-button button js-write-reg"></a></div>'].join(''));
	}
		
		$('#mem').html('');
		for (i=offset; i<Z80.mem.length/page_elements+offset; i++){
			$('#mem').append([
				'<div class="small-6 medium-3 large-2 column '
				, Z80.mem[i] ? css_class : ''
				,'"><div class="input-group"><span class="input-group-label">'
				, hex(i,16)
				,': </span><input class="input-group-field" type="text" id="'
				, i 
				,'" value="',hex(Z80.mem[i]),'"">'
				, '<a class="input-group-button button js-write-mem"></a></div></div>'
				].join(''));
		}
	return obj.offset;		
}
var paginate = function(offset){
	var current_page = Math.floor(offset/paginate_by),
	select = [];
		select.push(['<li><a href="#" class="',!current_page?'disabled ':'',' js-pageprev" aria-label="Prev page">Prev <span class="show-for-sr">page</span></a></li>','<li><a href="#" class="',!current_page===limit?'disabled ':'','js-pagenext" aria-label="Next page">Next <span class="show-for-sr">page</span></a></li>'].join(''));
		var limit = Math.floor((Z80.mem.length-1)/paginate_by), middle_page = Math.floor(limit /2);

		for (i=0; i<limit; i++){
			
			if(i<current_page+6 && i>current_page-6 && i>=0){
				select.push([
					'<li><a ',i===current_page?'class="current"':'','data-page="'
					, i*paginate_by
					,'">'
					, i
					,'</a></li>'
					].join(''));
			} else if (i===0){
				select.push([
					'<li><a ',i===current_page?'class="current"':'','data-page="'
					, i*paginate_by
					,'">'
					, i
					,'</a></li>'
					,'<li><span class="disabled">...</span></li>'
					].join(''));
			} else if(i===limit-1){
				select.push([
					'<li><span class="disabled">...</span></li>'
					,'<li><a ',i===current_page?'class="current"':'','data-page="'
					, i*paginate_by
					,'">'
					, i
					,'</a></li>'
					].join(''));
			}
		}
		
		$('#select').html(select);
		select = [];
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
								'<li><a href="javascript:void(0);" data-open="oplist" >Available Instruction Set</a></li>',
							'</ul>',
						'</li>',
						'<li><a class="js-reset" href="javascript:void(0);">Reset</a></li>',
						'<li><a data-open="oplist" href="javascript:void(0);">Available Instructions Set</a></li>',
					'</ul>',
				'</div>',
			'</div>',
			'<div class="row mt40"><div class="hide float-left"><label>Paginate by<input class="js-paginate-by" type="number" value="' , paginate_by , '"></label></div><div class="float-left"><ul id="select" class="pagination" role="navigation" aria-label="Pagination"></ul></div></div>',
			'<div class="row">',
				'<div class="medium-7 large-8 column" ><div id="mem" class="row"></div></div>',
				'<div id="regs" class="medium-3 large-2 column" ></div>',
				'<div id="input" class="medium-2 large-2 column">',
					'<textarea id="op"></textarea>',
					'<button class="expanded button js-exec">Execute</button>',
					'<p id="last-op"></p>',

				'</div>',				
			'</div>',
			'<div class="reveal" id="oplist" data-reveal >',
			'</div>'
			].join(''));
		paginate(0);
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
				'<tr class="js-exec-op op" data-close aria-label="Close reveal" data-op="', op ,'"><td>',hex(parseInt(op,10)),'</td><td>',ops_table[op].name,'</td><td>',ops_table[op].description,'</td></tr>'
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
		paginate(debgr({name:'', type:'ready', offset: 0 }));
		$(document).foundation();
		$(document)
			.on('op', function(e,obj){
				debgr(obj);
			})
			.on('click touchstart', '.js-pageprev' , function(e){
				e.preventDefault();
				$('[data-page]').removeClass('current');
				if(offset>paginate_by) {
					$(this).removeClass('disabled');
					offset -=paginate_by;
				}else{
					offset =0;
					$(this).addClass('disabled');
				}		
				paginate(debgr({name:'', type:'ready', offset: offset}));
				$('[data-page="' + offset + '"]').addClass('current');
			})
			.on('click touchstart', '.js-pagenext' , function(e){
				e.preventDefault();
				$('[data-page]').removeClass('current');
				if(offset<=Z80.mem.length-paginate_by) {
					$(this).removeClass('disabled');
					offset +=paginate_by;
				}else{
					$(this).addClass('disabled');
				}
				paginate(debgr({name:'', type:'ready', offset: offset }));
				$('[data-page="' + offset + '"]').addClass('current');
			})
			.on('click touchstart', '.js-exec' , function(e){
				$('#last-op').html('');
				e.preventDefault();
				var op = $('#op').val().match(/.{1,2}/g);
				for(var i=0; i<op.length; i++){
					Z80.mmu.wb(i,parseInt(op[i],16));
				}
				Z80.fetch();
				debgr({name:'', type:'ready', offset: 0 });
			}).on('click touchstart', '.js-reset' , function(e){
				$('#last-op').html('');
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
				paginate(debgr({name:'', type:'ready', offset: offset }));
			}).on('change','.js-paginate-by', function(){
				paginate_by = $(this).val();
				paginate(debgr({name:'', type:'ready', offset: offset }));
			}).on('click touchstart', '.js-write-mem' , function(e){
				e.preventDefault();
				var $parent = $(this).parent(),
					addr = $parent.find('input').attr('id'),
				mem = parseInt($parent.find('input').val(),16);
				Z80.mem[addr] = mem;
				debgr({name:'', type:'ready', offset: 0 });
			}).on('click touchstart', '.js-write-reg' , function(e){
				e.preventDefault();
				var $this = $(this).parent().find('input'),
					reg = $this.attr('data-reg');
				Z80.reg[reg] = parseInt($this.val(),2);
				debgr({name:'', type:'ready', offset: 0 });
			})
			.on('click touchstart', '.js-exec-op' , function(e){
				e.preventDefault();
				var op= parseInt($(this).attr('data-op'),10);
				Z80.op[op]();
				debgr({name:'', type:'ready', offset: 0 });
			});
	}
});