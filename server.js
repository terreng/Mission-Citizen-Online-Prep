var admin = require('firebase-admin');
const request = require('request');
const http = require('http');
const { parse } = require('querystring');
var fs = require('fs');
const bcrypt = require('bcrypt');

var localizations = JSON.parse(fs.readFileSync("localizations.json", 'utf8'));
var languages = JSON.parse(fs.readFileSync("languages.json", 'utf8'));
var lessontemplate = fs.readFileSync("lesson_content.html", 'utf8');
var quiztemplate = fs.readFileSync("quiz_content.html", 'utf8');

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
	if (request_queue.length > 0) {
		for (var r = 0; r < request_queue.length; r++) {
			handleRequest(request_queue[r][0],request_queue[r][1])
		}
	}
	request_queue = [];
},function(error) {
  console.error(error);
  lessons = undefined;
});

var request_queue = [];

const requestListener = function (req, res) {
if (lessons !== undefined) {
	handleRequest(req, res);
} else {
	request_queue.push([req,res])
}
}

function handleRequest(req, res) {

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
	handleRequest2()
});
} else {
	handleRequest2()
}

function handleRequest2() {
if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV == "production") {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+req.url});
  res.end();
} else {
var static_files = [
  ["style.css","text/css"],
  ["logo.png","image/png"],
  ["favicon.ico","image/x-icon"],
  ["admin/style.css","text/css"],
  ["admin/main.js","text/javascript"],
  ["admin/fastclick.js","text/javascript"],
  ["admin/index.html","text/html","admin/"],
  ["admin","forward","admin/"],
]
var matched_static_file = false;
for (var i = 0; i < static_files.length; i++) {
if (static_files[i][0] == req.url.substring(1) || (static_files[i][1] !== "forward" && (static_files[i][2] == req.url.substring(1) || static_files[i][3] == req.url.substring(1)))) {
  matched_static_file = JSON.parse(JSON.stringify(static_files[i]));
}
}
if (matched_static_file) {
  if (matched_static_file[1] == "forward") {
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/"+matched_static_file[2]});
    res.end();
  } else {
  fs.readFile(matched_static_file[0], function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    res.writeHead(200, { 'Content-Type': matched_static_file[1]+'; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=86400' });
    res.write(data, "utf-8");
    res.end();
  })
}
} else {
if (url == "/logout") {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/"+(query.continue ? "?continue="+query.continue : ""), 'Set-Cookie': ['lang=; Expires=0', 'code=; Expires=0', 'token=; Expires=0']});
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
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
  })
} else {
if (url == "/language_submit") {
if (body.language && Object.keys(languages).indexOf(body.language) > -1) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? "/"+query.continue.substring(1) : "/login"+(query.continue ? "?continue="+query.continue : "")), 'Set-Cookie': 'lang='+body.language});
  res.end();
} else {
  res.writeHead(400);
  res.end();
}
} else {
if (Object.keys(languages).indexOf(cookies.lang) == -1) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/login_language?continue="+url});
  res.end();
} else {
var error_text = {
  mismatchpassword: localizations[cookies.lang].login.mismatchpassword,
  weakpassword: localizations[cookies.lang].login.weakpassword,
  bademail: localizations[cookies.lang].login.bademail,
  badname: localizations[cookies.lang].login.badname,
  alreadyaccount: localizations[cookies.lang].login.alreadyaccount,
  noaccount: localizations[cookies.lang].login.noaccount,
  badpassword: localizations[cookies.lang].login.badpassword,
  nopassword: localizations[cookies.lang].login.nopassword
}
if (url == "/login") {
  fs.readFile("login_type.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"FORM_ACTION_QUERY": (query.continue ? "?continue="+query.continue : "")})
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
  })
} else {
if (url == "/login_code") {
  fs.readFile("login.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"FORM_ACTION": "/login_submit"+(query.continue ? "?continue="+query.continue : ""), "SUBTITLE": (query.error == "badcode" ? '<font color="red">{login.badcode}</font>' : "{login.subtitle}"), "VALUE": ((query.code && query.code.replace(/\s/g,'')) ? String(query.code).replace(/\s/g,'').substring(0,4)+(String(query.code).replace(/\s/g,'').length > 4 ? " "+String(query.code).replace(/\s/g,'').substring(4,8)+(String(query.code).replace(/\s/g,'').length > 8 ? " "+String(query.code).replace(/\s/g,'').substring(8,12) : "") : "") : "")});
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
  })
} else {
if (url == "/login_submit") {
if (body.intent !== "code" && body.intent !== "login" && body.intent !== "register") {
  res.writeHead(400);
  res.end();
  return;
}
if (body.intent == "code") {
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
if (snapshot.val() && !snapshot.val().email) {
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
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+("/login_code?error=badcode"+(badcode ? "&code="+badcode : "")+(query.continue ? "&continue="+query.continue : ""))});
  res.end();
}
}
if (body.intent == "register") {
if (body.name && typeof body.name == "string" && body.name.length > 0 && body.name.length < 127) {
if (body.email && typeof body.email == "string" && validateEmail(body.email)) {
if (body.password && typeof body.password == "string" && validatePassword(body.password)) {
if (body.password == body.password2) {

admin.database().ref("users").orderByChild("email").equalTo(body.email).once("value").then(function(snapshot) {

if (snapshot.val()) {
  return registerError("alreadyaccount");
}

function tryCode() {
var workingcode = generate(12);
admin.database().ref("users/"+workingcode).once("value").then(function(snapshot) {
if (snapshot.val()) {
  tryCode();
} else {
var newtoken = generateToken();
admin.database().ref("users/"+workingcode).set({
  "date": Date.now(),
  "name": body.name,
  "email": body.email.toLowerCase()
}).then(function() {
bcrypt.hash(body.password, 10, function(err, hash) {
if (err) {
  return internalServerError(err);
} else {
  admin.database().ref("privateusers/"+workingcode).set({
    "hash": hash,
    "tokens": [{"token":newtoken}]
  }).then(function() {
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? query.continue : "/"), 'Set-Cookie': ['code='+workingcode, 'token='+newtoken]});
    res.end();
  }).catch(function(error) {
    return internalServerError(error);
  });
}
});
}).catch(function(error) {
  return internalServerError(error);
});
}
}).catch(function(error) {
  return internalServerError(error);
});
}
tryCode()

}).catch(function(error) {
  return internalServerError(error);
});


} else {
  registerError("mismatchpassword");
}
} else {
  registerError("weakpassword");
}
} else {
  registerError("bademail");
}
} else {
  registerError("badname");
}
function registerError(code) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/login_register?error="+code+((body.email && typeof body.email == "string" && body.email.length < 127) ? "&email="+encodeURIComponent(body.email) : "")+((body.name && typeof body.name == "string" && body.name.length < 127) ? "&name="+encodeURIComponent(body.name) : "")+(query.continue ? "&continue="+query.continue : "")});
  res.end();
}
}
if (body.intent == "login") {
if (body.email && typeof body.email == "string" && validateEmail(body.email)) {
if (body.password && typeof body.password == "string" && body.password.length > 0) {

admin.database().ref("users").orderByChild("email").equalTo(body.email.toLowerCase()).once("value").then(function(snapshot) {
if (snapshot.val() && Object.keys(snapshot.val()).length == 1) {
  var userdata = snapshot.val()[Object.keys(snapshot.val())[0]];

admin.database().ref("privateusers/"+Object.keys(snapshot.val())[0]).once("value").then(function(snapshot2) {
if (snapshot2.val()) {
var privateuserdata = snapshot2.val();
bcrypt.compare(body.password, privateuserdata.hash, function(err, result) {
if (err) {
  return internalServerError(error);
} else {
if (result) {
  var newtoken = generateToken();
  if (!privateuserdata.tokens) {privateuserdata.tokens = []};
  if (privateuserdata.tokens.length == 10) {
    privateuserdata.tokens.splice(0,1);
  }
  privateuserdata.tokens.push({"token":newtoken});
  admin.database().ref("privateusers/"+Object.keys(snapshot.val())[0]+"/tokens").set(privateuserdata.tokens).then(function() {
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? query.continue : "/"), 'Set-Cookie': ['code='+Object.keys(snapshot.val())[0], 'token='+newtoken]});
    res.end();
  }).catch(function(error) {
    return internalServerError(error);
  });
} else {
  registerError("badpassword");
}
}
});
} else {
  return internalServerError(error);
}
}).catch(function(error) {
  return internalServerError(error);
});

} else {
  registerError("noaccount");
}
}).catch(function(error) {
  return internalServerError(error);
});

} else {
  registerError("nopassword");
}
} else {
  registerError("bademail");
}
function registerError(code) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/login_account?error="+code+((body.email && typeof body.email == "string" && body.email.length < 127) ? "&email="+encodeURIComponent(body.email) : "")+(query.continue ? "&continue="+query.continue : "")});
  res.end();
}
}
} else {
if (url == "/login_account") {
  fs.readFile("login_account.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"EMAIL_VALUE": query.email ? urlescape(query.email) : "", "ERROR_MESSAGES": JSON.stringify(error_text), "ERROR_VALUE": query.error ? (error_text[query.error] || "") : "", "ERROR_STYLE": query.error ? ' style="display: block;"' : "", "FORM_ACTION": "/login_submit"+(query.continue ? "?continue="+query.continue : ""), "FORM_ACTION_QUERY": (query.continue ? "?continue="+query.continue : "")})
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
  })
} else {
if (url == "/login_register") {
  fs.readFile("login_register.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"EMAIL_VALUE": query.email ? urlescape(query.email) : "", "NAME_VALUE": query.name ? urlescape(query.name) : "", "ERROR_MESSAGES": JSON.stringify(error_text), "ERROR_VALUE": query.error ? (error_text[query.error] || "") : "", "ERROR_STYLE": query.error ? ' style="display: block;"' : "", "FORM_ACTION": "/login_submit"+(query.continue ? "?continue="+query.continue : "")})
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
  })
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
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
  })
} else {

if (url == "/account") {
doAuthentication(cookies,function(userdata) {
if (userdata.email) {
  fs.readFile("account.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    var successes = {
      namechanged: localizations[cookies.lang].account.namechanged,
      emailchanged: localizations[cookies.lang].account.emailchanged,
      passwordchanged: localizations[cookies.lang].account.passwordchanged
    }
    data = localize(data,cookies.lang,{"UPDATE_BANNER": (query.success && successes[query.success]) ? '<div class="update_banner">'+successes[query.success]+'</div>' : "", "NAME": htmlescape(userdata.name), "EMAIL": htmlescape(userdata.email)})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
  })
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/"});
  res.end();
}
});
} else {
if (url == "/account_submit") {
if (body.intent !== "changename" && body.intent !== "changeemail" && body.intent !== "changepassword") {
  res.writeHead(400);
  res.end();
  return;
}
if (body.intent == "changename") {
if (body.name && body.name.length > 0 && body.name.length < 127) {
doAuthentication(cookies,function(userdata) {
if (userdata.email) {
  admin.database().ref("users/"+cookies.code+"/name").set(body.name).then(function() {
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account?success=namechanged"});
    res.end();
  }).catch(function(error) {
    return internalServerError(error);
  });
} else {
  res.writeHead(400);
  res.end();
}
});
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account_name?error=badname"});
  res.end();
}
}
if (body.intent == "changeemail") {
if (body.email && typeof body.email == "string" && validateEmail(body.email)) {
if (body.password && typeof body.password == "string" && body.password.length > 0) {
doAuthentication(cookies,function(userdata,passwordhash) {
if (userdata.email) {

bcrypt.compare(body.password, passwordhash, function(err, result) {
if (err) {
  return internalServerError(err);
} else {
if (result) {
  admin.database().ref("users/"+cookies.code+"/email").set(body.email).then(function() {
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account?success=emailchanged"});
    res.end();
  }).catch(function(error) {
    return internalServerError(error);
  });
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account_email?error=badpassword"});
  res.end();
}
}
});

} else {
  res.writeHead(400);
  res.end();
}
});
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account_email?error=nopassword"});
  res.end();
}
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account_email?error=bademail"});
  res.end();
}
}
if (body.intent == "changepassword") {
if (body.password0 && typeof body.password0 == "string" && body.password0.length > 0) {
if (body.password && typeof body.password == "string" && validatePassword(body.password)) {
if (body.password == body.password2) {
doAuthentication(cookies,function(userdata,passwordhash) {
if (userdata.email) {

bcrypt.compare(body.password0, passwordhash, function(err, result) {
if (err) {
  return internalServerError(err);
} else {
if (result) {
bcrypt.hash(body.password, 10, function(err, hash) {
if (err) {
  return internalServerError(err);
} else {
  admin.database().ref("privateusers/"+cookies.code+"/hash").set(hash).then(function() {
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account?success=passwordchanged"});
    res.end();
  }).catch(function(error) {
    return internalServerError(error);
  });
}
});
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account_password?error=badpassword"});
  res.end();
}
}
});

} else {
  res.writeHead(400);
  res.end();
}
});
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account_password?error=mismatchpassword"});
  res.end();
}
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account_password?error=weakpassword"});
  res.end();
}
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/account_password?error=nopassword"});
  res.end();
}
}
} else {
if (url == "/account_name") {
doAuthentication(cookies,function(userdata) {
  fs.readFile("account_name.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"NAME_VALUE": htmlescape(userdata.name), "ERROR_MESSAGES": JSON.stringify(error_text), "ERROR_VALUE": query.error ? (error_text[query.error] || "") : "", "ERROR_STYLE": query.error ? ' style="display: block;"' : ""})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
  })
});
} else {
if (url == "/account_email") {
doAuthentication(cookies,function(userdata) {
  fs.readFile("account_email.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"EMAIL_VALUE": htmlescape(userdata.email), "ERROR_MESSAGES": JSON.stringify(error_text), "ERROR_VALUE": query.error ? (error_text[query.error] || "") : "", "ERROR_STYLE": query.error ? ' style="display: block;"' : ""})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
  })
});
} else {
if (url == "/account_password") {
doAuthentication(cookies,function(userdata) {
  fs.readFile("account_password.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"ERROR_MESSAGES": JSON.stringify(error_text), "ERROR_VALUE": query.error ? (error_text[query.error] || "") : "", "ERROR_STYLE": query.error ? ' style="display: block;"' : ""})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
  })
});
} else {

if (url == "/") {
doAuthentication(cookies,function(userdata) {
  fs.readFile("index.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"SIDEBAR": renderSidebar(cookies,userdata,"home"), "TITLE": "{general.home}", "CONTENT": ""})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
  })
});
} else {
if (url.indexOf("/lesson/") == 0 && url.split("/lesson/")[1].indexOf("/") == -1 && lessons && lessons[Number(url.split("/lesson/")[1])-1]) {
var lessonnumber = Number(url.split("/lesson/")[1]);
var lessondata = lessons[Number(url.split("/lesson/")[1])-1];
doAuthentication(cookies,function(userdata) {
  fs.readFile("index.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"SIDEBAR": renderSidebar(cookies,userdata,lessonnumber), "TITLE": localize(localizations[cookies.lang].general.lesson,cookies.lang,{"NUM":String(lessonnumber)}), "CONTENT": localize(lessontemplate,cookies.lang,{"TITLE": lessondata.title[cookies.lang], "VIDEO": ((lessondata.video && lessondata.video[cookies.lang]) ? '<div style="width: 100%;padding-top: 56.28%;position: relative;margin-top: 14px;background:black;"><iframe frameborder="0" allowfullscreen="1" allow="autoplay; picture-in-picture" title="'+lessondata.title[cookies.lang]+'" src="https://www.youtube.com/embed/'+lessondata.video[cookies.lang]+'?playsinline=1&amp;rel=0&amp;enablejsapi=1&amp;origin=https%3A%2F%2Fonline.missioncitizen.org&amp;widgetid=1" style="width: 100%;height: 100%;position: absolute;top: 0;"></iframe></div>' : ''), "TEXT": ((lessondata.text && lessondata.text[cookies.lang]) ? '<div style="white-space: pre-wrap;margin-top: 12px;">'+lessondata.text[cookies.lang]+'</div>' : ''), "FORM_ACTION": "/lesson/"+lessonnumber+"/quiz"})})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
  })
});
} else {
if (url.indexOf("/lesson/") == 0 && url.split("/lesson/")[1].indexOf("/quiz") > -1 && url.split("/lesson/")[1].indexOf("/quiz") == url.split("/lesson/")[1].indexOf("/") && lessons && lessons[Number(url.split("/lesson/")[1].split("/quiz")[0])-1]) {
var lessonnumber = Number(url.split("/lesson/")[1].split("/quiz")[0]);
var lessondata = lessons[Number(url.split("/lesson/")[1].split("/quiz")[0])-1];
doAuthentication(cookies,function(userdata) {
if (query.id) {

admin.database().ref("users/"+cookies.code+"/quizzes/"+query.id).once("value").then(function(snapshot) {

if (snapshot.val()) {

} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/lesson/"+lessonnumber+"/quiz"});
  res.end();
}

}).catch(function(error) {
  return internalServerError(error);
});

  fs.readFile("index.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    data = localize(data,cookies.lang,{"SIDEBAR": renderSidebar(cookies,userdata,lessonnumber), "TITLE": localize(localizations[cookies.lang].general.lessonquiz,cookies.lang,{"NUM":String(lessonnumber)}), "CONTENT": localize(quiztemplate,cookies.lang,{})})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
  })
} else {
admin.database().ref("users/"+cookies.code+"/quizzes").orderByChild("lessonid").equalTo(lessondata.id).limitToLast(1).once("value").then(function(snapshot) {
if (snapshot.val() && Object.keys(snapshot.val()).length == 1) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/lesson/"+lessonnumber+"/quiz?id="+Object.keys(snapshot.val())[0]+"&step="+((snapshot.val()[Object.keys(snapshot.val())].choices || []).length*2)});
  res.end();
} else {

admin.database().ref("lessonhistory/lessons").orderByChild("key").limitToLast(1).once("value").then(function(snapshot2) {

  var lastlessons = snapshot2.val();
    
  if (lastlessons && Object.keys(lastlessons).length == 1) {
    var lessonhistoryid = Object.keys(lastlessons)[0];
    lastlessons = lastlessons[Object.keys(lastlessons)[0]];
  } else {
    return internalServerError(undefined,true);
  }

  if (lastlessons.lessons[lessonnumber-1] && (lastlessons.lessons[lessonnumber-1].questions || []).length > 0) {
  var newquizid = admin.database().ref("users/"+cookies.code+"/quizzes").push().key;
  admin.database().ref("users/"+cookies.code+"/quizzes/"+newquizid).set({date: Date.now(), lessondate: lastlessons.date, lessonhistoryid: lessonhistoryid, lessonid: lastlessons.lessons[lessonnumber-1].id, lessonindex: lessonnumber-1, length: (lastlessons.lessons[lessonnumber-1].questions || []).length}).then(function() {
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/lesson/"+lessonnumber+"/quiz?id="+newquizid+"&step=0"});
    res.end();
  }).catch(function(error) {
    return internalServerError(error);
  });
  } else {
    return internalServerError(undefined,true);
  }

}).catch(function(error) {
  return internalServerError(error);
});

}
}).catch(function(error) {
  return internalServerError(error);
});
}
});
} else {

  fs.readFile("404.html", 'utf8', function(error, data) {
    if (error) {
      return internalServerError(error);
    }
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
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
}
}
}
}
}
}
}
}
}

