import puppeteer from "puppeteer";
import promptPreferredVoice from "./promptPreferredVoice.js";
import promptUserLanguage from "./promptUserLanguage.js";
import promptVideoLanguage from "./promptVideoLanguage.js";
import jsonCache from "../redis.js";
import getAllVideos from "./downloadVideos.js";
import convertVideosToAudio from "./ffmpegActions.js";
import transcribeAllAudios from "./transcribe.js";
import translateArrayOfText from "./translate.js";
import synthesizeSentences from "./textToSpeech.js";
import { reply } from "../webhook.js";
import fs from "fs";

const browser = await puppeteer.launch({
	args: ["--no-sandbox", "--disable-setuid-sandbox"],
	headless: true,
});

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

function getSecurityCode() {
	const filepath = process.cwd() + "/security-code.txt";
	return new Promise((resolve) => {
		setTimeout(function () {
			fs.readFile(filepath, "utf-8", function (err, data) {
				resolve(data);
			});
		}, 1000 * 60);
	});
}

export async function getCommandAction({ message, callback_data }) {
	if (checkMultipleCommandEntities(message)) return noMultipleCommandsAnswer;
	const command = extractCommand(message);
	if (command == "/setvideolanguage") return promptVideoLanguage;
	else if (command == "/setmylanguage") return promptUserLanguage;
	else if (command == "/setvoice") return promptPreferredVoice;
	else if (command == "/start") return startCommand;
	else if (command == "/debug") return debugChat;
	else if (callback_data) return setConfigAndGetAction(message);
	else return searchUsername;
}

async function loginInstagram() {
	// when the app starts, the env variables are not immediately available, so we wait until they are
	// before proceeding to log in.
	do {
		await new Promise((res, rej) => setTimeout(res(true), 1000));
	} while (!process.env.BOT_USERNAME || !process.env.BOT_PASSWORD);

	const cwd = process.cwd();
	const cookieFilepath = cwd + "/sessionId.txt";
	let oldCookie = "";
	try {
		const oldCookie = fs.readFileSync(cookieFilepath);
	} catch (e) {}
	const botUsername = process.env.BOT_USERNAME;
	const botPassword = process.env.BOT_PASSWORD;
	const page = await browser.newPage();
	await page.setUserAgent(
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36"
	);
	if (oldCookie) await page.setCookies([{ name: "sessionid", value: oldCookie }]);
	await page.goto("https://www.instagram.com/");
	try {
		await page.waitForSelector(".logged-in");
		const cookies = await page.cookies();
		const sessionId = cookies.find((cookie) => cookie.name == "sessionid").value;
		fs.writeFileSync(cookieFilepath, sessionId);
	} catch (e) {
		await page.waitForSelector('input[name="username"]');
		await page.type('input[name="username"]', botUsername);
		await page.type('input[name="password"]', botPassword);
		await Promise.all([
			page.click('button[type="submit"]'),
			page.waitForNavigation({ waitUntil: "networkidle0" }),
		]);

		const suspiciousActivityDetected = await page.evaluate(() =>
			document.location.href.includes("challenge")
		);

		if (suspiciousActivityDetected) {
			console.log("Suspicious activity detected.");
			// clicks the send verification code to email button
			await page.click("form button");
			await page.waitForSelector("input#security_code");
			const securityCode = await getSecurityCode();
			await page.type("input#security_code", securityCode);
			await Promise.all([
				page.click("form button"),
				page.waitForNavigation({ waitUntil: "networkidle0" }),
			]);
			await page.waitForSelector(".logged-in");
			const cookies = await page.cookies();
			const sessionId = cookies.find((cookie) => cookie.name == "sessionid").value;
			fs.writeFileSync(cookieFilepath, sessionId);
		}
	}
}

async function getUserStories(username) {
	const igBaseUrl = "https://instagram.com/";
	const page = await browser.newPage();
	await page.setUserAgent(
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36"
	);
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

	await page.close();
	return urls;
}

async function searchUsername({ message }) {
	const botPublicUrl = process.env.BOT_DOMAIN;
	const { chat } = message;

	const notifyUser = (message) => reply(chat, { text: message }, "sendMessage");

	const username = message.text.trim().split(" ")[0];
	notifyUser("Getting stories...");
	const urls = await getUserStories(username);
	notifyUser("Downloading videos...");
	const videos = await getAllVideos(urls);
	notifyUser("Converting to audio...");
	const audios = await convertVideosToAudio(videos);

	const userPreferences = await jsonCache.get(chat.id);
	const { videoLang, targetLang, preferredVoice } = userPreferences;

	notifyUser("Transcribing audios...");
	const transcriptions = await transcribeAllAudios(audios, videoLang);
	notifyUser("Translating...");
	const translatedTexts = await translateArrayOfText(transcriptions, videoLang, targetLang);
	notifyUser("Synthesizing audio...");
	const spokenMessages = await synthesizeSentences(translatedTexts, preferredVoice, targetLang);
	const publicAudioAssets = spokenMessages.map((audio) => `${botPublicUrl}/${audio}`);
	const synthesizedAudios = publicAudioAssets.map((audio) => ({ audio }));
	return [synthesizedAudios, "sendAudio"];
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

async function debugChat({ message }) {
	const { chat } = message;
	const userSettings = await jsonCache.get(chat.id);
	return [
		{
			parse_mode: "markdown",
			text: "```javascript\n" + JSON.stringify(userSettings, null, 2) + "\n```",
		},
		"sendMessage",
	];
}

async function invalidCommand({ message }) {
	return [{ text: "That's not a valid command." }, "sendMessage"];
}

async function changeVideoLanguage({ message, callback_data }) {
	const callback_query_id = callback_data.id;
	const { chat } = message;
	const currentSettings = await jsonCache.get(chat.id);
	await jsonCache.set(chat.id, {
		...currentSettings,
		videoLang: callback_data.data,
	});
	return [{ text: "Video language set.", callback_query_id }, "answerCallbackQuery"];
}

async function changeUserLanguage({ message, callback_data }) {
	const callback_query_id = callback_data.id;
	const { chat } = message;
	const currentSettings = await jsonCache.get(chat.id);
	await jsonCache.set(chat.id, {
		...currentSettings,
		targetLang: callback_data.data,
	});
	return [{ text: "Your preferred language was set.", callback_query_id }, "answerCallbackQuery"];
}

async function setPreferredVoice({ message, callback_data }) {
	const { chat } = message;
	const callback_query_id = callback_data.id;
	const currentSettings = await jsonCache.get(chat.id);
	await jsonCache.set(chat.id, {
		...currentSettings,
		preferredVoice: callback_data.data,
	});
	return [{ text: "Your preferred voice was set.", callback_query_id }, "answerCallbackQuery"];
}

async function noMultipleCommandsAnswer() {
	return [
		{
			text: "You can't send multiple commands.",
		},
		"sendMessage",
	];
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

function startCommand() {
	return [
		{
			text: "This bot is under construction.",
		},
		"sendMessage",
	];
}
