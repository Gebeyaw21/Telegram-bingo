// ቴሌግራም ዌብ አፕ ኤፒአይን ማስጀመር
let tg = window.Telegram.WebApp;
tg.expand();

// የተጠቃሚውን ስም መቀበል
let userName = tg.initDataUnsafe?.user?.first_name || "ተጫዋች";
document.getElementById("user-info").innerText = `ሰላም፣ ${userName}! መልካም ዕድል።`;

// የቢንጎ ካርድ ቁጥሮችን ማመንጨት (ከ1 እስከ 75)
const cardElement = document.getElementById("bingo-card");
let cardNumbers = generateBingoNumbers();

function generateBingoNumbers() {
    let nums = [];
    while(nums.length < 25) {
        let r = Math.floor(Math.random() * 75) + 1;
        if(nums.indexOf(r) === -1) nums.push(r);
    }
    return nums;
}

// ካርዱን በስክሪኑ ላይ መዘርጋት
function renderCard() {
    cardElement.innerHTML = "";
    cardNumbers.forEach((num, index) => {
        let cell = document.createElement("div");
        cell.classList.add("bingo-cell");
        cell.innerText = num;
        
        // ማዕከላዊውን ሳጥን ነፃ (Free) ማድረግ ይቻላል
        if(index === 12) {
            cell.innerText = "⭐";
            cell.classList.add("marked");
        }

        cell.addEventListener("click", () => {
            if(index !== 12) {
                cell.classList.toggle("marked");
            }
        });

        cardElement.appendChild(cell);
    });
}

renderCard();

// ቁጥር ማውጣት
const drawBtn = document.getElementById("draw-btn");
const currentNumberElem = document.getElementById("current-number");
let drawnHistory = [];

drawBtn.addEventListener("click", () => {
    if(drawnHistory.length >= 75) {
        alert("ሁሉም ቁጥሮች አልቀዋል!");
        return;
    }
    let randNum;
    do {
        randNum = Math.floor(Math.random() * 75) + 1;
    } while(drawnHistory.includes(randNum));

    drawnHistory.push(randNum);
    currentNumberElem.innerText = randNum;
    
    // ለቴሌግራም ማሳወቂያ መስጠት (Haptic Feedback)
    tg.HapticFeedback.impactOccurred("medium");
});

// ቢንጎ ማረጋገጥ
document.getElementById("bingo-btn").addEventListener("click", () => {
    tg.showAlert("እንኳን ደስ አለዎት! ቢንጎ ብለዋል 🎉");
});