function doAuthentication(cookies,callback) {
var userdata;
var privateuserdata;
admin.database().ref("users/"+cookies.code).once("value").then(function(snapshot) {
  userdata = snapshot.val();
  hasDoneCallback();
}).catch(function(error) {
  return internalServerError(error);
});
if (cookies.token) {
admin.database().ref("privateusers/"+cookies.code).once("value").then(function(snapshot) {
  privateuserdata = snapshot.val();
  hasDoneCallback();
}).catch(function(error) {
  return internalServerError(error);
});
}
var authhasdone = 0;
function hasDoneCallback() {
authhasdone++;
if (authhasdone == (cookies.token ? 2 : 1)) {

if ((cookies.token ? (userdata && userdata.email && privateuserdata && validToken()) : (userdata && !userdata.email))) {
  callback(userdata,privateuserdata ? privateuserdata.hash : undefined);
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/logout?continue="+url});
  res.end();
}

function validToken() {
var foundmatch = false;
if (privateuserdata.tokens) {
for (var i = 0; i < privateuserdata.tokens.length; i++) {
if (privateuserdata.tokens[i].token == cookies.token) {
  foundmatch = true;
}
}
}
return foundmatch;
}

}
}
}

function renderSidebar(cookies,userdata,tab) {
var pendhtml = '<a href="/"'+(tab == "home" ? ' class="active"' : '')+'><div><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" /></svg></div><div>{general.home}</div></a>';
for (var i = 1; i < lessons.length+1; i++) {
pendhtml += '<a href="/lesson/'+i+'"'+(tab == i ? ' class="active"' : '')+'><div><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></div><div>'+localize(localizations[cookies.lang].general.lesson,cookies.lang,{"NUM":String(i)})+'</div></a>'
}
pendhtml += '<a href="/quiz"'+(tab == "quiz" ? ' class="active"' : '')+'><div><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" /></svg></div><div>{general.fullquiz}</div></a>'

if (userdata.email) {
pendhtml += '<div style="margin: 6px;border: 1px solid #c1c1c1;border-radius: 8px;padding: 6px;margin-top: 8px;"><div style="padding-bottom: 3px;">'+localizations[cookies.lang].account.knownuser+'</div><div style="font-size: 20px;padding: 2px 0px;word-break: break-word;">'+htmlescape(userdata.name)+'</div><a href="/account" style="color: black;text-decoration: none;height: 24px;width: 100%;display: block;margin-top: 4px;"><div style="float: left;"><svg style="width:24px;height:24px;" viewBox="0 0 24 24"><path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z""></path></svg></div><div style="float: left;padding-left: 3px;font-size: 18px;">'+localizations[cookies.lang].account.settings+'</div></a><a href="/logout" style="color: black;text-decoration: none;height: 24px;width: 100%;display: block;margin-top: 4px;"><div style="float: left;"><svg style="width:24px;height:24px;transform: rotate(180deg);" viewBox="0 0 24 24"><path fill="currentColor" d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z"></path></svg></div><div style="float: left;padding-left: 3px;font-size: 18px;">'+localizations[cookies.lang].account.logout+'</div></a></div>'
} else {
pendhtml += '<div style="margin: 6px;border: 1px solid #c1c1c1;border-radius: 8px;padding: 6px;margin-top: 8px;"><div style="padding-bottom: 3px;">'+localizations[cookies.lang].account.logincode+'</div><div style="font-size: 24px;">'+String(cookies.code).substring(0,4)+" "+String(cookies.code).substring(4,8)+" "+String(cookies.code).substring(8,12)+'</div><a href="/logout" style="color: black;text-decoration: none;height: 24px;width: 100%;display: block;margin-top: 4px;"><div style="float: left;"><svg style="width:24px;height:24px;transform: rotate(180deg);" viewBox="0 0 24 24"><path fill="currentColor" d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z"></path></svg></div><div style="float: left;padding-left: 3px;font-size: 18px;">'+localizations[cookies.lang].account.logout+'</div></a></div>'
}

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

function internalServerError(error,temporary) {
if (error) {
  console.error(error);
}
  var data = '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="initial-scale=1, minimum-scale=1, width=device-width"><title>Error '+(temporary ? '503: Service Temporarily Unavailable' : '500: Internal Server Error')+'</title><style>*{margin:0;padding:0}html{font:16px arial,sans-serif}html{background:#ffffff;color:#222222;padding:15px}body{margin:7% auto 0;max-width:390px;min-height:180px;padding:30px 0 15px}body{padding-right:150px}p{margin:11px 0 22px;overflow:hidden}ins{color:#777777;text-decoration:none}@media screen and (max-width:772px){body{background:none;margin-top:0;max-width:none;padding-right:0}}</style></head><body><a href="https://terrenllc.com"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 932 159" style="height:30px;padding-bottom:24px;margin-left:-1px;"><defs><style>.cls-1{fill:#1e88e5;}</style></defs><path class="cls-1" d="M58.6,25.4V154.8H35.84V25.4H1.17V4h92V25.4Z"/><path class="cls-1" d="M187.7,112.41H119.53q.89,11.73,7.62,18.65t17.29,6.84q8.2,0,13.57-3.91t12-14.45l18.56,10.35a74.26,74.26,0,0,1-9.08,12.55,48.41,48.41,0,0,1-10.26,8.6A41.21,41.21,0,0,1,157.42,156a57.57,57.57,0,0,1-13.76,1.56q-21.3,0-34.18-13.67t-12.9-36.53q0-22.54,12.5-36.52Q121.68,57,142.48,57q21,0,33.21,13.38t12.11,36.82Zm-22.56-18Q160.55,76.88,143,76.87a22.63,22.63,0,0,0-7.52,1.22,21.42,21.42,0,0,0-6.39,3.51,22.17,22.17,0,0,0-4.94,5.52A25.71,25.71,0,0,0,121,94.44Z"/><path class="cls-1" d="M211.72,59.68h22v8.49q6.06-6.35,10.75-8.69A24.7,24.7,0,0,1,255.76,57q8.7,0,18.17,5.67L263.87,82.82q-6.25-4.48-12.21-4.49-18,0-18,27.15V154.8h-22Z"/><path class="cls-1" d="M289.55,59.68h22v8.49q6-6.35,10.74-8.69A24.72,24.72,0,0,1,333.6,57q8.68,0,18.16,5.67L341.7,82.82q-6.24-4.48-12.2-4.49-18,0-18,27.15V154.8h-22Z"/><path class="cls-1" d="M449.61,112.41H381.45q.87,11.73,7.62,18.65t17.28,6.84q8.2,0,13.57-3.91t12-14.45l18.55,10.35a73.17,73.17,0,0,1-9.08,12.55,48.36,48.36,0,0,1-10.25,8.6A41.33,41.33,0,0,1,419.34,156a57.59,57.59,0,0,1-13.77,1.56q-21.29,0-34.18-13.67T358.5,107.33q0-22.54,12.5-36.52Q383.6,57,404.4,57q21,0,33.2,13.38t12.11,36.82Zm-22.56-18q-4.59-17.56-22.16-17.57a22.59,22.59,0,0,0-7.52,1.22A21.35,21.35,0,0,0,391,81.6,22.33,22.33,0,0,0,386,87.12a25.72,25.72,0,0,0-3.13,7.32Z"/><path class="cls-1" d="M473.64,59.68h22.07v8.79Q507.23,57,521.68,57q16.61,0,25.88,10.45,8,8.9,8,29V154.8H533.5V101.67q0-14.06-3.91-19.43t-13.86-5.47q-11,0-15.53,7.22t-4.49,24.91v45.9H473.64Z"/><path class="cls-1" d="M672,4v129.4h44.33V154.8H649.22V4Z"/><path class="cls-1" d="M760.65,4v129.4H805V154.8H737.89V4Z"/><path class="cls-1" d="M931.35,12.12v27q-19.73-16.5-40.82-16.5-23.24,0-39.16,16.7t-16,40.62q0,23.73,16,40t39.26,16.31q12,0,20.41-3.91a59,59,0,0,0,9.71-5.27,112.36,112.36,0,0,0,10.6-8v27.44a82.15,82.15,0,0,1-41,11q-32.31,0-55.17-22.56-22.75-22.75-22.75-54.88,0-28.81,19-51.37Q854.88,1.09,892.09,1.08,912.4,1.08,931.35,12.12Z"/></svg></a><p><b>Error '+(temporary ? '503' : '500')+':</b> <ins>'+(temporary ? 'Service Temporarily Unavailable' : 'Internal Server Error')+'</ins></p><p>Something went wrong while processing your request.'+(temporary ? ' Lesson or quiz data may have been recently changed, or lesson or quiz data may be malformed or corrupted.' : '')+' Please try again later.</p></body></html>';
  res.writeHead(temporary ? 503 : 500, { 'Content-Type': 'text/html', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
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

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
  return String(password || "").length > 3;
}

function generateToken() {
  var d = Date.now();
  var uniqueid = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x3|0x8)).toString(16);
  });
  return uniqueid;
}

