const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client;
let qrCodeData = null;
let isReady = false;

function initWhatsApp() {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']  // adiciona essas flags aqui
    }
  });



  client.on('qr', (qr) => {
    qrCodeData = qr;
    isReady = false;
    console.log('QR Code gerado.');
  });

  client.on('ready', () => {
    isReady = true;
    console.log('WhatsApp conectado!');
  });

  client.on('auth_failure', () => {
    isReady = false;
    console.log('Falha na autenticação.');
  });

  client.initialize();
}

async function getQrCodeImage() {
  if (qrCodeData) {
    return await qrcode.toDataURL(qrCodeData);
  }
  return null;
}

function getClientStatus() {
  return isReady;
}

async function sendMessage({ numbers, message, fileBuffer, fileName }) {
  if (!isReady) throw new Error('WhatsApp não está conectado');
  const results = [];
  for (let i = 0; i < numbers.length; i++) {
    const number = numbers[i];
    let status = 'erro';
    let errorMsg = null;
    try {
      const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
      if (fileBuffer && fileName) {
        const { MessageMedia } = require('whatsapp-web.js');
        const mime = require('mime-types');
        const mimeType = mime.lookup(fileName) || 'application/octet-stream';
        const media = new MessageMedia(
          mimeType,
          fileBuffer.toString('base64'),
          fileName
        );
        await client.sendMessage(chatId, media, { caption: message });
      } else {
        await client.sendMessage(chatId, message);
      }
      status = 'sucesso';
    } catch (e) {
      status = 'erro';
      errorMsg = e.message;
      console.error(`Erro ao enviar mensagem para ${number}:`, e);
    }
    results.push({ number, status, erro: errorMsg });
    if (i < numbers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
  }
  return results;
}

module.exports = {
  initWhatsApp,
  getQrCodeImage,
  getClientStatus,
  sendMessage
}; 