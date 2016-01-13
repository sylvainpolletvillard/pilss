[].forEach.call(document.querySelectorAll('img[data-originalsrc'), function(img){
	var hdsrc = img.getAttribute("data-originalsrc");
	var tmp = new Image();
	tmp.onload = function(){
		img.src = hdsrc;
	};
	tmp.src = hdsrc;
});