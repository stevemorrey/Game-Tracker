// --- CONFIGURATION ---
// REPLACE THIS WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- COUNTDOWN LOGIC ---
// Set the date we're counting down to
const nextGameDate = new Date("Jan 20, 2026 20:00:00").getTime();
document.getElementById("game-date").innerText = "Target: " + new Date(nextGameDate).toDateString();

const x = setInterval(function() {
    const now = new Date().getTime();
    const distance = nextGameDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    document.getElementById("timer").innerHTML = days + "d " + hours + "h " + minutes + "m ";

    if (distance < 0) {
        clearInterval(x);
        document.getElementById("timer").innerHTML = "GAME TIME!";
    }
}, 1000);

// --- AUTHENTICATION ---
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            console.log("Logged in:", result.user);
        })
        .catch(console.error);
}

function logout() {
    auth.signOut();
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
