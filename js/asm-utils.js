var binary = function(n,precision){
	var padding = '';
	if(arguments.length<2){
		padding = "00000000";		
	} else {
		switch(precision){
			case 16:
			padding = "0000000000000000";
			break;
			default:
			padding = "00000000";
		}
	}
	n=n.toString(2);
	return padding.substr(n.length)+n;
}
var hex = function(n,precision){
	var padding = "00";
	if(arguments.length<2){
		// do nothing		
	} else {
		switch(precision){
			case 16:
			padding = "0000"
			break;
		}
	}
	if (typeof n === typeof undefined || isNaN(n)){
		n=0;
	}
	n=n.toString(16);
	return padding.substr(n.length)+n;
}