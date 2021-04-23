const spinnerconst = "<div class='real_spinner'><svg class='spinner' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' ><circle class='path' fill='none' stroke-width='10' stroke-linecap='butt' cx='50' cy='50' r='40'></circle></svg></div>"
const montharray = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const shortmontharray = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const weekdayarray = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const shortweekdayarray = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var secretsignup = false;
var sactive = false;
var inanim = false;

var langs = {
  "en": "English",
  "es": "Spanish"
}

function initFunction() {
  var config = {
    apiKey: "AIzaSyDzNEqhS77I-9hKnCazVdydFj9QXzWciII",
    authDomain: "missioncitizenonline.firebaseapp.com",
    databaseURL: "https://missioncitizenonline.firebaseio.com",
    projectId: "missioncitizenonline",
    storageBucket: "missioncitizenonline.appspot.com"
  };
  firebase.initializeApp(config);
  readyFunction();
  firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
	  if (secretsignup) {
	gid("username").value = "";
	gid("password").value = "";
	
afterLogin();

	  } else {

afterLogin();

	gid("username").value = "";
	gid("password").value = "";
	  }
  } else {

    gid("login").style.display = "block";
    gid("controlpanel").style.display = "none";
  gid("login_enter").style.display = "block";
gid("login_load").style.display = "none";
gid("ra_title").innerHTML = "Mission: Citizen Online Admin";
gid("ra_title_2").innerHTML = "Mission: Citizen Online Admin";
gid("log_text").innerHTML = "Log In";

if (location.hash == "#register") {
signUp();
}
  }
});


}

function resetPassword() {
showAlert("Reset admin password?","An email will be sent to missioncitizen@gmail.com with a link to reset the admin password.","confirm",function() {
	firebase.auth().sendPasswordResetEmail("missioncitizen@gmail.com").then(function() {
		showAlert("Password reset email sent","Check your inbox for a link to reset the admin password.")
	  }).catch(function(error) {
		showAlert("Error","Uh oh, something went wrong while sending the password reset email: "+error.message);
	  });
})
}

function readyFunction() {
document.getElementById("everything").style.display = "block";
}

function afterLogin() {
	
gid("controlpanel").style.display = "block";
gid("login").style.display = "none";
var string = String(firebase.auth().currentUser.email);
gid("c_username").innerHTML = string;
if (gid(location.hash.split("#")[1]+"_content")) {
switchSection(location.hash.split("#")[1])
} else {
switchSection("users")
}
for (var i = 0; i < document.getElementsByClassName("option").length; i++) {
document.getElementsByClassName("option")[i].style.display = "block"
}
}

function logOut() {
firebase.auth().signOut().then(function() {
history.replaceState(undefined, undefined, "#logout");
gid("create_account").style.display = "block";
if (isMobile) {
toggleSidebar();
}
}).catch(function(error) {
  showAlert("Error","Error code: "+error.code)
});
	
}

function signUp() {
secretsignup = true;
gid("ra_title").innerHTML = "Mission: Citizen Online Admin";
gid("ra_title_2").innerHTML = "Mission: Citizen Online Admin";
gid("login_error").innerHTML = "";
gid("username").value = "";
gid("password").value = "";
gid('username').focus();
gid("log_text").innerHTML = "Register";
gid("create_account").style.display = "none";
}

function logIn() {
	
gid("login_enter").style.display = "none";
gid("login_load").style.display = "block";
gid("login_error").innerHTML = "";
gid('username').blur();
gid('password').blur();
//gid("create_account").style.display = "none"

if (secretsignup == true) {
	
firebase.auth().createUserWithEmailAndPassword(gid("username").value, gid("password").value).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  console.log(error.code)
  console.log(error.message)

  gid("login_error").innerHTML = error.code.replace("auth/invalid-email","Invalid username").replace("auth/email-already-in-use","Username taken").replace("auth/weak-password","Password weak").replace("auth/network-request-failed","Network error");;
  gid("login_enter").style.display = "block";
gid("login_load").style.display = "none";
if (error.code.indexOf("password") > 1) {
gid('password').focus();
} else {
gid('username').focus();
}
});
  
} else {
	
	  firebase.auth().signInWithEmailAndPassword("missioncitizen@gmail.com", gid("password").value).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  console.log(error.code)
  console.log(error.message)

  gid("login_error").innerHTML = error.code.replace("auth/invalid-email","Invalid username").replace("auth/wrong-password","Password incorrect").replace("auth/user-not-found","Invalid username").replace("auth/user-disabled","Account frozen");
  gid("login_enter").style.display = "block";
gid("login_load").style.display = "none";
if (error.code.indexOf("password") > 1) {
gid('password').focus();
} else {
gid('username').focus();
}
  
  });
	
}
 
	
}

function toggleSidebar() {
if (inanim == false) {
if (sactive == false) {
sactive = true;
inanim = true;
gid("sidebar").style.display = "block"
gid("dk_bk").style.display = "block"
gid("sidebar").classList.add("slideIn");
gid("dk_bk").classList.add("fadeIn");
gid("sidebar").classList.remove("slideOut");
gid("dk_bk").classList.remove("fadeOut");
setTimeout(function() {
inanim = false;
}, 200);
} else {
sactive = false;
inanim = true;
gid("sidebar").classList.add("slideOut");
gid("dk_bk").classList.add("fadeOut");
setTimeout(function() {
gid("sidebar").style.display = "none"
gid("dk_bk").style.display = "none"
inanim = false;
}, 200);
gid("sidebar").classList.remove("slideIn");
gid("dk_bk").classList.remove("fadeIn");
}
}
}

gid = function(id) {return document.getElementById(id)};

function switchSection(tab) {
if (isMobile && sactive) {
toggleSidebar();
}
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("option");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    gid(tab+"_content").style.display = "block";
	gid(tab+"_button").className += " active";
history.replaceState(undefined, undefined, "#"+tab);
if (tab == "lessons") {
gid("navtitle").innerHTML = "Lessons"
gid("content_title").innerHTML = "Lessons"
loadLessons();
}
if (tab == "users") {
gid("navtitle").innerHTML = "Users"
gid("content_title").innerHTML = "Users"
loadUsers();
}
if (tab == "insights") {
gid("navtitle").innerHTML = "Insights"
gid("content_title").innerHTML = "Insights"
loadInsights();
}
if (tab == "feedback") {
loadFeedback();
gid("navtitle").innerHTML = "Feedback"
gid("content_title").innerHTML = "Feedback"
}
if (tab == "settings") {
loadSettings();
gid("navtitle").innerHTML = "Settings"
gid("content_title").innerHTML = "Settings"
}
gid("content").scrollTop = 0;
}

function loadInsights() {
  gid("insights_main").style.display = "block";
  gid("insights_missed").style.display = "none";
  gid("insights_time").style.display = "none";
  gid("insights_loader").style.display = "none"
}

