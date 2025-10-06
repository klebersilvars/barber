import dotenv from 'dotenv';
dotenv.config({ path: 'keys.env' });
import express from 'express';
// import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import initializeFirebase from './firebase-config.js';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar Multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  }
});

// Inicializar Firebase Admin SDK
const db = initializeFirebase();

const app = express();

// Configurações do Firebase
const FIREBASE_TYPE = process.env.FIREBASE_TYPE || "service_account";
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_PRIVATE_KEY_ID = process.env.FIREBASE_PRIVATE_KEY_ID;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_CLIENT_ID = process.env.FIREBASE_CLIENT_ID;
const FIREBASE_AUTH_URI = process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth";
const FIREBASE_TOKEN_URI = process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token";
const FIREBASE_AUTH_PROVIDER_X509_CERT_URL = process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs";
const FIREBASE_CLIENT_X509_CERT_URL = process.env.FIREBASE_CLIENT_X509_CERT_URL;
const FIREBASE_UNIVERSE_DOMAIN = process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com";

// Configuração CORS com whitelist e resposta dinâmica por origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://www.trezu.com.br',
  'https://trezu.com.br',
  'https://localhost:5173'
];

const isDev = process.env.NODE_ENV !== 'production';

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Permitir requisições sem origin (ex.: Postman, healthchecks)
  if (!origin) {
    return next();
  }

  const isAllowed = allowedOrigins.includes(origin) || (isDev && origin.startsWith('http://localhost'));

  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mercado Pago Access Token (coloque sua chave de produção ou sandbox aqui)
const MP_ACCESS_TOKEN = process.env.API_KEY_MERCADO_PAGO
const MP_BASE_URL = 'https://api.mercadopago.com/checkout/preferences';

