const axios = require('axios');
const fs = require('fs');
const FileType = require('file-type');

var express = require("express");
var bodyParser = require("body-parser");
var multer = require('multer');
var mkdirp = require('mkdirp');
var app = express();

const global_uploads_path = __dirname + '/uploads';


app.use(bodyParser.json());
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);


var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});

var upload = multer({ storage : storage }).single('user_image');

app.get('/', function(req, res) {
    res.render('index.html');
});

// get file from uploads
app.get('/uploaded_files/:id', async function(req,res) {
	const id = req.params.id;
	//let filepath = __dirname + '/uploads/user_image-1599657441588';
	let filepath = global_uploads_path + '/' + id;
	try {
		if (fs.existsSync(filepath)) {
			//file exists
			let img = fs.readFileSync(filepath);
			let mime = await FileType.fromFile(filepath);

			res.writeHead(200, {
				'Content-Type': mime.mime,
				'Content-Length': img.length
			});
			res.end(img); 
		} else {
			res.end("Unable to find file");
		}
	} catch(err) {
	}
	res.end("Error");

});


// test do not use
app.get('/img', async function(req,res) {
	let filepath = __dirname + '/uploads/user_image-1599657441588';
	let img = fs.readFileSync(filepath);
        let mime = await FileType.fromFile(filepath);
	/*
	console.log(req.get('host'));
	console.log(req.get('x-forwarded-host'));
	console.log(JSON.stringify(req.headers));
	*/
	//console.log(mime);
      /*readFileSync reads the file as binary data .Change the data format to base64.Also send the mime type*/
        //img = Buffer.alloc(img, "binary").toString("base64");
	res.writeHead(200, {
		'Content-Type': mime.mime,
		'Content-Length': img.length
	});
	res.end(img); 
});

// submit image to tinyurl
app.post('/api/submit_to_tinyurl',function(req,res){
	console.log(global_uploads_path);
	const made = mkdirp.sync(global_uploads_path);

	upload(req,res,async function(err) {
		if (err) {
			return res.send(err);
		}
		if(err) {
		    return res.end("Error uploading file.");
		}
		let host = '';
		let url = '';
		if (req.get('origin')) {
			host = req.get('origin');
			url = host + '/uploaded_files/' + req.file.filename;
		} else if (req.get('x-forwarded-host')) {
			host = req.get('x-forwarded-host');
			url = 'http://' + host + '/uploaded_files/' + req.file.filename;
		} else {
			host = req.get('host');
			url = 'http://' + host + '/uploaded_files/' + req.file.filename;
		}
		//console.log(req.file.filename);
		//console.log(JSON.stringify(req.headers));
			
		//console.log('url is ' + url);

		let tiny_url = url;
		//const result = axios.get('https://dog.ceo/api/breeds/list/all')
		
		// grab from tiny url
		const obj_result = await axios.get('http://tinyurl.com/api-create.php?url=' + url);
		if (obj_result) {
			tiny_url = obj_result.data;
			console.log(tiny_url);
			return res.send("tiny url is : <a href='" + tiny_url + "'>" + tiny_url + "</a>");
		} else {
			res.end("Unable to generate tiny url");
		}
		//res.end("File is uploaded");
	});
});

app.listen(9101,function(){
    console.log("Working on port 9101");
});
