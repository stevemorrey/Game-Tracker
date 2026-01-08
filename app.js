// --- CONFIGURATION ---
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDBOD9Q_iYiST8SiRBlJHdETkphM91Cj1w",
  authDomain: "game-tracker-1452f.firebaseapp.com",
  projectId: "game-tracker-1452f",
  storageBucket: "game-tracker-1452f.firebasestorage.app",
  messagingSenderId: "499397697814",
  appId: "1:499397697814:web:2697d50e416e3b13883037",
  measurementId: "G-4C2346YDRH"
};

// --- CONFIGURATION ---
// Add the email addresses of the admins here
const ADMIN_EMAILS = ["stevemorrey@gmail.com"];


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- 1. COUNTDOWN LOGIC (Now Database Driven) ---
let nextGameDate = 0; // Will be updated from database

// Listen to the "settings" collection in the database
db.collection("settings").doc("gameNight").onSnapshot(doc => {
    if (doc.exists) {
        // Convert Firestore Timestamp to JS Date
        const data = doc.data();
        nextGameDate = data.nextDate.toDate().getTime(); 
        
        // Update the text immediately
        const dateObj = new Date(nextGameDate);
        document.getElementById("game-date").innerText = 
            "Next Game: " + dateObj.toDateString() + " @ " + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else {
        document.getElementById("game-date").innerText = "Date: TBD";
    }
});

// The Timer Loop (Runs every second)
setInterval(function() {
    if (nextGameDate === 0) return; // Don't run if we haven't loaded the date yet

    const now = new Date().getTime();
    const distance = nextGameDate - now;

    if (distance < 0) {
        document.getElementById("timer").innerHTML = "GAME TIME! 🎮";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("timer").innerHTML = 
        days + "d " + hours + "h " + minutes + "m " + seconds + "s ";
}, 1000);


// Initialize the timer
const nextGame = getNextGameDate();
const nextGameTime = nextGame.getTime();

// Display the target date in text (e.g., "Target: Fri Jan 23 2026")
document.getElementById("game-date").innerText = "Next Game: " + nextGame.toDateString() + " @ " + nextGame.getHours() + ":00";

// Run the Countdown
const timerInterval = setInterval(function() {
    const now = new Date().getTime();
    const distance = nextGameTime - now;

    // Time calculations
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display
    document.getElementById("timer").innerHTML = 
        days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

    // If the countdown is over
    if (distance < 0) {
        clearInterval(timerInterval);
        document.getElementById("timer").innerHTML = "GAME TIME! 🎮";
        // Optional: Reload page after 1 hour to trigger the next week's timer
    }
}, 1000);


// --- 2. UPDATED AUTH LOGIC (With Admin Check) ---
auth.onAuthStateChanged(user => {
    if (user) {
        // ... existing show/hide logic ...
        document.getElementById("login-btn").style.display = "none";
        document.getElementById("user-info").style.display = "block";
        document.getElementById("availability-section").style.display = "block";
        document.getElementById("username").innerText = user.displayName;
        checkMyStatus(user);

        // CHECK IF ADMIN
        if (ADMIN_EMAILS.includes(user.email)) {
            document.getElementById("admin-panel").style.display = "block";
        }
    } else {
        // ... existing hide logic ...
        document.getElementById("login-btn").style.display = "inline-block";
        document.getElementById("user-info").style.display = "none";
        document.getElementById("availability-section").style.display = "none";
        document.getElementById("admin-panel").style.display = "none";
    }
});


// --- 3. ADMIN FUNCTION TO SAVE DATE ---
function updateGameDate() {
    const inputVal = document.getElementById("admin-date-picker").value;
    if (!inputVal) return alert("Please pick a date!");

    const newDate = new Date(inputVal);

    // Save to Firestore "settings/gameNight"
    db.collection("settings").doc("gameNight").set({
        nextDate: firebase.firestore.Timestamp.fromDate(newDate),
        updatedBy: auth.currentUser.email
    })
    .then(() => alert("Timer Updated Successfully!"))
    .catch(err => alert("Error: " + err.message));
}


// Monitor Login State
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById("login-btn").style.display = "none";
        document.getElementById("user-info").style.display = "block";
        document.getElementById("availability-section").style.display = "block";
        document.getElementById("username").innerText = user.displayName;
        checkMyStatus(user);
    } else {
        document.getElementById("login-btn").style.display = "inline-block";
        document.getElementById("user-info").style.display = "none";
        document.getElementById("availability-section").style.display = "none";
    }
});

// --- DATABASE LOGIC ---
const playersRef = db.collection("players");

function toggleAvailability() {
    const user = auth.currentUser;
    if (!user) return;

    const btn = document.getElementById("status-btn");
    // Check current state (simple toggle logic based on button text for demo)
    const isAvailable = btn.innerText === "Mark as Unavailable"; 

    // Flip the status
    const newStatus = !isAvailable;
    
    playersRef.doc(user.uid).set({
        name: user.displayName,
        available: newStatus,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Check my own status to update button color
function checkMyStatus(user) {
    playersRef.doc(user.uid).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            updateButtonUI(data.available);
        }
    });
}

function updateButtonUI(isAvailable) {
    const btn = document.getElementById("status-btn");
    if (isAvailable) {
        btn.innerText = "Mark as Unavailable";
        btn.classList.add("ready");
    } else {
        btn.innerText = "Mark as Available";
        btn.classList.remove("ready");
    }
}

// Listen for ALL players updates in real-time
playersRef.where("available", "==", true).onSnapshot(snapshot => {
    const list = document.getElementById("player-list");
    list.innerHTML = ""; // Clear list
    snapshot.forEach(doc => {
        const player = doc.data();
        const li = document.createElement("li");
        li.innerText = player.name + " is ready! 🎮";
        list.appendChild(li);
    });
});
