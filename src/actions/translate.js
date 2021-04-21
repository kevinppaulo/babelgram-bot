import LanguageTranslatorV3 from "ibm-watson/language-translator/v3.js";
import { IamAuthenticator } from "ibm-watson/auth/index.js";

async function translate(text, videoLang, targetLang) {
  console.log(`translating: ${text}...`);
  const languageTranslator = new LanguageTranslatorV3({
    version: process.env.WATSON_TRANSLATE_VERSION,
    authenticator: new IamAuthenticator({
      apikey: process.env.WATSON_TRANSLATE_KEY,
    }),
    serviceUrl: process.env.WASTON_TRANSLATE_INST,
  });

  const modelId = videoLang.substring(0, 2) + "-" + targetLang.substring(0, 2);
  const translateParams = {
    text,
    modelId,
  };

  const { result } = await languageTranslator.translate(translateParams);
  return result;
}

async function translateArrayOfText(textArr, videoLang, targetLang) {
  const translateText = (text) => translate(text, videoLang, targetLang);
  const extractTranslationText = (translationResult) =>
    translationResult.translations[0].translation;

  const translationResults = await Promise.all(textArr.map(translateText));
  const translatedTextArr = translationResults.map(extractTranslationText);
  return translatedTextArr;
}

export default translateArrayOfText;
