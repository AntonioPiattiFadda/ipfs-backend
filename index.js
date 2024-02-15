require('dotenv').config();
const Axios = require('axios');
const FormData = require('form-data');
const { createReadStream } = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const express = require('express');

// const JWT = process.env.PINATA_JWT;
const app = express();

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No se ha proporcionado ningún archivo');
    }
    console.log(req.file);

    const formData = new FormData();

    // //Quiero ahora que la API guarde un archivo de video en IPFS
    // const file = createReadStream('./assets/Super-Mario-Bros.mp4');
    // formData.append('file', file);

    // const pinataMetadata = JSON.stringify({
    //   name: 'MP4 File',
    // });
    // formData.append('pinataMetadata', pinataMetadata);

    // const pinataOptions = JSON.stringify({
    //   cidVersion: 1,
    // });
    // formData.append('pinataOptions', pinataOptions);

    // const res = await Axios.post(
    //   'https://api.pinata.cloud/pinning/pinFileToIPFS',
    //   formData,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${JWT}`,
    //       ...formData.getHeaders(),
    //     },
    //   }
    // );
    // const ipfsHash = res.data.IpfsHash;
    // console.log(res.data);

    // //LLegaria al cliente
    res.json({
      message: 'Archivo subido a IPFS con éxito',
      // ipfsHash,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error al procesar el archivo');
  }
});

app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
