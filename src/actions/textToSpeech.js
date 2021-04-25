import TextToSpeechV1 from "ibm-watson/text-to-speech/v1.js";
import { IamAuthenticator } from "ibm-watson/auth/index.js";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

function textToVoice(text, preferredVoicegender, targetLang) {
	console.log(`synthesizing: ${text}`);
	return new Promise(async (resolve) => {
		const apiKey = process.env.WATSON_TEXT_SPEECH_KEY;
		const url = process.env.WATSON_TEXT_SPEECH_INST;
		const textToSpeech = new TextToSpeechV1({
			authenticator: new IamAuthenticator({
				apikey: apiKey,
			}),
			serviceUrl: url,
		});

		const availableVoices = await textToSpeech.listVoices();
		const languageVoices = availableVoices.result.voices.filter(
			({ language }) => language == targetLang
		);
		const findByGender = ({ gender }) => gender == preferredVoicegender;
		const languageHasPreferredGenderVoice = languageVoices.filter(findByGender).length;

		let voice = "";
		if (languageHasPreferredGenderVoice) voice = languageVoices.find(findByGender).name;
		else voice = languageVoices[0].name;

		const synthesizeParams = {
			text,
			voice,
			accept: "audio/mp3",
		};
		const filename = nanoid() + ".mp3";
		const rootPath = path.resolve(process.cwd());
    const publicPath = `media/synthesized/${filename}`;
		const filepath = `${rootPath}/public/${publicPath}`;

		try {
			const data = [];
			const { result } = await textToSpeech.synthesize(synthesizeParams);

			result.on("data", function (chunk) {
				data.push(chunk);
			});

			result.on("end", function () {
				const binary = Buffer.concat(data);
				fs.writeFileSync(filepath, binary);
				resolve(publicPath);
			});
		} catch (err) {
			console.log(`error: ${err.message}`);
		}
	});
}

async function synthesizeSentences(strings, voice, targetLang) {
	return await Promise.all(strings.map((sentence) => textToVoice(sentence, voice, targetLang)));
}

export default synthesizeSentences;
