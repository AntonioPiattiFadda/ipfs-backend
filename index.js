require('dotenv').config();
const Axios = require('axios');
const FormData = require('form-data');
const { createReadStream } = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const express = require('express');
const cors = require('cors');

const app = express();

const corsOptions = {
  origin: 'http://localhost:3001',
};
const JWT = process.env.PINATA_JWT;

app.use(cors(corsOptions));

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'mp3', 'mp4'];
    const extension = req.file.originalname.split('.').pop();
    const name = req.file.originalname.split('.').shift();

    if (!allowedExtensions.includes(extension)) {
      return res
        .status(400)
        .send('El formato soportado de archivo es PNG, JPG, JPEG, MP3 o MP4');
    }
    if (!req.file) {
      return res.status(400).send('No se ha proporcionado ningún archivo');
    }

    const formData = new FormData();

    const file = createReadStream(req.file.path);
    formData.append('file', file);

    const pinataMetadata = JSON.stringify({
      name,
    });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', pinataOptions);

    const response = await Axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          Authorization: `Bearer ${JWT}`,
          ...formData.getHeaders(),
        },
      }
    );
    const ipfsHash = response.data.IpfsHash;

    //NOTE - Subir el hash a blockchain
    //NOTE - Hacer hash con datos del archivo para la app
    console.log('IPFS Hash:', ipfsHash);

    res.json({
      message: 'Archivo subido a IPFS con éxito',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error al procesar el archivo');
  }
});

app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