// Criar preferência de pagamento
app.post('/api/create-preference', async (req, res) => {
  const { planId, email, planName, price, dataTermino } = req.body;
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
      metadata: {
        tipoPlano: planId, // individual ou empresa
        dataTermino: dataTermino // data de término do plano
      }
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
          const contaData = snapshot.docs[0].data();
          // Verificar tipo de plano pelo metadata ou pelo valor
          let tipoPlano = 'bronze'; // padrão
          let plano = '';
          let price = 0;
          
          if (payment.additional_info && payment.additional_info.items && payment.additional_info.items[0]) {
            plano = payment.additional_info.items[0].title?.toLowerCase() || '';
            price = payment.additional_info.items[0].unit_price || 0;
          } else if (payment.description) {
            plano = payment.description.toLowerCase();
          }
          
          // Priorizar metadata do tipoPlano (enviado do frontend)
          if (payment.metadata && payment.metadata.tipoPlano) {
            tipoPlano = payment.metadata.tipoPlano;
            console.log('Tipo de plano definido pelo metadata:', tipoPlano);
          } else {
            // Fallback: tentar identificar pelo preço (valores dos novos planos)
            if (price === 59.90) {
              tipoPlano = 'bronze';
            } else if (price === 89.90) {
              tipoPlano = 'prata';
            } else if (price === 139.90) {
              tipoPlano = 'ouro';
            } else if (price === 189.90) {
              tipoPlano = 'diamante';
            } else {
              // Valores trimestrais ou anuais - usar metadata para identificar o plano correto
              // pois alguns valores são iguais entre planos diferentes
              console.log('Preço não identificado automaticamente, usando metadata ou padrão bronze');
              // Se não conseguir identificar pelo preço, manter bronze como padrão
              // O importante é que o metadata seja enviado corretamente do frontend
            }
            console.log('Tipo de plano identificado pelo preço:', tipoPlano, 'Preço:', price);
          }
          
          // Pegar período de cobrança do metadata
          const billingPeriod = payment.metadata?.billingPeriod || 'monthly';
          
          // Calcular data de término e dias premium baseado no período
          const hoje = new Date();
          let dataTermino = null;
          let diasPremium = 30; // padrão
          
          if (billingPeriod === 'monthly') {
            // Mensal: 1 mês exato
            const dataTerminoCalc = new Date(hoje);
            dataTerminoCalc.setMonth(hoje.getMonth() + 1);
            dataTermino = dataTerminoCalc.toISOString();
            diasPremium = 30;
            console.log('Período mensal: 30 dias de premium');
          } else if (billingPeriod === 'quarterly') {
            // Trimestral: 3 meses exatos
            const dataTerminoCalc = new Date(hoje);
            dataTerminoCalc.setMonth(hoje.getMonth() + 3);
            dataTermino = dataTerminoCalc.toISOString();
            diasPremium = 90; // 3 meses = 90 dias
            console.log('Período trimestral: 90 dias de premium');
          } else if (billingPeriod === 'yearly') {
            // Anual: 1 ano exato
            const dataTerminoCalc = new Date(hoje);
            dataTerminoCalc.setFullYear(hoje.getFullYear() + 1);
            dataTermino = dataTerminoCalc.toISOString();
            diasPremium = 365; // 1 ano = 365 dias
            console.log('Período anual: 365 dias de premium');
          } else {
            // Fallback para mensal se não especificado
            const dataTerminoCalc = new Date(hoje);
            dataTerminoCalc.setMonth(hoje.getMonth() + 1);
            dataTermino = dataTerminoCalc.toISOString();
            diasPremium = 30;
            console.log('Período não especificado, usando mensal: 30 dias de premium');
          }
          
          // Usar data de término do metadata se disponível (prioridade)
          if (payment.metadata && payment.metadata.dataTermino) {
            dataTermino = payment.metadata.dataTermino;
            console.log('Data de término recebida do metadata:', dataTermino);
          }
          
          console.log('=== DADOS DO PAGAMENTO ===');
          console.log('Email do pagador:', email);
          console.log('Tipo de plano identificado:', tipoPlano);
          console.log('Preço pago:', price);
          console.log('Período de cobrança:', billingPeriod);
          console.log('Dias premium:', diasPremium);
          console.log('Data de término:', dataTermino);
          console.log('Metadata recebido:', payment.metadata);
          
          // Calcular data de expiração para o Firestore (em milissegundos)
          const dataExpiracao = new Date(dataTermino);
          const premiumExpiresAt = admin.firestore.Timestamp.fromDate(dataExpiracao);
          
          await docRef.update({
            premium: true,
            premiumExpiresAt: premiumExpiresAt,
            premiumDaysLeft: diasPremium,
            tipoPlano: tipoPlano,
            dias_plano_pago: diasPremium,
            dias_plano_pago_restante: diasPremium,
            data_termino_plano_premium: dataTermino,
            status_pagamento: 'pago',
            billing_period: billingPeriod // Salvar o período de cobrança
          });
          
          console.log(`✅ Plano ${tipoPlano} ativado com sucesso para ${email}`);
          // Ativar colaboradores para planos que permitem (Prata, Ouro, Diamante)
          if ((tipoPlano === 'prata' || tipoPlano === 'ouro' || tipoPlano === 'diamante') && contaData.nomeEstabelecimento) {
            const colaboradoresRef = db.collection('colaboradores');
            const colabSnap = await colaboradoresRef.where('estabelecimento', '==', contaData.nomeEstabelecimento).get();
            const batchColab = db.batch();
            colabSnap.forEach(colabDoc => {
              batchColab.update(colabDoc.ref, { ativo: true });
            });
            await batchColab.commit();
            console.log(`Colaboradores ativados para plano ${tipoPlano}`);
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
    const promises = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Para planos pagos (bronze, prata, ouro, diamante)
      if ((data.tipoPlano === 'bronze' || data.tipoPlano === 'prata' || data.tipoPlano === 'ouro' || data.tipoPlano === 'diamante') && data.dias_plano_pago_restante > 0) {
        if (data.dias_plano_pago_restante > 1) {
          batch.update(doc.ref, { dias_plano_pago_restante: data.dias_plano_pago_restante - 1 });
        } else if (data.dias_plano_pago_restante === 1) {
          // Desativar premium quando chegar a 0
          batch.update(doc.ref, { 
            premium: false, 
            tipoPlano: '',
            dias_plano_pago_restante: 0, 
            dias_plano_pago: 0 
          });
          
          // Se for plano que permite colaboradores, desativa colaboradores
          if ((data.tipoPlano === 'prata' || data.tipoPlano === 'ouro' || data.tipoPlano === 'diamante') && data.nomeEstabelecimento) {
            const colaboradoresRef = db.collection('colaboradores');
            const p = colaboradoresRef.where('estabelecimento', '==', data.nomeEstabelecimento).get().then(colabSnap => {
              const batchColab = db.batch();
              colabSnap.forEach(colabDoc => {
                batchColab.update(colabDoc.ref, { ativo: false });
              });
              return batchColab.commit();
            });
            promises.push(p);
          }
        }
      }
      
      // Para teste grátis
      if (data.tipoPlano === 'gratis' && data.dias_restantes_teste_gratis > 0) {
        if (data.dias_restantes_teste_gratis > 1) {
          batch.update(doc.ref, { dias_restantes_teste_gratis: data.dias_restantes_teste_gratis - 1 });
        } else if (data.dias_restantes_teste_gratis === 1) {
          // Desativar premium quando chegar a 0
          batch.update(doc.ref, { 
            premium: false, 
            tipoPlano: '',
            data_inicio_teste_gratis: null,
            dias_restantes_teste_gratis: null 
          });
        }
      }
    });
    
    await batch.commit();
    await Promise.all(promises);
    res.status(200).json({ message: 'Dias premium decrementados e colaboradores desativados se necessário.' });
  } catch (err) {
    console.error('Erro ao decrementar dias premium:', err.message);
    res.status(500).json({ error: 'Erro ao decrementar dias premium.' });
  }
});

