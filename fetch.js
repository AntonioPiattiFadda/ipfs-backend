import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

const IpfsHash = 'bafkreibkfqh42lpnos2uf7zioxzfryaovcohtrw4eq4puh2nnuiuh7y5ma';

async function main() {
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${IpfsHash}`);
    const contentType = res.headers.get('content-type');

    if (!res.ok) {
      throw new Error(
        `Failed to fetch IPFS file: ${res.status} ${res.statusText}`
      );
    }
    console.log('Content-Type:', contentType);

    const fileData = await res.arrayBuffer();
    const buffer = Buffer.from(fileData);

    let archiveName = '';
    const fileExt = contentType.split('/').pop();
    const extensionMapping = {
      mp4: 'mp4',
      mpeg: 'mp3',
      jpg: 'jpg',
      jpeg: 'jpg',
      png: 'png',
    };

    archiveName = extensionMapping[fileExt] || 'unknown';

    writeFileSync(`Archivo.${archiveName}`, buffer);

    console.log(`Archivo ${archiveName} descargado y guardado con éxito.`);
  } catch (error) {
    console.log('Error:', error);
  }
}

main();
