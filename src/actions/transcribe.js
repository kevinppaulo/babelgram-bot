import fs from "fs";
import SpeechToTextV1 from "ibm-watson/speech-to-text/v1.js";
import { IamAuthenticator } from "ibm-watson/auth/index.js";


function transcribeAudio(audioPath, videoLang) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.WATSON_TEXT_SPEECH_KEY;
    const serviceUrl = process.env.WATSON_TEXT_SPEECH_INST;

    const speechToText = new SpeechToTextV1({
      authenticator: new IamAuthenticator({
        apikey: apiKey,
      }),
      serviceUrl: serviceUrl,
    });

    const params = {
      objectMode: true,
      contentType: "audio/mp3",
      model: videoLang + "_BroadbandModel",
      keywords: [],
      maxAlternatives: 1,
    };

    // Create the stream.
    const recognizeStream = speechToText.recognizeUsingWebSocket(params);

    // Pipe in the audio.
    fs.createReadStream(audioPath).pipe(recognizeStream);

    recognizeStream.on("data", function (event) {
      console.log(event);
      resolve(event);
    });

    recognizeStream.on("error", function (event) {
      console.error(event);
      reject(event);
    });
  });
}

export default async function transcribeAllAudios(audios, videoLang){
  const transcriptions = await Promise.all(
    audios.map((audio) => transcribeAudio(audio, videoLang))
  );

  const resultHasText = transcription => transcription.results.length;
  const toText = transcription => transcription.results[0].alternatives[0].transcript;

  return transcriptions.filter(resultHasText).map(toText);
}
