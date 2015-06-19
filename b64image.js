/////////////////////////////////////////
//
//    base64 Image Encoder / Decoder
//    
//    Copyright(c) 2015 Michael Gieson
//    www.gieson.com
//    
//    Get it:
//    http://www.gieson.com/Library/projects/utilities/base64-image
//    
//    Get it from Github.xom
//    https://github.com/bobtherobot/b64image
//    
//    MIT Licensed
//    
/////////////////////////////////////////

var imageInfo = {};
var renderDelay = 100;

function f_dragOver (evt){
	evt.stopPropagation();
	evt.preventDefault();
	// Show "copy" icon.
	// copy: A copy of the source item is made at the new location.
	// move: An item is moved to a new location.
	// link: A link is established to the source at the new location.
	// none: The item may not be dropped.
	evt.dataTransfer.dropEffect = 'copy';
}

function f_local (url){
	
	var img = new Image();
	img.src = url;
	imageInfo.image = img;
	imageInfo.data = url;
	finalizeImg();
	
}

function f_loaded (evt){
	
	var img = new Image();
	var elem = evt.target || evt.srcElement;
	img.src = elem.result;
	
	imageInfo.image = img;
	
	finalizeImg();

}

function getLocalImageData(theImage, kind){
	var canvas = document.createElement('canvas');
		canvas.width = theImage.width;
		canvas.height = theImage.height;
		var context = canvas.getContext('2d');
		context.drawImage(theImage, 0, 0 );
		
		var mime = "";
		if(kind == "jpg"){
			mime = 'image/jpeg';
		}
		var myData = canvas.toDataURL(mime);
		
		/*
		// get png data url
		var pngUrl = canvas.toDataURL();

		// get jpeg data url 
		var jpegUrl = canvas.toDataURL('image/jpeg');

		// get low quality jpeg data url
		var lowQualityJpegUrl = canvas.toDataURL('image/jpeg', 0.2);
		*/
		context = null;
		canvas = null;
		
		return myData;
}
function updateImage(){
	var targ = document.getElementById("imageTarget");

	// Empty node
	while(targ.firstChild){
	    targ.removeChild(targ.firstChild);
	}
	targ.appendChild(imageInfo.image);
}
function finalizeImg (){
	updateImage();
	// Need to wait until the browser renders the image into the DOM before we can access it.
	setTimeout(doImageToText, renderDelay);
}

function humanFileSize(size) {
    var i = Math.floor( Math.log(size) / Math.log(1024) );
    return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
};

function randomInt(minNum, maxNum) {
	return Math.round( minNum + (Math.random() * (maxNum - minNum)) );
}

function getContents(id){
	var elem = document.getElementById(id);
	var type = elem.tagName.toLowerCase();
	if(type == "input" || type == "textarea"){
		return elem.value;
	} else {
		return elem.innerHTML;
	}
}
function setContents(id, val){
	var elem = document.getElementById(id);
	var type = typeof elem;
	if(type == "input"){
		elem.value = val;
	} else {
		elem.innerHTML = val;
	}
}

function doImageToText(){
	var ext = imageInfo.name.split(".").pop();
	var img = imageInfo.image;
	var str = getLocalImageData(img, ext);
	
	setContents("outAsRaw", str);
	
	updateOutAsFields(str, img.width, img.height);
}

function updateOutAsFields(str, w, h) {
	
	setContents("charCount", humanFileSize(str.length));
	setContents("imageDimsW", w);
	setContents("imageDimsH", h);
	
	// CSS Class
	var cssOut = [
		  ".embeddedImage" + randomInt(0, 1000) + " {"
		, "	position : relative;"
		, "	display : inline-block;"
		, "	width : " + w + "px;"
		, "	height : " + h + "px;"
		, "	/* Maintain aspect ratio: */"
		, "	background-size : contain;"
		, "	/* Squish to exact width/height: */"
		, "	/* background-size : 100% 100%; */"
		, "	background-repeat : no-repeat;"
		, "	background-position : center center;"
		, "	background-image : url('" + str + "');"
		, "}"
	];
	
	setContents("outAsCss", cssOut.join("\n"));
	
	// HTML Image
	var imgOut = '<img alt="my image" width=' + w + ' height=' + h + ' src="' + str + '" />';
	setContents("outAsImg", imgOut);
}

function f_drop (evt){
	evt.stopPropagation();
 	evt.preventDefault();

	// Clear imageInfo
	imageInfo = null;
	imageInfo = {};

	var f;
	
	var url = evt.dataTransfer.getData("url");
	if(url){
		f_local(url);
		
	} else {
		f = evt.dataTransfer.files[0];
		//for(var prop in f){

			imageInfo.size = f.size;
			imageInfo.type = f.type;
			imageInfo.name = f.name;
			imageInfo.date = f.lastModifiedDate ? f.lastModifiedDate : new Date();
			//imageInfo.data.url = window.URL.createObjectURL(f); // creates a blob reference (not very useful)
		
		//}

		var reader = new FileReader();
		reader.onload = f_loaded;
		reader.readAsDataURL(f);
	}
	

	
}


function pasteText(){
	setTimeout(doPaste, renderDelay);
}

function doPaste(){
	
	var val = getContents("outAsRaw");
	
	// Basic cleaning (remove quotes)
	val = val.replace(/[\"\']/g, "");
	
	// Check if user included url(
	val = val.replace("url(", "");
	val = val.replace(");", "");
	
	// Make sure we have the data attributes	
	if(val.substr(0, 4) !== "data"){
		// Assume PNG
		val = "data:image/png;base64," + val;
	}
	
	// Only accept valid base64 characters in the data portion
	val = val.split(",");
	val[1] = val[1].replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\+\/\=]/g, "");
	val = val.join(",");
	
	// Put back into textarea
	setContents("outAsRaw", val);
	
	var img = new Image();
	img.src = val;
	
	imageInfo.image = img;
	imageInfo.data = val;
	updateImage();
	
	setTimeout(doUpdateOutFields, renderDelay);
	
	
}

function doUpdateOutFields(){
	var img = imageInfo.image;
	updateOutAsFields(imageInfo.data, img.width, img.height)
}

function selectAll(e) {
	var elem = e.target;
    elem.focus();
    elem.select();
}

function init(){
	var el = document.getElementById("imageTarget");
	el.addEventListener('dragover', f_dragOver, false); 
	el.addEventListener('drop', f_drop, false);
	
	el = document.getElementById("outAsRaw");
	el.addEventListener('click', selectAll, false);
	
	el = document.getElementById("outAsCss");
	el.addEventListener('click', selectAll, false);
	
	el = document.getElementById("outAsImg");
	el.addEventListener('click', selectAll, false);
}

function setNewBkgdColor(evt){
	var val = getContents("bkgdColorChooser");
	var elem = document.getElementById("imageTarget");
	elem.style.backgroundColor = val;
	
}

document.addEventListener("DOMContentLoaded", function() {
  init();
});