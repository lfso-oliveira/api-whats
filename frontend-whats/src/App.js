import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [qr, setQr] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [numeros, setNumeros] = useState('');
  const [anexo, setAnexo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchQr();
    const interval = setInterval(() => {
      fetchStatus();
      fetchQr();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/status`);
    const data = await res.json();
    setConectado(data.conectado);
  };

  const fetchQr = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/qr`);
    const data = await res.json();
    setQr(data.qr);
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setResultado(null);
    const formData = new FormData();
    formData.append('mensagem', mensagem);
    formData.append('numeros', JSON.stringify(numeros.split(/\r?\n/).map(n => n.trim()).filter(n => n)));
    if (anexo) formData.append('anexo', anexo);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/enviar`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setResultado(data);
    } catch (err) {
      setResultado({ erro: 'Erro ao enviar' });
    }
    setEnviando(false);
  };

  return (
    <div className="App">
      <h1>API WhatsApp</h1>
      <div>
        <strong>Status:</strong> {conectado ? 'Conectado' : 'Não conectado'}
      </div>
      {!conectado && qr && (
        <div>
          <h2>Escaneie o QR Code:</h2>
          <img src={qr} alt="QR Code" style={{ width: 256 }} />
        </div>
      )}
      {conectado && (
        <form onSubmit={handleEnviar} className="form-whats">
          <div>
            <label>Mensagem:</label><br />
            <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} required />
          </div>
          <div>
            <label>Números (um por linha, com DDD e país):</label><br />
            <textarea value={numeros} onChange={e => setNumeros(e.target.value)} placeholder="5511999999999" required />
          </div>
          <div>
            <label>Anexo (opcional):</label><br />
            <input type="file" accept="image/*,video/*" onChange={e => setAnexo(e.target.files[0])} />
          </div>
          <button type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar'}</button>
        </form>
      )}
      {resultado && (
        <div className="resultado">
          <h3>Resultado:</h3>
          <pre>{JSON.stringify(resultado, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
