require('dotenv').config();
const Axios = require('axios');
const FormData = require('form-data');
const { createReadStream, readFileSync } = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const express = require('express');
const cors = require('cors');
const { default: Web3 } = require('web3');

const app = express();

const corsOptions = {
  origin: '*',
};
const JWT = process.env.PINATA_JWT;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

app.use(cors(corsOptions));
const web3 = new Web3('https://data-seed-prebsc-1-s1.bnbchain.org:8545');

const contractABI = JSON.parse(
  readFileSync('./contracts/MutleyStorage.json', 'utf-8')
);
const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
console.log('ABI', contractABI);
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'mp3', 'mp4'];
    const extension = req.file.originalname.split('.').pop();
    const name = req.file.originalname.split('.').shift();

    if (!allowedExtensions.includes(extension)) {
      return res
        .status(400)
        .send('Supported file format is PNG, JPG, JPEG, MP3, or MP4');
    }
    if (!req.file) {
      return res.status(400).send('No file was provided');
    }

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1; // getUTCMonth() retorna meses de 0-11
    const day = now.getUTCDate();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();

    // Añadiendo ceros iniciales donde sea necesario para cumplir con el formato deseado
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day
      .toString()
      .padStart(2, '0')}`;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const currentDateTimeUTC = `${formattedDate} ${formattedTime} UTC`;

    const formData = new FormData();

    const file = createReadStream(req.file.path);
    formData.append('file', file);

    const pinataMetadata = JSON.stringify({
      name,
      // Adding date and format to metadata
      dateUploaded: currentDateTimeUTC,
      fileFormat: extension,
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

    const account = web3.eth.accounts.privateKeyToAccount(
      `0x${WALLET_PRIVATE_KEY}`
    );
    web3.eth.accounts.wallet.add(account);
    const data = contract.methods
      .addFile(
        ipfsHash,
        `https://ipfs.io/ipfs/${ipfsHash}`,
        currentDateTimeUTC,
        extension
      )
      .encodeABI();
    // Get the nonce for the account
    const nonce = await web3.eth.getTransactionCount(account.address, 'latest');

    // Estimar el gas necesario para la transacción
    const estimatedGas = await web3.eth.estimateGas({
      from: account.address,
      to: CONTRACT_ADDRESS,
      data: data,
      nonce: nonce,
    });

    // Obtener el precio actual del gas
    const gasPrice = await web3.eth.getGasPrice();

    // Aumentar un poco el límite de gas para asegurarnos de que la transacción se complete
    const gasLimit = (BigInt(estimatedGas) * BigInt(12)) / BigInt(10);

    // Crear la transacción con el gas estimado
    const tx = {
      from: account.address,
      to: CONTRACT_ADDRESS,
      nonce: nonce,
      gas: gasLimit, // Usar el límite de gas calculado
      gasPrice: gasPrice,
      data: data,
    };

    // Firmar y enviar la transacción
    const signedTx = await account.signTransaction(tx);
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );
    console.log('Transaction sent to the blockchain:', receipt.transactionHash);
    console.log('IPFS Hash:', ipfsHash);

    res.json({
      message: 'File successfully uploaded to IPFS',
      IpfsHash: ipfsHash,
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error processing the file');
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
