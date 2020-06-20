var admin = require('firebase-admin');
const request = require('request');
const http = require('http');
const { parse } = require('querystring');
var fs = require('fs');

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
if (req.url == "/") {

	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.end('Hello world');

} else {
if (req.url == "/style.css") {
  fs.readFile("style.css", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(data);
  })
} else {
  fs.readFile("404.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(data);
  })
}
}
}

function internalServerError(error) {
if (error) {
  console.error(error);
}
  res.writeHead(500, { 'Content-Type': 'text/html' });
  res.end('<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="initial-scale=1, minimum-scale=1, width=device-width"><title>Error 500: Internal Server Error</title><style>*{margin:0;padding:0}html{font:16px arial,sans-serif}html{background:#ffffff;color:#222222;padding:15px}body{margin:7% auto 0;max-width:390px;min-height:180px;padding:30px 0 15px}body{padding-right:150px}p{margin:11px 0 22px;overflow:hidden}ins{color:#777777;text-decoration:none}@media screen and (max-width:772px){body{background:none;margin-top:0;max-width:none;padding-right:0}}</style></head><body><a href="https://terrenllc.com"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 932 159" style="height:30px;padding-bottom:24px;margin-left:-1px;"><defs><style>.cls-1{fill:#1e88e5;}</style></defs><path class="cls-1" d="M58.6,25.4V154.8H35.84V25.4H1.17V4h92V25.4Z"/><path class="cls-1" d="M187.7,112.41H119.53q.89,11.73,7.62,18.65t17.29,6.84q8.2,0,13.57-3.91t12-14.45l18.56,10.35a74.26,74.26,0,0,1-9.08,12.55,48.41,48.41,0,0,1-10.26,8.6A41.21,41.21,0,0,1,157.42,156a57.57,57.57,0,0,1-13.76,1.56q-21.3,0-34.18-13.67t-12.9-36.53q0-22.54,12.5-36.52Q121.68,57,142.48,57q21,0,33.21,13.38t12.11,36.82Zm-22.56-18Q160.55,76.88,143,76.87a22.63,22.63,0,0,0-7.52,1.22,21.42,21.42,0,0,0-6.39,3.51,22.17,22.17,0,0,0-4.94,5.52A25.71,25.71,0,0,0,121,94.44Z"/><path class="cls-1" d="M211.72,59.68h22v8.49q6.06-6.35,10.75-8.69A24.7,24.7,0,0,1,255.76,57q8.7,0,18.17,5.67L263.87,82.82q-6.25-4.48-12.21-4.49-18,0-18,27.15V154.8h-22Z"/><path class="cls-1" d="M289.55,59.68h22v8.49q6-6.35,10.74-8.69A24.72,24.72,0,0,1,333.6,57q8.68,0,18.16,5.67L341.7,82.82q-6.24-4.48-12.2-4.49-18,0-18,27.15V154.8h-22Z"/><path class="cls-1" d="M449.61,112.41H381.45q.87,11.73,7.62,18.65t17.28,6.84q8.2,0,13.57-3.91t12-14.45l18.55,10.35a73.17,73.17,0,0,1-9.08,12.55,48.36,48.36,0,0,1-10.25,8.6A41.33,41.33,0,0,1,419.34,156a57.59,57.59,0,0,1-13.77,1.56q-21.29,0-34.18-13.67T358.5,107.33q0-22.54,12.5-36.52Q383.6,57,404.4,57q21,0,33.2,13.38t12.11,36.82Zm-22.56-18q-4.59-17.56-22.16-17.57a22.59,22.59,0,0,0-7.52,1.22A21.35,21.35,0,0,0,391,81.6,22.33,22.33,0,0,0,386,87.12a25.72,25.72,0,0,0-3.13,7.32Z"/><path class="cls-1" d="M473.64,59.68h22.07v8.79Q507.23,57,521.68,57q16.61,0,25.88,10.45,8,8.9,8,29V154.8H533.5V101.67q0-14.06-3.91-19.43t-13.86-5.47q-11,0-15.53,7.22t-4.49,24.91v45.9H473.64Z"/><path class="cls-1" d="M672,4v129.4h44.33V154.8H649.22V4Z"/><path class="cls-1" d="M760.65,4v129.4H805V154.8H737.89V4Z"/><path class="cls-1" d="M931.35,12.12v27q-19.73-16.5-40.82-16.5-23.24,0-39.16,16.7t-16,40.62q0,23.73,16,40t39.26,16.31q12,0,20.41-3.91a59,59,0,0,0,9.71-5.27,112.36,112.36,0,0,0,10.6-8v27.44a82.15,82.15,0,0,1-41,11q-32.31,0-55.17-22.56-22.75-22.75-22.75-54.88,0-28.81,19-51.37Q854.88,1.09,892.09,1.08,912.4,1.08,931.35,12.12Z"/></svg></a><p><b>Error 500:</b> <ins>Internal Server Error</ins></p><p>An internal server error occurred while processing your request. Please try again.</p></body></html>');
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