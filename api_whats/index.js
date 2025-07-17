const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const whatsapp = require('./whatsapp');
const multer = require('multer');
const upload = multer();

whatsapp.initWhatsApp();

app.get('/qr', async (req, res) => {
  const qr = await whatsapp.getQrCodeImage();
  if (qr) {
    res.json({ qr });
  } else {
    res.status(404).json({ erro: 'QR Code não disponível' });
  }
});

app.get('/status', (req, res) => {
  res.json({ conectado: whatsapp.getClientStatus() });
});

app.post('/enviar', upload.single('anexo'), async (req, res) => {
  const { mensagem, numeros } = req.body;
  let listaNumeros = [];
  try {
    listaNumeros = JSON.parse(numeros);
  } catch {
    return res.status(400).json({ erro: 'Formato de números inválido (deve ser JSON array)' });
  }
  let fileBuffer = null;
  let fileName = null;
  if (req.file) {
    fileBuffer = req.file.buffer;
    fileName = req.file.originalname;
  }
  try {
    const resultado = await whatsapp.sendMessage({
      numbers: listaNumeros,
      message: mensagem,
      fileBuffer,
      fileName
    });
    res.json({ resultado });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post('/enviar-json', async (req, res) => {
  const { mensagem, numeros, fileName, fileBase64 } = req.body;
  let listaNumeros = [];
  try {
    listaNumeros = Array.isArray(numeros) ? numeros : JSON.parse(numeros);
  } catch {
    return res.status(400).json({ erro: 'Formato de números inválido (deve ser array ou JSON array)' });
  }
  let fileBuffer = null;
  if (fileBase64 && fileName) {
    try {
      fileBuffer = Buffer.from(fileBase64, 'base64');
    } catch {
      return res.status(400).json({ erro: 'Arquivo base64 inválido' });
    }
  }
  try {
    const resultado = await whatsapp.sendMessage({
      numbers: listaNumeros,
      message: mensagem,
      fileBuffer,
      fileName
    });
    res.json({ resultado });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get('/', (req, res) => {
  res.send('API WhatsApp rodando!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 