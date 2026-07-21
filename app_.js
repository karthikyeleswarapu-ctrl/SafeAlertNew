import {
    saveUserProfile,
    loadUserProfile,
    saveUserContact,
    loadUserContacts,
    deleteUserContact,
    saveSOSHistory,
    loadSOSHistory
} from "./firestore.js";
let lat=null;
let lng=null;

let lastShake=0;

/* STORAGE */

function read(key,fallback=[]){

try{

return JSON.parse(
localStorage.getItem(key)
)||fallback;

}

catch{

return fallback;

}

}

function write(key,value){

localStorage.setItem(
key,
JSON.stringify(value)
);

}

/* STATS */

async function updateStats() {

    const contacts = (await loadUserContacts()).length;
    const history = read("history", []).length;

    if (contactCount)
        contactCount.innerText = contacts;

    if (alertCount)
        alertCount.innerText = history;

}

/* LOCATION */

async function getLocation(){

const box=
document.getElementById(
"location"
);

const live=
document.getElementById(
"liveLocation"
);

return new Promise(

(resolve)=>{

if(
!navigator.geolocation
){

box.innerHTML=
"❌ GPS unsupported";

resolve(false);

return;

}

box.innerHTML=

"📍 Fetching location...";

navigator.geolocation
.getCurrentPosition(

(pos)=>{

lat=
pos.coords.latitude;

lng=
pos.coords.longitude;

box.innerHTML=

`
📍 Location Ready

<br><br>

Lat:
${lat.toFixed(6)}

<br>

Lng:
${lng.toFixed(6)}
`;

if(
live
){

live.innerHTML=

`
${lat.toFixed(6)}

,
${lng.toFixed(6)}

<br>

±${Math.round(
pos.coords.accuracy
)}m
`;

}

resolve(true);

},

(err)=>{

if(
err.code===1
){

box.innerHTML=

`
❌ Permission denied

<br><br>

Tap Refresh Location
`;

}

else{

box.innerHTML=

`
❌ Unable to fetch
`;

}

if(
live
)
live.innerHTML=
"Waiting...";

resolve(false);

},

{

enableHighAccuracy:true,

timeout:15000,

maximumAge:0

}

);

}

);

}

/* CONTACTS */

async function saveContact() {

    const name = document.getElementById("name");
    const phone = document.getElementById("phone");

    if (!name.value || !phone.value) {
        alert("Enter details");
        return;
    }

    await saveUserContact({
        name: name.value,
        phone: phone.value
    });

    name.value = "";
    phone.value = "";

    await showContacts();
    await showSafety();
    await updateStats();

}

async function deleteContact(id) {

    await deleteUserContact(id);

    await showContacts();
    await showSafety();
    await updateStats();

}

async function showContacts() {

    const box = contactList;
    box.innerHTML = "";

    const data = await loadUserContacts();

    if (data.length === 0) {
        box.innerHTML = `
            <div class="card">
                No contacts
            </div>
        `;
        return;
    }

    data.forEach((c) => {

        box.innerHTML += `
            <div class="contact">

                👤 ${c.name}

                <br><br>

                📞 ${c.phone}

                <br><br>

                <button
                    class="primary-btn"
                    onclick="deleteContact('${c.id}')">

                    Delete

                </button>

            </div>
        `;

    });

}

/* PROFILE */

async function saveProfile() {

    const profile = {
        name: profileName.value,
        phone: profilePhone.value,
        email: profileEmail.value
    };

    await saveUserProfile(profile);

    await showProfile();

    alert("Profile saved successfully!");

}

async function showProfile() {

    const p = await loadUserProfile();

    if (!p) {
        profileInfo.innerHTML = "No profile saved";
        return;
    }

    profileName.value = p.name || "";
    profilePhone.value = p.phone || "";
    profileEmail.value = p.email || "";

    profileInfo.innerHTML = `
        👤 ${p.name || "-"}
        <br><br>
        📞 ${p.phone || "-"}
        <br><br>
        📧 ${p.email || "-"}
    `;

}

/* HISTORY */

async function showHistory(){

historyList.innerHTML="";
    
const history = await loadSOSHistory();

history.forEach((x) => {

    historyList.innerHTML += `

    <div class="history">

        🚨 SOS Sent

        <br><br>

        ${x.time}

    </div>

    `;

});

await updateStats();    
}

/* SOS */

async function sendSOS(){

const ok=
await getLocation();

if(
!ok
){

alert(
"Location required"
);

return;

}

const contacts = await loadUserContacts();

if(
contacts.length===0
){

alert(
"Add contacts"
);

return;

}

const p = await loadUserProfile() || {};

const map=

`https://maps.google.com/?q=${lat},${lng}`;

const msg=

`🚨 EMERGENCY ALERT

👤 ${p.name||"User"}

📞 ${p.phone||"-"}

📍 ${map}

Sent via SafeAlert`;
    
await saveSOSHistory({
    time: new Date().toLocaleString(),
    map: map
});

await showHistory();    

window.location.href=

`sms:${contacts.map(
x=>x.phone
).join(",")}?body=${encodeURIComponent(msg)}`;

}

/* CALL */

function callNumber(n){

window.location.href=
`tel:${n}`;

}

async function showSafety() {

    safetyContacts.innerHTML = "";

    const contacts = await loadUserContacts();

    contacts.forEach((c) => {

        safetyContacts.innerHTML += `
            <div class="contact">

                👤 ${c.name}

                <br><br>

                <button
                    class="primary-btn"
                    onclick="callNumber('${c.phone}')">

                    Call

                </button>

            </div>
        `;

    });

}

/* SHAKE */

window.addEventListener(

"devicemotion",

(e)=>{

const a=
e.accelerationIncludingGravity;

if(
!a
)return;

const force=

Math.abs(a.x)+
Math.abs(a.y)+
Math.abs(a.z);

if(
force>40
){

const now=
Date.now();

if(
now-lastShake<5000
)
return;

lastShake=now;

if(
confirm(
"Send SOS?"
)
){

sendSOS();

}

}

}

);

/* NAV */

function tab(id,el){

document
.querySelectorAll(
".page"
)
.forEach(
x=>
x.classList.remove(
"active"
)
);

document
.getElementById(
id
)
.classList.add(
"active"
);

document
.querySelectorAll(
".item"
)
.forEach(
x=>
x.classList.remove(
"selected"
)
);

el.classList.add(
"selected"
);

}

/* START */

window.onload = async () => {
    try {
        
    await showContacts();
    await showProfile();
    await showHistory();
    await showSafety();
    await updateStats();
} catch (e) {
        console.error(e);
    }
    setTimeout(() => {
        getLocation();
    }, 800);

};

function togglePassword() {

    const password = document.getElementById("loginPassword");
    const eye = document.getElementById("eyeIcon");

    if (password.type === "password") {
        password.type = "text";
        eye.textContent = "visibility_off";
    } else {
        password.type = "password";
        eye.textContent = "visibility";
    }

}
window.getLocation = getLocation;
window.sendSOS = sendSOS;
window.saveContact = saveContact;
window.deleteContact = deleteContact;
window.callNumber = callNumber;
window.saveProfile = saveProfile;
window.tab = tab;
window.togglePassword = togglePassword;

