var admin = require('firebase-admin');
const http = require('http');
const { parse } = require('querystring');
var fs = require('fs');
const bcrypt = require('bcrypt');

var localizations = JSON.parse(fs.readFileSync("localizations.json", 'utf8'));
var languages = JSON.parse(fs.readFileSync("languages.json", 'utf8'));
var lessontemplate = fs.readFileSync("pages/lesson_content.html", 'utf8');
var files = {
  "language.html": fs.readFileSync("pages/language.html", 'utf8'),
  "login_type.html": fs.readFileSync("pages/login_type.html", 'utf8'),
  "login.html": fs.readFileSync("pages/login.html", 'utf8'),
  "login_account.html": fs.readFileSync("pages/login_account.html", 'utf8'),
  "login_register.html": fs.readFileSync("pages/login_register.html", 'utf8'),
  "newcode.html": fs.readFileSync("pages/newcode.html", 'utf8'),
  "account.html": fs.readFileSync("pages/account.html", 'utf8'),
  "account_name.html": fs.readFileSync("pages/account_name.html", 'utf8'),
  "account_email.html": fs.readFileSync("pages/account_email.html", 'utf8'),
  "account_password.html": fs.readFileSync("pages/account_password.html", 'utf8'),
  "index.html": fs.readFileSync("pages/index.html", 'utf8'),
  "headless_index.html": fs.readFileSync("pages/headless_index.html", 'utf8'),
  "quiz_splash.html": fs.readFileSync("pages/quiz_splash.html", 'utf8'),
  "404.html": fs.readFileSync("pages/404.html", 'utf8'),
}

var question_timeout = 60; //seconds per question on full length quiz
var imprecision_tolerance = 6;//seconds of imprecision allowed for full length quiz server side timing validation. increase this if people on slower internet connections are missing questions they swear they answered in time.

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT)),
  databaseURL: 'https://missioncitizenonline.firebaseio.com'
});

var lessons;
admin.database().ref("lessons").on("value",function(snapshot) {
  lessons = snapshot.val();
	checkReadyLessons();
},function(error) {
  console.error(error);
  lessons = undefined;
});

var banner;
admin.database().ref("banner").on("value",function(snapshot) {
  banner = snapshot.val();
  checkReadyLessons();
},function(error) {
  console.error(error);
  banner = undefined;
});

function checkReadyLessons() {
if (lessons !== undefined && banner !== undefined) {
	if (request_queue.length > 0) {
		for (var r = 0; r < request_queue.length; r++) {
			handleRequest(request_queue[r][0],request_queue[r][1])
		}
	}
  request_queue = [];
}
}

var request_queue = [];

