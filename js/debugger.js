var debug=true,
offset=0,
select = [],
paginate_by=1024;
page_elements = Z80.mem.length/paginate_by;
var debgr = function(obj){
	var css_class='notempty';
	$('#last-op').append(obj.name ? ops_table[obj.name].name+' - ':'');
	$('#regs').html('');
	for(key in Z80.reg){
		$('#regs').append(['<div class="', Z80.reg[key] ? css_class : '' ,'">', key , ': ' , binary(Z80.reg[key], (key==='sp'||key==='pc') ? 16 : 8) , '</div>'].join(''));
	}
	if(obj.type === 'ready'){
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
	}		
}
$(function(){
	if(debug){
		$('body').html([			
			'<div class="row"><ul id="select" class="pagination" role="navigation" aria-label="Pagination"></ul></div>',
			'<div class="row">',
				'<div class="medium-6 large-7 column" ><div id="mem" class="row"></div></div>',
				'<div id="regs" class="medium-3 large-2 column" ></div>',
				'<div id="input" class="medium-3 large-3 column">',
					'<label>op</label>',
					'<textarea id="op"></textarea>',
					'<button id="exec" class="button">Execute</button>',
					'<button class="button" data-toggle="oplist">Ops list</button>',
					'<button id="reset" class="button alert">Reset</button>',
					'<p id="last-op"></p>',

				'</div>',				
			'</div>',
			'<div class="reveal" id="oplist" data-reveal>',
			'</div>'
			].join(''));
		select.push('<li><a id="prev" href="#" class="disabled" aria-label="Prev page">Prev <span class="show-for-sr">page</span></a></li>');
		for (i=0; i<Z80.mem.length/(paginate_by+1); i++){
			select.push([
				'<li><a ',!i?'class="current"':'','data-page="'
				, i*paginate_by
				,'">'
				, i
				,'</a></li>'
				].join(''));
		}
		select.push('<li><a id="next" href="#" aria-label="Next page">Next <span class="show-for-sr">page</span></a></li>');
		$('#select').append(select);
		var oplist = [
		'<p class="lead">Available operations:</p>',
		'<p>In this table: on the left hexadecial code of the Operation, on the right </p>',
		'<table>',
			'<thead>',
				'<tr>',
					'<th width="200">Code</th>',
					'<th width="500">Operation</th>',
				'</tr>',
			'</thead>',
		'<tbody>',
		];
		for (op in Z80.op){
			oplist.push([
				'<tr><td>',hex(parseInt(op,10)),'</td><td><span data-tooltip aria-haspopup="true" class="has-tip" data-disable-hover="False" tabindex=1 title="',ops_table[op].description,'">',ops_table[op].name,'</span></td></tr>'
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
		$(document)
			.on('op', function(e,obj){
				debgr(obj);
			})
			.on('click touchstart', '#prev' , function(e){
				e.preventDefault();
				$('[data-page]').removeClass('current');
				$('#next').removeClass('disabled');
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
			.on('click touchstart', '#next' , function(e){
				e.preventDefault();
				$('[data-page]').removeClass('current');
				$('#prev').removeClass('disabled');
				if(offset<=Z80.mem.length-(Z80.mem.length/(paginate_by+1))) {
					$(this).removeClass('disabled');
					offset +=paginate_by;
				}else{
					$(this).addClass('disabled');
				}
				debgr({name:'', type:'ready', offset: offset });
				$('[data-page="' + offset + '"]').addClass('current');
			})
			.on('click touchstart', '#exec' , function(e){
				e.preventDefault();
				var op = $('#op').val().match(/.{1,2}/g);
				for(var i=0; i<op.length; i++){
					Z80.mmu.wb(i,parseInt(op[i],16));
				}
				Z80.fetch();
				debgr({name:'', type:'ready', offset: 0 });
			}).on('click touchstart', '#reset' , function(e){
				e.preventDefault();
				Z80.reset();
				debgr({name:'', type:'ready', offset: 0 });
			}).on('click touchstart','[data-page]', function(){
				offset = parseInt($(this).attr('data-page'),10);
				if (offset) {
					$('#prev').removeClass('disabled');
				} else {
					$('#prev').addClass('disabled');
				}
				$('[data-page]').removeClass('current');
				$(this).addClass('current');
				debgr({name:'', type:'ready', offset: offset });
			});
		$(document).foundation();
	}
});