function generateMostFrequentlyMissedQuestions(callback,includeanons,includehistory) {

  firebase.database().ref("users").once("value").then(function(snapshot) {
  
  var data_users = snapshot.val();
  
  firebase.database().ref("lessonhistory/lessons").once("value").then(function(snapshot) {
  
  var data_lessonhistory = snapshot.val();

  var questions_object = {}
  
    for (var i = 0; i < Object.keys(data_users).length; i++) {

		if (data_users[Object.keys(data_users)[i]].quizzes && (includeanons || data_users[Object.keys(data_users)[i]].email)) {

			for (var e = 0; e < Object.keys(data_users[Object.keys(data_users)[i]].quizzes).length; e++) {

				var this_quiz = data_users[Object.keys(data_users)[i]].quizzes[Object.keys(data_users[Object.keys(data_users)[i]].quizzes)[e]];

				if (includehistory || (data_lessonhistory && this_quiz.lessonhistoryid == Object.keys(data_lessonhistory)[Object.keys(data_lessonhistory).length-1])) {

				var this_questions;

				var question_source_string = "";

				if (this_quiz.type !== 0) {

					var this_lesson_questions = null;

					for (var f = 0; f < data_lessonhistory[this_quiz.lessonhistoryid].lessons.length; f++) {
						if (data_lessonhistory[this_quiz.lessonhistoryid].lessons[f].id == this_quiz.lessonid) {

							this_lesson_questions = data_lessonhistory[this_quiz.lessonhistoryid].lessons[f].questions;
							question_source_string = "Lesson "+(f+1);

						}
					}

					this_questions = shuffleArray(this_lesson_questions,this_quiz.date);

					for (var f = 0; f < this_questions.length; f++) {
						this_questions[f].answers = shuffleArray(this_questions[f].answers,this_quiz.date+f);
					}

				}

				//TODO: ALSO INCLUDE DATA FROM QUIZZES

				for (var f = 0; f < this_questions.length; f++) {

					var question_title_simplified = this_questions[f].question["en"].replace(/[^a-zA-Z0-9]/gi,"").toLowerCase();

					if (!questions_object[question_title_simplified]) {

						questions_object[question_title_simplified] = {
							"question": this_questions[f].question,
							"subtitle": this_questions[f].subtitle,
							"type": this_questions[f].type,
							"answers": {},
							"where": question_source_string,
							"count": 0
						}

					}

					questions_object[question_title_simplified].count++;

					for (var a = 0; a < this_questions[f].answers.length; a++) {

						var answer_simplified = this_questions[f].answers[a].answer["en"].replace(/[^a-zA-Z0-9]/gi,"").toLowerCase();

						if (!questions_object[question_title_simplified].answers[answer_simplified]) {

							questions_object[question_title_simplified].answers[answer_simplified] = {
								"answer": this_questions[f].answers[a].answer,
								"correct": this_questions[f].answers[a].correct,
								"count": 0
							}

						}

						if (this_quiz.choices && this_quiz.choices[f] && this_quiz.choices[f][0] == a) {

							questions_object[question_title_simplified].answers[answer_simplified].count++;

						}

					}

				}

				}

			}

		}

	}
  var questions_array_sorted = [];
  for(var i=0;i<Object.keys(questions_object).length;i++){
    questions_array_sorted.push(questions_object[Object.keys(questions_object)[i]]);
  }

  questions_array_sorted.sort(function(a,b){return a.count - b.count})
  console.log(questions_object);
	callback(questions_array_sorted);
  
  }).catch(function(error) {
    showAlert("Error",error.message);
  });
  
  }).catch(function(error) {
    showAlert("Error",error.message);
  });
  
}

function getDates() {
  if(!isNan(Number(gid('date-select').value))) {
  var end_date = Date.now();
  if(Number(gid('date-select').value) > 0 ){
    var start_date = end_date - (3600000*24*30*(Number(gid('date-select').value)));
  }else{
    var start_date = new Date(1601276400000);
    }
  }else{
  //Custom
  } 
}

function missedReport() {
  gid("insights_main").style.display = "none";
  gid("insights_missed").style.display = "none";
  gid("insights_time").style.display = "none";
  gid("insights_loader").style.display = "block";
  generateMostFrequentlyMissedQuestions(function(res){
    gid("insights_loader").style.display = "none";
    gid("insights_missed").style.display = "block";
    var pendhtml = "";
    // console.log(res);
    for(var i=0;i<res.length;i++){
      pendhtml += '<div>'+ res[i]['where'] +'</div><div style="font-size: 22px;">'+ (res[i]['question']['en'].length == 0 ? res[i]['question']['es'] : res[i]['question']['en']) +'</div>'
      var percent_missed = 0;
      for(var e=0;e<Object.keys(res[i][Object.keys(res[i])[3]]).length;e++){
        var answer = res[i]['answers'][Object.keys(res[i]['answers'])[e]];
        // console.log(answer)
        var border_color = (answer['correct'] ? '#66bb6a': '#ef5350');
        var main_color = (answer['correct'] ? '#c8e6c9': '#ffcdd2');
        var percent = (answer['count']/res[i]['count'])*100;
        pendhtml += '<div class="answer_bar" style="border:2px solid '+ border_color +';background: linear-gradient(to right, '+ main_color +' '+ percent +'%, #f5f5f5 0%)"><div class="mock-answer">'+ (answer['answer']['en'].length == 0 ? answer['answer']['es'] : answer['answer']['en']) +'</div><div style="float:right;font-size:18px;">'+ Math.floor(percent) +'%</div></div></div>'
        if(!answer['correct']){
          percent_missed += percent;
        }
      }
      pendhtml += '<div style="font-size:18px">Missed <b>'+ Math.floor(percent_missed) +'%</b> of the time, answered <b>'+ res[i]['count'] +'</b> times total.</div><div style="padding:20px;"></div>'
    }
    gid('question_report').innerHTML = pendhtml;
  },gid('include_anonymous').checked, true);
}


function timeReport() {
  gid("insights_main").style.display = "none";
  gid("insights_missed").style.display = "none";
  gid("insights_time").style.display = "none";
  gid("insights_loader").style.display = "block";

}

var userlist = [];

function loadUsers() {

gid("users_main").style.display = "block";
gid("users_user").style.display = "none";
gid("users_quiz").style.display = "none";

gid("no_users").style.display = "none";
gid("users_list_loader").style.display = "block";
gid("users_list").style.display = "none";

firebase.auth().currentUser.getIdToken().then(function(idToken) {

asyncLoad((location.origin)+"/api?intent=getUsers&token="+encodeURIComponent(idToken),function(response) {

  userlist = JSON.parse(response);

  var pendhtml = "";

  for (var i = 0; i < userlist.length; i++) {
    pendhtml += '<div class="user_list_item" onclick="openUser(\''+userlist[i].id+'\')"><div>'+htmlescape(userlist[i].name)+'</div><div>'+toDateString(userlist[i].date)+'</div></div>'
  }

  gid("inner_users_list").innerHTML = pendhtml;
gid("users_list_loader").style.display = "none";
gid("users_list").style.display = "block";
	
},function() {
	
  showAlert("Error","Bad response from server");
	
});

}).catch(function(error) {
  showAlert("Error",error.message);
});

}

function findUser() {
  showAlert("Find User",'<div style="font-size: 18px; padding-bottom: 7px;font-weight:bold;">Email</div><input type="text" class="c_text" placeholder="Email" id="find_user_email" onkeypress="if(event.keyCode==13) {gid(\'p_ok_link\').click()}"></input><div id="user_email_not_found" style="display: none;color: red;padding-top: 8px;">User with email not found</div><div style="font-size: 18px; padding-bottom: 12px; padding-top: 12px;text-align: center;">- - - OR - - -</div><div style="font-size: 18px; padding-bottom: 7px;font-weight:bold;">User ID (Login Code)</div><input type="text" class="c_text" placeholder="User ID" id="find_user_userid" onkeypress="if(event.keyCode==13) {gid(\'p_ok_link\').click()}"></input><div id="user_userid_not_found" style="display: none;color: red;padding-top: 8px;">Invalid login code</div>',"submit",function() {
    var email = gid("find_user_email").value;
    var userid = gid("find_user_userid").value.split(" ").join("");
    gid("user_userid_not_found").style.display = "none";
    gid("user_email_not_found").style.display = "none";
    var found_user_id = false;
    for (var i = 0; i < userlist.length; i++) {
      if (userlist[i].email == email) {
        found_user_id = userlist[i].id;
      }
    }
    if (found_user_id || userid.length == 12) {
      openUser(userid.length == 12 ? userid : found_user_id);
      hideAlert();
    } else {
      if (userid) {
        gid("user_userid_not_found").style.display = "block";
        gid("find_user_userid").focus();
      } else {
        gid("user_email_not_found").style.display = "block";
        gid("find_user_email").focus();
      }
    }
  })
  gid("find_user_email").focus();
}

var openuserid = false;
var openuserresponse = false;

