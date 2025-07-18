import dotenv from 'dotenv';
dotenv.config({ path: 'keys.env' });
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import admin from 'firebase-admin';

// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://www.trezu.com.br',
    'https://trezu.com.br'
  ],
  credentials: true,
}));
app.use(bodyParser.json());

// Mercado Pago Access Token (coloque sua chave de produção ou sandbox aqui)
const MP_ACCESS_TOKEN = process.env.API_KEY_MERCADO_PAGO
const MP_BASE_URL = 'https://api.mercadopago.com/checkout/preferences';

// Criar preferência de pagamento
app.post('/api/create-preference', async (req, res) => {
  const { planId, email, planName, price } = req.body;
  try {
    const preference = {
      items: [
        {
          title: planName,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(price),
        },
      ],
      payer: {
        email: email,
      },
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }],
      },
      back_urls: {
        success: 'https://SEU_DOMINIO/sucesso',
        failure: 'https://SEU_DOMINIO/erro',
        pending: 'https://SEU_DOMINIO/pendente',
      },
      auto_return: 'approved',
      notification_url: 'https://SEU_DOMINIO/api/mercadopago-webhook',
    };
    const response = await axios.post(MP_BASE_URL, preference, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    return res.json({ init_point: response.data.init_point });
  } catch (error) {
    console.error('Erro ao criar preferência:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Erro ao criar preferência de pagamento.' });
  }
});

// Webhook Mercado Pago
app.post('/api/mercadopago-webhook', async (req, res) => {
  const data = req.body;
  // O Mercado Pago envia notificações diferentes, precisamos buscar o pagamento
  if (data.type === 'payment') {
    try {
      const paymentId = data.data.id;
      // Buscar detalhes do pagamento
      const paymentRes = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
      });
      const payment = paymentRes.data;
      if (payment.status === 'approved') {
        // Buscar usuário pelo e-mail
        const email = payment.payer.email;
        const contasRef = db.collection('contas');
        const snapshot = await contasRef.where('email', '==', email).get();
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          // Verificar se é plano anual ou mensal
          // O nome do plano pode estar em payment.additional_info.items[0].title ou payment.description
          let plano = '';
          if (payment.additional_info && payment.additional_info.items && payment.additional_info.items[0] && payment.additional_info.items[0].title) {
            plano = payment.additional_info.items[0].title.toLowerCase();
          } else if (payment.description) {
            plano = payment.description.toLowerCase();
          }
          if (plano.includes('anual')) {
            // Plano anual: 365 dias
            await docRef.update({
              premium: true,
              premiumExpiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
              premiumDaysLeft: 365,
            });
          } else {
            // Plano mensal (padrão): 30 dias
            await docRef.update({
              premium: true,
              premiumExpiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
              premiumDaysLeft: 30,
            });
          }
        }
      }
      res.status(200).send('OK');
    } catch (err) {
      console.error('Erro no webhook:', err.message);
      res.status(500).send('Erro');
    }
  } else {
    res.status(200).send('OK');
  }
});

// (Opcional) Endpoint para decrementar premiumDaysLeft diariamente (pode ser chamado por cronjob)
app.post('/api/decrement-premium-days', async (req, res) => {
  try {
    const contasRef = db.collection('contas');
    const snapshot = await contasRef.where('premium', '==', true).get();
    const batch = db.batch();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.premiumDaysLeft > 1) {
        batch.update(doc.ref, { premiumDaysLeft: data.premiumDaysLeft - 1 });
      } else {
        batch.update(doc.ref, { premium: false, premiumDaysLeft: 0 });
      }
    });
    await batch.commit();
    res.status(200).json({ message: 'Dias premium decrementados.' });
  } catch (err) {
    console.error('Erro ao decrementar dias premium:', err.message);
    res.status(500).json({ error: 'Erro ao decrementar dias premium.' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
}); 