var admin = require('firebase-admin');
const request = require('request');
const http = require('http');
const { parse } = require('querystring');
var fs = require('fs');

var localizations = JSON.parse(fs.readFileSync("localizations.json", 'utf8'));
var languages = JSON.parse(fs.readFileSync("languages.json", 'utf8'));
var lessontemplate = fs.readFileSync("lesson_content.html", 'utf8');

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT)),
  databaseURL: 'https://missioncitizenonline.firebaseio.com'
});

admin.firestore().settings({timestampsInSnapshots: true});
//const timestamp = snapshot.get('created_at').toDate();

var lessons;
admin.database().ref("lessons").on("value",function(snapshot) {
  lessons = snapshot.val();
},function(error) {
  lessons = undefined;
});

const requestListener = function (req, res) {

var body;

var url = req.url.split("?")[0];
var query = parse(req.url.split("?")[1]);

console.log(req.url);

var cookies = {},
rc = req.headers.cookie;
rc && rc.split(';').forEach(function(cookie) {
  var parts = cookie.split('=');
  cookies[parts.shift().trim()] = decodeURI(parts.join('='));
});

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
if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV == "production") {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+req.url});
  res.end();
} else {
var static_files = [
  ["style.css","text/css"],
  ["logo.png","image/png"],
  ["favicon.ico","image/x-icon"]
]
var matched_static_file = false;
for (var i = 0; i < static_files.length; i++) {
if (static_files[i][0] == req.url.substring(1)) {
  matched_static_file = JSON.parse(JSON.stringify(static_files[i]));
}
}
if (matched_static_file) {
  fs.readFile(matched_static_file[0], function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    res.writeHead(200, { 'Content-Type': matched_static_file[1]+'; charset=utf-8', 'Content-Length': data.length, 'Cache-Control': 'private, max-age=86400' });
    res.write(data, "utf-8");
    res.end();
  })
} else {
if (url == "/logout") {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/", 'Set-Cookie': ['lang=; Expires=0', 'code=; Expires=0']});
  res.end();
} else {
if (url == "/login_language") {
  fs.readFile("language.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    var langhtml = "";
    for (var i = 0; i < Object.keys(languages).length; i++) {
      langhtml += '<form action="{FORM_ACTION}" method="POST"><input name="language" readonly value="'+Object.keys(languages)[i]+'" style="display: none;"><input type="submit" value="'+languages[Object.keys(languages)[i]].name+'"></form>'
    }
    data = localize(data,undefined,{"FORM_ACTION": "/language_submit"+(query.continue ? "?continue="+query.continue : ""), "LANGUAGES": langhtml})
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': data.length, 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
  })
} else {
if (url == "/language_submit") {
if (Object.keys(languages).indexOf(body.language) > -1) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? "/"+query.continue.substring(1) : "/login"+(query.continue ? "?continue="+query.continue : "")), 'Set-Cookie': 'lang='+body.language});
  res.end();
} else {
  internalServerError();
}
} else {
if (Object.keys(languages).indexOf(cookies.lang) == -1) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/login_language?continue="+url});
  res.end();
} else {
if (url == "/login") {
  fs.readFile("login.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"FORM_ACTION": "/login_submit"+(query.continue ? "?continue="+query.continue : ""), "SUBTITLE": (query.error == "badcode" ? '<font color="red">{login.badcode}</font>' : "{login.subtitle}"), "VALUE": ((query.code && query.code.replace(/\s/g,'')) ? String(query.code).replace(/\s/g,'').substring(0,4)+(String(query.code).replace(/\s/g,'').length > 4 ? " "+String(query.code).replace(/\s/g,'').substring(4,8)+(String(query.code).replace(/\s/g,'').length > 8 ? " "+String(query.code).replace(/\s/g,'').substring(8,12) : "") : "") : "")});
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': data.length, 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
  })
} else {
if (url == "/login_submit") {
if (body.code && (body.code.replace(/\s/g,'').length == 12 || body.code == "auto")) {
if (body.code == "auto") {
function tryCode() {
var workingcode = generate(12);
admin.database().ref("users/"+workingcode).once("value").then(function(snapshot) {
if (snapshot.val()) {
  tryCode();
} else {
admin.database().ref("users/"+workingcode+"/date").set(Date.now()).then(function() {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+("/welcome"+(query.continue ? "?continue="+query.continue : "")), 'Set-Cookie': 'code='+workingcode});
  res.end();
}).catch(function(error) {
  return internalServerError(error);
});
}
}).catch(function(error) {
  return internalServerError(error);
});
}
tryCode()
} else {
body.code = body.code.replace(/\s/g,'');
admin.database().ref("users/"+body.code).once("value").then(function(snapshot) {
if (snapshot.val()) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? "/"+query.continue.substring(1) : "/"), 'Set-Cookie': 'code='+body.code});
  res.end();
} else {
  badCode(body.code);
}
}).catch(function(error) {
  return internalServerError(error);
});
}
} else {badCode((body.code ? body.code : undefined))}
function badCode(badcode) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+("/login?error=badcode"+(badcode ? "&code="+badcode : "")+(query.continue ? "&continue="+query.continue : ""))});
  res.end();
}
} else {
if (!cookies.code) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/login?continue="+url});
  res.end();
} else {
if (url == "/welcome") {
  fs.readFile("newcode.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"FORM_ACTION": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? query.continue : "/"), "CODE": String(cookies.code).substring(0,4)+" "+String(cookies.code).substring(4,8)+" "+String(cookies.code).substring(8,12)});
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': data.length, 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
  })
} else {
if (url == "/") {

  fs.readFile("index.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"SIDEBAR": renderSidebar(cookies.lang,cookies.code,"home"), "TITLE": "{general.home}", "CODE": String(cookies.code).substring(0,4)+" "+String(cookies.code).substring(4,8)+" "+String(cookies.code).substring(8,12), "CONTENT": ""})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': data.length, 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
  })

} else {
if (url.indexOf("/lesson/") == 0 && lessons && lessons[Number(url.split("/lesson/")[1])-1]) {
var lessonnumber = Number(url.split("/lesson/")[1]);
var lessondata = lessons[Number(url.split("/lesson/")[1])-1];

  fs.readFile("index.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"SIDEBAR": renderSidebar(cookies.lang,cookies.code,lessonnumber), "TITLE": "{general.lesson}"+lessonnumber, "CODE": String(cookies.code).substring(0,4)+" "+String(cookies.code).substring(4,8)+" "+String(cookies.code).substring(8,12), "CONTENT": localize(lessontemplate,cookies.lang,{"TITLE": lessondata.title[cookies.lang], "VIDEO": ((lessondata.video && lessondata.video[cookies.lang]) ? '<div style="width: 100%;padding-top: 56.28%;position: relative;margin-top: 14px;background:black;"><iframe frameborder="0" allowfullscreen="1" allow="autoplay; picture-in-picture" title="'+lessondata.title[cookies.lang]+'" src="https://www.youtube.com/embed/'+lessondata.video[cookies.lang]+'?playsinline=1&amp;rel=0&amp;enablejsapi=1&amp;origin=https%3A%2F%2Fonline.missioncitizen.org&amp;widgetid=1" style="width: 100%;height: 100%;position: absolute;top: 0;"></iframe></div>' : ''), "TEXT": ((lessondata.text && lessondata.text[cookies.lang]) ? '<div style="white-space: pre-wrap;margin-top: 12px;">'+lessondata.text[cookies.lang]+'</div>' : '')})})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': data.length, 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
  })

} else {

  fs.readFile("404.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': data.length, 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
  })

}
}
}
}
}
}
}
}
}
}
}
}
}