function openUser(userid) {

openuserid = userid;

gid("users_main").style.display = "none";
gid("users_quiz").style.display = "none";
gid("users_user").style.display = "block";

gid("user_loader").style.display = "block";
gid("user_content").style.display = "none";

firebase.auth().currentUser.getIdToken().then(function(idToken) {

  asyncLoad((location.origin)+"/api?intent=getUserFull&userid="+userid+"&token="+encodeURIComponent(idToken),function(response) {

    response = JSON.parse(response);
    openuserresponse = response;

    gid("user_loader").style.display = "none";
    gid("user_content").style.display = "block";

    if (response.email) {
    gid("user_details_name").innerText = "Name: "+response.name;
    gid("user_details_email").innerText = "Email: "+response.email;
    gid("user_details_name").style.display = "";
    gid("user_details_email").style.display = "";
    gid("account_user_buttons").style.display = "";
    gid("anon_user_buttons").style.display = "none";
    } else {
      gid("user_details_name").style.display = "none";
      gid("user_details_email").style.display = "none";
      gid("account_user_buttons").style.display = "none";
      gid("anon_user_buttons").style.display = "";
    }
    gid("user_details_date").innerText = "Registration date: "+toDateString(response.date);
    gid("user_details_userid").innerText = "User ID: "+response.id;

    var pendhtml = "";

    for (var i = 0; i < response.lesson_score_history.length; i++) {

      var earned_star = false;
      var earned_completion = false;
      if (response.lesson_score_history[i] && Object.keys(response.lesson_score_history[i]).length > 0) {
      for (var e = 0; e < Object.keys(response.lesson_score_history[i]).length; e++) {
        if (response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].choices && response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].choices.length == response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].length) {
          earned_completion = true;
          if (response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].choices.filter(function(a) {return a[1] == 1}).length == response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].length || response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].choices.filter(function(a) {return a[1] == 1}).length == response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].length-1) {
            earned_star = true;
          }
        }
      }
      }

      pendhtml += '<div class="quiz_item" id="quiz_item_'+i+'" onclick="toggleQuizItem('+i+')"><div>Lesson #'+(i+1)+'</div><div>'+(earned_star ? '<i class="material-icons">star</i>' : (earned_completion ? '<i class="material-icons">check</i>' : ''))+'</div><div'+(earned_completion ? '' : ' style="display: none;"')+'><i class="material-icons">expand_more</i></div></div>'

      pendhtml += '<div style="display: none;">';

      if (response.lesson_score_history[i] && Object.keys(response.lesson_score_history[i]).length > 0) {
        for (var e = Object.keys(response.lesson_score_history[i]).length-1; e > -1; e--) {
          if (response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].choices && response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].choices.length == response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].length) {
              pendhtml += '<div class="quiz_result_item" onclick="openUserQuiz(openuserresponse.lesson_score_history['+i+']['+Object.keys(response.lesson_score_history[i])[e]+'])"><div>'+toDateString(response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].date)+'</div><div>'+response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].choices.filter(function(a) {return a[1] == 1}).length+'/'+response.lesson_score_history[i][Object.keys(response.lesson_score_history[i])[e]].length+'</div><div><i class="material-icons">chevron_right</i></div></div>'
          }
        }
      }

      pendhtml += '</div>';
    }

    pendhtml += '<div class="quiz_item" id="quiz_item_'+response.lesson_score_history.length+'" onclick="toggleQuizItem('+response.lesson_score_history.length+')"><div>Practice Quiz</div><div></div><div'+(response.practice_quiz_score_history.length > 0 ? '' : ' style="display: none;"')+'><i class="material-icons">expand_more</i></div></div>'

    pendhtml += '<div style="display: none;">';

    if (response.practice_quiz_score_history && Object.keys(response.practice_quiz_score_history).length > 0) {
      for (var e = Object.keys(response.practice_quiz_score_history).length-1; e > -1; e--) {
        pendhtml += '<div class="quiz_result_item" onclick="openUserQuiz(openuserresponse.practice_quiz_score_history['+Object.keys(response.practice_quiz_score_history)[e]+'])"><div>'+toDateString(response.practice_quiz_score_history[Object.keys(response.practice_quiz_score_history)[e]].date)+'</div><div>'+(Object.keys(response.practice_quiz_score_history[Object.keys(response.practice_quiz_score_history)[e]].choices || []).map(function (key) {return (response.practice_quiz_score_history[Object.keys(response.practice_quiz_score_history)[e]].choices || [])[Number(key)]}).filter(function(a) {return (a && a[1] == 1)}).length)+'/'+response.practice_quiz_score_history[Object.keys(response.practice_quiz_score_history)[e]].length+'</div><div><i class="material-icons">chevron_right</i></div></div>'
      }
    }

    pendhtml += '</div>';

    gid("quiz_history").innerHTML = pendhtml;

  },function(error) {

    if (error == 204) {

      showAlert("User not found","User with login code not found");
      loadUsers();

    } else {
	
      showAlert("Error","Bad response from server");

    }
    
  },function() {
	
    showAlert("Error","You are offline");
    
  },"getUserFull");
  
  }).catch(function(error) {
    showAlert("Error",error.message);
  });

}

function resetUserPassword() {
  showAlert("Reset user password?","This user will be signed out of all devices and a temporary new password will be automatically generated.","confirm",function() {
    createPostProgress("Resetting user password")
    firebase.auth().currentUser.getIdToken().then(function(idToken) {
    asyncLoad((location.origin)+"/api?intent=resetUserPassword&userid="+openuserid+"&token="+encodeURIComponent(idToken),function(response) {
      showAlert("Password reset","New password:<br><br>"+JSON.parse(response).password)
    },function() {
      showAlert("Error","Bad response from server");
    },function() {
      showAlert("Error","You are offline");
    },"resetUserPassword");
  }).catch(function(error) {
    showAlert("Error",error.message);
  });
  })
}

function deleteUserAccount() {
  showAlert("Delete user account?","This action cannot be undone. All data associated with this user will be permanently deleted.","confirm",function() {
    createPostProgress("")
    setTimeout(function() {
    showAlert("Are you sure you want to permanently delete this user?","This user will be irrevocably deleted upon clicking confirm below.","confirm",function() {
    createPostProgress("Deleting user")
    firebase.auth().currentUser.getIdToken().then(function(idToken) {
    asyncLoad((location.origin)+"/api?intent=deleteUser&userid="+openuserid+"&token="+encodeURIComponent(idToken),function(response) {
      loadUsers();
      showAlert("User deleted","The user was deleted successfully");
    },function() {
      showAlert("Error","Bad response from server");
    },function() {
      showAlert("Error","You are offline");
    },"deleteUser");
  }).catch(function(error) {
    showAlert("Error",error.message);
  });
  })
  },400)
  })
}

function toggleQuizItem(index) {
if (gid("quiz_item_"+index).nextElementSibling.style.display == "block") {
  gid("quiz_item_"+index).nextElementSibling.style.display = "none";
  gid("quiz_item_"+index).children[2].children[0].innerText = "expand_more";
} else {
  gid("quiz_item_"+index).nextElementSibling.style.display = "block";
  gid("quiz_item_"+index).children[2].children[0].innerText = "expand_less";
}
}

function openUserQuiz(quiz_object) {
gid("users_main").style.display = "none";
gid("users_quiz").style.display = "block";
gid("users_user").style.display = "none";
gid("content").scrollTop = 0;

gid("user_quiz_loader").style.display = "block";
gid("user_quiz_content").style.display = "block";

firebase.auth().currentUser.getIdToken().then(function(idToken) {

  var authobject = encodeURIComponent(JSON.stringify({"key":idToken,"userid":openuserid}));

  var baseurl = "";
  if (quiz_object.type == 0) {
    baseurl = (location.origin)+"/quiz/0?id="+quiz_object.id+"&step="+((quiz_object.length)+1)+"&auth="+authobject
  } else {
    baseurl = (location.origin)+"/lesson/"+(quiz_object.lessonindex+1)+"/quiz?id="+quiz_object.id+"&step="+((quiz_object.length*2)+1)+"&auth="+authobject
  }

  gid("user_quiz_iframe").innerHTML = '<iframe frameborder="0" onload="gid(\'user_quiz_loader\').style.display = \'none\';gid(\'user_quiz_content\').querySelector(\'iframe\').style.height = \'1px\'; gid(\'user_quiz_content\').querySelector(\'iframe\').style.height = gid(\'user_quiz_content\').querySelector(\'iframe\').contentWindow.document.documentElement.scrollHeight + \'px\';" style="border: 0;width: 100%;height:1px;" onerror=\'return;setTimeout(function() {openUserQuiz('+JSON.stringify(quiz_object)+'),1000}\' src="'+baseurl+'"></iframe>';
  gid("users_quiz_title").innerText = (quiz_object.type == 0 ? "Practice Quiz Results" : "Lesson #"+(quiz_object.lessonindex+1)+" Quiz Results");
  gid("users_quiz_subtitle").innerHTML = toDateString(quiz_object.date) + " &bull; "+((Object.keys(quiz_object.choices || []).map(function (key) {return (quiz_object.choices || [])[Number(key)]}).filter(function(a) {return (a && a[1] == 1)}).length)+'/'+quiz_object.length);
  
  //gid("user_quiz_content").style.display = "block";

}).catch(function(error) {
  showAlert("Error",error.message);
});
}

