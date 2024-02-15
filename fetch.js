import fetch from 'node-fetch'; // Importar node-fetch para usar en Node.js
import { writeFileSync } from 'fs';

const IpfsHash = 'bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku';

async function main() {
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${IpfsHash}`);
    const contentType = res.headers.get('content-type');
    console.log('Content-Type:', contentType);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch IPFS file: ${res.status} ${res.statusText}`
      );
    }

    const fileData = await res.arrayBuffer(); // Obtener los datos del archivo como un ArrayBuffer
    const buffer = Buffer.from(fileData); // Convertir el ArrayBuffer a un Buffer de Node.js

    // Guardar el archivo en local
    writeFileSync('archivo.mp3', buffer);

    console.log('Archivo MP3 descargado y guardado con éxito.');
  } catch (error) {
    console.log('Error:', error);
  }
}

main();