const requestListener = function (req, res) {
if (lessons !== undefined && banner !== undefined) {
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

var headless = false;
if (query.auth) {
try {
  query.auth = JSON.parse(query.auth);
  if ((url == "/lesson_language") || (url.indexOf("/lesson/") == 0 && url.split("/lesson/")[1].indexOf("/quiz") > -1 && url.split("/lesson/")[1].indexOf("/quiz") == url.split("/lesson/")[1].indexOf("/")) || (url.indexOf("/quiz/0") == 0)) {
  headless = true;
  }
} catch {}
}

if (url == "/users.csv") {
  if (query.token) {
    admin.auth().verifyIdToken(query.token, true).then(function(decodedToken) {
      if (decodedToken.uid == "mD5iMxc7d5hD9HXXSAXSHbOHTHk2") {

        admin.database().ref("users").once("value").then(function(snapshot) {
          var users = snapshot.val() || {};
          users = Object.fromEntries(Object.entries(users).filter(function([key, value]) {return true && value.email}))
          for (var i = 0; i < Object.keys(users).length; i++) {
            users[Object.keys(users)[i]].id = Object.keys(users)[i];
          }
          var users_array = [];
          for (var i = 0; i < Object.keys(users).length; i++) {
            users_array.push(users[Object.keys(users)[i]])
          }
          users_array = users_array.sort(function(a,b) {return a.date - b.date});

          admin.database().ref("lessons").once("value").then(function(snapshot2) {
            var lessons = snapshot2.val();

            var pendcsv = "User ID,Name,Email,Registration Date,";

            if (lessons.length > 0) {
              for (var i = 0; i < lessons.length; i++) {
                pendcsv += "Lesson "+(i+1)+",";
              }
            }

            pendcsv += "Practice Quiz\n"

            if (users_array.length > 0) {
            for (var u = 0; u < users_array.length; u++) {

              var userdata = users_array[u];

              pendcsv += userdata.id+","+userdata.name.replace(/(,|\")/g,"")+","+userdata.email.replace(/(,|\")/g,"")+","+toCSVDate(userdata.date)+",";

              var lesson_score_history = [];
              var practice_quiz_score_history = [];

              var lesson_numbers = {};
              if (lessons.length > 0) {
                for (var i = 0; i < lessons.length; i++) {
                  lesson_numbers[lessons[i].id] = i;
                  lesson_score_history[i] = [];
                }
              }

              if (userdata.quizzes) {
              for (var i = 0; i < Object.keys(userdata.quizzes).length; i++) {
                if (userdata.quizzes[Object.keys(userdata.quizzes)[i]].type === 0 && Math.floor(((Date.now()-userdata.quizzes[Object.keys(userdata.quizzes)[i]].timer_date)/1000)/question_timeout) > 9) {
                  practice_quiz_score_history.push(userdata.quizzes[Object.keys(userdata.quizzes)[i]]);
                  practice_quiz_score_history[practice_quiz_score_history.length-1].id = Object.keys(userdata.quizzes)[i];
                } else {
                  if (lesson_numbers[userdata.quizzes[Object.keys(userdata.quizzes)[i]].lessonid] != null && userdata.quizzes[Object.keys(userdata.quizzes)[i]].choices && userdata.quizzes[Object.keys(userdata.quizzes)[i]].choices.length == userdata.quizzes[Object.keys(userdata.quizzes)[i]].length) {
                    lesson_score_history[lesson_numbers[userdata.quizzes[Object.keys(userdata.quizzes)[i]].lessonid]].push(userdata.quizzes[Object.keys(userdata.quizzes)[i]]);
                    lesson_score_history[lesson_numbers[userdata.quizzes[Object.keys(userdata.quizzes)[i]].lessonid]][lesson_score_history[lesson_numbers[userdata.quizzes[Object.keys(userdata.quizzes)[i]].lessonid]].length-1].id = Object.keys(userdata.quizzes)[i];
                  }
                }
              }
              }

              for (var i = 0; i < lesson_score_history.length; i++) {

                var highest_score = 0;
                var out_of_score = 0;
                if (lesson_score_history[i] && Object.keys(lesson_score_history[i]).length > 0) {
                for (var e = 0; e < Object.keys(lesson_score_history[i]).length; e++) {
                  if (lesson_score_history[i][Object.keys(lesson_score_history[i])[e]].choices) {
                    if (lesson_score_history[i][Object.keys(lesson_score_history[i])[e]].choices.filter(function(a) {return a[1] == 1}).length > highest_score) {
                      highest_score = lesson_score_history[i][Object.keys(lesson_score_history[i])[e]].choices.filter(function(a) {return a[1] == 1}).length;
                      out_of_score = lesson_score_history[i][Object.keys(lesson_score_history[i])[e]].length;
                    }
                  }
                }
                }

                if (highest_score > 0) {
                  pendcsv += String(highest_score)+"/"+String(out_of_score)+",";
                } else {
                  pendcsv += ",";
                }
          
              }
          
              var highest_score = 0;
              var out_of_score = 0;
          
              if (practice_quiz_score_history && Object.keys(practice_quiz_score_history).length > 0) {
                for (var e = Object.keys(practice_quiz_score_history).length-1; e > -1; e--) {
                  if ((Object.keys(practice_quiz_score_history[Object.keys(practice_quiz_score_history)[e]].choices || []).map(function (key) {return (practice_quiz_score_history[Object.keys(practice_quiz_score_history)[e]].choices || [])[Number(key)]}).filter(function(a) {return (a && a[1] == 1)}).length) > highest_score) {
                    highest_score = (Object.keys(practice_quiz_score_history[Object.keys(practice_quiz_score_history)[e]].choices || []).map(function (key) {return (practice_quiz_score_history[Object.keys(practice_quiz_score_history)[e]].choices || [])[Number(key)]}).filter(function(a) {return (a && a[1] == 1)}).length);
                    out_of_score = practice_quiz_score_history[Object.keys(practice_quiz_score_history)[e]].length;
                  }
                }
              }

              if (highest_score > 0) {
                pendcsv += String(highest_score)+"/"+String(out_of_score);
              }

              pendcsv += "\n";

            }
            }

            res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Length': Buffer.byteLength(pendcsv, "utf-8"), 'Cache-Control': 'no-store' });
            res.write(pendcsv, "utf-8");
            res.end();

          }).catch(function(error) {
            return internalServerError(error);
          });
        }).catch(function(error) {
          return internalServerError(error);
        });

      } else {
        res.writeHead(403);
        res.end();
      }
    }).catch(function(error) {
      console.error(error);
      res.writeHead(400);
      res.end();
    });
  } else {
    res.writeHead(400);
    res.end();
  }
} else {
if (url.indexOf("/api") == 0) {
if (query.token) {
  admin.auth().verifyIdToken(query.token, true).then(function(decodedToken) {
    if (decodedToken.uid == "mD5iMxc7d5hD9HXXSAXSHbOHTHk2") {
      if (query.intent == "getUsers") {

        admin.database().ref("users").once("value").then(function(snapshot) {
          var users = snapshot.val() || {};
          users = Object.fromEntries(Object.entries(users).filter(function([key, value]) {return true && value.email}))
          for (var i = 0; i < Object.keys(users).length; i++) {
            users[Object.keys(users)[i]].id = Object.keys(users)[i];
            delete users[Object.keys(users)[i]].quizzes;
          }
          var users_array = [];
          for (var i = 0; i < Object.keys(users).length; i++) {
            users_array.push(users[Object.keys(users)[i]])
          }
          users_array = users_array.sort(function(a,b) {return b.date - a.date});
          var data = JSON.stringify(users_array);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
          res.write(data, "utf-8");
          res.end();
        }).catch(function(error) {
          return internalServerError(error);
        });

      } else {
      if (query.intent == "getUserFull" && query.userid) {
        admin.database().ref("users/"+query.userid).once("value").then(function(snapshot) {
          if (snapshot.val()) {
            var userdata = snapshot.val();
            admin.database().ref("lessons").once("value").then(function(snapshot2) {
              var lessons = snapshot2.val();
              //admin.database().ref("lessonhistory/lessons").once("value").then(function(snapshot3) {
                //var lessonhistory = snapshot3.val();

                var lesson_score_history = [];
                var practice_quiz_score_history = [];

                var lesson_numbers = {};
                if (lessons.length > 0) {
                  for (var i = 0; i < lessons.length; i++) {
                    lesson_numbers[lessons[i].id] = i;
                    lesson_score_history[i] = [];
                  }
                }

                if (userdata.quizzes) {
                for (var i = 0; i < Object.keys(userdata.quizzes).length; i++) {
                  if (userdata.quizzes[Object.keys(userdata.quizzes)[i]].type === 0 && Math.floor(((Date.now()-userdata.quizzes[Object.keys(userdata.quizzes)[i]].timer_date)/1000)/question_timeout) > 9) {
                    practice_quiz_score_history.push(userdata.quizzes[Object.keys(userdata.quizzes)[i]]);
                    practice_quiz_score_history[practice_quiz_score_history.length-1].id = Object.keys(userdata.quizzes)[i];
                  } else {
                    if (lesson_numbers[userdata.quizzes[Object.keys(userdata.quizzes)[i]].lessonid] != null && userdata.quizzes[Object.keys(userdata.quizzes)[i]].choices && userdata.quizzes[Object.keys(userdata.quizzes)[i]].choices.length == userdata.quizzes[Object.keys(userdata.quizzes)[i]].length) {
                      lesson_score_history[lesson_numbers[userdata.quizzes[Object.keys(userdata.quizzes)[i]].lessonid]].push(userdata.quizzes[Object.keys(userdata.quizzes)[i]]);
                      lesson_score_history[lesson_numbers[userdata.quizzes[Object.keys(userdata.quizzes)[i]].lessonid]][lesson_score_history[lesson_numbers[userdata.quizzes[Object.keys(userdata.quizzes)[i]].lessonid]].length-1].id = Object.keys(userdata.quizzes)[i];
                    }
                  }
                }
                }

                var data = JSON.stringify({"name": userdata.name, "email": userdata.email, "date": userdata.date, "id": query.userid, "lesson_score_history": lesson_score_history, "practice_quiz_score_history": practice_quiz_score_history});
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
                res.write(data, "utf-8");
                res.end();

              //}).catch(function(error) {
              //  return internalServerError(error);
              //});
            }).catch(function(error) {
              return internalServerError(error);
            });
          } else {
            res.writeHead(204);
            res.end();
          }
        }).catch(function(error) {
          return internalServerError(error);
        });
      } else {
        if (query.intent == "resetUserPassword" && query.userid) {
          admin.database().ref("users/"+query.userid).once("value").then(function(snapshot) {
            if (snapshot.val()) {

              function makeid(length) { //https://stackoverflow.com/a/1349426/6276471
                var result           = '';
                var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                var charactersLength = characters.length;
                for ( var i = 0; i < length; i++ ) {
                   result += characters.charAt(Math.floor(Math.random() * charactersLength));
                }
                return result;
             }

              var newpassword = makeid(15);

              bcrypt.hash(newpassword, 10, function(err, hash) {
                if (err) {
                  return internalServerError(err);
                } else {
                  admin.database().ref("privateusers/"+query.userid+"/hash").set(hash).then(function() {
                    admin.database().ref("privateusers/"+query.userid+"/tokens").set(null).then(function() {
                    
                      var data = JSON.stringify({"password": newpassword});
                      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
                      res.write(data, "utf-8");
                      res.end();
                    
                    }).catch(function(error) {
                      return internalServerError(error);
                    });
                  }).catch(function(error) {
                    return internalServerError(error);
                  });
                }
              });

            } else {
              res.writeHead(400);
              res.end();
            }
          }).catch(function(error) {
            return internalServerError(error);
          });
        } else {
          if (query.intent == "deleteUser" && query.userid) {
            admin.database().ref("users/"+query.userid).once("value").then(function(snapshot) {
              if (snapshot.val()) {

                    admin.database().ref("users/"+query.userid).set(null).then(function() {
                      admin.database().ref("privateusers/"+query.userid).set(null).then(function() {
                      
                        var data = JSON.stringify({});
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
                        res.write(data, "utf-8");
                        res.end();
                      
                      }).catch(function(error) {
                        return internalServerError(error);
                      });
                    }).catch(function(error) {
                      return internalServerError(error);
                    });
  
              } else {
                res.writeHead(400);
                res.end();
              }
            }).catch(function(error) {
              return internalServerError(error);
            });
          } else {
            if (query.intent == "transformUser" && query.userid && query.name && query.name.length > 0 && query.email && validateEmail(query.email)) {
              admin.database().ref("users/"+query.userid).once("value").then(function(snapshot) {
                if (snapshot.val() && !snapshot.val().email) {

                  admin.database().ref("users").orderByChild("email").equalTo(query.email).once("value").then(function(snapshot2) {

                    if (snapshot2.val()) {
                      res.writeHead(409);
                      res.end();
                    } else {
    
                  function makeid(length) { //https://stackoverflow.com/a/1349426/6276471
                    var result           = '';
                    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    var charactersLength = characters.length;
                    for ( var i = 0; i < length; i++ ) {
                       result += characters.charAt(Math.floor(Math.random() * charactersLength));
                    }
                    return result;
                 }
    
                  var newpassword = makeid(15);
    
                  bcrypt.hash(newpassword, 10, function(err, hash) {
                    if (err) {
                      return internalServerError(err);
                    } else {
                      admin.database().ref("privateusers/"+query.userid).set({"hash":hash}).then(function() {
                        admin.database().ref("users/"+query.userid).update({"name":query.name,"email":query.email}).then(function() {
                        
                          var data = JSON.stringify({"password": newpassword});
                          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
                          res.write(data, "utf-8");
                          res.end();
                        
                        }).catch(function(error) {
                          return internalServerError(error);
                        });
                      }).catch(function(error) {
                        return internalServerError(error);
                      });
                    }
                  });

                }

                }).catch(function(error) {
                  return internalServerError(error);
                });
    
                } else {
                  res.writeHead(400);
                  res.end();
                }
              }).catch(function(error) {
                return internalServerError(error);
              });
            } else {
            res.writeHead(400);
            res.end();
            }
          }
        }
      }
      }
    } else {
      res.writeHead(400);
      res.end();
    }
  }).catch(function(error) {
    console.error(error);
    res.writeHead(400);
    res.end();
  });
} else {
  res.writeHead(400);
  res.end();
}
} else {
var static_files = [
  ["css/style.css","text/css","style.css"],
  ["css/headless_style.css","text/css","headless_style.css"],
  ["images/logo.png","image/png","logo.png"],
  ["images/icon.png","image/png","icon.png"],
  ["images/android-chrome-192x192.png","image/png","android-chrome-192x192.png"],
  ["images/android-chrome-256x256.png","image/png","android-chrome-256x256.png"],
  ["images/apple-touch-icon.png","image/png","apple-touch-icon.png"],
  ["images/mstile-150x150.png","image/png","mstile-150x150.png"],
  ["images/favicon-16x16.png","image/png","favicon-16x16.png"],
  ["images/favicon-32x32.png","image/png","favicon-32x32.png"],
  ["favicon.ico","image/x-icon"],
  ["images/safari-pinned-tab.svg","image/svg+xml","safari-pinned-tab.svg"],
  ["browserconfig.xml","text/xml"],
  ["site.webmanifest","application/manifest+json"],
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

if (cookies.code && typeof cookies.code == "string" && cookies.token && typeof cookies.token == "string") {
  admin.database().ref("privateusers/"+cookies.code).once("value").then(function(snapshot) {
    privateuserdata = snapshot.val();
    if (privateuserdata && privateuserdata.tokens && privateuserdata.tokens.length > 0) {
      for (var i = 0; i < privateuserdata.tokens.length; i++) {
        if (privateuserdata.tokens[i].token == cookies.token) {
          privateuserdata.tokens.splice(i,1);
          break;
        }
      }
    }
    if (privateuserdata && privateuserdata.tokens) {
      admin.database().ref("privateusers/"+cookies.code+"/tokens").set(privateuserdata.tokens).then(function() {
        doLogOut()
      }).catch(function(error) {
        return internalServerError(error);
      });
    } else {
      doLogOut()
    }
  }).catch(function(error) {
    return internalServerError(error);
  });
} else {
  doLogOut()
}

function doLogOut() {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/"+(query.continue ? "?continue="+query.continue : ""), 'Set-Cookie': ['lang=; Expires=0', 'code=; Expires=0', 'token=; Expires=0', 'lesson_lang=; Expires=0']});
  res.end();
}
} else {
if (url == "/login_language") {
  var data = files["language.html"];
    var langhtml = "";
    for (var i = 0; i < Object.keys(languages).length; i++) {
      langhtml += '<form action="{FORM_ACTION}" method="POST"><input name="language" readonly value="'+Object.keys(languages)[i]+'" style="display: none;"><input type="submit" value="'+languages[Object.keys(languages)[i]].name+'"></form>'
    }
    data = localize(data,undefined,{"FORM_ACTION": "/language_submit"+(query.continue ? "?continue="+query.continue : ""), "LANGUAGES": langhtml})
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
} else {
if (url == "/language_submit") {
if (body && body.language && Object.keys(languages).indexOf(body.language) > -1) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? "/"+query.continue.substring(1) : "/login"+(query.continue ? "?continue="+query.continue : "")), 'Set-Cookie': ['lesson_lang=; Expires=0', 'lang='+body.language+'; Expires=Sun, 01 Jan 2040 08:00:00 GMT']});
  res.end();
} else {
  res.writeHead(400);
  res.end();
}
} else {
if (Object.keys(languages).indexOf(cookies.lang) == -1 && !headless) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/login_language?continue="+url});
  res.end();
} else {
if (headless) {
  cookies.lang = "en";
}
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
if (cookies.code) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/"});
  res.end();
  return;
}
  var data = files["login_type.html"];
    data = localize(data,cookies.lang,{"FORM_ACTION_QUERY": (query.continue ? "?continue="+query.continue : "")})
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
} else {
if (url == "/login_code") {
if (cookies.code) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/"});
  res.end();
  return;
}
  var data = files["login.html"];
    data = localize(data,cookies.lang,{"CONTINUE_QUERY": (query.continue ? "?continue="+query.continue : ""), "FORM_ACTION": "/login_submit"+(query.continue ? "?continue="+query.continue : ""), "SUBTITLE": (query.error == "badcode" ? '<font color="red">{login.badcode}</font>' : "{login.subtitle}"), "VALUE": ((query.code && query.code.replace(/\s/g,'')) ? String(query.code).replace(/\s/g,'').substring(0,4)+(String(query.code).replace(/\s/g,'').length > 4 ? " "+String(query.code).replace(/\s/g,'').substring(4,8)+(String(query.code).replace(/\s/g,'').length > 8 ? " "+String(query.code).replace(/\s/g,'').substring(8,12) : "") : "") : "")});
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
} else {
if (url == "/login_submit") {
if (!(body && (body.intent == "code" || body.intent == "login" || body.intent == "register"))) {
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
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+("/welcome"+(query.continue ? "?continue="+query.continue : "")), 'Set-Cookie': 'code='+workingcode+'; Expires=Sun, 01 Jan 2040 08:00:00 GMT'});
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
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? "/"+query.continue.substring(1) : "/"), 'Set-Cookie': 'code='+body.code+'; Expires=Sun, 01 Jan 2040 08:00:00 GMT'});
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
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? query.continue : "/"), 'Set-Cookie': ['code='+workingcode+'; Expires=Sun, 01 Jan 2040 08:00:00 GMT', 'token='+newtoken+'; Expires=Sun, 01 Jan 2040 08:00:00 GMT']});
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
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? query.continue : "/"), 'Set-Cookie': ['code='+Object.keys(snapshot.val())[0]+'; Expires=Sun, 01 Jan 2040 08:00:00 GMT', 'token='+newtoken+'; Expires=Sun, 01 Jan 2040 08:00:00 GMT']});
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
  if (cookies.code) {
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/"});
    res.end();
    return;
  }
  var data = files["login_account.html"];
    data = localize(data,cookies.lang,{"CONTINUE_QUERY": (query.continue ? "?continue="+query.continue : ""), "EMAIL_VALUE": query.email ? urlescape(query.email) : "", "ERROR_MESSAGES": JSON.stringify(error_text), "ERROR_VALUE": query.error ? (error_text[query.error] || "") : "", "ERROR_STYLE": query.error ? ' style="display: block;"' : "", "FORM_ACTION": "/login_submit"+(query.continue ? "?continue="+query.continue : ""), "FORM_ACTION_QUERY": (query.continue ? "?continue="+query.continue : "")})
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
} else {
if (url == "/login_register") {
  if (cookies.code) {
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/"});
    res.end();
    return;
  }
  var data = files["login_register.html"];
    data = localize(data,cookies.lang,{"CONTINUE_QUERY": (query.continue ? "?continue="+query.continue : ""), "EMAIL_VALUE": query.email ? urlescape(query.email) : "", "NAME_VALUE": query.name ? urlescape(query.name) : "", "ERROR_MESSAGES": JSON.stringify(error_text), "ERROR_VALUE": query.error ? (error_text[query.error] || "") : "", "ERROR_STYLE": query.error ? ' style="display: block;"' : "", "FORM_ACTION": "/login_submit"+(query.continue ? "?continue="+query.continue : "")})
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
} else {
if (!cookies.code && !headless) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/login?continue="+url});
  res.end();
} else {

if (url == "/lesson_language") {
if (body && body.language && Object.keys(languages).indexOf(body.language) > -1) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? "/"+decodeURIComponent(query.continue.substring(1)) : "/"), 'Set-Cookie': ['lesson_lang='+body.language+'; Expires=Sun, 01 Jan 2040 08:00:00 GMT']});
  res.end();
} else {
  var data = files["language.html"];
    var langhtml = "";
    for (var i = 0; i < Object.keys(languages).length; i++) {
      langhtml += '<form action="{FORM_ACTION}" method="POST"><input name="language" readonly value="'+Object.keys(languages)[i]+'" style="display: none;"><input type="submit" value="'+languages[Object.keys(languages)[i]].name+'"></form>'
    }
    data = localize(data,undefined,{"FORM_ACTION": "/lesson_language"+(query.continue ? "?continue="+encodeURIComponent(query.continue)+(query.auth ? "&auth="+encodeURIComponent(JSON.stringify(query.auth)) : "") : ""), "LANGUAGES": langhtml})
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
}
} else {

if (url == "/welcome") {
  var data = files["newcode.html"];
    data = localize(data,cookies.lang,{"FORM_ACTION": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+(query.continue ? query.continue : "/"), "CODE": String(cookies.code).substring(0,4)+" "+String(cookies.code).substring(4,8)+" "+String(cookies.code).substring(8,12)});
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();
} else {

if (url == "/account") {
doAuthentication(cookies,function(userdata) {
if (userdata.email) {
  var data = files["account.html"];
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
} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/"});
  res.end();
}
});
} else {
if (url == "/account_submit") {
if (!(body && (body.intent == "changename" || body.intent == "changeemail" || body.intent == "changepassword"))) {
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
  var data = files["account_name.html"];
    data = localize(data,cookies.lang,{"NAME_VALUE": htmlescape(userdata.name), "ERROR_MESSAGES": JSON.stringify(error_text), "ERROR_VALUE": query.error ? (error_text[query.error] || "") : "", "ERROR_STYLE": query.error ? ' style="display: block;"' : ""})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
});
} else {
if (url == "/account_email") {
doAuthentication(cookies,function(userdata) {
  var data = files["account_email.html"];
    data = localize(data,cookies.lang,{"EMAIL_VALUE": htmlescape(userdata.email), "ERROR_MESSAGES": JSON.stringify(error_text), "ERROR_VALUE": query.error ? (error_text[query.error] || "") : "", "ERROR_STYLE": query.error ? ' style="display: block;"' : ""})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
});
} else {
if (url == "/account_password") {
doAuthentication(cookies,function(userdata) {
  var data = files["account_password.html"];
    data = localize(data,cookies.lang,{"ERROR_MESSAGES": JSON.stringify(error_text), "ERROR_VALUE": query.error ? (error_text[query.error] || "") : "", "ERROR_STYLE": query.error ? ' style="display: block;"' : ""})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
});
} else {

if (url == "/") {
doAuthentication(cookies,function(userdata) {

  var pendhtml = '<main>';

  if (banner && banner[cookies.lang] && (banner[cookies.lang][0].length > 0 || banner[cookies.lang][1].length > 0)) {
    pendhtml += '<div><div class="quiz_results_title" style="font-size: 22px;padding-bottom: 14px;">'+banner[cookies.lang][0]+'</div><div class="quiz_results_subtitle" style="padding-bottom: 0px;">'+banner[cookies.lang][1]+'</div></div>';
  }

  var next_step = false;
  var things_earned = 0;
  var need_earned = lessons.length*2;

  for (var i = 1; i < lessons.length+1; i++) {
  if ((lessons[i-1].questions || []).length == 0) {
    need_earned -= 2;
  }
  var earned_star = false;
  var earned_completion = false;
  if (userdata.quizzes && Object.keys(userdata.quizzes).length > 0) {
  for (var e = 0; e < Object.keys(userdata.quizzes).length; e++) {
    if (userdata.quizzes[Object.keys(userdata.quizzes)[e]].lessonid == lessons[i-1].id && userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices && userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices.length == userdata.quizzes[Object.keys(userdata.quizzes)[e]].length) {
      earned_completion = true;
      if (userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices.filter(function(a) {return a[1] == 1}).length == userdata.quizzes[Object.keys(userdata.quizzes)[e]].length || userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices.filter(function(a) {return a[1] == 1}).length == userdata.quizzes[Object.keys(userdata.quizzes)[e]].length-1) {
        earned_star = true;
      }
    }
  }
  }
  if (earned_star) {
    things_earned++;
  }
  if (earned_completion) {
    things_earned++;
  }
  if (!earned_completion && !next_step && !((lessons[i-1].questions || []).length == 0)) {
    next_step = [i,0];
  }
  }
  if (!next_step) {
  for (var i = 1; i < lessons.length+1; i++) {
  var earned_star = false;
  var earned_completion = false;
  if (userdata.quizzes && Object.keys(userdata.quizzes).length > 0) {
  for (var e = 0; e < Object.keys(userdata.quizzes).length; e++) {
    if (userdata.quizzes[Object.keys(userdata.quizzes)[e]].lessonid == lessons[i-1].id && userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices && userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices.length == userdata.quizzes[Object.keys(userdata.quizzes)[e]].length) {
      earned_completion = true;
      if (userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices.filter(function(a) {return a[1] == 1}).length == userdata.quizzes[Object.keys(userdata.quizzes)[e]].length || userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices.filter(function(a) {return a[1] == 1}).length == userdata.quizzes[Object.keys(userdata.quizzes)[e]].length-1) {
        earned_star = true;
      }
    }
  }
  }
  if (!earned_star && !((lessons[i-1].questions || []).length == 0)) {
    next_step = [i,1];
    break;
  }
  }
  }

  pendhtml += '<div><div class="quiz_results_title" style="font-size: 22px;">'+(Object.keys(userdata.quizzes || {}).length > 0 ? localizations[cookies.lang].general.nextup : localizations[cookies.lang].general.nextup_new)+'</div><div class="quiz_results_subtitle">'+(next_step ? localize(next_step[1] == 0 ? localizations[cookies.lang].general.nextup_lesson : localizations[cookies.lang].general.nextup_quiz,cookies.lang,{"NUM":String(next_step[0])}) : localizations[cookies.lang].general.nextup_fullquiz)+'</div><form action="'+(next_step ? '/lesson/'+next_step[0] : '/quiz')+'" method="GET" style="overflow:hidden;margin-top:2px;"><input type="submit" value="'+(next_step ? localizations[cookies.lang].general.nextup_go_lesson : localizations[cookies.lang].general.nextup_go_fullquiz)+'" style="width: 200px;float: right;"></form></div>';

  var progress = things_earned/need_earned;

  pendhtml += '<div><div class="quiz_results_title" style="font-size: 21px;">'+localizations[cookies.lang].general.lessonprogress+'</div><div class="progress_bar" style="background: linear-gradient(90deg, #a8d2ff '+(Math.round(progress*100)+"%")+', #e0ebf7 '+(Math.round(progress*100)+"%")+');">'+(Math.round(progress*100)+"%")+'</div></div>'

  pendhtml += '</div>';

  var data = files["index.html"];
    data = localize(data,cookies.lang,{"META": "", "SIDEBAR": renderSidebar(cookies,userdata,"home"), "TITLE": "{general.home}", "CONTENT": pendhtml})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
});
} else {
if (url.indexOf("/lesson/") == 0 && url.split("/lesson/")[1].indexOf("/") == -1 && lessons && lessons[Number(url.split("/lesson/")[1])-1]) {
var lessonnumber = Number(url.split("/lesson/")[1]);
var lessondata = lessons[Number(url.split("/lesson/")[1])-1];
doAuthentication(cookies,function(userdata) {
  var data = files["index.html"];
    data = localize(data,cookies.lang,{"META": "", "SIDEBAR": renderSidebar(cookies,userdata,lessonnumber), "TITLE": localize(localizations[cookies.lang].general.lesson,cookies.lang,{"NUM":String(lessonnumber)}), "CONTENT": localize(lessontemplate,cookies.lang,{"TITLE": lessondata.title[cookies.lesson_lang || cookies.lang] || lessondata.title.en, "LANGUAGE_PICKER": renderLanguagePicker(cookies), "VIDEO": ((lessondata.video && lessondata.video["en"]) ? '<div style="width: 100%;padding-top: 56.28%;position: relative;margin-top: 14px;background:black;"><iframe frameborder="0" allowfullscreen="1" allow="autoplay; picture-in-picture" title="'+(lessondata.title[cookies.lesson_lang || cookies.lang] || lessondata.title["en"])+'" src="https://www.youtube.com/embed/'+(lessondata.video[cookies.lesson_lang || cookies.lang] || lessondata.video["en"])+'?playsinline=1&amp;rel=0&amp;enablejsapi=1&amp;origin=https%3A%2F%2Fonline.missioncitizen.org&amp;widgetid=1" style="width: 100%;height: 100%;position: absolute;top: 0;"></iframe></div>' : ''), "TEXT": ((lessondata.text && lessondata.text["en"]) ? '<div style="white-space: pre-wrap;margin-top: 12px;">'+(lessondata.text[cookies.lesson_lang || cookies.lang] || lessondata.text["en"])+'</div>' : ''), "FORM_ACTION": "/lesson/"+lessonnumber+"/quiz", "QUIZ_BUTTON_STYLE": ((lessondata.questions || []).length > 0) ? "" : "display: none;"})})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();
});
} else {
if (url == "/quiz_submit") {
if (body && query.id && query.index != null) {
if (query.index !== "NaN" && String(Number(query.index)) == query.index) {
  query.index = Number(query.index);
} else {
  res.writeHead(400);
  res.end();
  return;
}
if (body.option != null) {
if (typeof body.option == "object" && body.option.length > 0) {
  body.option = body.option.filter(function(a) {return (a !== "NaN" && String(Number(a)) == a)}).map(function(a) {return Number(a)})
  if (body.option.length == 0) {
    body.option = false;
  }
} else {
if (body.option !== "NaN" && String(Number(body.option)) == body.option) {
  body.option = Number(body.option);
} else {
  body.option = false;
}
}
}
doAuthentication(cookies,function(userdata) {

if (userdata && userdata.quizzes && userdata.quizzes[query.id] && userdata.quizzes[query.id].type !== 0) {

var userquizdata = userdata.quizzes[query.id];

if (userquizdata && (userquizdata.choices || []).length == query.index) {

  admin.database().ref("lessonhistory/lessons/"+userquizdata.lessonhistoryid+"/lessons/"+userquizdata.lessonindex).once("value").then(function(snapshot2) {

    if (snapshot2.val() && snapshot2.val().id == userquizdata.lessonid && snapshot2.val().questions && snapshot2.val().questions.length > 0) {

      var questions_shuffled = shuffleArray(snapshot2.val().questions,userquizdata.date);
      var question_index = query.index;

      if (!questions_shuffled[question_index].answers || !(questions_shuffled[question_index].answers.length > 0)) {
        return internalServerError(undefined,true);
      }

      var multiple = questions_shuffled[question_index].type || false;
      if (multiple == 1) {
        multiple = false;
      }
  
      var options_shuffled = shuffleArray(questions_shuffled[question_index].answers,userquizdata.date+question_index);
  
      var selected_options = [];
      var hasrightanswer = 0;

      for (var i = 0; i < options_shuffled.length; i++) {
        if (options_shuffled[i].correct) {
          if (hasrightanswer !== (multiple || 1)) {
            hasrightanswer++;
          } else {
            continue;
          }
        } else {
          if (selected_options.length == (((multiple || 1)*4)-(multiple || 1)) && hasrightanswer !== (multiple || 1)) {
            continue;
          }
        }
        if (selected_options.length == (multiple || 1)*4) {
          continue;
        }
        selected_options.push(options_shuffled[i]);
      }
  
      if (hasrightanswer !== (multiple || 1)) {
        return internalServerError(undefined,true);
      }

      if (body.option !== false && ((typeof body.option == "number" && !multiple) || (typeof body.option == "object" && body.option.length == (multiple || 1)))) {

      var iscorrect = false;
      if (typeof body.option == "number") {
        iscorrect = selected_options[body.option].correct || false;
      } else {
        if (body.option.length == multiple) {
        iscorrect = true;
        for (var i = 0; i < body.option.length; i++) {
          if (selected_options[body.option[i]].correct !== true) {
            iscorrect = false;
          }
        }
        }
      }

      admin.database().ref("users/"+cookies.code+"/quizzes/"+query.id+"/choices/"+query.index).set([body.option,iscorrect ? 1 : 0]).then(function() {

        res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/lesson/"+(userquizdata.lessonindex+1)+"/quiz?id="+query.id+"&step="+((query.index*2)+1)});
        res.end();

      }).catch(function(error) {
        return internalServerError(error);
      });

      } else {

        res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/lesson/"+(userquizdata.lessonindex+1)+"/quiz?id="+query.id+"&step="+((query.index*2)+"&error=nooption")});
        res.end();

      }

    } else {
      res.writeHead(400);
      res.end();
    }

  }).catch(function(error) {
    return internalServerError(error);
  });

} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/lesson/"+(userquizdata.lessonindex+1)+"/quiz?id="+query.id});
  res.end();
}

} else {
  res.writeHead(400);
  res.end();
}

});
} else {
  res.writeHead(400);
  res.end();
}
} else {
if (url.indexOf("/lesson/") == 0 && url.split("/lesson/")[1].indexOf("/quiz") > -1 && url.split("/lesson/")[1].indexOf("/quiz") == url.split("/lesson/")[1].indexOf("/") && lessons && lessons[Number(url.split("/lesson/")[1].split("/quiz")[0])-1]) {
var lessonnumber = Number(url.split("/lesson/")[1].split("/quiz")[0]);
var lessondata = lessons[Number(url.split("/lesson/")[1].split("/quiz")[0])-1];
doAuthentication(cookies,function(userdata) {
if (query.id) {

if (query.step && query.step !== "NaN" && String(Number(query.step)) == query.step) {
  query.step = Number(query.step);
} else {
  query.step = 0;
}

if (userdata && userdata.quizzes && userdata.quizzes[query.id]) {

var userquizdata = userdata.quizzes[query.id];

if (userquizdata && userquizdata.type !== 0 && !((query.step || 0) > (userquizdata.length*2)+1) && ((userquizdata.choices || []).length*2 == query.step || ((userquizdata.choices || []).length*2 == query.step+1 && query.step > 0) || ((userquizdata.choices || []).length == userquizdata.length && query.step == (userquizdata.length*2)+1))) {

  admin.database().ref("lessonhistory/lessons/"+userquizdata.lessonhistoryid+"/lessons/"+userquizdata.lessonindex).once("value").then(function(snapshot2) {

  if (snapshot2.val() && snapshot2.val().id == userquizdata.lessonid && snapshot2.val().questions && snapshot2.val().questions.length > 0) {

    if (query.step/2 == snapshot2.val().questions.length || query.step == (snapshot2.val().questions.length*2)+1) {

    if (query.step/2 == snapshot2.val().questions.length) {

    var pendhtml = '<main><div>';

    var correct = userquizdata.choices.filter(function(a) {return a[1] == 1}).length;
    pendhtml += '<div class="quiz_results_title">'+localize(localizations[cookies.lang].general.lessonquizresults,cookies.lang,{"NUM":String(lessonnumber)})+'</div><div class="quiz_results_results">'+localize(localizations[cookies.lang].general.correctamount,cookies.lang,{"NUM":String(correct),"TOTAL_NUM":String(snapshot2.val().questions.length)})+'</div>';

    if (correct == snapshot2.val().questions.length || correct == snapshot2.val().questions.length-1) {
      pendhtml += '<div class="quiz_results_subtitle">'+localizations[cookies.lang].general.feedback_done+'</div>';
    } else {
      if (correct/snapshot2.val().questions.length < 0.6) {
        pendhtml += '<div class="quiz_results_subtitle">'+localizations[cookies.lang].general.feedback_poor+'</div>';
      } else {

        var foundlastquiz = false;
        for (var i = 0; i < Object.keys(userdata.quizzes).length; i++) {
          if (Object.keys(userdata.quizzes)[i] !== query.id && userdata.quizzes[Object.keys(userdata.quizzes)[i]].lessonid == userquizdata.lessonid && userdata.quizzes[Object.keys(userdata.quizzes)[i]].choices) {
            foundlastquiz = userdata.quizzes[Object.keys(userdata.quizzes)[i]];
          }
        }
        if (foundlastquiz && correct > foundlastquiz.choices.filter(function(a) {return a[1] == 1}).length) {
          pendhtml += '<div class="quiz_results_subtitle">'+localize(localizations[cookies.lang].general.feedback_improvement,cookies.lang,{"NUM":String(correct-foundlastquiz.choices.filter(function(a) {return a[1] == 1}).length)})+'</div>';
        } else {
          pendhtml += '<div class="quiz_results_subtitle">'+localizations[cookies.lang].general.feedback_generic+'</div>';
        }

      }
    }

    pendhtml += '<form action="/lesson/'+lessonnumber+'/quiz?id='+query.id+'&step='+(query.step+1)+'" method="POST" style="overflow:hidden;margin-bottom:22px;"><input type="submit" value="'+localizations[cookies.lang].general.review+'" style="width: 200px;float:left;"></form>'

    if (correct == snapshot2.val().questions.length || correct == snapshot2.val().questions.length-1) {
    if (lessons[lessonnumber]) {
      pendhtml += '<form action="/lesson/'+(lessonnumber+1)+'" method="GET" style="overflow:hidden;margin-top:12px;"><input type="submit" value="'+localizations[cookies.lang].general.continuelesson+'" style="width: 250px;float:right;"></form>'
    } else {
      pendhtml += '<form action="/lesson/'+(lessonnumber+1)+'" method="GET" style="overflow:hidden;margin-top:12px;"><input type="submit" value="'+localizations[cookies.lang].general.continuequiz+'" style="width: 250px;float:right;"></form>'
    }
    } else {
      pendhtml += '<form action="/lesson/'+lessonnumber+'" method="GET" style="overflow:hidden;margin-top:12px;"><input type="submit" value="'+localizations[cookies.lang].general.backtolesson+'" style="width: 200px;float:left;"></form>'
    }

    }

    if (query.step == (snapshot2.val().questions.length*2)+1) {

      var pendhtml = '<main>'+renderLanguagePicker(cookies,query.auth)+'<div>';

      if (!headless) {
      pendhtml += '<div class="quiz_results_title" style="font-size: 22px;">'+localizations[cookies.lang].general.review+'</div>';
      }

      if (!headless) {
      pendhtml += '<form action="/lesson/'+lessonnumber+'/quiz?id='+query.id+'&step='+(query.step-1)+'" method="POST" style="overflow:hidden;"><input type="submit" value="'+localizations[cookies.lang].general.backtoresults+'" style="width: 200px;float:left;"></form>'
      }

      var questions_shuffled = shuffleArray(snapshot2.val().questions,userquizdata.date);

      for (var question_index = 0; question_index < userquizdata.length; question_index++) {
  
      if (!questions_shuffled[question_index].answers || !(questions_shuffled[question_index].answers.length > 0)) {
        return internalServerError(undefined,true);
      }
  
      var multiple = questions_shuffled[question_index].type || false;
      if (multiple == 1) {
        multiple = false;
      }
  
      var options_shuffled = shuffleArray(questions_shuffled[question_index].answers,userquizdata.date+question_index);
  
      var selected_options = [];
      var hasrightanswer = 0;
  
      for (var i = 0; i < options_shuffled.length; i++) {
        if (options_shuffled[i].correct) {
          if (hasrightanswer !== (multiple || 1)) {
            hasrightanswer++;
          } else {
            continue;
          }
        } else {
          if (selected_options.length == (((multiple || 1)*4)-(multiple || 1)) && hasrightanswer !== (multiple || 1)) {
            continue;
          }
        }
        if (selected_options.length == (multiple || 1)*4) {
          continue;
        }
        selected_options.push(options_shuffled[i]);
      }
  
      if (hasrightanswer !== (multiple || 1)) {
        return internalServerError(undefined,true);
      }
  
      pendhtml += '<div class="question_subtitle" '+((question_index !== 0 || !headless) ? 'style="padding-top: 20px;"' : '')+'>'+localize(localizations[cookies.lang].general.question_result_label,cookies.lang,{"NUM":String(question_index+1), "TOTAL_NUM": String(questions_shuffled.length), "RESULT": (userquizdata.choices[question_index][1] == 1 ? '<span style="color: #689f38">'+localizations[cookies.lang].general.correct+'</span>' : '<span style="color: #d32f2f">'+localizations[cookies.lang].general.incorrect+'</span>')})+'</div><div class="question_question">'+(questions_shuffled[question_index].question[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].question["en"])+'</div>'+((questions_shuffled[question_index].subtitle && questions_shuffled[question_index].subtitle["en"]) ? '<div class="question_question_subtitle">'+(questions_shuffled[question_index].subtitle[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].subtitle["en"])+'</div>' : '')+'<form action="/quiz_submit?id='+query.id+'&index='+question_index+'" method="POST" onsubmit="return beforeSubmit()"><div class="question_options reasoning">';
  
      for (var i = 0; i < selected_options.length; i++) {
        pendhtml += '<div'+(selected_options[i].correct ? ' class="correct"' : ((typeof userquizdata.choices[question_index][0] == "number" ? userquizdata.choices[question_index][0] == i : userquizdata.choices[question_index][0].indexOf(i) > -1) ? ' class="incorrect"' : ''))+'><div><input'+((typeof userquizdata.choices[question_index][0] == "number" ? userquizdata.choices[question_index][0] == i : userquizdata.choices[question_index][0].indexOf(i) > -1) ? ' checked disabled' : ' disabled')+' type="'+(multiple ? "checkbox" : "radio")+'" name="option" value="'+i+'" id="'+i+'"></div><div><label for="'+i+'">'+(selected_options[i].answer[cookies.lesson_lang || cookies.lang] || selected_options[i].answer["en"])+'</label>'+((selected_options[i].correct && questions_shuffled[question_index].reasoning && questions_shuffled[question_index].reasoning["en"]) ? '<div>'+(questions_shuffled[question_index].reasoning[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].reasoning["en"])+'</div>' : '')+'</div></div>'
      }
  
      pendhtml += '</div></form>';
  
      }

      if (!headless) {
      pendhtml += '<form action="/lesson/'+lessonnumber+'/quiz?id='+query.id+'&step='+(query.step-1)+'" method="POST" style="overflow:hidden;margin-top:26px;"><input type="submit" value="'+localizations[cookies.lang].general.backtoresults+'" style="width: 200px;float:left;"></form>'
      }

    }

    pendhtml += '</div></main>';

    if (headless) {
      var data = files["headless_index.html"];
      data = localize(data,cookies.lang,{"META": "", "CONTENT": pendhtml})
    } else {
    var data = files["index.html"];
    data = localize(data,cookies.lang,{"META": "", "SIDEBAR": renderSidebar(cookies,userdata,lessonnumber), "TITLE": localize(localizations[cookies.lang].general.lessonquiz,cookies.lang,{"NUM":String(lessonnumber)}), "CONTENT": pendhtml})
    }
      if (!data) {
        return internalServerError();
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
      res.write(data, "utf-8");
      res.end();

    } else {

    var questions_shuffled = shuffleArray(snapshot2.val().questions,userquizdata.date);
    var question_index = Math.floor(query.step/2);
    var reasoning = false;
    if (question_index*2 !== query.step) {
      reasoning = true;
    }

    if (!questions_shuffled[question_index].answers || !(questions_shuffled[question_index].answers.length > 0)) {
      return internalServerError(undefined,true);
    }

    var multiple = questions_shuffled[question_index].type || false;
    if (multiple == 1) {
      multiple = false;
    }

    var options_shuffled = shuffleArray(questions_shuffled[question_index].answers,userquizdata.date+question_index);

    var selected_options = [];
    var hasrightanswer = 0;

    for (var i = 0; i < options_shuffled.length; i++) {
      if (options_shuffled[i].correct) {
        if (hasrightanswer !== (multiple || 1)) {
          hasrightanswer++;
        } else {
          continue;
        }
      } else {
        if (selected_options.length == (((multiple || 1)*4)-(multiple || 1)) && hasrightanswer !== (multiple || 1)) {
          continue;
        }
      }
      if (selected_options.length == (multiple || 1)*4) {
        continue;
      }
      selected_options.push(options_shuffled[i]);
    }

    if (hasrightanswer !== (multiple || 1)) {
      return internalServerError(undefined,true);
    }

    var pendhtml = "";

    pendhtml += '<main>'+renderLanguagePicker(cookies)+'<div><div class="question_subtitle">'+localize(reasoning ? localizations[cookies.lang].general.question_result_label : localizations[cookies.lang].general.question_label,cookies.lang,{"NUM":String(question_index+1), "TOTAL_NUM": String(questions_shuffled.length), "RESULT": (reasoning ? (userquizdata.choices[userquizdata.choices.length-1][1] == 1 ? '<span style="color: #689f38">'+localizations[cookies.lang].general.correct+'</span>' : '<span style="color: #d32f2f">'+localizations[cookies.lang].general.incorrect+'</span>') : '')})+'</div><div class="question_question">'+(questions_shuffled[question_index].question[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].question["en"])+'</div>'+((questions_shuffled[question_index].subtitle && questions_shuffled[question_index].subtitle["en"]) ? '<div class="question_question_subtitle">'+(questions_shuffled[question_index].subtitle[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].subtitle["en"])+'</div>' : '')+'<form action="/quiz_submit?id='+query.id+'&index='+question_index+'" method="POST" onsubmit="return beforeSubmit()"><div class="question_options'+(reasoning ? " reasoning" : "")+'">';

    for (var i = 0; i < selected_options.length; i++) {
      pendhtml += '<div'+(reasoning ? (selected_options[i].correct ? ' class="correct"' : ((typeof userquizdata.choices[userquizdata.choices.length-1][0] == "number" ? userquizdata.choices[userquizdata.choices.length-1][0] == i : userquizdata.choices[userquizdata.choices.length-1][0].indexOf(i) > -1) ? ' class="incorrect"' : '')) : '')+'><div><input'+(reasoning ? ((typeof userquizdata.choices[userquizdata.choices.length-1][0] == "number" ? userquizdata.choices[userquizdata.choices.length-1][0] == i : userquizdata.choices[userquizdata.choices.length-1][0].indexOf(i) > -1) ? ' checked disabled' : ' disabled') : '')+' type="'+(multiple ? "checkbox" : "radio")+'" name="option" value="'+i+'" id="'+i+'"></div><div><label for="'+i+'">'+(selected_options[i].answer[cookies.lesson_lang || cookies.lang] || selected_options[i].answer["en"])+'</label>'+((selected_options[i].correct && reasoning && questions_shuffled[question_index].reasoning && questions_shuffled[question_index].reasoning["en"]) ? '<div>'+(questions_shuffled[question_index].reasoning[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].reasoning["en"])+'</div>' : '')+'</div></div>'
    }

    pendhtml += '</div>'+(reasoning ? "</form>" : "")+'<div class="question_error"'+(query.error == "nooption" ? "" : ' style="display: none;"')+'>'+([2,3].indexOf(questions_shuffled[question_index].type) > -1 ? localize(localizations[cookies.lang].general.nooption_multiple,cookies.lang,{"NUM":String(questions_shuffled[question_index].type)}) : localizations[cookies.lang].general.nooption)+'</div><div style="overflow:hidden;margin-top:12px;">'+(reasoning ? '<form action="/lesson/'+lessonnumber+'/quiz?id='+query.id+'&step='+(query.step+1)+'" method="POST">' : '')+'<input type="submit" value="'+(reasoning ? localizations[cookies.lang].general.continue : localizations[cookies.lang].general.submit)+'" style="width: 200px;float:right;">'+(reasoning ? '</form>' : '')+'</div>'+(reasoning ? '' : '</form>')+'</div></main>'

    pendhtml += '<script>window.history.replaceState(undefined,undefined,"/lesson/'+lessonnumber+'/quiz?id='+query.id+'&step='+query.step+'");function beforeSubmit() {var checkedcount = 0; for (var i = 0; i < document.querySelector(".question_options").children.length; i++) {checkedcount += (document.querySelector(".question_options").children[i].querySelector("input").checked ? 1 : 0)};if (checkedcount !== '+(multiple || 1)+') {document.querySelector(".question_error").style.display = "block";return false;}}</script>';

    var data = files["index.html"];
      data = localize(data,cookies.lang,{"META": "", "SIDEBAR": renderSidebar(cookies,userdata,lessonnumber), "TITLE": localize(localizations[cookies.lang].general.lessonquiz,cookies.lang,{"NUM":String(lessonnumber)}), "CONTENT": pendhtml})
      if (!data) {
        return internalServerError();
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
      res.write(data, "utf-8");
      res.end();

    }

  } else {
    return internalServerError(undefined,true);
  }

  }).catch(function(error) {
    return internalServerError(error);
  });

} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/lesson/"+lessonnumber+"/quiz"});
  res.end();
}

} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/lesson/"+lessonnumber+"/quiz"});
  res.end();
}
} else {

var matchinglessonid = false;
if (userdata && userdata.quizzes && Object.keys(userdata.quizzes).length > 0) {
  for (var i = 0; i < Object.keys(userdata.quizzes).length; i++) {
    if (userdata.quizzes[Object.keys(userdata.quizzes)[i]].lessonid == lessondata.id) {
      matchinglessonid = userdata.quizzes[Object.keys(userdata.quizzes)[i]];
      matchinglessonid.key = Object.keys(userdata.quizzes)[i];
    }
  }
}

if (matchinglessonid && !(matchinglessonid.length == (matchinglessonid.choices || []).length)) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/lesson/"+lessonnumber+"/quiz?id="+matchinglessonid.key+"&step="+((matchinglessonid.choices || []).length*2)});
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

}
},headless ? query.auth : undefined);
} else {
if (url == "/quiz_submit_0") {
if (body && query.id && query.index != null) {
if (query.index !== "NaN" && String(Number(query.index)) == query.index) {
  query.index = Number(query.index);
} else {
  res.writeHead(400);
  res.end();
  return;
}
if (body.option != null) {
if (typeof body.option == "object" && body.option.length > 0) {
  body.option = body.option.filter(function(a) {return (a !== "NaN" && String(Number(a)) == a)}).map(function(a) {return Number(a)})
  if (body.option.length == 0) {
    body.option = false;
  }
} else {
if (body.option !== "NaN" && String(Number(body.option)) == body.option) {
  body.option = Number(body.option);
} else {
  body.option = false;
}
}
}
doAuthentication(cookies,function(userdata) {

if (userdata && userdata.quizzes && userdata.quizzes[query.id] && userdata.quizzes[query.id].type == 0) {

var userquizdata = userdata.quizzes[query.id];

if (userquizdata && (Math.floor(((Date.now()-userquizdata.timer_date)/1000)/question_timeout) == query.index || Math.floor(((Date.now()-userquizdata.timer_date-(imprecision_tolerance*1000))/1000)/question_timeout) == query.index)) {

  admin.database().ref("lessonhistory/lessons/"+userquizdata.lessonhistoryid+"/lessons").once("value").then(function(snapshot2) {

    var all_questions = [];
    if (snapshot2.val() && snapshot2.val().length > 0) {
      for (var i = 0; i < snapshot2.val().length; i++) {
        if (snapshot2.val()[i].questions && snapshot2.val()[i].questions.length > 0) {
          for (var e = 0; e < snapshot2.val()[i].questions.length; e++) {
            all_questions.push(snapshot2.val()[i].questions[e]);
          }
        }
      }
    }

    if (all_questions.length >= 10) {

      var questions_shuffled = shuffleArray(all_questions,userquizdata.date);
      questions_shuffled = questions_shuffled.splice(0,10);
      var question_index = query.index;

      if (!questions_shuffled[question_index].answers || !(questions_shuffled[question_index].answers.length > 0)) {
        return internalServerError(undefined,true);
      }

      var multiple = questions_shuffled[question_index].type || false;
      if (multiple == 1) {
        multiple = false;
      }
  
      var options_shuffled = shuffleArray(questions_shuffled[question_index].answers,userquizdata.date+question_index);
  
      var selected_options = [];
      var hasrightanswer = 0;

      for (var i = 0; i < options_shuffled.length; i++) {
        if (options_shuffled[i].correct) {
          if (hasrightanswer !== (multiple || 1)) {
            hasrightanswer++;
          } else {
            continue;
          }
        } else {
          if (selected_options.length == (((multiple || 1)*4)-(multiple || 1)) && hasrightanswer !== (multiple || 1)) {
            continue;
          }
        }
        if (selected_options.length == (multiple || 1)*4) {
          continue;
        }
        selected_options.push(options_shuffled[i]);
      }
  
      if (hasrightanswer !== (multiple || 1)) {
        return internalServerError(undefined,true);
      }

      if (body.option !== false && ((typeof body.option == "number" && !multiple) || (typeof body.option == "object" && body.option.length == (multiple || 1)))) {

      var iscorrect = false;
      if (typeof body.option == "number") {
        iscorrect = selected_options[body.option].correct || false;
      } else {
        if (body.option.length == multiple) {
        iscorrect = true;
        for (var i = 0; i < body.option.length; i++) {
          if (selected_options[body.option[i]].correct !== true) {
            iscorrect = false;
          }
        }
        }
      }

      admin.database().ref("users/"+cookies.code+"/quizzes/"+query.id).transaction(function(current_value) {
        if (current_value) {
          if (!current_value.choices) {current_value.choices = []};
          if (current_value.choices[query.index]) {
            return current_value;
          }
          current_value.choices[query.index] = [body.option,iscorrect ? 1 : 0,Math.max(0,Math.min(60,Math.floor((((Date.now()-userquizdata.timer_date)/1000)-(60*query.index)))-1))];
          current_value.timer_date = (query.index+1 == 10 ? 1 : Date.now()-1000-((query.index+1)*60*1000));
          return current_value;
        } else {
          return current_value;
        }
      },function(error, committed, snapshot) {
        if (error || !committed) {
          return internalServerError(error);
        }
        res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/quiz/0?id="+query.id+"&step="+((query.index)+1)});
        res.end();
      })

      } else {

        res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/quiz/0?id="+query.id+"&step="+((query.index)+"&error=nooption")});
        res.end();

      }

    } else {
      res.writeHead(400);
      res.end();
    }

  }).catch(function(error) {
    return internalServerError(error);
  });

} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/quiz/0?id="+query.id});
  res.end();
}

} else {
  res.writeHead(400);
  res.end();
}

});
} else {
  res.writeHead(400);
  res.end();
}
} else {
if (url.indexOf("/quiz") == 0) {

doAuthentication(cookies,function(userdata) {

if (url.indexOf("/quiz/0") == 0) {

if (query.id) {

if (query.step && query.step !== "NaN" && String(Number(query.step)) == query.step) {
  query.step = Number(query.step);
} else {
  query.step = 0;
}

if (userdata && userdata.quizzes && userdata.quizzes[query.id]) {

var userquizdata = userdata.quizzes[query.id];

if (userquizdata && userquizdata.type == 0 && ((Math.floor(((Date.now()-userquizdata.timer_date)/1000)/question_timeout) == query.step && !(query.step > 9)) || (query.step == 10 && Math.floor(((Date.now()-userquizdata.timer_date)/1000)/question_timeout) > 9) || (query.step == 11 && Math.floor(((Date.now()-userquizdata.timer_date)/1000)/question_timeout) > 9))) {

  admin.database().ref("lessonhistory/lessons/"+userquizdata.lessonhistoryid+"/lessons").once("value").then(function(snapshot2) {

  var all_questions = [];
  if (snapshot2.val() && snapshot2.val().length > 0) {
    for (var i = 0; i < snapshot2.val().length; i++) {
      if (snapshot2.val()[i].questions && snapshot2.val()[i].questions.length > 0) {
        for (var e = 0; e < snapshot2.val()[i].questions.length; e++) {
          all_questions.push(snapshot2.val()[i].questions[e]);
        }
      }
    }
  }

  if (all_questions.length >= 10) {

    if (query.step == 10 || query.step == (10)+1) {

    if (query.step == 10) {

    var pendhtml = '<main><div>';

    var correct = Object.keys(userquizdata.choices || []).map(function (key) {return (userquizdata.choices || [])[Number(key)]}).filter(function(a) {return a[1] == 1}).length;
    pendhtml += '<div class="quiz_results_title">'+localizations[cookies.lang].general.fullquizresults+'</div><div class="quiz_results_results">'+localize(localizations[cookies.lang].general.correctamount,cookies.lang,{"NUM":String(correct),"TOTAL_NUM":String(10)})+'</div>';

    if (correct >= 6) {
      pendhtml += '<div class="quiz_results_subtitle">'+localizations[cookies.lang].general.feedback_pass+'</div>';
    } else {
      pendhtml += '<div class="quiz_results_subtitle">'+localizations[cookies.lang].general.feedback_fail+'</div>';
    }

    pendhtml += '<form action="/quiz/0?id='+query.id+'&step='+(query.step+1)+'" method="POST" style="overflow:hidden;"><input type="submit" value="'+localizations[cookies.lang].general.review+'" style="width: 200px;float:left;margin-bottom:22px;"></form>'

    pendhtml += '<form action="/quiz/" method="GET" style="overflow:hidden;"><input type="submit" value="'+localizations[cookies.lang].general.backtofullquiz+'" style="width: 200px;float:left;"></form>'

    }

    if (query.step == (10)+1) {

      var pendhtml = '<main>'+renderLanguagePicker(cookies)+'<div>'

      if (!headless) {
      pendhtml += '<div class="quiz_results_title" style="font-size: 22px;">'+localizations[cookies.lang].general.review+'</div>';
      }

      if (!headless) {
      pendhtml += '<form action="/quiz/0?id='+query.id+'&step='+(query.step-1)+'" method="POST" style="overflow:hidden;"><input type="submit" value="'+localizations[cookies.lang].general.backtoresults+'" style="width: 200px;float:left;"></form>'
      }

      var questions_shuffled = shuffleArray(all_questions,userquizdata.date);
      questions_shuffled = questions_shuffled.splice(0,10);

      for (var question_index = 0; question_index < userquizdata.length; question_index++) {
  
      if (!questions_shuffled[question_index].answers || !(questions_shuffled[question_index].answers.length > 0)) {
        return internalServerError(undefined,true);
      }
  
      var multiple = questions_shuffled[question_index].type || false;
      if (multiple == 1) {
        multiple = false;
      }
  
      var options_shuffled = shuffleArray(questions_shuffled[question_index].answers,userquizdata.date+question_index);
  
      var selected_options = [];
      var hasrightanswer = 0;
  
      for (var i = 0; i < options_shuffled.length; i++) {
        if (options_shuffled[i].correct) {
          if (hasrightanswer !== (multiple || 1)) {
            hasrightanswer++;
          } else {
            continue;
          }
        } else {
          if (selected_options.length == (((multiple || 1)*4)-(multiple || 1)) && hasrightanswer !== (multiple || 1)) {
            continue;
          }
        }
        if (selected_options.length == (multiple || 1)*4) {
          continue;
        }
        selected_options.push(options_shuffled[i]);
      }
  
      if (hasrightanswer !== (multiple || 1)) {
        return internalServerError(undefined,true);
      }
  
      pendhtml += '<div class="question_subtitle" '+((question_index !== 0 || !headless) ? 'style="padding-top: 20px;"' : '')+'>'+localize(localizations[cookies.lang].general.question_result_label,cookies.lang,{"NUM":String(question_index+1), "TOTAL_NUM": String(questions_shuffled.length), "RESULT": (((userquizdata.choices || [])[question_index] || [])[1] == 1 ? '<span style="color: #689f38">'+localizations[cookies.lang].general.correct+'</span>' : (((userquizdata.choices || [])[question_index] || [])[1] == 0 ? '<span style="color: #d32f2f">'+localizations[cookies.lang].general.incorrect+'</span>' : '<span style="color: #d32f2f">'+localizations[cookies.lang].general.timeout+'</span>'))})+(((userquizdata.choices || [])[question_index] || [])[2] != null ? '<div class="quiz_timer"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 20C16.4 20 20 16.4 20 12S16.4 4 12 4 4 7.6 4 12 7.6 20 12 20M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22C6.5 22 2 17.5 2 12C2 6.5 6.5 2 12 2M17 13.9L16.3 15.2L11 12.3V7H12.5V11.4L17 13.9Z" /></svg><div id="timer_time">'+function() {var minutes_string = Math.floor(((userquizdata.choices || [])[question_index] || [])[2]/60); var seconds_string = String(((userquizdata.choices || [])[question_index] || [])[2]-(60*minutes_string)); if (seconds_string.length == 1) {seconds_string = "0"+seconds_string}; return String(minutes_string)+":"+seconds_string;}()+'</div></div>' : '')+'</div><div class="question_question">'+(questions_shuffled[question_index].question[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].question["en"])+'</div>'+((questions_shuffled[question_index].subtitle && questions_shuffled[question_index].subtitle["en"]) ? '<div class="question_question_subtitle">'+(questions_shuffled[question_index].subtitle[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].subtitle["en"])+'</div>' : '')+'<form action="/quiz_submit_0?id='+query.id+'&index='+question_index+'" method="POST" onsubmit="return beforeSubmit()"><div class="question_options reasoning">';
  
      for (var i = 0; i < selected_options.length; i++) {
        pendhtml += '<div'+(selected_options[i].correct ? ' class="correct"' : ((typeof ((userquizdata.choices || [])[question_index] || [])[0] == "number" ? ((userquizdata.choices || [])[question_index] || [])[0] == i : (((userquizdata.choices || [])[question_index] || [])[0] || []).indexOf(i) > -1) ? ' class="incorrect"' : ''))+'><div><input'+((typeof ((userquizdata.choices || [])[question_index] || [])[0] == "number" ? ((userquizdata.choices || [])[question_index] || [])[0] == i : (((userquizdata.choices || [])[question_index] || [])[0] || []).indexOf(i) > -1) ? ' checked disabled' : ' disabled')+' type="'+(multiple ? "checkbox" : "radio")+'" name="option" value="'+i+'" id="'+i+'"></div><div><label for="'+i+'">'+(selected_options[i].answer[cookies.lesson_lang || cookies.lang] || selected_options[i].answer["en"])+'</label>'+((selected_options[i].correct && questions_shuffled[question_index].reasoning && questions_shuffled[question_index].reasoning["en"]) ? '<div>'+(questions_shuffled[question_index].reasoning[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].reasoning["en"])+'</div>' : '')+'</div></div>'
      }
  
      pendhtml += '</div></form>';
  
      }

      if (!headless) {
      pendhtml += '<form action="/quiz/0?id='+query.id+'&step='+(query.step-1)+'" method="POST" style="overflow:hidden;margin-top:26px;"><input type="submit" value="'+localizations[cookies.lang].general.backtoresults+'" style="width: 200px;float:left;"></form>'
      }

    }

    pendhtml += '</div></main>';

    if (headless) {
      var data = files["headless_index.html"];
      data = localize(data,cookies.lang,{"META": "", "CONTENT": pendhtml})
    } else {
    var data = files["index.html"];
      data = localize(data,cookies.lang,{"META": "", "SIDEBAR": renderSidebar(cookies,userdata,"quiz"), "TITLE": localizations[cookies.lang].general.fullquiz, "CONTENT": pendhtml})
    }
      if (!data) {
        return internalServerError();
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
      res.write(data, "utf-8");
      res.end();

    } else {

    var questions_shuffled = shuffleArray(all_questions,userquizdata.date);
    questions_shuffled = questions_shuffled.splice(0,10);
    var question_index = query.step;
    var reasoning = false;

    if (!questions_shuffled[question_index].answers || !(questions_shuffled[question_index].answers.length > 0)) {
      return internalServerError(undefined,true);
    }

    var multiple = questions_shuffled[question_index].type || false;
    if (multiple == 1) {
      multiple = false;
    }

    var options_shuffled = shuffleArray(questions_shuffled[question_index].answers,userquizdata.date+question_index);

    var selected_options = [];
    var hasrightanswer = 0;

    for (var i = 0; i < options_shuffled.length; i++) {
      if (options_shuffled[i].correct) {
        if (hasrightanswer !== (multiple || 1)) {
          hasrightanswer++;
        } else {
          continue;
        }
      } else {
        if (selected_options.length == (((multiple || 1)*4)-(multiple || 1)) && hasrightanswer !== (multiple || 1)) {
          continue;
        }
      }
      if (selected_options.length == (multiple || 1)*4) {
        continue;
      }
      selected_options.push(options_shuffled[i]);
    }

    if (hasrightanswer !== (multiple || 1)) {
      return internalServerError(undefined,true);
    }

    var pendhtml = "";

    pendhtml += '<main>'+renderLanguagePicker(cookies)+'<div><div class="question_subtitle">'+localize(localizations[cookies.lang].general.question_label,cookies.lang,{"NUM":String(question_index+1), "TOTAL_NUM": String(questions_shuffled.length)})+'<div class="quiz_timer"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z" /></svg><div id="timer_time">'+localizations[cookies.lang].general.quiztime+'</div></div></div><div class="question_question">'+(questions_shuffled[question_index].question[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].question["en"])+'</div>'+((questions_shuffled[question_index].subtitle && questions_shuffled[question_index].subtitle["en"]) ? '<div class="question_question_subtitle">'+(questions_shuffled[question_index].subtitle[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].subtitle["en"])+'</div>' : '')+'<form action="/quiz_submit_0?id='+query.id+'&index='+question_index+'" method="POST" onsubmit="return beforeSubmit()"><div class="question_options'+(reasoning ? " reasoning" : "")+'">';

    for (var i = 0; i < selected_options.length; i++) {
      pendhtml += '<div><div><input type="'+(multiple ? "checkbox" : "radio")+'" name="option" value="'+i+'" id="'+i+'"></div><div><label for="'+i+'">'+(selected_options[i].answer[cookies.lesson_lang || cookies.lang] || selected_options[i].answer["en"])+'</label>'+((selected_options[i].correct && reasoning && questions_shuffled[question_index].reasoning && questions_shuffled[question_index].reasoning["en"]) ? '<div>'+(questions_shuffled[question_index].reasoning[cookies.lesson_lang || cookies.lang] || questions_shuffled[question_index].reasoning["en"])+'</div>' : '')+'</div></div>'
    }

    pendhtml += '</div>'+(reasoning ? "</form>" : "")+'<div class="question_error"'+(query.error == "nooption" ? "" : ' style="display: none;"')+'>'+([2,3].indexOf(questions_shuffled[question_index].type) > -1 ? localize(localizations[cookies.lang].general.nooption_multiple,cookies.lang,{"NUM":String(questions_shuffled[question_index].type)}) : localizations[cookies.lang].general.nooption)+'</div><div style="overflow:hidden;margin-top:12px;">'+(reasoning ? '<form action="/quiz/0?id='+query.id+'&step='+(query.step+1)+'" method="POST">' : '')+'<input type="submit" value="'+(reasoning ? localizations[cookies.lang].general.continue : localizations[cookies.lang].general.submit)+'" style="width: 200px;float:right;">'+(reasoning ? '</form>' : '')+'</div>'+(reasoning ? '' : '</form>')+'</div></main>'

    pendhtml += '<script>var last_time_string = ""; window.history.replaceState(undefined,undefined,"/quiz/0?id='+query.id+'&step='+query.step+'");function beforeSubmit() {var checkedcount = 0; for (var i = 0; i < document.querySelector(".question_options").children.length; i++) {checkedcount += (document.querySelector(".question_options").children[i].querySelector("input").checked ? 1 : 0)};if (checkedcount !== '+(multiple || 1)+') {document.querySelector(".question_error").style.display = "block";return false;}};var timerdate = Date.now()+(1000*'+(Math.ceil(60-(((Date.now()-userquizdata.timer_date)/1000)-(Math.floor(((Date.now()-userquizdata.timer_date)/1000)/question_timeout)*60)))+1)+');function checkTimer() {var seconds_remaining = Math.max(0,Math.ceil((timerdate-Date.now())/1000)); var minutes_remaining = Math.floor(seconds_remaining/60); var seconds_string = String(seconds_remaining-(minutes_remaining*60)); if (seconds_string.length == 1) {seconds_string = "0"+seconds_string}; var new_time_string = String(minutes_remaining)+":"+seconds_string; if (new_time_string !== last_time_string) {document.querySelector("#timer_time").innerText = new_time_string; last_time_string = new_time_string;}}; setInterval(function() {checkTimer()},30); checkTimer();</script>';

    var data = files["index.html"];
      data = localize(data,cookies.lang,{"META": '<meta http-equiv="refresh" content="'+String(Math.ceil(60-(((Date.now()-userquizdata.timer_date)/1000)-(Math.floor(((Date.now()-userquizdata.timer_date)/1000)/question_timeout)*60)))+1)+';url=/quiz/0?id='+query.id+'&step='+(query.step+1)+'" />', "SIDEBAR": renderSidebar(cookies,userdata,"quiz"), "TITLE": localizations[cookies.lang].general.fullquiz, "CONTENT": pendhtml})
      if (!data) {
        return internalServerError();
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
      res.write(data, "utf-8");
      res.end();

    }

  } else {
    return internalServerError(undefined,true);
  }

  }).catch(function(error) {
    return internalServerError(error);
  });

} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/quiz/0"});
  res.end();
}

} else {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/quiz/0"});
  res.end();
}
} else {

var matchinglessonid = false;
if (userdata && userdata.quizzes && Object.keys(userdata.quizzes).length > 0) {
  for (var i = 0; i < Object.keys(userdata.quizzes).length; i++) {
    if (userdata.quizzes[Object.keys(userdata.quizzes)[i]].type == 0) {//quiz
      matchinglessonid = userdata.quizzes[Object.keys(userdata.quizzes)[i]];
      matchinglessonid.key = Object.keys(userdata.quizzes)[i];
    }
  }
}

if (matchinglessonid && !(Math.floor(((Date.now()-matchinglessonid.timer_date)/1000)/question_timeout) > 9)) {
  res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/quiz/0?id="+matchinglessonid.key+"&step="+Math.min(11,(Math.floor(((Date.now()-matchinglessonid.timer_date)/1000)/question_timeout)))});
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

  if (lastlessons.lessons) {
  var newquizid = admin.database().ref("users/"+cookies.code+"/quizzes").push().key;
  admin.database().ref("users/"+cookies.code+"/quizzes/"+newquizid).set({date: Date.now(), timer_date: Date.now()-1000, lessondate: lastlessons.date, lessonhistoryid: lessonhistoryid, type: 0, length: 10}).then(function() {
    res.writeHead(302, {"Location": (process.env.NODE_ENV == "production" ? "https://" : "http://")+req.headers.host+"/quiz/0?id="+newquizid+"&step=0"});
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

}

} else {

  var quiz_splash_data = files["quiz_splash.html"];

  var data = files["index.html"];
    data = localize(data,cookies.lang,{"META": "", "SIDEBAR": renderSidebar(cookies,userdata,"quiz"), "TITLE": localizations[cookies.lang].general.fullquiz, "CONTENT": localize(quiz_splash_data,cookies.lang)})
    if (!data) {
      return internalServerError();
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'private, max-age=0' });
    res.write(data, "utf-8");
    res.end();


}

},headless ? query.auth : undefined);

} else {

  var data = files["404.html"];
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(data, "utf-8"), 'Cache-Control': 'no-store' });
    res.write(data, "utf-8");
    res.end();

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
}
}
}
}
}
}

function doAuthentication(cookies,callback,apiauth) {
var userdata;
var privateuserdata;
if (apiauth) {
if (apiauth.key && apiauth.userid) {
  admin.auth().verifyIdToken(apiauth.key, true).then(function(decodedToken) {
    if (decodedToken.uid == "mD5iMxc7d5hD9HXXSAXSHbOHTHk2") {
      admin.database().ref("users/"+apiauth.userid).once("value").then(function(snapshot) {
        userdata = snapshot.val();
        if (userdata) {
          cookies.lang = "en";
          cookies.code = apiauth.userid;
          callback(userdata)
        } else {
          res.writeHead(400);
          res.end();
        }
      }).catch(function(error) {
        return internalServerError(error);
      });
    } else {
      res.writeHead(400);
      res.end();
    }
  }).catch(function(error) {
    console.error(error);
    res.writeHead(500);
    res.end();
  });
} else {
  res.writeHead(400);
  res.end();
}
} else {
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
}

function renderLanguagePicker(cookies,apiauth) {
var selected_lang = cookies.lesson_lang || cookies.lang;

var pendhtml = '<div class="language_picker"><a href="/lesson_language?continue='+encodeURIComponent(req.url)+(apiauth ? "&auth="+encodeURIComponent(JSON.stringify(apiauth)) : "")+'">'+localizations[cookies.lang].general.language+': '+languages[selected_lang].name+'</a><form action="/lesson_language?continue='+encodeURIComponent(req.url)+(apiauth ? "&auth="+encodeURIComponent(JSON.stringify(apiauth)) : "")+'" method="POST"><select name="language" onchange="this.form.submit()">';

for (var i = 0; i < Object.keys(languages).length; i++) {
  pendhtml += '<option value="'+Object.keys(languages)[i]+'"'+(selected_lang == Object.keys(languages)[i] ? " selected" : "")+'>'+languages[Object.keys(languages)[i]].name+'</option>';
}

pendhtml += '</select></form><svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></div>'

return pendhtml;
}

function renderSidebar(cookies,userdata,tab) {
var pendhtml = '<a href="/"'+(tab == "home" ? ' class="active"' : '')+'><div><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" /></svg></div><div>{general.home}</div></a>';
for (var i = 1; i < lessons.length+1; i++) {
var earned_star = false;
var earned_completion = false;
if (userdata.quizzes && Object.keys(userdata.quizzes).length > 0) {
for (var e = 0; e < Object.keys(userdata.quizzes).length; e++) {
  if (userdata.quizzes[Object.keys(userdata.quizzes)[e]].lessonid == lessons[i-1].id && userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices && userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices.length == userdata.quizzes[Object.keys(userdata.quizzes)[e]].length) {
    earned_completion = true;
    if (userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices.filter(function(a) {return a[1] == 1}).length == userdata.quizzes[Object.keys(userdata.quizzes)[e]].length || userdata.quizzes[Object.keys(userdata.quizzes)[e]].choices.filter(function(a) {return a[1] == 1}).length == userdata.quizzes[Object.keys(userdata.quizzes)[e]].length-1) {
      earned_star = true;
    }
  }
}
}
pendhtml += '<a href="/lesson/'+i+'"'+(tab == i ? ' class="active"' : '')+'><div><svg viewBox="0 0 24 24"><path d="'+((lessons[i-1].questions || []).length > 0 ? "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" : "M17.5 14.33C18.29 14.33 19.13 14.41 20 14.57V16.07C19.38 15.91 18.54 15.83 17.5 15.83C15.6 15.83 14.11 16.16 13 16.82V15.13C14.17 14.6 15.67 14.33 17.5 14.33M13 12.46C14.29 11.93 15.79 11.67 17.5 11.67C18.29 11.67 19.13 11.74 20 11.9V13.4C19.38 13.24 18.54 13.16 17.5 13.16C15.6 13.16 14.11 13.5 13 14.15M17.5 10.5C15.6 10.5 14.11 10.82 13 11.5V9.84C14.23 9.28 15.73 9 17.5 9C18.29 9 19.13 9.08 20 9.23V10.78C19.26 10.59 18.41 10.5 17.5 10.5M21 18.5V7C19.96 6.67 18.79 6.5 17.5 6.5C15.45 6.5 13.62 7 12 8V19.5C13.62 18.5 15.45 18 17.5 18C18.69 18 19.86 18.16 21 18.5M17.5 4.5C19.85 4.5 21.69 5 23 6V20.56C23 20.68 22.95 20.8 22.84 20.91C22.73 21 22.61 21.08 22.5 21.08C22.39 21.08 22.31 21.06 22.25 21.03C20.97 20.34 19.38 20 17.5 20C15.45 20 13.62 20.5 12 21.5C10.66 20.5 8.83 20 6.5 20C4.84 20 3.25 20.36 1.75 21.07C1.72 21.08 1.68 21.08 1.63 21.1C1.59 21.11 1.55 21.12 1.5 21.12C1.39 21.12 1.27 21.08 1.16 21C1.05 20.89 1 20.78 1 20.65V6C2.34 5 4.18 4.5 6.5 4.5C8.83 4.5 10.66 5 12 6C13.34 5 15.17 4.5 17.5 4.5Z")+'"/></svg></div><div>'+((lessons[i-1].questions || []).length > 0 ? localize(localizations[cookies.lang].general.lesson,cookies.lang,{"NUM":String(i)}) : (lessons[i-1].title[cookies.lang] || lessons[i-1].title.en))+(earned_star ? '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"></path></svg>' : (earned_completion? '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>' : ''))+'</div></a>'
}
pendhtml += '<a href="/quiz"'+(tab == "quiz" ? ' class="active"' : '')+'><div><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z" /></svg></div><div>{general.fullquiz}</div></a>'

if (userdata.email) {
pendhtml += '<div style="margin: 6px;border: 1px solid #c1c1c1;border-radius: 8px;padding: 6px;margin-top: 8px;"><div style="padding-bottom: 3px;">'+localizations[cookies.lang].account.knownuser+'</div><div style="font-size: 20px;padding: 2px 0px;word-break: break-word;">'+htmlescape(userdata.name)+'</div><a href="/account" style="color: black;text-decoration: none;height: 24px;width: 100%;display: block;margin-top: 4px;margin-bottom: 6px;"><div style="float: left;height:24px;"><svg style="width:24px;height:24px;" viewBox="0 0 24 24"><path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z""></path></svg></div><div style="float: left;padding-left: 3px;font-size: 18px;padding-top: 1px;">'+localizations[cookies.lang].account.settings+'</div></a><a href="/logout" style="color: black;text-decoration: none;height: 24px;width: 100%;display: block;margin-top: 4px;"><div style="float: left;"><svg style="width:24px;height:24px;transform: rotate(180deg);" viewBox="0 0 24 24"><path fill="currentColor" d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z"></path></svg></div><div style="float: left;padding-left: 3px;font-size: 18px;">'+localizations[cookies.lang].account.logout+'</div></a></div>'
} else {
pendhtml += '<div style="margin: 6px;border: 1px solid #c1c1c1;border-radius: 8px;padding: 6px;margin-top: 8px;"><div style="padding-bottom: 3px;">'+localizations[cookies.lang].account.logincode+'</div><div style="font-size: 24px;">'+String(cookies.code).substring(0,4)+" "+String(cookies.code).substring(4,8)+" "+String(cookies.code).substring(8,12)+'</div><a href="/logout" style="color: black;text-decoration: none;height: 24px;width: 100%;display: block;margin-top: 4px;"><div style="float: left;height:24px;"><svg style="width:24px;height:24px;transform: rotate(180deg);" viewBox="0 0 24 24"><path fill="currentColor" d="M14.08,15.59L16.67,13H7V11H16.67L14.08,8.41L15.5,7L20.5,12L15.5,17L14.08,15.59M19,3A2,2 0 0,1 21,5V9.67L19,7.67V5H5V19H19V16.33L21,14.33V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19Z"></path></svg></div><div style="float: left;padding-left: 3px;font-size: 18px;padding-top: 1px;">'+localizations[cookies.lang].account.logout+'</div></a></div>'
}

return pendhtml;
}

function localize(data,lang,special) {
haderror = [];
try {
data = data.replace(/{([A-Za-z0-9_\.]+?)}/g,function(a,b) {if (b == b.toUpperCase()) {if (b == "LANGUAGE_CODE") {return lang} else {if (special[b] !== undefined && special[b] !== false) {if (special[b].indexOf("{") > -1) {if (localize(special[b],lang,special) !== false) {return localize(special[b],lang,special)} else {haderror.push([b, 1]);return b}} else {return special[b]}} else {haderror.push([b, 2]);return b;}}} else {if (localizations[lang][b.split(".")[0]][b.split(".")[1]] !== undefined) {return localizations[lang][b.split(".")[0]][b.split(".")[1]]} else {haderror.push([b, 3]);return b}}});
} catch(error) {
console.error(error);
return false;
}
if (haderror.length > 0) {
console.error("Something went wrong while parsing: "+JSON.stringify(haderror));
}
return (haderror.length > 0 ? false : data);
}

function internalServerError(error,temporary) {
if (error) {
  console.error(error);
}
  var data = '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="initial-scale=1, minimum-scale=1, width=device-width"><title>Error '+(temporary ? '503: Service Temporarily Unavailable' : '500: Internal Server Error')+'</title><style>*{margin:0;padding:0}html{font:16px arial,sans-serif}html{background:#ffffff;color:#222222;padding:15px}body{margin:7% auto 0;max-width:390px;min-height:180px;padding:30px 0 15px}body{padding-right:150px}p{margin:11px 0 22px;overflow:hidden}ins{color:#777777;text-decoration:none}@media screen and (max-width:772px){body{background:none;margin-top:0;max-width:none;padding-right:0}}</style></head><body><a href="https://terrenllc.com"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 932 159" style="height:30px;padding-bottom:24px;margin-left:-1px;"><defs><style>.cls-1{fill:#1e88e5;}</style></defs><path class="cls-1" d="M58.6,25.4V154.8H35.84V25.4H1.17V4h92V25.4Z"/><path class="cls-1" d="M187.7,112.41H119.53q.89,11.73,7.62,18.65t17.29,6.84q8.2,0,13.57-3.91t12-14.45l18.56,10.35a74.26,74.26,0,0,1-9.08,12.55,48.41,48.41,0,0,1-10.26,8.6A41.21,41.21,0,0,1,157.42,156a57.57,57.57,0,0,1-13.76,1.56q-21.3,0-34.18-13.67t-12.9-36.53q0-22.54,12.5-36.52Q121.68,57,142.48,57q21,0,33.21,13.38t12.11,36.82Zm-22.56-18Q160.55,76.88,143,76.87a22.63,22.63,0,0,0-7.52,1.22,21.42,21.42,0,0,0-6.39,3.51,22.17,22.17,0,0,0-4.94,5.52A25.71,25.71,0,0,0,121,94.44Z"/><path class="cls-1" d="M211.72,59.68h22v8.49q6.06-6.35,10.75-8.69A24.7,24.7,0,0,1,255.76,57q8.7,0,18.17,5.67L263.87,82.82q-6.25-4.48-12.21-4.49-18,0-18,27.15V154.8h-22Z"/><path class="cls-1" d="M289.55,59.68h22v8.49q6-6.35,10.74-8.69A24.72,24.72,0,0,1,333.6,57q8.68,0,18.16,5.67L341.7,82.82q-6.24-4.48-12.2-4.49-18,0-18,27.15V154.8h-22Z"/><path class="cls-1" d="M449.61,112.41H381.45q.87,11.73,7.62,18.65t17.28,6.84q8.2,0,13.57-3.91t12-14.45l18.55,10.35a73.17,73.17,0,0,1-9.08,12.55,48.36,48.36,0,0,1-10.25,8.6A41.33,41.33,0,0,1,419.34,156a57.59,57.59,0,0,1-13.77,1.56q-21.29,0-34.18-13.67T358.5,107.33q0-22.54,12.5-36.52Q383.6,57,404.4,57q21,0,33.2,13.38t12.11,36.82Zm-22.56-18q-4.59-17.56-22.16-17.57a22.59,22.59,0,0,0-7.52,1.22A21.35,21.35,0,0,0,391,81.6,22.33,22.33,0,0,0,386,87.12a25.72,25.72,0,0,0-3.13,7.32Z"/><path class="cls-1" d="M473.64,59.68h22.07v8.79Q507.23,57,521.68,57q16.61,0,25.88,10.45,8,8.9,8,29V154.8H533.5V101.67q0-14.06-3.91-19.43t-13.86-5.47q-11,0-15.53,7.22t-4.49,24.91v45.9H473.64Z"/><path class="cls-1" d="M672,4v129.4h44.33V154.8H649.22V4Z"/><path class="cls-1" d="M760.65,4v129.4H805V154.8H737.89V4Z"/><path class="cls-1" d="M931.35,12.12v27q-19.73-16.5-40.82-16.5-23.24,0-39.16,16.7t-16,40.62q0,23.73,16,40t39.26,16.31q12,0,20.41-3.91a59,59,0,0,0,9.71-5.27,112.36,112.36,0,0,0,10.6-8v27.44a82.15,82.15,0,0,1-41,11q-32.31,0-55.17-22.56-22.75-22.75-22.75-54.88,0-28.81,19-51.37Q854.88,1.09,892.09,1.08,912.4,1.08,931.35,12.12Z"/></svg></a><p><b>Error '+(temporary ? '503' : '500')+':</b> <ins>'+(temporary ? 'Service Temporarily Unavailable' : 'Internal Server Error')+'</ins></p><p>Something went wrong while processing your request.'+(temporary ? ' Lesson or quiz data may have been recently changed, or lesson or quiz data may be malformed or corrupted.' : '')+' Please try again later.</p><pre style="word-break: break-all;white-space: pre-wrap;font-size: 15px;">'+(new Error().stack)+'</pre></body></html>';
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

function randomFromSeed(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function shuffleArray(a,seed) {

var calls = 0;

var randy = function() {return Math.random()};
if (seed) {
randy = function() {calls += 1; return randomFromSeed(seed+calls || 1)};
}

  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(randy() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
return a;
}

function toCSVDate(stamp) {
var date = new Date(stamp);
return date.getFullYear()+"/"+(String((date.getMonth()+1)).length == 1 ? "0"+(date.getMonth()+1) : (date.getMonth()+1))+"/"+(String(date.getDate()).length == 1 ? "0"+date.getDate() : date.getDate());
}