function backFromQuizResults() {
  gid("users_main").style.display = "none";
  gid("users_quiz").style.display = "none";
  gid("users_user").style.display = "block";
  gid("content").scrollTop = 0;
}

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function makeUserAccount() {
  showAlert("Transform this anonymous account into a student account",'<div style="font-size: 18px; padding-bottom: 7px;font-weight:bold;">Student Name</div><input type="text" class="c_text" placeholder="Name" id="transform_name" onkeypress="if(event.keyCode==13) {gid(\'transform_email\').focus()}"></input><div id="transform_name_bad" style="display: none;color: red;padding-top: 8px;">Please enter student name</div><div style="font-size: 18px; padding-bottom: 7px;font-weight:bold;padding-top: 7px;">Student Email</div><input type="text" class="c_text" placeholder="Email" id="transform_email" onkeypress="if(event.keyCode==13) {gid(\'p_ok_link\').click()}"></input><div id="transform_email_bad" style="display: none;color: red;padding-top: 8px;">Please enter a valid email address</div><div style="padding-top:10px;">A temporary password for this user will be generated automatically.</div>',"submit",function() {
    var name = gid("transform_name").value;
    var email = gid("transform_email").value;
    gid("transform_name_bad").style.display = "none";
    gid("transform_email_bad").style.display = "none";
    if (name.length > 0) {
      if (validateEmail(email)) {
        createPostProgress("Transforming user account and generating temporary password")
        firebase.auth().currentUser.getIdToken().then(function(idToken) {
        asyncLoad((location.origin)+"/api?intent=transformUser&userid="+openuserid+"&token="+encodeURIComponent(idToken)+"&name="+encodeURIComponent(name)+"&email="+encodeURIComponent(email),function(response) {
          showAlert("User account successfully made into a student account","Temporary password:<br><br>"+JSON.parse(response).password);
          openUser(openuserid);
        },function(error) {
          if (error == 409) {
            showAlert("Error","An account with this email address already exists.");
          } else {
          showAlert("Error","Bad response from server");
          }
        },function() {
          showAlert("Error","You are offline");
        },"transformUser");
      }).catch(function(error) {
        showAlert("Error",error.message);
      });
      } else {
        gid("transform_email_bad").style.display = "block";
        gid("transform_email").focus();
      }
    } else {
      gid("transform_name_bad").style.display = "block";
      gid("transform_name").focus();
    }
  })
  gid("transform_name").focus();
}

function exportUsers() {
showAlert("Export Users","This will export all account users into a .CSV file. You can import CSV files into spreadsheet software like Google Sheets or Microsoft Excel.","submit",function() {
  firebase.auth().currentUser.getIdToken().then(function(idToken) {
    window.location = ((location.origin)+"/users.csv?token="+idToken);
    hideAlert();
  }).catch(function(error) {
    showAlert("Error",error.message);
  });
});
}

var lessons;

function loadLessons() {
gid("lessons_main").style.display = "block";
gid("lessons_edit").style.display = "none";
gid("lessons_edit_quiz").style.display = "none";
gid("lessons_edit_question").style.display = "none";

gid("no_lessons").style.display = "none";
gid("lesson_list_loader").style.display = "block";
gid("lesson_list").style.display = "none";

firebase.database().ref("lessons").once("value").then(function(snapshot) {

var pendhtml = "";
gid("lesson_list_loader").style.display = "none";

lessons = snapshot.val();

if (snapshot.val() && snapshot.val().length > 0) {

  pendhtml += '<div class="buttons"><a onclick="editLesson('+snapshot.val().length+',true)"><div class="button" id="new_lesson" style="float: right; margin-right: 0; margin-bottom: 15px;">New Lesson</div></a></div>'

  for (var i = 0; i < snapshot.val().length; i++) {
  pendhtml += "<div class='post_item'><div class='rem_left'><div style='font-size: 25px;' class='ell ell_title'>Lesson "+(i+1)+"</div><div style='font-size: 17px; padding-top: 3px;' class='ell'>"+htmlescape((snapshot.val()[i] && snapshot.val()[i].title && snapshot.val()[i].title.en) ? snapshot.val()[i].title.en : "")+"</div></div><div class='rem_right'><a title='Reorder' onclick='reorderLesson("+i+")'><div class='item_icon'><i class='material-icons'>height</i></div></a><a title='Edit' onclick='editLesson("+i+")'><div class='item_icon'><i class='material-icons'>edit</i></div></a><a title='Delete' onclick='deleteLesson("+i+")'><div class='item_icon'><i class='material-icons'>delete</i></div></div></a></div>";
  }
  gid("lesson_list").style.display = "block";
  
  gid("inner_lesson_list").innerHTML = pendhtml;

} else {

  gid("no_lessons").style.display = "block";

}

}).catch(function(error) {
  showAlert("Error",error.message);
});
}

var openlessonindex = false;
var isnewlesson = false;

function editLesson(lessonindex,newlesson) {
  if (!lessons) {
    lessons = [];
  }
  openlessonindex = lessonindex;
  isnewlesson = newlesson ? true : false;
  gid("editlessontitle").innerHTML = "Edit Lesson "+(lessonindex+1);
  gid("editlessontitle2").innerHTML = "Edit Lesson "+(lessonindex+1)+" Quiz Questions";
  gid("lessons_main").style.display = "none";
  gid("lessons_edit").style.display = "block";
  gid("lesson_title").innerHTML = "";
  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("lesson_title").innerHTML += '<div style="font-size: 18px; padding-top: 10px; padding-bottom: 7px;font-weight:bold;">Title* ('+langs[Object.keys(langs)[i]]+')</div><input type="text" class="c_text lang_'+Object.keys(langs)[i]+'" placeholder="Title" oninput="this.style.borderColor=\'\';this.nextElementSibling.style.display=\'none\'"><div class="input_error">Please enter a title in '+langs[Object.keys(langs)[i]]+'</div>';
  }
  gid("lesson_video").innerHTML = "";
  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("lesson_video").innerHTML += '<div style="font-size: 18px; padding-top: 10px; padding-bottom: 7px;font-weight:bold;">YouTube Video ID ('+langs[Object.keys(langs)[i]]+')</div><input type="text" class="c_text lang_'+Object.keys(langs)[i]+'" placeholder="hEFglmU27MA" id="video_input_'+Object.keys(langs)[i]+'" oninput="this.style.borderColor=\'\';this.nextElementSibling.style.display=\'none\'"><div class="input_error">Please enter a valid video ID or URL</div>';
  }
  gid("lesson_text").innerHTML = "";
  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("lesson_text").innerHTML += '<div style="font-size: 18px; padding-top: 10px; padding-bottom: 7px;font-weight:bold;">Text/Description ('+langs[Object.keys(langs)[i]]+')</div><textarea type="text" class="c_textarea lang_'+Object.keys(langs)[i]+'" style="height: 75px;" placeholder="Optional text that shows below video"></textarea>';
  }
  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("lesson_title").querySelector(".lang_"+Object.keys(langs)[i]).value = ((lessons[lessonindex] && lessons[lessonindex].title) ? lessons[lessonindex].title[Object.keys(langs)[i]] || "" : "")
    gid("lesson_video").querySelector(".lang_"+Object.keys(langs)[i]).value = ((lessons[lessonindex] && lessons[lessonindex].video) ? lessons[lessonindex].video[Object.keys(langs)[i]] || "" : "")
    gid("lesson_text").querySelector(".lang_"+Object.keys(langs)[i]).value = ((lessons[lessonindex] && lessons[lessonindex].text) ? lessons[lessonindex].text[Object.keys(langs)[i]] || "" : "")
  }
}