function renderSidebar(lang,code,tab) {
var pendhtml = '<a href="/"'+(tab == "home" ? ' class="active"' : '')+'><div><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" /></svg></div><div>{general.home}</div></a>';
for (var i = 1; i < lessons.length+1; i++) {
pendhtml += '<a href="/lesson/'+i+'"'+(tab == i ? ' class="active"' : '')+'><div><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></div><div>{general.lesson}'+i+'</div></a>'
}
pendhtml += '<a href="/quiz"'+(tab == "quiz" ? ' class="active"' : '')+'><div><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" /></svg></div><div>{general.quiz}</div></a>'
return pendhtml;
}

function localize(data,lang,special) {
haderror = false;
try {
data = data.replace(/{([A-Za-z0-9_\.]+?)}/g,function(a,b) {if (b == b.toUpperCase()) {if (b == "LANGUAGE_CODE") {return lang} else {if (special[b] !== undefined) {if (special[b].indexOf("{") > -1) {if (localize(special[b],lang,special) !== false) {return localize(special[b],lang,special)} else {haserror = b;return b}} else {return special[b]}} else {haderror = b;return b;}}} else {if (localizations[lang][b.split(".")[0]][b.split(".")[1]] !== undefined) {return localizations[lang][b.split(".")[0]][b.split(".")[1]]} else {haderror = b;return b}}});
} catch(error) {
console.error(error);
return false;
}
if (haderror) {
console.error("Something went wrong while parsing: "+haderror);
}
return (haderror ? false : data);
}

