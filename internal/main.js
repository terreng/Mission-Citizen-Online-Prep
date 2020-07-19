const spinnerconst = "<div class='real_spinner'><svg class='spinner' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' ><circle class='path' fill='none' stroke-width='10' stroke-linecap='butt' cx='50' cy='50' r='40'></circle></svg></div>"
const montharray = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const shortmontharray = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const weekdayarray = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const shortweekdayarray = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
var secretsignup = false;
var sactive = false;
var inanim = false;

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
gid("ra_title").innerHTML = "Mission Citizen Online Admin";
gid("ra_title_2").innerHTML = "Mission Citizen Online Admin";
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
switchSection("lessons")
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
gid("ra_title").innerHTML = "Mission Citizen Online Admin";
gid("ra_title_2").innerHTML = "Mission Citizen Online Admin";
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
gid("create_account").style.display = "none"

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
gid("supportr").innerHTML = "";
gid("feedbackr").innerHTML = "";
gid("resolvedr").innerHTML = "";

firebase.database().ref('/feedback/').once('value').then(function(snapshot) {
  feedbackjson = snapshot.val();
  displayFeed();
});

}

function displayFeed() {
gid("supportr").innerHTML = "";
gid("feedbackr").innerHTML = "";
gid("resolvedr").innerHTML = "";
gid("feedback_loader").style.display = "none";
gid("feedback_content2").style.display = "block";
if (feedbackjson !== null) {
for (var i = 0; i < Object.keys(feedbackjson).length; i++) {
if (feedbackjson[Object.keys(feedbackjson)[i]]["status"] !== "Resolved") {
if (feedbackjson[Object.keys(feedbackjson)[i]]["request_type"] == "Support Request") {
gid("supportr").innerHTML += "<div class='post_item' id='feedback_"+i+"'><div class='item_left'><div style='font-size: 25px;' class='ell'>Support Request</div><div style='font-size: 17px; padding-top: 3px;' class='ell'>"+toTimeString(feedbackjson[Object.keys(feedbackjson)[i]]["timestamp"])+"</div></div><div class='item_right'><a title='View' onclick='viewFeedback("+i+")'><div class='item_icon'><i class='material-icons'>remove_red_eye</i></div></a><a title='Mark as resolved' onclick='resolveFeedback("+i+")'><div class='item_icon'><i class='material-icons'>check</i></div></a></div></div>";
} else {
gid("feedbackr").innerHTML += "<div class='post_item' id='feedback_"+i+"'><div class='item_left'><div style='font-size: 25px;' class='ell'>"+feedbackjson[Object.keys(feedbackjson)[i]]["request_type"]+"</div><div style='font-size: 17px; padding-top: 3px;' class='ell'>"+htmlescape(feedbackjson[Object.keys(feedbackjson)[i]]["message"])+"</div></div><div class='item_right'><a title='View' onclick='viewFeedback("+i+")'><div class='item_icon'><i class='material-icons'>remove_red_eye</i></div></a><a title='Mark as resolved' onclick='resolveFeedback("+i+")'><div class='item_icon'><i class='material-icons'>check</i></div></a></div></div>";
}
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
if (gid("supportr").innerHTML == "") {
gid("supportr").innerHTML = "<center>No unresolved support requests</center><div class='padding'></div>"
}
if (gid("resolvedr").innerHTML == "") {
gid("resolvedr").innerHTML = "<center>No resolved feedback or support requests</center><div class='padding'></div>"
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