function updateLesson() {
for (var i = 0; i < Object.keys(langs).length; i++) {
  if(gid("lesson_title").querySelector(".lang_"+Object.keys(langs)[i]).value.length == 0){
    gid("lesson_title").querySelector(".lang_"+Object.keys(langs)[i]).style.borderColor = "red";
    gid("lesson_title").querySelector(".lang_"+Object.keys(langs)[i]).nextElementSibling.style.display = "block";
    gid("lesson_title").querySelector(".lang_"+Object.keys(langs)[i]).focus();
    return;
  }
}
for (var i = 0; i < Object.keys(langs).length; i++) {
  var getvideoid = gid("lesson_video").querySelector(".lang_"+Object.keys(langs)[i]).value;
  var checkvideoid = getvideoid.match(/((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/);
  if ((checkvideoid && checkvideoid[5] && checkvideoid[5].length == 11) || getvideoid.length == 11) {
    gid("lesson_video").querySelector(".lang_"+Object.keys(langs)[i]).value = ((checkvideoid && checkvideoid[5]) ? checkvideoid[5] : getvideoid);
  }else if(getvideoid.length > 0){
    gid("video_input_"+Object.keys(langs)[i]).style.borderColor = "red";
    gid("video_input_"+Object.keys(langs)[i]).nextElementSibling.style.display = "block";
    gid("video_input_"+Object.keys(langs)[i]).focus();
    return;  
  }
}
var updatedata = {
  "title": {},
  "text": {},
  "video": {}
}
for (var i = 0; i < Object.keys(langs).length; i++) {
  updatedata.title[Object.keys(langs)[i]] = gid("lesson_title").querySelector(".lang_"+Object.keys(langs)[i]).value || "";
  updatedata.video[Object.keys(langs)[i]] = gid("lesson_video").querySelector(".lang_"+Object.keys(langs)[i]).value || null;
  updatedata.text[Object.keys(langs)[i]] = gid("lesson_text").querySelector(".lang_"+Object.keys(langs)[i]).value || null;
}
if (isnewlesson) {
  updatedata.id = Date.now();
}
createPostProgress("Saving lesson")
firebase.database().ref("lessons/"+openlessonindex).update(updatedata).then(function() {
  hideAlert();
  loadLessons();
}).catch(function(error) {
  showAlert("Error",error.message);
});
}

var questions = [];

function editLessonQuestions() {
  questions = JSON.parse(JSON.stringify(lessons[openlessonindex] ? lessons[openlessonindex].questions || [] : []));
  renderQuizQuestions();
}

function renderQuizQuestions() {
  gid("lessons_edit").style.display = "none";
  gid("lessons_edit_quiz").style.display = "block";

  var pendhtml = "";

  var tempquestions = [];
  if (Object.keys(questions).length > 0) {
    for (var i = 0; i < Object.keys(questions).length; i++) {
      tempquestions.push(questions[Object.keys(questions)[i]]);
    }
  }
  questions = tempquestions;

  if (questions.length > 0) {
  for (var i = 0; i < questions.length; i++) {
    if (!questions[i].answers) {
      questions[i].answers = [];
    }
    pendhtml += "<div class='post_item'><div class='item_left'><div style='font-size: 25px;' class='ell ell_title'>"+questions[i].question.en+"</div><div style='font-size: 17px; padding-top: 3px;' class='ell'>"+questions[i].answers.length+" answers ("+questions[i].answers.filter(function(item) {return item.correct}).length+" correct, "+questions[i].answers.filter(function(item) {return !item.correct}).length+" incorrect)</div></div><div class='item_right'><a title='Edit' onclick='editQuestion("+i+")'><div class='item_icon'><i class='material-icons'>edit</i></div></a><a title='Delete' onclick='deleteQuestion("+i+")'><div class='item_icon'><i class='material-icons'>close</i></div></div></a></div>";
  }
} else {
  pendhtml = '<div style="font-size: 18px;padding-bottom: 10px;">No questions yet</div>'
}

  gid("quiz_questions").innerHTML = pendhtml;
}

function newQuizQuestion() {
editQuestion(questions.length)
}

var questionindex;
var answers;

function editQuestion(index) {
  questionindex = index;
  gid("lessons_edit_question").style.display = "block";
  gid("lessons_edit_quiz").style.display = "none";
  answers = JSON.parse(JSON.stringify(((questions && questions[questionindex] && questions[questionindex].answers) ? questions[questionindex].answers : [])));
  gid("question_question").innerHTML = "";
  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("question_question").innerHTML += '<div style="font-size: 18px; padding-top: 10px; padding-bottom: 7px;font-weight:bold;">Question* ('+langs[Object.keys(langs)[i]]+')</div><input type="text" class="c_text lang_'+Object.keys(langs)[i]+'" placeholder="Question?" oninput="this.style.borderColor=\'\';this.nextElementSibling.style.display=\'none\'"><div class="input_error">Please enter a question in '+langs[Object.keys(langs)[i]]+'</div>';
  }
  gid("question_subtitle").innerHTML = "";
  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("question_subtitle").innerHTML += '<div style="font-size: 18px; padding-top: 10px; padding-bottom: 7px;font-weight:bold;">Subtitle ('+langs[Object.keys(langs)[i]]+')</div><input type="text" class="c_text lang_'+Object.keys(langs)[i]+'" placeholder="Optional question subtitle">';
  }
  gid("question_reasoning").innerHTML = "";
  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("question_reasoning").innerHTML += '<div style="font-size: 18px; padding-top: 10px; padding-bottom: 7px;font-weight:bold;">Reasoning ('+langs[Object.keys(langs)[i]]+')</div><textarea type="text" class="c_textarea lang_'+Object.keys(langs)[i]+'" style="height: 75px;" placeholder="Correct answers justification"></textarea>';
  }

  gid("question_type").value = String(questions[questionindex].type || 1)

  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("question_question").querySelector(".lang_"+Object.keys(langs)[i]).value = ((questions[questionindex] && questions[questionindex].question) ? questions[questionindex].question[Object.keys(langs)[i]] || "" : "")
    gid("question_subtitle").querySelector(".lang_"+Object.keys(langs)[i]).value = ((questions[questionindex] && questions[questionindex].subtitle) ? questions[questionindex].subtitle[Object.keys(langs)[i]] || "" : "")
    gid("question_reasoning").querySelector(".lang_"+Object.keys(langs)[i]).value = ((questions[questionindex] && questions[questionindex].reasoning) ? questions[questionindex].reasoning[Object.keys(langs)[i]] || "" : "")
  }

  renderQuestionOptions();
}

function renderQuestionOptions() {
  var pendhtml = "";

  if (answers.length > 0) {
    for (var i = 0; i < answers.length; i++) {
      pendhtml += "<div class='post_item option_item'><div class='item_left'><div style='font-size: 25px;' class='ell ell_title'>"+answers[i].answer.en+"</div><div style='font-size: 17px; padding-top: 3px;' class='ell'>"+(answers[i].correct ? "Correct" : "Incorrect")+"</div></div><div class='item_right'><a title='Edit' onclick='editOption("+i+")'><div class='item_icon'><i class='material-icons'>edit</i></div></a><a title='Delete' onclick='deleteOption("+i+")'><div class='item_icon'><i class='material-icons'>close</i></div></div></a></div>";
    }
  } else {
    pendhtml = '<div style="font-size: 18px;padding-bottom: 10px;">No options yet</div>'
  }

  gid("question_options").innerHTML = pendhtml;
}

function editOption(index) {

var pendhtml = "";

for (var i = 0; i < Object.keys(langs).length; i++) {
  pendhtml += '<div style="font-size: 18px; padding-top: 10px; padding-bottom: 7px;font-weight:bold;">Option* ('+langs[Object.keys(langs)[i]]+')</div><input type="text" class="c_text lang_'+Object.keys(langs)[i]+'" placeholder="Option" oninput="this.style.borderColor=\'\';this.nextElementSibling.style.display=\'none\'"><div class="input_error">Please enter an option in '+langs[Object.keys(langs)[i]]+'</div>';
}

pendhtml += '<select style="border-width: 2px;margin-top: 16px;font-size: 20px;"><option value="true">Correct</option><option value="false">Incorrect</option></select>'

showAlert("Question Option",pendhtml,"submit",function() {

  for (var i = 0; i < Object.keys(langs).length; i++) {
    if(gid("panel-content").querySelector(".lang_"+Object.keys(langs)[i]).value.length == 0){
      gid("panel-content").querySelector(".lang_"+Object.keys(langs)[i]).style.borderColor = "red";
      gid("panel-content").querySelector(".lang_"+Object.keys(langs)[i]).nextElementSibling.style.display = "block";
      gid("panel-content").querySelector(".lang_"+Object.keys(langs)[i]).focus();
      return;
    }
  }

  if (!answers[index]) {
    answers[index] = {"answer":{}};
  }

  for (var i = 0; i < Object.keys(langs).length; i++) {
    answers[index].answer[Object.keys(langs)[i]] = gid("panel-content").querySelector(".lang_"+Object.keys(langs)[i]).value || "";
  }

  answers[index].correct = gid("panel-content").querySelector("select").value == "true";

  hideAlert();
  renderQuestionOptions();
  
})

for (var i = 0; i < Object.keys(langs).length; i++) {
  gid("panel-content").querySelector(".lang_"+Object.keys(langs)[i]).value = ((answers[index] && answers[index].answer) ? answers[index].answer[Object.keys(langs)[i]] || "" : "")
}
gid("panel-content").querySelector("select").value = ((answers[index] && answers[index].correct) ? "true" : "false");

}

function addOption() {

  editOption(answers.length)

}

function deleteOption(index) {

  answers.splice(index,1);
  renderQuestionOptions();

}

