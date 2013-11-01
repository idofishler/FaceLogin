var video;
var canvas;
var ctx;
var localMediaStream;
var dataUrl;
var nameSpace = "@faceLogin";

function hasGetUserMedia() {
	// Note: Opera is unprefixed.
	return !!(navigator.getUserMedia || navigator.webkitGetUserMedia
			|| navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

if (hasGetUserMedia()) {
	// Good to go!
} else {
	alert('getUserMedia() is not supported in your browser');
}

var onFailSoHard = function(e) {
	alert("FAIL");
	console.log('Reeeejected!', e);
};

var encrypt = function(input) {
	return input;
	// TODO encrypt
//	return CryptoJS.AES.encrypt(input, "Secret Passphrase");
};

var decrypt = function(input) {
	return input;
	// TODO decrypt
//	return CryptoJS.AES.decrypt(input, "Secret Passphrase").toString(
//			CryptoJS.enc.Utf8);
};

var displayVideo = function(stream) {
	while (!video) {
		setTimeout(displayVideo, 100);
	}
	video.src = window.URL.createObjectURL(stream);
	localMediaStream = stream;
};

function dataURItoBlob(dataURI, callback) {
	// convert base64 to raw binary data held in a string
	// doesn't handle URLEncoded DataURIs
	var byteString;
	if (dataURI.split(',')[0].indexOf('base64') >= 0) {
		byteString = atob(dataURI.split(',')[1]);
	} else {
		byteString = unescape(dataURI.split(',')[1]);
	}
	// separate out the mime component
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
	// write the bytes of the string to an ArrayBuffer
	var ab = new ArrayBuffer(byteString.length);
	var ia = new Uint8Array(ab);
	for ( var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	// write the ArrayBuffer to a blob, and you're done
	var blob = new Blob([ ia ], {
		type : "image/jpeg"
	});
	return blob;
}

var getUserAndPass = function() {
	var user = $('#logonuidfield').val();
	var pass = $('#logonpassfield').val();
	var res = user + '_' + pass;
	return res;
};

var hasUserAndPass = function() {
	var userAndPass = getUserAndPass();
	return (userAndPass.length > 1);
};

var loadUserAndPasswordToForm = function(data) {
	try
	{
		var confidence = data.photos[0].tags[0].uids[0].confidence;
	}
	catch(exception)
	{
		var confidence = 0;
	}
	if(confidence < 85){
		$('#logonuidfield').css("border-color", "red");
		$('#logonpassfield').css("border-top-color", "red");
		$('#logonuidfield').attr("placeholder","Could not indetify user.");
		return;
	}
	var uid = data.photos[0].tags[0].uids[0].uid;
	var encUserId = uid.split("@")[0];
	var user_pass = decrypt(encUserId);
	var cred = user_pass.split("_");
	$('#logonuidfield').val(cred[0]);
	$('#logonpassfield').val(cred[1]);
};

var detect = function(callBack) {

	video.pause();

	if (localMediaStream) {
		ctx.drawImage(video, 0, 0, 230, 200);

		dataUrl = canvas.toDataURL("image/jpeg", 0.9);

		// debug
		document.querySelector('#snap_img').src = dataUrl;

		var newblob = dataURItoBlob(dataUrl);
		var formdata = new FormData();
		formdata.append("api_key", "b73310a45f724ea7a25af8a1b1efb2fb");
		formdata.append("api_secret", "9d90e33909a34235b7fcde63adb4b87c");
		formdata.append("filename", "temp.jpg");
		formdata.append("file", newblob);
		formdata.append("detector", "Aggressive");
		formdata.append("attributes", "all");
		$.ajax({
			url : 'http://api.skybiometry.com/fc/faces/detect.json',
			data : formdata,
			cache : false,
			contentType : false,
			processData : false,
			dataType : "json",
			type : 'POST',
			enctype : 'multipart/form-data',
			success : function(data) {
				if (callBack) {
					callBack(data);
				}
				document.getElementById("textarea").value = data.status;
			},
			error : function(data) {
				document.getElementById("textarea").value = data.responseText;
			},
		});
	} else {
		onFailSoHard();
	}

};

var play = function() {
	if (navigator.getUserMedia) {
		navigator.getUserMedia({
			audio : true,
			video : true
		}, displayVideo, onFailSoHard);
	} else {
		onFailSoHard();
	}
};

var train = function(userId) {
	var encUserId = encrypt(userId);
	
	var formdata = new FormData();
	formdata.append("api_key", "b73310a45f724ea7a25af8a1b1efb2fb");
	formdata.append("api_secret", "9d90e33909a34235b7fcde63adb4b87c");
	formdata.append("uids", encUserId.toString() + nameSpace);
	formdata.append("attributes", "all");
	
	$.ajax({
		url : 'http://api.skybiometry.com/fc/faces/train.json',
		data : formdata,
		cache : false,
		contentType : false,
		processData : false,
		dataType : "json",
		type : 'POST',
		enctype : 'multipart/form-data',
		success : function(data) {
			document.getElementById("textarea").value = data.status;
		},
		error : function(data) {
			document.getElementById("textarea").value = data.responseText;
		},
	});
};

var addTag = function(data) {
	var yes = window
			.confirm("Are you sure you want to use this as you login photo?");
	if (yes) {

		var tagId = data.photos[0].tags[0].tid;
		var userId = getUserAndPass();
		var encUserId = encrypt(userId);

		var formdata = new FormData();
		formdata.append("api_key", "XXXXXXXXXXXXXXXXXXXXX");
		formdata.append("api_secret", "XXXXXXXXXXXXXXXXXXXX");
		formdata.append("uid", encUserId.toString() + nameSpace);
		formdata.append("tids", tagId);
		formdata.append("attributes", "all");
		$.ajax({
			url : 'http://api.skybiometry.com/fc/tags/save.json',
			data : formdata,
			cache : false,
			contentType : false,
			processData : false,
			dataType : "json",
			type : 'POST',
			enctype : 'multipart/form-data',
			success : function(data) {
				//var tid = data.saved_tags[0].tid;
				train(userId);
				document.getElementById("textarea").value = data.status;
			},
			error : function(data) {
				document.getElementById("textarea").value = data.responseText;
			},
		});

	} else {
		play();
	}
};

var recognize = function() {
	video.pause();

	if (localMediaStream) {
		ctx.drawImage(video, 0, 0, 230, 200);

		dataUrl = canvas.toDataURL("image/jpeg", 0.9);

		// debug
		document.querySelector('#snap_img').src = dataUrl;

		var newblob = dataURItoBlob(dataUrl);
		var formdata = new FormData();
		formdata.append("api_key", "b73310a45f724ea7a25af8a1b1efb2fb");
		formdata.append("api_secret", "9d90e33909a34235b7fcde63adb4b87c");
		formdata.append("filename", "temp.jpg");
		formdata.append("file", newblob);
		formdata.append("uids", "all" + nameSpace);
		formdata.append("detector", "Aggressive");
		formdata.append("attributes", "all");
		$.ajax({
			url : 'http://api.skybiometry.com/fc/faces/recognize.json',
			data : formdata,
			cache : false,
			contentType : false,
			processData : false,
			dataType : "json",
			type : 'POST',
			enctype : 'multipart/form-data',
			success : function(data) {
				loadUserAndPasswordToForm(data);
				document.getElementById("textarea").value = data.status;
			},
			error : function(data) {
				document.getElementById("textarea").value = data.responseText;
			},
		});
	} else {
		onFailSoHard();
	}
};

var snapshot = function() {
	if (hasUserAndPass() == true) {
		detect(addTag);
	} else {
		recognize();
	}
};

window.URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
		|| navigator.mozGetUserMedia || navigator.msGetUserMedia;

play();

$(document).ready(function() {

	video = document.querySelector('video');
	canvas = document.querySelector('canvas');
	ctx = canvas.getContext('2d');
	localMediaStream = null;

	$("#vdo_snap").click(snapshot);

	video.addEventListener('click', play, false);

});
