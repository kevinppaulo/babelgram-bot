import puppeteer from "puppeteer";
import promptPreferredVoice from "./promptPreferredVoice.js";
import promptUserLanguage from "./promptUserLanguage.js";
import promptVideoLanguage from "./promptVideoLanguage.js";
import jsonCache from "../redis.js";
import getAllVideos from "./downloadVideos.js";
import convertVideosToAudio from "./ffmpegActions.js";

const browser = await puppeteer.launch({ headless: false });
loginInstagram();
const filterBotCommand = (entity) => entity.type == "bot_command";

function checkMultipleCommandEntities(message) {
	if ("entities" in message) return message.entities.filter(filterBotCommand).length > 1;
	return false;
}

function extractCommand(message) {
	if (!("entities" in message)) return null;
	const [command] = message.entities.filter(filterBotCommand);
	const { offset, length } = command;
	return message.text.slice(offset, length + offset);
}

export async function getCommandAction({ message, callback_data }) {
	if (checkMultipleCommandEntities(message)) return noMultipleCommandsAnswer;

	const command = extractCommand(message);

	if (command == "/setvideolanguage") return promptVideoLanguage;
	else if (command == "/setmylanguage") return promptUserLanguage;
	else if (command == "/setvoice") return promptPreferredVoice;
	else if (callback_data) return setConfigAndGetAction(message);
	else return searchUsername;
}

async function loginInstagram() {
	// when the app starts, the env variables are not immediately available, so we wait until they are
	// before proceeding to log in.
	do {
		await new Promise((res, rej) => setTimeout(res(true), 1000));
	} while (!process.env.BOT_USERNAME || !process.env.BOT_PASSWORD);

	const botUsername = process.env.BOT_USERNAME;
	const botPassword = process.env.BOT_PASSWORD;
	const page = await browser.newPage();
	await page.goto("https://www.instagram.com/accounts/login/");
	await page.waitForSelector('input[name="username"]');
	await page.type('input[name="username"]', botUsername);
	await page.type('input[name="password"]', botPassword);
	await page.click('button[type="submit"]');
}

async function getUserStories(username) {
	const igBaseUrl = "https://instagram.com/";
	const page = await browser.newPage();
	await page.goto(igBaseUrl + username);
	await page.click('img[data-testid="user-avatar"]');
	const urls = [];
	while (true) {
		try {
			await page.waitForSelector(".coreSpriteRightChevron", { timeout: 2000 });
		} catch (e) {
			break;
		}
		try {
			await page.waitForSelector("video", { timeout: 2000 });
			const videoSrc = await page.evaluate(() => document.querySelector("video").children[0].src);
			urls.push(videoSrc);
		} catch (e) {}
		await page.click(".coreSpriteRightChevron");
	}
	return urls;
}

async function searchUsername({ message }) {
	const username = message.text.trim().split(" ")[0];
	const urls = await getUserStories(username);
	const videos = await getAllVideos(urls);
  const audios = await convertVideosToAudio(videos);
	return {text: 'ok'};
}

async function setConfigAndGetAction({ chat }) {
	const userSettings = await jsonCache.get(chat.id);
	const { lastCommand } = userSettings;

	await jsonCache.set(chat.id, {
		...userSettings,
		lastCommand: null,
	});

	if (lastCommand == "/setvideolanguage") return changeVideoLanguage;
	else if (lastCommand == "/setmylanguage") return changeUserLanguage;
	else if (lastCommand == "/setvoice") return setPreferredVoice;
	else return invalidCommand;
}

async function invalidCommand({ message }) {
	return { text: "That's not a valid command." };
}

async function changeVideoLanguage({ message, callback_data }) {
	const { chat } = message;
	const currentSettings = await jsonCache.get(chat.id);
	await jsonCache.set(chat.id, {
		...currentSettings,
		videoLang: callback_data.data,
	});
	return { text: "Video language set." };
}

async function changeUserLanguage({ message, callback_data }) {
	const { chat } = message;
	const currentSettings = await jsonCache.get(chat.id);
	await jsonCache.set(chat.id, {
		...currentSettings,
		targetLang: callback_data.data,
	});
	return { text: "Your preferred language was set." };
}

async function setPreferredVoice({ message, callback_data }) {
	const { chat } = message;
	const currentSettings = await jsonCache.get(chat.id);
	await jsonCache.set(chat.id, {
		...currentSettings,
		preferredVoice: callback_data.data,
	});
	return { text: "Your preferred voice was set." };
}

async function noMultipleCommandsAnswer() {
	return {
		text: "You can't send multiple commands.",
	};
}

export async function getOrCreateUserSettings(chat) {
	let userSettings = await jsonCache.get(chat.id);

	if (!userSettings) {
		userSettings = {
			videoLang: "en-US",
			targetLang: "pt-BR",
			lastCommand: null,
			preferredVoice: "female",
		};
		await jsonCache.set(chat.id, userSettings);
	}

	return userSettings;
}
