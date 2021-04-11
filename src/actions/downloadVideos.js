import fs from 'fs';
import https from 'https';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

function download(url) {
  console.log(`downloading ${url}`);
	return new Promise((resolve, reject) => {
		const filename = nanoid();
		const extension = '.mp4';
		const rootPath = path.resolve(process.cwd());

		https.get(url, (res) => {
			const path = `${rootPath}/media/downloaded_stories/${filename}${extension}`;
			const file = fs.createWriteStream(path);
			res.pipe(file);
			file.on('finish', () => {
				file.close();
				resolve(path);
			});
		});
	});
}

async function getAllVideos(urls) {
	const downloads = urls.map(download);
	const files = await Promise.all(downloads);
	return files;
}

export default getAllVideos;
