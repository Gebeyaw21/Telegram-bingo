const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const cors = require('cors');

// ያቀረብከው የቦት ቶክን ቁጥር
const BOT_TOKEN = '8696007423:AAFSJrVcS2cTPcaz9A7w7vM2YOimb_ZMG3I';
// የ index.html ፋይልህን በኢንተርኔት ላይ ስትጭነው የምታገኘው ሊንክ
const MINI_APP_URL = 'https://vercel.app'; 

const bot = new Telegraf(BOT_TOKEN);
const app = express();
app.use(cors());
app.use(express.json());

const activeGames = {};

// 1. የቦት ትዕዛዞች
bot.command('start_bingo', (ctx) => {
    const chatId = ctx.chat.id;

    if (ctx.chat.type === 'private') {
        return ctx.reply('❌ እባክዎ ይህንን ቦት በቡድን (Group) ውስጥ ይጋብዙትና እዚያ ላይ ይጫወቱ!');
    }

    activeGames[chatId] = {
        drawnNumbers: new Set(),
        status: 'PLAYING',
        host: ctx.from.id
    };

    const gameLink = `${MINI_APP_URL}?chatId=${chatId}`;

    ctx.reply(
        `🎰 **የቡድን የቢንጎ ጨዋታ ተጀመረ!** 🎰\n\n📢 አስቀጣሪ: @${ctx.from.username || ctx.from.first_name}\n👉 የእርስዎን የመጫወቻ ካርድ ለመቀበል ከታች ያለውን ቁልፍ ይጫኑ።`,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.url('🎴 የቢንጎ ካርዴን አውጣ', gameLink)],
                [Markup.button.callback('🎲 የሚቀጥለውን ቁጥር እጣ', `draw_${chatId}`)]
            ])
        }
    );
});

bot.action(/draw_(.+)/, (ctx) => {
    const chatId = ctx.match[1];
    const game = activeGames[chatId];

    if (!game) return ctx.answerCbQuery('ምንም ንቁ ጨዋታ የለም። በ /start_bingo ይጀምሩ።');
    if (game.drawnNumbers.size >= 75) return ctx.reply('ሁሉም ቁጥሮች (1-75) ወጥተዋል!');

    let drawn;
    do {
        drawn = Math.floor(Math.random() * 75) + 1;
    } while (game.drawnNumbers.has(drawn));

    game.drawnNumbers.add(drawn);

    const letters = ['B', 'I', 'N', 'G', 'O'];
    const letter = letters[Math.floor((drawn - 1) / 15)];

    ctx.reply(`🗣 **የወጣው ቁጥር:** ✨ 【 ${letter}-${drawn} 】 ✨\n(የወጡት ቁጥሮች ብዛት: ${game.drawnNumbers.size}/75)`);
    ctx.answerCbQuery();
});

// 2. የቢንጎ አሸናፊነት ማረጋገጫ መስመር ህግጋት
function checkBingoLines(markedCells) {
    const winPatterns = [
        // አግድም (Rows), [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
        // ቁልቁል (Columns), [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
        // ሰያፍ (Diagonals), [4, 8, 12, 16, 20]
    ];
    return winPatterns.some(pattern => pattern.every(index => markedCells[index]));
}

app.post('/api/verify-bingo', async (req, res) => {
    const { chatId, cardMatrix, markedCells, userId, username } = req.body;
    const game = activeGames[chatId];

    if (!game) {
        return res.status(400).json({ success: false, message: "በዚህ ግሩፕ ውስጥ ንቁ ጨዋታ የለም!" });
    }

    // 1. መስመር መሙላቱን ማረጋገጥ
    if (!checkBingoLines(markedCells)) {
        return res.json({ success: false, message: "ማረጋገጫው አልተሳካም! ቢያንስ አንድ ሙሉ መስመር (አግድም፣ ቁልቁል፣ ወይም ሰያፍ) አልሞሉም።" });
    }

    // 2. የተመረጡት ቁጥሮች በትክክል በዕጣ መውጣታቸውን ማረጋገጥ
    const drawnArray = Array.from(game.drawnNumbers);
    let validNumbers = true;

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (i === 2 && j === 2) continue; // የነጻ ቦታ እለፍ
            const index = i * 5 + j;
            if (markedCells[index]) {
                if (!drawnArray.includes(cardMatrix[i][j])) {
                    validNumbers = false;
                }
            }
        }
    }

    if (!validNumbers) {
        return res.json({ success: false, message: "ስህተት! የመረጧቸው አንዳንዶቹ ቁጥሮች ገና በዕጣ አልወጡም!" });
    }

    // አሸናፊ ማብሰር
    await bot.telegram.sendMessage(chatId, `🎉 🎉 **ቢንጎ! አሸናፊ አግኝተናል!** 🎉 🎉\n\n👑 እንኳን ደስ አለዎት @${username}! ያረጋገጡት መስመር ትክክል ነው! የዚህ ዙር ጨዋታ ተጠናቋል።`);
    delete activeGames[chatId]; 
    res.json({ success: true });
});

bot.launch();
app.listen(3000, () => console.log('የቢንጎ ሰርቨር ተነስቷል! 🚀'));
