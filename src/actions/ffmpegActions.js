import extractAudio from 'ffmpeg-extract-audio';
import {nanoid} from 'nanoid';
import path from 'path';

async function toMp3(videoPath){
  console.log(`converting ${videoPath}`);
	const filename = nanoid() + '.mp3';

  const rootPath = path.resolve(process.cwd());
  const outputFilePath = `${rootPath}/media/converted_stories/${filename}`;

  await extractAudio({
    input: videoPath,
    output: outputFilePath
  });

  return outputFilePath;
}

async function convertVideosToAudio(videos){
  return await Promise.all(videos.map(toMp3));
}

export default convertVideosToAudio;