// Endpoint para decrementar dias automaticamente (cron job)
app.get('/api/cron/decrementar-dias', async (req, res) => {
  const { token } = req.query;
  const authHeader = req.headers.authorization;
  
  // Verificar token de segurança
  const expectedToken = process.env.CRON_TOKEN || '123456';
  const providedToken = token || (authHeader && authHeader.replace('Bearer ', ''));
  
  if (providedToken !== expectedToken) {
    console.log('Tentativa de acesso não autorizada ao endpoint de cron');
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    console.log('Iniciando decremento automático de dias...');
    
    // Abordagem mais robusta: buscar documentos em lotes menores
    let processedCount = 0;
    let decrementedCount = 0;
    let errorCount = 0;
    let lastDoc = null;
    const batchSize = 10; // Processar 10 documentos por vez
    
    while (true) {
      try {
        // Buscar lote de documentos
        let query = db.collection('contas').where('premium', '==', true).limit(batchSize);
        
        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
          console.log('Nenhum documento restante para processar');
          break;
        }
        
        // Processar cada documento individualmente
        for (const doc of snapshot.docs) {
          try {
            const data = doc.data();
            processedCount++;
            
            let needsUpdate = false;
            const updates = {};
            
            // Verificar plano grátis
            if (data.tipoPlano === 'gratis' && data.dias_restantes_teste_gratis > 0) {
              const novosDias = data.dias_restantes_teste_gratis - 1;
              
              if (novosDias <= 0) {
                // Plano expirou
                updates.premium = false;
                updates.dias_restantes_teste_gratis = 0;
                updates.tipoPlano = 'nenhum';
                console.log(`Conta ${doc.id}: Plano grátis expirou`);
              } else {
                // Decrementar dias
                updates.dias_restantes_teste_gratis = novosDias;
                console.log(`Conta ${doc.id}: Decrementado dias grátis ${data.dias_restantes_teste_gratis} -> ${novosDias}`);
              }
              needsUpdate = true;
              decrementedCount++;
            }
            // Verificar planos pagos (bronze, prata, ouro, diamante)
            else if ((data.tipoPlano === 'bronze' || data.tipoPlano === 'prata' || data.tipoPlano === 'ouro' || data.tipoPlano === 'diamante') && data.dias_plano_pago_restante > 0) {
              const novosDias = data.dias_plano_pago_restante - 1;
              
              if (novosDias <= 0) {
                // Plano expirou - desativar premium
                updates.premium = false;
                updates.dias_plano_pago_restante = 0;
                updates.tipoPlano = 'nenhum';
                updates.data_termino_plano_premium = null;
                updates.status_pagamento = 'expirado';
                console.log(`Conta ${doc.id}: Plano ${data.tipoPlano} expirou`);
              } else {
                // Decrementar dias
                updates.dias_plano_pago_restante = novosDias;
                console.log(`Conta ${doc.id}: Decrementado dias ${data.tipoPlano} ${data.dias_plano_pago_restante} -> ${novosDias}`);
              }
              needsUpdate = true;
              decrementedCount++;
            }
            
            // Atualizar documento se necessário
            if (needsUpdate) {
              // Usar updateDoc com retry individual
              let updateRetryCount = 0;
              const maxUpdateRetries = 3;
              
              while (updateRetryCount < maxUpdateRetries) {
                try {
                  await doc.ref.update(updates);
                  console.log(`Documento ${doc.id} atualizado com sucesso`);
                  break;
                } catch (updateError) {
                  updateRetryCount++;
                  console.log(`Tentativa ${updateRetryCount} de atualizar ${doc.id} falhou:`, updateError.message);
                  
                  if (updateRetryCount >= maxUpdateRetries) {
                    console.error(`Falha ao atualizar ${doc.id} após ${maxUpdateRetries} tentativas`);
                    errorCount++;
                  } else {
                    // Esperar antes de tentar novamente
                    await new Promise(resolve => setTimeout(resolve, 1000 * updateRetryCount));
                  }
                }
              }
            }
            
          } catch (docError) {
            errorCount++;
            console.error(`Erro ao processar documento ${doc.id}:`, docError.message);
            // Continuar com o próximo documento
          }
        }
        
        // Atualizar lastDoc para a próxima iteração
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        
        // Pequena pausa entre lotes para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (batchError) {
        console.error('Erro ao processar lote:', batchError.message);
        errorCount++;
        
        // Se o erro for gRPC, tentar novamente após uma pausa maior
        if (batchError.message.includes('gRPC') || batchError.message.includes('DECODER')) {
          console.log('Erro gRPC detectado, aguardando 5 segundos antes de tentar novamente...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          // Para outros erros, continuar
          break;
        }
      }
    }

    const response = {
      message: 'Decremento automático concluído',
      processed: processedCount,
      decremented: decrementedCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    };

    console.log('Resposta do cron job:', response);
    return res.json(response);

  } catch (error) {
    console.error('Erro no cron job de decremento:', error);
    return res.status(500).json({ 
      error: 'Erro interno no servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para verificar e desativar planos expirados baseado na data
app.post('/api/verificar-planos-expirados', async (req, res) => {
  try {
    console.log('=== VERIFICANDO PLANOS EXPIRADOS ===');
    
    const contasRef = db.collection('contas');
    const snapshot = await contasRef.where('premium', '==', true).get();
    
    let planosExpirados = 0;
    const hoje = new Date();
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const dataTermino = data.data_termino_plano_premium;
      
      if (dataTermino) {
        const dataTerminoObj = new Date(dataTermino);
        
        // Se a data de término já passou, desativar premium
        if (hoje >= dataTerminoObj) {
          await doc.ref.update({
            premium: false,
            data_termino_plano_premium: null,
            dias_plano_pago_restante: 0,
            dias_restantes_teste_gratis: 0
          });
          
          planosExpirados++;
          console.log(`Plano expirado para ${doc.id}: ${data.nomeEstabelecimento}`);
        }
      }
    }
    
    const response = {
      message: 'Verificação de planos expirados concluída',
      planosExpirados: planosExpirados,
      timestamp: new Date().toISOString()
    };
    
    console.log('Resposta da verificação:', response);
    return res.json(response);
    
  } catch (error) {
    console.error('Erro na verificação de planos expirados:', error);
    return res.status(500).json({ 
      error: 'Erro interno no servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de teste para verificar configurações
app.get('/api/test-config', (req, res) => {
  console.log('=== TESTE DE CONFIGURAÇÕES ===');
  
  const configs = {
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      api_key: process.env.CLOUDINARY_API_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'CONFIGURADO' : 'NÃO CONFIGURADO'
    },
    firebase: {
      project_id: process.env.FIREBASE_PROJECT_ID ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      client_email: process.env.FIREBASE_CLIENT_EMAIL ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      private_key: process.env.FIREBASE_PRIVATE_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO'
    },
    firestore: {
      initialized: db ? 'SIM' : 'NÃO'
    }
  };
  
  console.log('Configurações:', configs);
  
  res.json({
    message: 'Teste de configurações',
    timestamp: new Date().toISOString(),
    configs: configs
  });
});

// Endpoint de teste para CORS
app.get('/api/test-cors', (req, res) => {
  console.log('Teste CORS - Headers recebidos:', req.headers);
  console.log('Teste CORS - Origin:', req.headers.origin);
  console.log('Teste CORS - Method:', req.method);
  
  res.json({ 
    message: 'CORS está funcionando!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers
  });
});

// Endpoint de teste para POST
app.post('/api/test-cors-post', (req, res) => {
  console.log('Teste CORS POST - Headers recebidos:', req.headers);
  console.log('Teste CORS POST - Origin:', req.headers.origin);
  console.log('Teste CORS POST - Body:', req.body);
  
  res.json({ 
    message: 'CORS POST está funcionando!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method,
    body: req.body
  });
});

// Endpoint para upload de logo
app.post('/api/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    console.log('=== INÍCIO DO UPLOAD DE LOGO ===');
    console.log('Headers recebidos:', req.headers);
    console.log('Origin:', req.headers.origin);
    console.log('Method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    
    if (!req.file) {
      console.log('❌ Nenhum arquivo enviado');
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const { uid } = req.body;
    if (!uid) {
      console.log('❌ UID não fornecido');
      return res.status(400).json({ error: 'UID do usuário é obrigatório' });
    }

    console.log(`✅ Processando upload para usuário: ${uid}`);
    console.log('Arquivo recebido:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Verificar configuração do Cloudinary
    console.log('🔍 Verificando configuração do Cloudinary...');
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Configuração do Cloudinary incompleta');
      return res.status(500).json({ 
        error: 'Configuração do Cloudinary incompleta',
        details: 'Variáveis de ambiente não configuradas'
      });
    }

    // Converter buffer para base64
    console.log('🔄 Convertendo arquivo para base64...');
    const base64Image = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;

    console.log('🔄 Fazendo upload para Cloudinary...');
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'NÃO CONFIGURADO',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'NÃO CONFIGURADO'
    });

    // Upload para o Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'barber-logos',
      public_id: `logo_${uid}`,
      overwrite: true,
      transformation: [
        { width: 300, height: 300, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    console.log('✅ Upload para Cloudinary concluído:', uploadResult.secure_url);

    // Verificar configuração do Firestore
    console.log('🔍 Verificando configuração do Firestore...');
    if (!db) {
      console.error('❌ Firestore não inicializado');
      return res.status(500).json({ 
        error: 'Firestore não inicializado',
        details: 'Erro na configuração do Firebase'
      });
    }

    // Salvar URL no Firestore
    console.log('🔄 Salvando URL no Firestore...');
    
    // Implementar retry para salvar no Firestore
    let firestoreRetryCount = 0;
    const maxFirestoreRetries = 3;
    let firestoreSuccess = false;
    
    while (firestoreRetryCount < maxFirestoreRetries && !firestoreSuccess) {
      try {
        const docRef = db.collection('contas').doc(uid);
        await docRef.update({
          logo_url: uploadResult.secure_url
        });
        firestoreSuccess = true;
        console.log('✅ URL salva no Firestore com sucesso');
      } catch (firestoreError) {
        firestoreRetryCount++;
        console.error(`❌ Tentativa ${firestoreRetryCount} de salvar no Firestore falhou:`, firestoreError.message);
        
        if (firestoreRetryCount >= maxFirestoreRetries) {
          console.error('❌ Todas as tentativas de salvar no Firestore falharam');
          
          // Tentar salvar usando set() em vez de update() (pode funcionar melhor)
          try {
            console.log('🔄 Tentando salvar usando set()...');
            const docRef = db.collection('contas').doc(uid);
            await docRef.set({
              logo_url: uploadResult.secure_url
            }, { merge: true });
            console.log('✅ URL salva no Firestore usando set()');
            firestoreSuccess = true;
          } catch (setError) {
            console.error('❌ Set() também falhou:', setError.message);
            
            // Mesmo com erro no Firestore, retornar sucesso pois a imagem foi enviada
            return res.status(200).json({
              success: true,
              logo_url: uploadResult.secure_url,
              message: 'Logo enviada com sucesso! (URL salva localmente)',
              warning: 'Erro ao salvar no banco de dados, mas a imagem foi enviada',
              firestore_error: setError.message
            });
          }
        }
        
        // Esperar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 2000 * firestoreRetryCount));
      }
    }

    console.log('=== FIM DO UPLOAD DE LOGO ===');

    res.status(200).json({
      success: true,
      logo_url: uploadResult.secure_url,
      message: 'Logo enviada com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro no upload da logo:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Verificar tipo específico de erro
    if (error.name === 'FirebaseError') {
      console.error('❌ Erro do Firebase:', error.code, error.message);
      return res.status(500).json({ 
        error: 'Erro do Firebase',
        details: error.message,
        code: error.code
      });
    }
    
    if (error.http_code) {
      console.error('❌ Erro do Cloudinary:', error.http_code, error.message);
      return res.status(500).json({ 
        error: 'Erro do Cloudinary',
        details: error.message,
        code: error.http_code
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao fazer upload da logo',
      details: error.message,
      type: error.name
    });
  }
});

// Endpoint para testar decremento manualmente (apenas para desenvolvimento)
app.post('/api/test-decrement', async (req, res) => {
  try {
    const contasRef = db.collection('contas');
    const snapshot = await contasRef.where('premium', '==', true).get();
    
    const results = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        uid: doc.id,
        tipoPlano: data.tipoPlano,
        diasPlanoPagoRestante: data.dias_plano_pago_restante,
        diasRestantesTeste: data.dias_restantes_teste_gratis,
        premium: data.premium
      });
    });
    
    res.status(200).json({ 
      message: 'Dados das contas premium encontradas',
      contas: results 
    });
  } catch (err) {
    console.error('Erro ao buscar dados:', err.message);
    res.status(500).json({ error: 'Erro ao buscar dados.' });
  }
});

// Endpoint de teste para verificar conectividade com Firestore
app.get('/api/test-firestore', async (req, res) => {
  try {
    console.log('=== TESTE DE CONECTIVIDADE FIRESTORE ===');
    
    // Teste 1: Verificar se o Firebase está inicializado
    if (!db) {
      throw new Error('Firebase não está inicializado');
    }
    console.log('✅ Firebase inicializado');
    
    // Teste 2: Tentar buscar um documento simples
    const testQuery = db.collection('contas').limit(1);
    const testSnapshot = await testQuery.get();
    console.log('✅ Query simples executada com sucesso');
    console.log(`📊 Documentos encontrados: ${testSnapshot.size}`);
    
    // Teste 3: Tentar uma operação de escrita (apenas teste, não salva)
    const testDoc = db.collection('test_connection').doc('temp');
    await testDoc.set({
      test: true,
      timestamp: new Date().toISOString()
    });
    console.log('✅ Operação de escrita testada com sucesso');
    
    // Limpar documento de teste
    await testDoc.delete();
    console.log('✅ Documento de teste removido');
    
    res.json({
      success: true,
      message: 'Conectividade com Firestore OK',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de conectividade:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
}); 