function deleteQuestion(index) {
showAlert("Remove quiz question?","This action cannot be undone.","confirm",function() {
  questions.splice(index,1);
  createPostProgress("Saving questions")
  firebase.database().ref("lessons/"+openlessonindex+"/questions").set(questions).then(function() {
    hideAlert();
    lessons[openlessonindex].questions = questions;
    renderQuizQuestions();
  }).catch(function(error) {
    showAlert("Error",error.message);
  });
})
}

function goBackEditQuiz() {
  gid("lessons_edit").style.display = "block";
  gid("lessons_edit_quiz").style.display = "none";
}

function backQuestion() {
  gid("lessons_edit_quiz").style.display = "block";
  gid("lessons_edit_question").style.display = "none";
}

function saveQuestionChanges() {
  for (var i = 0; i < Object.keys(langs).length; i++) {
    if(gid("question_question").querySelector(".lang_"+Object.keys(langs)[i]).value.length == 0){
      gid("question_question").querySelector(".lang_"+Object.keys(langs)[i]).style.borderColor = "red";
      gid("question_question").querySelector(".lang_"+Object.keys(langs)[i]).nextElementSibling.style.display = "block";
      gid("question_question").querySelector(".lang_"+Object.keys(langs)[i]).focus();
      return;
    }
  }
  var num_correct = 0;
  for(var i = 0;i<answers.length;i++){
    if(answers[i]['correct']){
      num_correct++;
    }
  }
  if(num_correct < Number(gid("question_type").value)){
    showAlert('Error','Please select at least ' + Number(gid("question_type").value) + ' correct answer' + (Number(gid("question_type").value) > 1 ? 's' : ''));
    return;
  }
  var updatedata = {
    "answers": answers,
    "question": {},
    "reasoning": {},
    "subtitle": {}
  }
  for (var i = 0; i < Object.keys(langs).length; i++) {
    updatedata.question[Object.keys(langs)[i]] = gid("question_question").querySelector(".lang_"+Object.keys(langs)[i]).value || "";
    updatedata.subtitle[Object.keys(langs)[i]] = gid("question_subtitle").querySelector(".lang_"+Object.keys(langs)[i]).value || "";
    updatedata.reasoning[Object.keys(langs)[i]] = gid("question_reasoning").querySelector(".lang_"+Object.keys(langs)[i]).value || null;
    updatedata.type = Number(gid("question_type").value);
  }
  createPostProgress("Saving question")
  firebase.database().ref("lessons/"+openlessonindex+"/questions/"+questionindex).update(updatedata).then(function() {
    hideAlert();
    backQuestion();
    if (!lessons[openlessonindex]) {
      lessons[openlessonindex] = {};
    }
    if (!lessons[openlessonindex].questions) {
      lessons[openlessonindex].questions = {};
    }
    lessons[openlessonindex].questions[questionindex] = updatedata;
    editLessonQuestions();
  }).catch(function(error) {
    showAlert("Error",error.message);
  });
}

function deleteLesson(index) {
  showAlert("Are you sure you want to delete this lesson?","This action cannot be undone.<div style='margin-top: 10px'></div><div style='color: red;'>WARNING: DO NOT PERFORM THIS OPERATION UNLESS YOU ARE THE ONLY ONE LOGGED IN TO THE MISSION: CITIZEN ONLINE ADMIN SYSTEM.</div>","confirm",function() {
    lessons.splice(index,1);
    createPostProgress("Deleting lesson")
firebase.database().ref("lessons").set(lessons).then(function() {
  hideAlert();
  loadLessons();
}).catch(function(error) {
  showAlert("Error",error.message);
});
  })	
}

function reorderLesson(index) {
  showAlert("Reorder lesson","This lesson is currently in position "+String(index+1)+" of "+lessons.length+"<div style='margin-top: 10px'></div>New position:<div style='margin-top: 10px'></div><input onkeypress='if(event.keyCode==13) {saveOrderS("+index+");}' type='tel' class='c_text' id='order_text' placeholder='"+String(index+1)+"'><div style='margin-top: 10px'></div><div style='color: red;'>WARNING: DO NOT PERFORM THIS OPERATION UNLESS YOU ARE THE ONLY ONE LOGGED IN TO THE MISSION: CITIZEN ONLINE ADMIN SYSTEM.</div>","submit",function() {saveOrderS(index)});
  gid("order_text").focus();
  }
  
  function saveOrderS(index) {
  var vv = Math.floor(Number(gid("order_text").value));
  if (vv < 1 || vv > lessons.length || String(Number(gid("order_text").value)) == "NaN") {
  showAlert("Error","The new position should be a number from 1 to "+lessons.length)
  } else {
  var coopy = lessons[index];
  lessons.splice(index,1);
  lessons.splice(vv-1, 0, coopy);
  
  createPostProgress("Updating lesson order");

  firebase.database().ref("lessons").set(lessons).then(function() {
    hideAlert();
    loadLessons();
  }).catch(function(error) {
    showAlert("Error",error.message);
  });
  
  }
  }


function getScrollbarWidth() {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

    document.body.appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);        

    var widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
}

function showAlert(title,message,type,yesfunction) {
gid("prompt").children[0].style.width = "";
if (type == "cancel") {
gid("panel-bottomA").style.display = "block";
gid("p_cancel").style.display = "block";
gid("p_ok").style.display = "none";
} else {
gid("p_ok").style.display = "block";
if (type == "confirm") {
gid("panel-bottomA").style.display = "block";
gid("p_cancel").style.display = "block";
gid("p_ok").innerHTML = "CONFIRM"
gid("p_ok").classList.add("red")
gid("p_ok_link").onclick = function () {yesfunction()}
} else {
gid("p_ok").classList.remove("red")


if (type == "submit" || type == "colour") {
gid("panel-bottomA").style.display = "block";
gid("p_cancel").style.display = "block";
gid("p_ok").innerHTML = "SUBMIT"
gid("p_ok_link").onclick = function () {yesfunction()}
if (type == "colour") {
	gid("prompt").children[0].style.width = "262px";
}
} else {
if (type == "done") {
gid("panel-bottomA").style.display = "block";
gid("p_cancel").style.display = "none";
gid("p_ok").innerHTML = "DONE"
gid("p_ok_link").onclick = function () {yesfunction()}
} else {
if (type == "tryagain") {
gid("panel-bottomA").style.display = "block";
gid("p_cancel").style.display = "block";
gid("p_ok").innerHTML = "TRY AGAIN"
gid("p_ok_link").onclick = function () {yesfunction()}
} else {
gid("p_ok_link").onclick = function () {hideAlert()}
if (type == "hidden") {
gid("panel-bottomA").style.display = "none";
} else {
gid("panel-bottomA").style.display = "block";
gid("p_cancel").style.display = "none";
gid("p_ok").innerHTML = "OK"
}
}
}
}


}
}
gid("panel-title").innerHTML = title;
gid("panel-content").innerHTML = message;
gid("prompt").style.display = "block";
}

function hideAlert() {
gid("prompt").style.display = "none";
}

var capitalMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function toTimeString(stamp) {
var date = new Date(stamp);
var today = new Date();
var hours = date.getHours();
var day = date.getDate();
var ampm = ""
var monthstring = capitalMonths[date.getMonth()];
if (hours > 11 && hours < 24) {
ampm = " PM"
} else {
ampm = " AM"
}
if (hours > 12) {
hours -= 12;
}
if (hours == 0) {
hours = 12;
}
var minutes = "0" + date.getMinutes();
var timestring = monthstring +" " + day +nth(day) +", " + date.getFullYear() + " at "+hours + ':' + minutes.substr(-2) + ampm;
return timestring;
}

	    function nth(d) {
      if(d>3 && d<21) return 'th';
      switch (d % 10) {
            case 1:  return "st";
            case 2:  return "nd";
            case 3:  return "rd";
            default: return "th";
        }
    }


