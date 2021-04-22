# babelgram-bot 🤖
![image](https://user-images.githubusercontent.com/28049114/115646248-333a9b00-a2f8-11eb-80ee-721ef89d5842.png)


Babelgram uses voice recognition and speech synthesis to translate Instagram's stories to your desired language using IBM Watson's
Speech to Text, Translation and Text to Speech services.

### How to run this project
1. Clone this project and install all dependencies using ```yarn install``` or ```npm -i```
2. Create your Telegram bot using botfather.
3. Have a redis server running. See instructions for installing [here](https://redis.io/topics/quickstart)
4. Have an accessible public domain to host your project. I recommend ngrok for local development and heroku for deploying.
5. You'll need an IBM Cloud account to use the [speech to text](https://cloud.ibm.com/catalog/services/speech-to-text), [text to speech](https://cloud.ibm.com/catalog/services/text-to-speech) and [language translator](https://cloud.ibm.com/catalog/services/language-translator) services. Don't worry, they have a free plan.
6. Grab your key and url from each of your services and put them in your ```.env``` file. An example ```.env``` is provided. 
7. Speaking of ```.env```, configure your bot token, public url, instagram username and password on your ```.env``` file.
8. Make your bot's webhook point to your domain. See [setWebhook](https://core.telegram.org/bots/api#setwebhook) for more info.

![image](https://user-images.githubusercontent.com/28049114/115643988-24ea8000-a2f4-11eb-810c-fbcefbd29646.png)

### Notes
currently the bot expects you to set the webhook in the following format: ```https://your-domain.com/{yourSecretToken}/update/``` where ```{yourSecretToken}``` is the ```WEBHOOK_SECRET``` configured in the ```.env ``` file.
