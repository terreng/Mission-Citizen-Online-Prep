var admin = require('firebase-admin');
const request = require('request');
const http = require('http');
const { parse } = require('querystring');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT)),
  databaseURL: 'https://missioncitizenonline.firebaseio.com'
});

admin.firestore().settings({timestampsInSnapshots: true});
//const timestamp = snapshot.get('created_at').toDate();


const requestListener = function (req, res) {

console.log(req.url);

var body;

if (req.method === 'POST') {
body = "";
req.on('data', function(chunk) {
	body += chunk.toString();
});
req.on('end', function() {
	body = parse(body);
	handleRequest()
});
} else {
	handleRequest()
}

function handleRequest() {
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.end('Hello world');
}

}

const server = http.createServer(requestListener);
server.listen((process.env.NODE_ENV == "production" ? process.env.PORT : 8873));

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}