function internalServerError(error) {
if (error) {
  console.error(error);
}
  var data = '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="initial-scale=1, minimum-scale=1, width=device-width"><title>Error 500: Internal Server Error</title><style>*{margin:0;padding:0}html{font:16px arial,sans-serif}html{background:#ffffff;color:#222222;padding:15px}body{margin:7% auto 0;max-width:390px;min-height:180px;padding:30px 0 15px}body{padding-right:150px}p{margin:11px 0 22px;overflow:hidden}ins{color:#777777;text-decoration:none}@media screen and (max-width:772px){body{background:none;margin-top:0;max-width:none;padding-right:0}}</style></head><body><a href="https://terrenllc.com"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 932 159" style="height:30px;padding-bottom:24px;margin-left:-1px;"><defs><style>.cls-1{fill:#1e88e5;}</style></defs><path class="cls-1" d="M58.6,25.4V154.8H35.84V25.4H1.17V4h92V25.4Z"/><path class="cls-1" d="M187.7,112.41H119.53q.89,11.73,7.62,18.65t17.29,6.84q8.2,0,13.57-3.91t12-14.45l18.56,10.35a74.26,74.26,0,0,1-9.08,12.55,48.41,48.41,0,0,1-10.26,8.6A41.21,41.21,0,0,1,157.42,156a57.57,57.57,0,0,1-13.76,1.56q-21.3,0-34.18-13.67t-12.9-36.53q0-22.54,12.5-36.52Q121.68,57,142.48,57q21,0,33.21,13.38t12.11,36.82Zm-22.56-18Q160.55,76.88,143,76.87a22.63,22.63,0,0,0-7.52,1.22,21.42,21.42,0,0,0-6.39,3.51,22.17,22.17,0,0,0-4.94,5.52A25.71,25.71,0,0,0,121,94.44Z"/><path class="cls-1" d="M211.72,59.68h22v8.49q6.06-6.35,10.75-8.69A24.7,24.7,0,0,1,255.76,57q8.7,0,18.17,5.67L263.87,82.82q-6.25-4.48-12.21-4.49-18,0-18,27.15V154.8h-22Z"/><path class="cls-1" d="M289.55,59.68h22v8.49q6-6.35,10.74-8.69A24.72,24.72,0,0,1,333.6,57q8.68,0,18.16,5.67L341.7,82.82q-6.24-4.48-12.2-4.49-18,0-18,27.15V154.8h-22Z"/><path class="cls-1" d="M449.61,112.41H381.45q.87,11.73,7.62,18.65t17.28,6.84q8.2,0,13.57-3.91t12-14.45l18.55,10.35a73.17,73.17,0,0,1-9.08,12.55,48.36,48.36,0,0,1-10.25,8.6A41.33,41.33,0,0,1,419.34,156a57.59,57.59,0,0,1-13.77,1.56q-21.29,0-34.18-13.67T358.5,107.33q0-22.54,12.5-36.52Q383.6,57,404.4,57q21,0,33.2,13.38t12.11,36.82Zm-22.56-18q-4.59-17.56-22.16-17.57a22.59,22.59,0,0,0-7.52,1.22A21.35,21.35,0,0,0,391,81.6,22.33,22.33,0,0,0,386,87.12a25.72,25.72,0,0,0-3.13,7.32Z"/><path class="cls-1" d="M473.64,59.68h22.07v8.79Q507.23,57,521.68,57q16.61,0,25.88,10.45,8,8.9,8,29V154.8H533.5V101.67q0-14.06-3.91-19.43t-13.86-5.47q-11,0-15.53,7.22t-4.49,24.91v45.9H473.64Z"/><path class="cls-1" d="M672,4v129.4h44.33V154.8H649.22V4Z"/><path class="cls-1" d="M760.65,4v129.4H805V154.8H737.89V4Z"/><path class="cls-1" d="M931.35,12.12v27q-19.73-16.5-40.82-16.5-23.24,0-39.16,16.7t-16,40.62q0,23.73,16,40t39.26,16.31q12,0,20.41-3.91a59,59,0,0,0,9.71-5.27,112.36,112.36,0,0,0,10.6-8v27.44a82.15,82.15,0,0,1-41,11q-32.31,0-55.17-22.56-22.75-22.75-22.75-54.88,0-28.81,19-51.37Q854.88,1.09,892.09,1.08,912.4,1.08,931.35,12.12Z"/></svg></a><p><b>Error 500:</b> <ins>Internal Server Error</ins></p><p>Something went wrong while processing your request. Please try again.</p></body></html>';
  res.writeHead(500, { 'Content-Type': 'text/html', 'Content-Length': data.length, 'Cache-Control': 'no-store' });
  res.end(data);
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

function generate(n) {
  var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.   

  if ( n > max ) {
          return generate(max) + generate(n - max);
  }

  max        = Math.pow(10, n+add);
  var min    = max/10; // Math.pow(10, n) basically
  var number = Math.floor( Math.random() * (max - min + 1) ) + min;

  return ("" + number).substring(add); 
}