function htmlescape(str) {
if (str == undefined) {
return str;
}
str = String(str);
return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function unhtmlescape(str) {
if (str == undefined) {
return str;
}
str = String(str);
return str.split("&lt;").join("<").split("&gt;").join(">").split('&quot;').join('"').split("&#039;").join("'").split("&amp;").join("&");
}

var feedbackjson = "";
function loadFeedback() {
gid("feedback_loader").style.display = "block";
gid("feedback_content2").style.display = "none";
gid("feedback_content3").style.display = "none";
gid("feedback_content4").style.display = "none";
gid("feedbackr").innerHTML = "";
gid("resolvedr").innerHTML = "";

firebase.database().ref('/feedback/').once('value').then(function(snapshot) {
  feedbackjson = snapshot.val();
  displayFeed();
});

}

function displayFeed() {
gid("feedbackr").innerHTML = "";
gid("resolvedr").innerHTML = "";
gid("feedback_loader").style.display = "none";
gid("feedback_content2").style.display = "block";
if (feedbackjson !== null) {
for (var i = 0; i < Object.keys(feedbackjson).length; i++) {
if (feedbackjson[Object.keys(feedbackjson)[i]]["status"] !== "Resolved") {
gid("feedbackr").innerHTML += "<div class='post_item' id='feedback_"+i+"'><div class='item_left'><div style='font-size: 25px;' class='ell'>"+feedbackjson[Object.keys(feedbackjson)[i]]["request_type"]+"</div><div style='font-size: 17px; padding-top: 3px;' class='ell'>"+htmlescape(feedbackjson[Object.keys(feedbackjson)[i]]["message"])+"</div></div><div class='item_right'><a title='View' onclick='viewFeedback("+i+")'><div class='item_icon'><i class='material-icons'>remove_red_eye</i></div></a><a title='Mark as resolved' onclick='resolveFeedback("+i+")'><div class='item_icon'><i class='material-icons'>check</i></div></a></div></div>";
} else {
if (feedbackjson[Object.keys(feedbackjson)[i]]["request_type"] == "Support Request") {
gid("resolvedr").innerHTML += "<div class='post_item' id='feedback_"+i+"'><div class='item_left'><div style='font-size: 25px;' class='ell'>Support Request</div><div style='font-size: 17px; padding-top: 3px;' class='ell'>"+toTimeString(feedbackjson[Object.keys(feedbackjson)[i]]["timestamp"])+"</div></div><div class='item_right'><a title='View' onclick='viewFeedback("+i+")'><div class='item_icon'><i class='material-icons'>remove_red_eye</i></div></a><a title='Delete' onclick='deleteFeedback("+i+")'><div class='item_icon'><i class='material-icons'>delete</i></div></a></div></div>";
} else {
gid("resolvedr").innerHTML += "<div class='post_item' id='feedback_"+i+"'><div class='item_left'><div style='font-size: 25px;' class='ell'>"+feedbackjson[Object.keys(feedbackjson)[i]]["request_type"]+"</div><div style='font-size: 17px; padding-top: 3px;' class='ell'>"+htmlescape(feedbackjson[Object.keys(feedbackjson)[i]]["message"])+"</div></div><div class='item_right'><a title='View' onclick='viewFeedback("+i+")'><div class='item_icon'><i class='material-icons'>remove_red_eye</i></div></a><a title='Delete' onclick='deleteFeedback("+i+")'><div class='item_icon'><i class='material-icons'>delete</i></div></a></div></div>";
}
}
}
}
shownmsgfdbck();
}

function shownmsgfdbck() {
if (gid("feedbackr").innerHTML == "") {
gid("feedbackr").innerHTML = "<center>No unresolved feedback</center><div class='padding'></div>"
}
if (gid("resolvedr").innerHTML == "") {
gid("resolvedr").innerHTML = "<center>No resolved feedback</center><div class='padding'></div>"
}
}

function viewResolvedFeedback() {
gid("feedback_content3").style.display = "block";
gid("feedback_content2").style.display = "none";
}

function backFeedback() {
gid("feedback_content4").style.display = "none";
gid("feedback_content3").style.display = "none";
gid("feedback_content2").style.display = "block";
}

var currentfeedback = false;
function viewFeedback(id) {
currentfeedback = id;
gid("feedback_content4").style.display = "block";
gid("feedback_content3").style.display = "none";
gid("feedback_content2").style.display = "none";
gid("del_fed").style.display = "none";
gid("unres_fed").style.display = "none";
gid("res_fed").style.display = "block";
if (feedbackjson[Object.keys(feedbackjson)[id]]["status"] == "Resolved") {
gid("del_fed").style.display = "block";
gid("unres_fed").style.display = "block";
gid("res_fed").style.display = "none";
}
gid("fc_1").innerHTML = "";
gid("fc_1").innerHTML += "<div style='font-size: 25px;'>"+feedbackjson[Object.keys(feedbackjson)[id]]["request_type"]+"</div><div class='padding'></div>";
if (feedbackjson[Object.keys(feedbackjson)[id]]["request_type"] == "Support Request") {
gid("fc_1").innerHTML += "Name: "+feedbackjson[Object.keys(feedbackjson)[id]]["name"]+"<div class='minipadding'></div>";
gid("fc_1").innerHTML += "Contact: "+feedbackjson[Object.keys(feedbackjson)[id]]["contact_info"]+"<div class='minipadding'></div>";
}
gid("fc_1").innerHTML += "Date: "+toTimeString(feedbackjson[Object.keys(feedbackjson)[id]]["timestamp"])+"<div class='minipadding'></div>";
gid("fc_1").innerHTML += "Message:<div class='padding'></div><pre>"+htmlescape(feedbackjson[Object.keys(feedbackjson)[id]]["message"])+"</pre><div class='padding'></div>";
gid("fc_1").innerHTML += "Device Info: <a onclick='showDevInfo()' id='sdi'>Show</a><div class='minipadding'></div><pre class='di' id='di'>"+htmlescape(JSON.stringify(JSON.parse(feedbackjson[Object.keys(feedbackjson)[id]]["device_info"]),null,2))+"</pre><div class='minipadding'></div>";
}

function showDevInfo() {
gid("di").style.display = "block";
gid("sdi").style.display = "none";
}

function resolveFeedback(id) {
createPostProgress("Marking as resolved");

firebase.database().ref('feedback/'+Object.keys(feedbackjson)[id]).update({
    status : "Resolved",
}).then(function () {

allDone()

}).catch(function(error) {showAlert("Error","Error code: "+error.code)});

function allDone() {

if (gid("feedback_content4").style.display == "block") {
gid("feedback_content4").style.display = "none"
gid("feedback_content3").style.display = "none";
gid("feedback_content2").style.display = "block";
}

feedbackjson[Object.keys(feedbackjson)[id]]["status"] = "Resolved";

displayFeed();

hideAlert();
}

}

function unresolveFeedback(id) {
createPostProgress("Marking as unresolved");

firebase.database().ref('feedback/'+Object.keys(feedbackjson)[id]).update({
    status : "Unresolved",
}).then(function () {

allDone()

}).catch(function(error) {showAlert("Error","Error code: "+error.code)});

function allDone() {

if (gid("feedback_content4").style.display == "block") {
gid("feedback_content4").style.display = "none"
gid("feedback_content3").style.display = "none";
gid("feedback_content2").style.display = "block";
}

feedbackjson[Object.keys(feedbackjson)[id]]["status"] = "Unresolved";

displayFeed();

showAlert("Marked as unresolved","Marked as unresolved successfully")
}

}

function deleteFeedback(id) {
createPostProgress("Deleting feedback");

firebase.database().ref('feedback/'+Object.keys(feedbackjson)[id]).set(null).then(function () {

allDone()

}).catch(function(error) {showAlert("Error","Error code: "+error.code)});

function allDone() {

gid("feedback_content4").style.display = "none"

delete feedbackjson[Object.keys(feedbackjson)[id]]

displayFeed();

gid("feedback_content3").style.display = "block";
gid("feedback_content2").style.display = "none";

hideAlert();
}

}


function loadSettings() {
gid("settings_main").style.display = "block";

gid("ac_username").innerHTML = "Email: "+firebase.auth().currentUser.email;
gid("ac_uid").innerHTML = "Account ID: "+firebase.auth().currentUser.uid;

gid("banner_loader").style.display = "block";
gid("banner_content").style.display = "none";

firebase.database().ref("banner").once("value").then(function(snapshot) {

  gid("banner_title").innerHTML = "";
  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("banner_title").innerHTML += '<div style="font-size: 18px; padding-top: 10px; padding-bottom: 7px;font-weight:bold;">Title ('+langs[Object.keys(langs)[i]]+')</div><input type="text" class="c_text lang_'+Object.keys(langs)[i]+'" placeholder="Title">';
  }

  gid("banner_body").innerHTML = "";
  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("banner_body").innerHTML += '<div style="font-size: 18px; padding-top: 10px; padding-bottom: 7px;font-weight:bold;">Body ('+langs[Object.keys(langs)[i]]+')</div><textarea type="text" class="c_textarea lang_'+Object.keys(langs)[i]+'" style="height: 75px;" placeholder="Body (HTML enabled)"></textarea>';
  }

  for (var i = 0; i < Object.keys(langs).length; i++) {
    gid("banner_title").querySelector(".lang_"+Object.keys(langs)[i]).value = ((snapshot.val() && snapshot.val()[Object.keys(langs)[i]]) ? snapshot.val()[Object.keys(langs)[i]][0] : "") || "";
    gid("banner_body").querySelector(".lang_"+Object.keys(langs)[i]).value = ((snapshot.val() && snapshot.val()[Object.keys(langs)[i]]) ? snapshot.val()[Object.keys(langs)[i]][1] : "") || "";
  }

  gid("banner_loader").style.display = "none";
  gid("banner_content").style.display = "block";

}).catch(function(error) {
  showAlert("Error",error.message);
});
}

