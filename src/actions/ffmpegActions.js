import extractAudio from 'ffmpeg-extract-audio';
import {nanoid} from 'nanoid';
import path from 'path';

async function toMp3(videoPath){
  console.log(`converting ${videoPath}`);
	const filename = nanoid() + '.mp3';

  const rootPath = path.resolve(process.cwd());
  const outputFilePath = `${rootPath}/public/media/converted_stories/${filename}`;

  try{
    await extractAudio({
      input: videoPath,
      output: outputFilePath
    });
  }catch(e){
    console.log("An error occurred when extracting audio from video.")
    return false;
  }
  return outputFilePath;
}

async function convertVideosToAudio(videos){
  const audios = await Promise.all(videos.map(toMp3));
  return audios.filter(audio => audio);
}

export default convertVideosToAudio;