function htmlescape(str) {
if (str == undefined) {
return str;
}
str = String(str);
return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function urlescape(str) {
if (str == undefined) {
return str;
}
str = String(str);
return str.replace(/"/g, "&quot;");
}

function unhtmlescape(str) {
if (str == undefined) {
return str;
}
str = String(str);
return str.split("&lt;").join("<").split("&gt;").join(">").split('&quot;').join('"').split("&#039;").join("'").split("&amp;").join("&");
}

checkLessonChanges();
setInterval(function() {
  checkLessonChanges()
},1000*60*60*1);

function checkLessonChanges() {
admin.database().ref("lessons").once("value").then(function(snapshot) {

var currentlessons = snapshot.val();

admin.database().ref("lessonhistory/lessons").orderByChild("key").limitToLast(1).once("value").then(function(snapshot2) {

var lastlessons = snapshot2.val();

if (lastlessons && Object.keys(lastlessons).length == 1) {
  lastlessons = lastlessons[Object.keys(lastlessons)[0]];
}

if (JSON.stringify(currentlessons) !== JSON.stringify(lastlessons ? lastlessons.lessons : undefined)) {

admin.database().ref("lessonhistory/lessons/"+admin.database().ref("lessonhistory/lessons").push().key).set({lessons: currentlessons, date: Date.now()}).then(function() {

}).catch(function(error) {
  console.error(error);
})

}

}).catch(function(error) {
  console.error(error);
})

}).catch(function(error) {
  console.error(error);
})
}