function saveBanner() {
  gid("banner_loader").style.display = "block";
  gid("banner_content").style.display = "none";

  var updatedata = {};
  for (var i = 0; i < Object.keys(langs).length; i++) {
    updatedata[Object.keys(langs)[i]] = [];
    updatedata[Object.keys(langs)[i]][0] = gid("banner_title").querySelector(".lang_"+Object.keys(langs)[i]).value || "";
    updatedata[Object.keys(langs)[i]][1] = gid("banner_body").querySelector(".lang_"+Object.keys(langs)[i]).value || "";
  }

  firebase.database().ref("banner").set(updatedata).then(function() {
    loadSettings();
  }).catch(function(error) {
    showAlert("Error",error.message);
    gid("banner_loader").style.display = "none";
  gid("banner_content").style.display = "block";
  });
}

function changePassword() {
showAlert("Change Password","<input onkeypress='if(event.keyCode==13) {gid(\"new_password\").focus();}' type='password' class='c_text' id='old_password' placeholder='Current Password'><div class='padding'><input onkeypress='if(event.keyCode==13) {gid(\"new_password2\").focus();}' type='password' class='c_text' id='new_password' placeholder='New Password'><div class='padding'><input onkeypress='if(event.keyCode==13) {confirmChangePassword();}' type='password' class='c_text' id='new_password2' placeholder='Retype New Password'>","submit",function() {confirmChangePassword()});
setTimeout(function() {
gid("old_password").focus();
},1)
}

function confirmChangePassword() {
var oldpass = gid("old_password").value;
var newpass = gid("new_password").value;
if(newpass == gid("new_password2").value && oldpass.length > 0 && newpass.length > 0) {
showAlert("Are you sure you want to change your password?","You are about to change your password to: <div style='padding-bottom:10px'></div>"+newpass,"confirm",function() {doChangePassword(oldpass,newpass)});
} else {
showAlert("Error","Invalid current or new password")
}
}

function doChangePassword(oldpass,newpass) {
createPostProgress("Updating password");
var user = firebase.auth().currentUser;
var cred = firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser.email,oldpass);
user.reauthenticateWithCredential(cred).then(function() {
user.updatePassword(newpass).then(function() {
showAlert("Password Changed","Your password was updated successfully");
}).catch(function(error) {
if (error.code == "auth/weak-password") {
showAlert("Error","The new password you entered is too weak. Your password has not been changed.");
} else {
showAlert("Error","An error occured. Your password has not been changed.</br>Error code: "+error.code);
}
});
}).catch(function(error) {
if (error.code == "auth/wrong-password") {
showAlert("Error","The password you entered is incorrect. Your password has not been changed.");
} else {
showAlert("Error","An error occured. Your password has not been changed.</br>Error code: "+error.code);
}
});
}

function closeAccount() {
showAlert("Delete Account","<input onkeypress='if(event.keyCode==13) {confirmDeleteAccount();}' type='password' class='c_text' id='my_password' placeholder='Confirm Password'>","confirm",function() {confirmDeleteAccount()});
setTimeout(function() {
gid("my_password").focus();
},1)
}

function confirmDeleteAccount() {
var oldpass = gid("my_password").value;
showAlert("Delete Account","Please type the following:</br><div style='padding-bottom:5px'></div>"+String(firebase.auth().currentUser.uid).substring(0,12).split("I").join("P").split("l").join("b")+"<div style='padding-bottom:10px'></div><input onkeypress='if(event.keyCode==13) {confirmDeleteAccount2("+oldpass+");}' type='text' class='c_text' id='del_context_password' placeholder='Confirmation Text'>","confirm",function() {confirmDeleteAccount2(oldpass)});
gid("del_context_password").focus();
}

function confirmDeleteAccount2(oldpass) {
var constring = gid("del_context_password").value;
showAlert("Are you sure you want to delete your account?","Once you do this, there's no going back!<div style='padding-top: 10px'></div>You will no longer be able to access any of the features of your account","confirm",function() {actuallyDeleteAccount(oldpass,constring)})
}

function actuallyDeleteAccount(oldpass,constring) {
createPostProgress("Deleting account");
if (constring == String(firebase.auth().currentUser.uid).substring(0,12).split("I").join("P").split("l").join("b")) {
var user = firebase.auth().currentUser;
var cred = firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser.email,oldpass);
user.reauthenticateWithCredential(cred).then(function() {
user.delete().then(function() {
location.reload();
}).catch(function(error) {
showAlert("Error","An error occured. Your account has not been deleted.</br>Error code: "+error.code);
});
}).catch(function(error) {
if (error.code == "auth/wrong-password") {
showAlert("Error","The password you entered is incorrect. Your account has not been deleted.");
} else {
showAlert("Error","An error occured. Your account has not been deleted.</br>Error code: "+error.code);
}
});

} else {
showAlert("Error","The confirmation text you entered was incorrect. Your account has not been deleted.")
}
}


var asyncrequest = [];

function asyncLoad(url,done,error,offline,identifier,abort,responseType,progress) {
	
	if (!identifier) {
		identifier = Math.random().toString(36).substring(2, 15);
	}
		
	if (asyncrequest[identifier] == undefined) {
		asyncrequest[identifier] = new Array();
	}
	
	var newsesh = Math.random()*1000;
	asyncrequest[identifier]["session"] = newsesh;
	
	if (asyncrequest[identifier]["request"] !== undefined && asyncrequest[identifier]["request"].readyState !== 4) {
		asyncrequest[identifier]["request"].abort();
		if (asyncrequest[identifier]["abort"]) {
		asyncrequest[identifier]["abort"]();
		}
		delete asyncrequest[identifier];
		return asyncLoad(url,done,error,offline,identifier,abort,responseType,progress);
	}
	
	asyncrequest[identifier]["abort"] = abort;
	asyncrequest[identifier]["request"] = new XMLHttpRequest();
	asyncrequest[identifier]["request"].onreadystatechange = function() {
		if (this.readyState == 4 && newsesh == asyncrequest[identifier]["session"]) {
				if (this.status == 200) {
					if (asyncrequest[identifier]["request"].responseType == "blob") {
					done(this.response,identifier,this.getResponseHeader('content-type'));
					} else {
					done(this.responseText,identifier,this.getResponseHeader('content-type'));
					}
					delete asyncrequest[identifier];
				} else {
					if (navigator.onLine) {
						error(this.status,this.responseText);
					} else {
						offline();
					}
					delete asyncrequest[identifier];
			}
		}
	}
	if (progress) {
	asyncrequest[identifier]["request"].onprogress = function (event) {
		if (event.total > 0) {
		var percent = event.loaded/event.total;
		} else {
		var percent = -1;
		}
		progress(percent,event.loaded,event.total);
	}
	}
	if (responseType) {
	asyncrequest[identifier]["request"].responseType = responseType;
	}
	asyncrequest[identifier]["request"].open("GET", url, true);
	asyncrequest[identifier]["request"].send();
}

function cleanurl(string) { 
	return string.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, "").replace(/^www./, "");
}

function striphtml(string) {
return string.split("</br>").join(" ").replace(/<(?:.|\n)*?>/gm, '');
}


function createPostProgress(text) {
showAlert("Please wait",text+"...<div style='margin-bottom: 10px'/>","hidden");	
}

function toDateString(stamp) {
var date = new Date(stamp);
var day = date.getDate();
var monthstring = capitalMonths[date.getMonth()];
var timestring = monthstring +" " + day +nth(day) +", " + date.getFullYear();
return timestring;
}

function nth(d) {
  if(d>3 && d<21) return 'th';
  switch (d % 10) {
        case 1:  return "st";
        case 2:  return "nd";
        case 3:  return "rd";
        default: return "th";
    }
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