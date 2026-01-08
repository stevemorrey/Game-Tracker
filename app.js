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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- SMART RECURRING COUNTDOWN --- 

function getNextGameDate() {
    const now = new Date();
    
    // CONFIGURATION: Change these two lines to your schedule
    const targetDay = 5; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const targetHour = 20; // 24-hour format (20 = 8 PM)

    const nextDate = new Date(now);
    
    // 1. Calculate how many days until the target day
    // The modulo (%) math ensures we wrap around the week correctly
    let daysUntil = (targetDay + 7 - now.getDay()) % 7;

    // 2. Check if the game is today but the time has already passed
    // If so, we want next week's game (add 7 days)
    if (daysUntil === 0 && now.getHours() >= targetHour) {
        daysUntil = 7;
    }

    // 3. Set the date and time
    nextDate.setDate(now.getDate() + daysUntil);
    nextDate.setHours(targetHour, 0, 0, 0);

    return nextDate;
}

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
