require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do middleware
app.use(cors());
app.use(express.json());

// Configuração da API do Google Sheets com credenciais de conta de serviço
const CREDENTIALS_PATH = path.join(__dirname, 'credentials', 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Inicializar o cliente de autenticação
const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: SCOPES,
});

// ID da planilha e nome da aba
const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const sheetName = process.env.SHEET_NAME || 'inbound';

// API endpoint para buscar dados da planilha
app.get('/api/vehicles', async (req, res) => {
  try {
    // Criar cliente autenticado do Google Sheets
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Buscar dados da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}`,
    });

    // Extrair cabeçalhos e linhas de dados
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum dado encontrado na planilha.' });
    }

    const headers = rows[0].map(header => header.toLowerCase().trim());
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = index < row.length ? row[index] : '';
      });
      return obj;
    });

    res.json(data);
  } catch (error) {
    console.error('Erro ao acessar a planilha do Google:', error);
    res.status(500).json({ error: 'Erro ao buscar dados da planilha', details: error.message });
  }
});

// Rota para verificar se o servidor está online
app.get('/api/health', (req, res) => {
  res.json({ status: 'online' });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
