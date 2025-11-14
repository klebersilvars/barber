import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
// import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import initializeFirebase from './firebase-config.js';
import admin from 'firebase-admin';

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

// WhatsApp API Configuration
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || 'Lyu6H6ADzWn3KqqQofyhFlmT96UBs3'
const WHATSAPP_BASE_URL = 'https://belkit.pro'

// Configuração da API do Asaas
// Configure sua API Key do Asaas aqui
const ASAAS_API_KEY = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmIyYjEyMzcxLTcyZDgtNDhhNC04NGJjLTU2ZjY1NDQxMTNiZTo6JGFhY2hfZWZhMzMzNjMtY2E1NS00Njc5LWE5MWQtODhlNGViN2I1NjNj'; // Substitua pela sua API Key do Asaas
const ASAAS_API_URL = 'https://api.asaas.com/v3';

// Log da configuração da API (sem expor a chave completa)
if (ASAAS_API_KEY && ASAAS_API_KEY !== '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmIyYjEyMzcxLTcyZDgtNDhhNC04NGJjLTU2ZjY1NDQxMTNiZTo6JGFhY2hfZWZhMzMzNjMtY2E1NS00Njc5LWE5MWQtODhlNGViN2I1NjNj') {
  console.log('✅ API Key do Asaas configurada:', ASAAS_API_KEY.substring(0, 20) + '...');
} else {
  console.warn('⚠️ API Key do Asaas NÃO configurada! Configure a constante ASAAS_API_KEY no código');
}

// Configuração dos links dos planos Asaas
const ASAAS_PLAN_LINKS = {
  teste: 'https://www.asaas.com/c/3tq79ax6gm22ib6g',
  bronze: 'https://www.asaas.com/c/i0ac1rrdxjlo8hsd',
  prata: 'https://www.asaas.com/c/sv8skxvst83ze71k',
  ouro: 'https://www.asaas.com/c/yv4j5eg7i3up6g2f',
  diamante: 'https://www.asaas.com/c/xy7dsnu6ojr47git'
};

// Valores dos planos (para identificar o plano pelo valor pago)
// Incluindo valores mensais, trimestrais e anuais
const PLAN_VALUES = {
  // Plano Teste (R$ 5,00 - atribui como prata)
  5.00: { tipo: 'prata', periodo: 'monthly' },
  
  // Bronze
  59.90: { tipo: 'bronze', periodo: 'monthly' },
  162.00: { tipo: 'bronze', periodo: 'quarterly' },
  575.00: { tipo: 'bronze', periodo: 'yearly' },
  
  // Prata
  89.90: { tipo: 'prata', periodo: 'monthly' },
  243.00: { tipo: 'prata', periodo: 'quarterly' },
  863.00: { tipo: 'prata', periodo: 'yearly' },
  
  // Ouro
  139.90: { tipo: 'ouro', periodo: 'monthly' },
  378.00: { tipo: 'ouro', periodo: 'quarterly' },
  1343.00: { tipo: 'ouro', periodo: 'yearly' },
  
  // Diamante
  189.90: { tipo: 'diamante', periodo: 'monthly' },
  513.00: { tipo: 'diamante', periodo: 'quarterly' },
  1823.00: { tipo: 'diamante', periodo: 'yearly' }
};

// Endpoint para obter a URL do webhook (para configurar no Asaas)
app.get('/api/asaas/webhook-url', (req, res) => {
  const baseUrl = process.env.BACKEND_URL || 'https://barber-backend-qlt6.onrender.com';
  const webhookUrl = `${baseUrl}/api/asaas-webhook`;
  
  res.json({
    webhook_url: webhookUrl,
    message: 'Configure esta URL no painel do Asaas em: Configurações > Webhooks',
    instrucoes: [
      '1. Acesse o painel do Asaas',
      '2. Vá em Configurações > Webhooks',
      '3. Adicione a URL acima',
      '4. Selecione os eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED',
      '5. Salve as configurações'
    ]
  });
});

// Endpoint para obter os links dos planos
app.get('/api/asaas/planos', (req, res) => {
  res.json({
    planos: {
      teste: {
        link: ASAAS_PLAN_LINKS.teste,
        valor: 5.00,
        nome: 'Plano Teste',
        atribuiComo: 'prata' // Atribui como prata quando pago
      },
      bronze: {
        link: ASAAS_PLAN_LINKS.bronze,
        valor: 59.90,
        nome: 'Plano Bronze'
      },
      prata: {
        link: ASAAS_PLAN_LINKS.prata,
        valor: 89.90,
        nome: 'Plano Prata'
      },
      ouro: {
        link: ASAAS_PLAN_LINKS.ouro,
        valor: 139.90,
        nome: 'Plano Ouro'
      },
      diamante: {
        link: ASAAS_PLAN_LINKS.diamante,
        valor: 189.90,
        nome: 'Plano Diamante'
      }
    }
  });
});

// Endpoint para gerar link de pagamento com UID (substitui o create-preference do Mercado Pago)
app.post('/api/asaas/get-payment-link', async (req, res) => {
  try {
    let { uid, planId, email } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: 'UID é obrigatório' });
    }
    
    if (!planId || !ASAAS_PLAN_LINKS[planId]) {
      return res.status(400).json({ error: 'Plano inválido. Use: bronze, prata, ouro ou diamante' });
    }
    
    // Obter o link do plano
    const planLink = ASAAS_PLAN_LINKS[planId];
    
    // Extrair o ID do paymentLink (última parte da URL após /c/)
    // Exemplo: https://www.asaas.com/c/3tq79ax6gm22ib6g -> 3tq79ax6gm22ib6g
    const paymentLinkId = planLink.split('/c/')[1] || planLink.split('/').pop() || null;
    
    // Adicionar o UID e email como parâmetros na URL
    // O Asaas pode receber parâmetros customizados via query string
    // O email é CRÍTICO para o webhook encontrar o usuário
    const paymentUrl = `${planLink}?uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(email || '')}`;
    
    // Salvar mapeamento UID -> Email -> Plano no Firestore para uso no webhook
    // CRÍTICO: Este mapeamento é essencial para o webhook encontrar o usuário
    if (!email) {
      console.warn('⚠️ Email não fornecido no request. Tentando buscar do Firestore...');
      try {
        // Tentar buscar email do usuário no Firestore usando o UID
        const userDoc = await db.collection('contas').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          email = userData.email || null;
          if (email) {
            console.log(`✅ Email encontrado no Firestore: ${email}`);
          } else {
            console.warn('⚠️ Usuário encontrado no Firestore mas sem email cadastrado');
          }
        } else {
          console.warn(`⚠️ Usuário não encontrado no Firestore com UID: ${uid}`);
        }
      } catch (firestoreError) {
        console.error('Erro ao buscar email no Firestore:', firestoreError.message);
      }
    }
    
    // Salvar email e paymentLinkId na coleção 'contas' (CRÍTICO)
    // Implementar retry robusto para lidar com erros gRPC
    if (email && uid) {
      let retryCount = 0;
      const maxRetries = 5;
      let saved = false;
      
      while (retryCount < maxRetries && !saved) {
      try {
        const contaRef = db.collection('contas').doc(uid);
          
          // Tentar buscar o documento primeiro
          let contaDoc;
          try {
            contaDoc = await contaRef.get();
          } catch (getError) {
            // Se falhar ao buscar, pode ser erro gRPC - tentar novamente
            if (getError.message.includes('gRPC') || getError.message.includes('DECODER')) {
              retryCount++;
              console.log(`⚠️ Erro gRPC ao buscar documento (tentativa ${retryCount}/${maxRetries}). Aguardando...`);
              await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
              continue;
            }
            throw getError;
          }
        
        const updateData = {
          email: email.toLowerCase().trim(),
          ultima_atualizacao: new Date().toISOString(),
          ultimo_paymentLinkId: paymentLinkId, // Salvar o ID do paymentLink para o webhook encontrar
          ultimo_planId_solicitado: planId, // Salvar o plano solicitado
          data_solicitacao_plano: new Date().toISOString()
        };
        
        if (contaDoc.exists) {
          await contaRef.update(updateData);
          console.log(`✅ Conta atualizada: Email ${email}, PaymentLinkId ${paymentLinkId}, Plano ${planId}`);
        } else {
          // Se a conta não existe, criar com o email e paymentLinkId
          await contaRef.set({
            ...updateData,
            createdAt: new Date().toISOString()
          }, { merge: true });
          console.log(`✅ Conta criada: Email ${email}, PaymentLinkId ${paymentLinkId}, Plano ${planId}`);
        }
          
          saved = true;
      } catch (contaError) {
          retryCount++;
          
          // Verificar se é erro gRPC/DECODER
          const isGrpcError = contaError.message.includes('gRPC') || 
                             contaError.message.includes('DECODER') ||
                             contaError.message.includes('UNKNOWN') ||
                             contaError.code === 2;
          
          if (isGrpcError && retryCount < maxRetries) {
            const waitTime = 2000 * retryCount; // 2s, 4s, 6s, 8s, 10s
            console.log(`⚠️ Erro gRPC detectado (tentativa ${retryCount}/${maxRetries}). Aguardando ${waitTime}ms antes de tentar novamente...`);
            console.log(`   Erro: ${contaError.message.substring(0, 100)}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            // Se não for erro gRPC ou já tentou todas as vezes, logar o erro
            console.error('❌ ERRO ao salvar na conta:', contaError.message);
            if (retryCount >= maxRetries) {
              console.error('❌ Todas as tentativas falharam após', maxRetries, 'tentativas');
            }
            // Não bloquear o processo - continuar mesmo com erro
            break;
          }
        }
      }
      
      if (!saved) {
        console.warn('⚠️ Não foi possível salvar os dados no Firestore, mas o link de pagamento será retornado');
      }
    } else {
      console.warn('⚠️ Email ou UID não disponível para salvar no Firestore');
      console.warn('UID:', uid);
      console.warn('Email:', email);
      console.warn('PlanId:', planId);
    }
    
    return res.json({
      payment_url: paymentUrl,
      planId: planId,
      uid: uid
    });
    
  } catch (error) {
    console.error('Erro ao gerar link de pagamento:', error);
    return res.status(500).json({ error: 'Erro ao gerar link de pagamento' });
  }
});

// Webhook Asaas - recebe notificações de pagamento
app.post('/api/asaas-webhook', async (req, res) => {
    const event = req.body.event;
    const payment = req.body.payment;
  const subscription = req.body.subscription;
  
  console.log('📨 Webhook do Asaas recebido:', {
    event,
    paymentId: payment?.id,
    subscriptionId: subscription?.id
  });

  try {
    // Processar eventos de pagamento confirmado
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const paymentId = payment?.id;
      console.log('💳 Processando pagamento confirmado:', paymentId);

      if (!paymentId) {
        console.log('⚠️ ID de pagamento não encontrado na notificação');
        return res.status(200).send('OK - Payment ID not found');
      }

      // Buscar detalhes do pagamento no Asaas
      let paymentDetails;
      try {
        const paymentRes = await axios.get(`${ASAAS_API_URL}/payments/${paymentId}`, {
          headers: {
            'access_token': ASAAS_API_KEY,
            'Content-Type': 'application/json',
          },
        });
        paymentDetails = paymentRes.data;
        console.log('✅ Detalhes do pagamento obtidos da API do Asaas');
      } catch (error) {
        console.error('❌ Erro ao buscar pagamento no Asaas:', error.response?.status, error.message);
        // Se não encontrar, usar os dados do webhook
        paymentDetails = payment;
        console.log('⚠️ Usando dados do webhook diretamente');
      }

      console.log('💳 Dados do pagamento:', {
        id: paymentDetails.id,
        status: paymentDetails.status,
        value: paymentDetails.value,
        customer: paymentDetails.customer,
        subscription: paymentDetails.subscription,
        externalReference: paymentDetails.externalReference
      });

      // Se o pagamento estiver confirmado/recebido
      if (paymentDetails.status === 'CONFIRMED' || paymentDetails.status === 'RECEIVED') {
        // Buscar email do cliente no Asaas
        let customerEmail = null;
        
        // Tentar extrair email do objeto payment
        if (paymentDetails.customer) {
          // Se customer é um objeto, pegar o email diretamente
          if (typeof paymentDetails.customer === 'object' && paymentDetails.customer.email) {
            customerEmail = paymentDetails.customer.email;
            console.log('📧 Email encontrado no objeto customer:', customerEmail);
          } 
          // Se customer é um ID (string), buscar na API
          else if (typeof paymentDetails.customer === 'string') {
            try {
              const customerRes = await axios.get(`${ASAAS_API_URL}/customers/${paymentDetails.customer}`, {
        headers: {
                  'access_token': ASAAS_API_KEY,
                  'Content-Type': 'application/json',
                },
              });
              customerEmail = customerRes.data?.email;
              console.log('📧 Email do cliente obtido da API do Asaas:', customerEmail);
            } catch (error) {
              console.warn('⚠️ Erro ao buscar email do cliente:', error.message);
            }
          }
        }
        
        if (!customerEmail) {
          console.log('⚠️ Email não encontrado no pagamento');
          return res.status(200).send('OK - Email not found');
        }
        
        // Normalizar email
        customerEmail = customerEmail.toLowerCase().trim();
        console.log(`✅ Email final para busca: ${customerEmail}`);
        
        // Buscar usuário por email no Firestore
        // CRÍTICO: O email é usado para encontrar a conta do usuário
        let docRef = null;
        let contaData = null;
        
        try {
          console.log(`🔍 Buscando usuário por email: ${customerEmail}`);
          const contasRef = db.collection('contas');
          
          // Tentar buscar com retry para lidar com erros gRPC
          let retryCount = 0;
          const maxRetries = 5;
          let encontrado = false;
          
          while (retryCount < maxRetries && !encontrado) {
            try {
              const snapshot = await contasRef.where('email', '==', customerEmail).get();
              
              if (!snapshot.empty) {
                docRef = snapshot.docs[0].ref;
                contaData = snapshot.docs[0].data();
                console.log(`✅ Usuário encontrado por email: ${customerEmail}`);
                console.log(`✅ UID da conta: ${docRef.id}`);
                console.log(`✅ Dados da conta:`, JSON.stringify(contaData, null, 2));
                encontrado = true;
                break;
              } else {
                // Se não encontrou, tentar buscar todas as contas e filtrar manualmente (case-insensitive)
                console.log(`⚠️ Nenhuma conta encontrada com o email exato. Buscando todas as contas...`);
                const allAccounts = await contasRef.limit(500).get();
                
                console.log(`📊 Total de contas verificadas: ${allAccounts.size}`);
                
                for (const doc of allAccounts.docs) {
                  const data = doc.data();
                  const emailConta = data.email ? data.email.toLowerCase().trim() : null;
                  
                  if (emailConta === customerEmail) {
                    docRef = doc.ref;
                    contaData = data;
                    console.log(`✅ Conta encontrada por email (case-insensitive): ${customerEmail}`);
                    console.log(`✅ UID da conta: ${docRef.id}`);
                    encontrado = true;
                    break;
                  }
                }
                
                if (encontrado) {
                  break;
                }
              }
              
              // Se não encontrou, tentar novamente
              retryCount++;
              if (retryCount < maxRetries) {
                const waitTime = 1000 * retryCount; // 1s, 2s, 3s, 4s
                console.log(`⚠️ Conta não encontrada. Tentativa ${retryCount + 1}/${maxRetries} em ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              }
              
            } catch (emailError) {
              retryCount++;
              console.error(`❌ Erro ao buscar por email (tentativa ${retryCount}/${maxRetries}):`, emailError.message);
              
              // Se for erro gRPC, tentar novamente
              if (emailError.message.includes('gRPC') || emailError.message.includes('DECODER')) {
                if (retryCount < maxRetries) {
                  const waitTime = 2000 * retryCount; // 2s, 4s, 6s, 8s
                  console.log(`⚠️ Erro gRPC detectado. Tentando novamente em ${waitTime}ms...`);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                  console.error('❌ Todas as tentativas falharam. Stack trace:', emailError.stack);
                }
              } else {
                // Para outros erros, não tentar novamente
                console.error('❌ Erro não gRPC. Stack trace:', emailError.stack);
                break;
              }
            }
          }
          
          if (!encontrado) {
            console.log(`❌ Nenhum usuário encontrado com o email: ${customerEmail} após ${retryCount} tentativa(s)`);
            return res.status(200).json({ 
              message: 'Usuário não encontrado',
              email: customerEmail
            });
          }
        } catch (firestoreError) {
          console.error('❌ Erro ao buscar usuário no Firestore:', firestoreError.message);
          return res.status(200).json({ 
            message: 'Erro ao buscar usuário',
            error: firestoreError.message
          });
        }
        
        // Identificar o tipo de plano pelo valor
        let tipoPlano = null;
        let billingPeriod = 'monthly'; // Padrão mensal
        const value = paymentDetails.value || paymentDetails.totalValue || paymentDetails.amount || 0;
        const valorArredondado = Math.round(value * 100) / 100;
        
        if (PLAN_VALUES[valorArredondado]) {
          const planInfo = PLAN_VALUES[valorArredondado];
          tipoPlano = planInfo.tipo;
          billingPeriod = planInfo.periodo;
          console.log('✅ Plano identificado pelo valor:', tipoPlano, '- Período:', billingPeriod);
        } else {
          // Tentar identificar pela descrição
          const description = paymentDetails.description || '';
          const descLower = description.toLowerCase();
          if (descLower.includes('bronze')) {
              tipoPlano = 'bronze';
          } else if (descLower.includes('prata')) {
              tipoPlano = 'prata';
          } else if (descLower.includes('ouro')) {
              tipoPlano = 'ouro';
          } else if (descLower.includes('diamante')) {
              tipoPlano = 'diamante';
          }
          
          // Tentar identificar período pela descrição
          if (descLower.includes('trimestral') || descLower.includes('quarterly')) {
            billingPeriod = 'quarterly';
          } else if (descLower.includes('anual') || descLower.includes('yearly')) {
            billingPeriod = 'yearly';
          }
          
          console.log('Plano identificado pela descrição:', tipoPlano, '- Período:', billingPeriod);
        }
        
        if (!tipoPlano) {
          console.log('❌ Não foi possível identificar o tipo de plano');
          return res.status(200).send('OK - Plan type not identified');
        }
        
        // Calcular datas baseado no período
        const hoje = new Date();
        const dataPagamento = new Date(paymentDetails.paymentDate || paymentDetails.dateCreated || hoje);
        const dataFinal = new Date(hoje);
        
        let diasPremium = 30; // Padrão mensal
        
        if (billingPeriod === 'yearly') {
          dataFinal.setFullYear(dataFinal.getFullYear() + 1);
          diasPremium = 365;
        } else if (billingPeriod === 'quarterly') {
          dataFinal.setMonth(dataFinal.getMonth() + 3);
          diasPremium = 90;
                } else {
          // monthly
          dataFinal.setMonth(dataFinal.getMonth() + 1);
          diasPremium = 30;
        }
        
        console.log('📅 Período identificado:', billingPeriod);
        console.log('📅 Data de término calculada:', dataFinal.toISOString());
        console.log('📅 Dias premium:', diasPremium);
          
        // Calcular data de expiração para o Firestore
        const dataExpiracao = new Date(dataFinal);
          const premiumExpiresAt = admin.firestore.Timestamp.fromDate(dataExpiracao);
          
          // Definir limite de colaboradores por plano
          let maxColaborador = 1;
          if (tipoPlano === 'bronze') {
            maxColaborador = 2;
          } else if (tipoPlano === 'prata') {
            maxColaborador = 3;
          } else if (tipoPlano === 'ouro') {
            maxColaborador = 4;
          } else if (tipoPlano === 'diamante') {
            maxColaborador = 999999; // Sem limite prático
          }

        // Preparar atualizações da conta
        const updates = {
            premium: true,
            premiumExpiresAt: premiumExpiresAt,
            premiumDaysLeft: diasPremium,
            tipoPlano: tipoPlano,
            dias_plano_pago: diasPremium,
            dias_plano_pago_restante: diasPremium,
            data_termino_plano_premium: dataFinal.toISOString(),
            status_pagamento: 'pago',
            billing_period: billingPeriod,
          max_colaborador: maxColaborador,
            ultima_atualizacao_plano: new Date().toISOString(),
            payment_id: paymentId, // Salvar ID do pagamento para referência
            payment_date: dataPagamento.toISOString()
        };
        
        console.log('=== ATUALIZANDO CONTA DO USUÁRIO ===');
        console.log('UID:', docRef.id);
        console.log('Email:', customerEmail);
        console.log('Tipo de Plano:', tipoPlano);
        console.log('Dias Premium:', diasPremium);
        console.log('Data de Término:', dataFinal.toISOString());
        console.log('Max Colaboradores:', maxColaborador);
        
        // Atualizar conta do usuário
        try {
          await docRef.update(updates);
          console.log(`✅ Plano ${tipoPlano} ativado com sucesso para ${customerEmail} (UID: ${docRef.id})`);
        } catch (updateError) {
          console.error('❌ Erro ao atualizar conta:', updateError.message);
          console.error('Stack trace:', updateError.stack);
          throw updateError;
        }
        
        // Ativar colaboradores para planos que permitem
        if ((tipoPlano === 'bronze' || tipoPlano === 'prata' || tipoPlano === 'ouro' || tipoPlano === 'diamante') && contaData?.nomeEstabelecimento) {
          try {
            console.log(`🔍 Ativando colaboradores para plano ${tipoPlano}...`);
            const colaboradoresRef = db.collection('colaboradores');
            const colabSnap = await colaboradoresRef.where('estabelecimento', '==', contaData.nomeEstabelecimento).get();
            
            if (!colabSnap.empty) {
            const batchColab = db.batch();
            colabSnap.forEach(colabDoc => {
              batchColab.update(colabDoc.ref, { ativo: true });
            });
            await batchColab.commit();
              console.log(`✅ ${colabSnap.size} colaborador(es) ativado(s) para plano ${tipoPlano}`);
            } else {
              console.log(`ℹ️ Nenhum colaborador encontrado para ativar`);
            }
          } catch (colabError) {
            console.error('❌ Erro ao ativar colaboradores:', colabError.message);
            // Não bloquear o processo se falhar ao ativar colaboradores
          }
        }
        
        return res.status(200).json({ 
          success: true,
          message: 'Pagamento processado com sucesso',
          email: customerEmail,
          uid: docRef.id,
          tipoPlano: tipoPlano,
          paymentId: paymentId
        });
  } else {
        console.log(`⚠️ Pagamento não confirmado. Status: ${paymentDetails.status}`);
        return res.status(200).send('OK - Payment not confirmed');
      }
    }
    // Processar eventos de assinatura cancelada ou pagamento cancelado
    else if (event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_CANCELLED' || 
             event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') {
      console.log('❌ Processando cancelamento:', {
        event,
        subscriptionId: subscription?.id,
        paymentId: payment?.id
      });
      
      // Buscar email do cliente para desativar o plano
      let customerEmail = null;
      
      if (payment?.customer) {
        if (typeof payment.customer === 'object' && payment.customer.email) {
          customerEmail = payment.customer.email;
        } else if (typeof payment.customer === 'string') {
          try {
            const customerRes = await axios.get(`${ASAAS_API_URL}/customers/${payment.customer}`, {
              headers: {
                'access_token': ASAAS_API_KEY,
                'Content-Type': 'application/json',
              },
            });
            customerEmail = customerRes.data?.email;
          } catch (error) {
            console.warn('⚠️ Erro ao buscar email do cliente:', error.message);
          }
        }
      }
      
      if (customerEmail) {
        customerEmail = customerEmail.toLowerCase().trim();
        console.log(`🔍 Buscando conta para cancelar: ${customerEmail}`);
        
        try {
          const contasRef = db.collection('contas');
          const snapshot = await contasRef.where('email', '==', customerEmail).get();
          
          if (!snapshot.empty) {
            const docRef = snapshot.docs[0].ref;
            const contaData = snapshot.docs[0].data();
            
            // Desativar premium e resetar limites
            await docRef.update({
              premium: false,
              tipoPlano: 'nenhum',
              status_pagamento: 'cancelado',
              dias_plano_pago_restante: 0,
              data_termino_plano_premium: null,
              max_colaborador: 1,
              ultima_atualizacao_plano: new Date().toISOString(),
              cancelamento_data: new Date().toISOString()
            });
            
            console.log(`✅ Plano cancelado para ${customerEmail} (UID: ${docRef.id})`);
            
            // Desativar colaboradores extras
            if (contaData?.nomeEstabelecimento) {
              try {
                const colaboradoresRef = db.collection('colaboradores');
                const colabSnap = await colaboradoresRef.where('estabelecimento', '==', contaData.nomeEstabelecimento).get();
                
                if (!colabSnap.empty) {
                  const batchColab = db.batch();
                  colabSnap.forEach(colabDoc => {
                    batchColab.update(colabDoc.ref, { ativo: false });
                  });
                  await batchColab.commit();
                  console.log(`✅ ${colabSnap.size} colaborador(es) desativado(s)`);
                }
              } catch (colabError) {
                console.error('❌ Erro ao desativar colaboradores:', colabError.message);
              }
            }
          } else {
            console.log(`⚠️ Nenhuma conta encontrada com o email: ${customerEmail}`);
          }
        } catch (firestoreError) {
          console.error('❌ Erro ao processar cancelamento:', firestoreError.message);
        }
      }
      
      return res.status(200).json({ 
        success: true,
        message: 'Cancelamento processado',
        email: customerEmail
      });
    } 
    else {
      console.log(`ℹ️ Evento não processado: ${event}`);
      return res.status(200).send('OK - Event not processed');
    }
  } catch (err) {
    console.error('❌ Erro no webhook Asaas:', err.message);
    console.error('Stack trace:', err.stack);
    // Retornar 200 para não gerar erro no Asaas, mas logar o erro
    return res.status(200).json({ 
      error: 'Erro ao processar webhook',
      message: err.message
    });
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
            dias_plano_pago: 0,
            max_colaborador: 1
          });
          
          // Desativar colaboradores extras (inclui bronze, prata, ouro, diamante)
          if ((data.tipoPlano === 'bronze' || data.tipoPlano === 'prata' || data.tipoPlano === 'ouro' || data.tipoPlano === 'diamante') && data.nomeEstabelecimento) {
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
            dias_restantes_teste_gratis: null,
            max_colaborador: 1,
            status_pagamento: 'expirado'
          });

          // Desativar TODOS os colaboradores do estabelecimento imediatamente
          if (data.nomeEstabelecimento) {
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
            dias_restantes_teste_gratis: 0,
            max_colaborador: 1,
            status_pagamento: 'expirado'
          });
          // Desativar colaboradores extras ao expirar
          const nomeEstabelecimento = data.nomeEstabelecimento;
          const tipoPlanoAnterior = data.tipoPlano;
          if (nomeEstabelecimento) {
            const colaboradoresRef = db.collection('colaboradores');
            const colabSnap = await colaboradoresRef.where('estabelecimento', '==', nomeEstabelecimento).get();
            const batchColab = db.batch();
            colabSnap.forEach(colabDoc => {
              batchColab.update(colabDoc.ref, { ativo: false });
            });
            await batchColab.commit();
          }
          
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

// Endpoint para inicializar conta com valores padrão, incluindo max_colaborador = 1
app.post('/api/init-account', async (req, res) => {
  try {
    const { uid, email, nomeEstabelecimento } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'UID é obrigatório' });
    }

    const docRef = db.collection('contas').doc(uid);
    await docRef.set({
      email: email || null,
      nomeEstabelecimento: nomeEstabelecimento || null,
      premium: false,
      tipoPlano: 'nenhum',
      dias_plano_pago: 0,
      dias_plano_pago_restante: 0,
      dias_restantes_teste_gratis: 0,
      avaliacao_gratis: false,
      data_termino_plano_premium: null,
      max_colaborador: 1,
      createdAt: new Date().toISOString()
    }, { merge: true });

    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao inicializar conta:', error.message);
    return res.status(500).json({ error: 'Erro ao inicializar conta' });
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
            dias_restantes_teste_gratis: 0,
            max_colaborador: 1,
            status_pagamento: 'expirado'
          });
          // Desativar colaboradores extras ao expirar
          const nomeEstabelecimento = data.nomeEstabelecimento;
          const tipoPlanoAnterior = data.tipoPlano;
          if (nomeEstabelecimento) {
            const colaboradoresRef = db.collection('colaboradores');
            const colabSnap = await colaboradoresRef.where('estabelecimento', '==', nomeEstabelecimento).get();
            const batchColab = db.batch();
            colabSnap.forEach(colabDoc => {
              batchColab.update(colabDoc.ref, { ativo: false });
            });
            await batchColab.commit();
          }
          
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

// Endpoint para inicializar conta com valores padrão, incluindo max_colaborador = 1
app.post('/api/init-account', async (req, res) => {
  try {
    const { uid, email, nomeEstabelecimento } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'UID é obrigatório' });
    }

    const docRef = db.collection('contas').doc(uid);
    await docRef.set({
      email: email || null,
      nomeEstabelecimento: nomeEstabelecimento || null,
      premium: false,
      tipoPlano: 'nenhum',
      dias_plano_pago: 0,
      dias_plano_pago_restante: 0,
      dias_restantes_teste_gratis: 0,
      avaliacao_gratis: false,
      data_termino_plano_premium: null,
      max_colaborador: 1,
      createdAt: new Date().toISOString()
    }, { merge: true });

    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao inicializar conta:', error.message);
    return res.status(500).json({ error: 'Erro ao inicializar conta' });
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

// ==================== ENDPOINTS WHATSAPP ====================

// Endpoint para gerar QR Code
app.post('/api/whatsapp/generate-qr', async (req, res) => {
  try {
    console.log('=== GERANDO QR CODE WHATSAPP ===');
    console.log('Dados recebidos:', req.body);
    
    const { device, api_key, force } = req.body;
    
    if (!device) {
      return res.status(400).json({ error: 'Número do dispositivo é obrigatório' });
    }
    
    if (!api_key) {
      return res.status(400).json({ error: 'API Key é obrigatória' });
    }
    
    console.log(`Gerando QR Code para dispositivo: ${device}`);
    
    // A API do Belkit usa GET para generate-qr, então vamos usar query parameters
    const params = new URLSearchParams({
      device: device,
      api_key: api_key
    });
    
    if (force !== undefined) {
      params.append('force', force.toString());
    }
    
    const response = await axios.get(`${WHATSAPP_BASE_URL}/generate-qr?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Resposta da API WhatsApp:', response.data);
    
    if (response.data) {
      console.log('✅ QR Code gerado com sucesso');
      return res.json({
        success: true,
        status: response.data.status,
        qrcode: response.data.qrcode,
        message: response.data.message || 'QR Code gerado com sucesso',
        device: device
      });
    } else {
      console.log('❌ Resposta da API vazia');
      return res.status(500).json({ 
        error: 'Erro ao gerar QR Code',
        details: 'Resposta da API vazia'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code:', error.response?.data || error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Erro da API WhatsApp',
        details: error.response.data?.message || error.response.data?.error || 'Erro desconhecido',
        status: error.response.status
      });
    }
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint para enviar mensagem
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    console.log('=== ENVIANDO MENSAGEM WHATSAPP ===');
    console.log('Dados recebidos:', req.body);
    
    const { api_key, sender, number, message, footer, msgid, full } = req.body;
    
    if (!api_key || !sender || !number || !message) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: api_key, sender, number, message' 
      });
    }
    
    console.log(`Enviando mensagem de ${sender} para ${number}`);
    
    const payload = {
      api_key: api_key,
      sender: sender,
      number: number,
      message: message
    };
    
    // Adicionar parâmetros opcionais se fornecidos
    if (footer && footer.trim()) {
      payload.footer = footer.trim();
    }
    
    if (msgid && msgid.trim()) {
      payload.msgid = msgid.trim();
    }
    
    if (full !== undefined) {
      payload.full = full;
    }
    
    const response = await axios.post(`${WHATSAPP_BASE_URL}/send-message`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Resposta da API WhatsApp:', response.data);
    
    if (response.data) {
      console.log('✅ Mensagem enviada com sucesso');
      return res.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        data: response.data
      });
    } else {
      console.log('❌ Resposta da API vazia');
      return res.status(500).json({ 
        error: 'Erro ao enviar mensagem',
        details: 'Resposta da API vazia'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Erro da API WhatsApp',
        details: error.response.data?.message || error.response.data?.error || 'Erro desconhecido',
        status: error.response.status
      });
    }
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint para verificar status do dispositivo
app.post('/api/whatsapp/check-status', async (req, res) => {
  try {
    console.log('=== VERIFICANDO STATUS WHATSAPP ===');
    console.log('Dados recebidos:', req.body);
    
    const { api_key, number } = req.body;
    
    if (!api_key || !number) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: api_key, number' 
      });
    }
    
    console.log(`Verificando status para dispositivo: ${number}`);
    
    const response = await axios.post(`${WHATSAPP_BASE_URL}/info-devices`, {
      api_key: api_key,
      number: number
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Resposta da API WhatsApp:', response.data);
    
    if (response.data && response.data.status === true && response.data.info && response.data.info.length > 0) {
      const deviceInfo = response.data.info[0];
      const isConnected = deviceInfo.status === 'Connected';
      const statusDevice = deviceInfo.status; // 'Connected' ou 'Disconnect'
      
      console.log(`✅ Status do dispositivo verificado: ${deviceInfo.status}`);
      console.log(`📱 Dispositivo: ${deviceInfo.body}`);
      console.log(`🔗 Conectado: ${isConnected}`);
      
      // Salvar status no Firestore se o UID for fornecido
      if (req.body.uid) {
        try {
          const contasRef = db.collection('contas').doc(req.body.uid);
          await contasRef.update({
            status_device: statusDevice,
            last_status_check: new Date().toISOString()
          });
          console.log(`✅ Status salvo no Firestore para UID: ${req.body.uid}`);
        } catch (firebaseError) {
          console.error('❌ Erro ao salvar no Firestore:', firebaseError);
        }
      }
      
      return res.json({
        success: true,
        connected: isConnected,
        status: deviceInfo.status,
        status_device: statusDevice,
        deviceInfo: deviceInfo,
        message: isConnected ? 'Dispositivo conectado' : 'Dispositivo desconectado'
      });
    } else {
      console.log('❌ Nenhum dispositivo encontrado ou resposta inválida');
      
      // Salvar status como 'Not Found' no Firestore se o UID for fornecido
      if (req.body.uid) {
        try {
          const contasRef = db.collection('contas').doc(req.body.uid);
          await contasRef.update({
            status_device: 'Not Found',
            last_status_check: new Date().toISOString()
          });
          console.log(`✅ Status 'Not Found' salvo no Firestore para UID: ${req.body.uid}`);
        } catch (firebaseError) {
          console.error('❌ Erro ao salvar no Firestore:', firebaseError);
        }
      }
      
      return res.json({
        success: true,
        connected: false,
        status: 'Not Found',
        status_device: 'Not Found',
        deviceInfo: null,
        message: 'Dispositivo não encontrado'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.response?.data || error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Erro da API WhatsApp',
        details: error.response.data?.message || error.response.data?.error || 'Erro desconhecido',
        status: error.response.status
      });
    }
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint para desconectar dispositivo
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    console.log('=== DESCONECTANDO DISPOSITIVO WHATSAPP ===');
    console.log('Dados recebidos:', req.body);
    
    const { api_key, sender } = req.body;
    
    if (!api_key || !sender) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: api_key, sender' 
      });
    }
    
    console.log(`Desconectando dispositivo: ${sender}`);
    
    const response = await axios.post(`${WHATSAPP_BASE_URL}/logout-device`, {
      api_key: api_key,
      sender: sender
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Resposta da API WhatsApp:', response.data);
    
    if (response.data) {
      console.log('✅ Dispositivo desconectado com sucesso');
      return res.json({
        success: true,
        message: 'Dispositivo desconectado com sucesso',
        data: response.data
      });
    } else {
      console.log('❌ Resposta da API vazia');
      return res.status(500).json({ 
        error: 'Erro ao desconectar dispositivo',
        details: 'Resposta da API vazia'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao desconectar dispositivo:', error.response?.data || error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Erro da API WhatsApp',
        details: error.response.data?.message || error.response.data?.error || 'Erro desconhecido',
        status: error.response.status
      });
    }
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Endpoint para buscar status do dispositivo no Firestore
app.post('/api/whatsapp/get-status', async (req, res) => {
  try {
    console.log('=== BUSCANDO STATUS WHATSAPP NO FIRESTORE ===');
    console.log('Dados recebidos:', req.body);
    
    const { uid } = req.body;
    
    if (!uid) {
      return res.status(400).json({ 
        error: 'UID é obrigatório' 
      });
    }
    
    console.log(`Buscando status para UID: ${uid}`);
    
    // Tentar buscar com retry em caso de erro do Firestore
    let doc = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && !doc) {
      try {
    const contasRef = db.collection('contas').doc(uid);
        doc = await contasRef.get();
        break; // Sucesso, sair do loop
      } catch (firestoreError) {
        retryCount++;
        console.log(`Tentativa ${retryCount} de buscar no Firestore falhou:`, firestoreError.message);
        
        if (retryCount >= maxRetries) {
          // Se todas as tentativas falharam, retornar erro mas não quebrar
          console.error('❌ Todas as tentativas de buscar no Firestore falharam');
          return res.status(200).json({
            success: false,
            error: 'Erro ao conectar com o banco de dados',
            status_device: 'Unknown',
            message: 'Não foi possível verificar o status. Tente novamente mais tarde.'
          });
        }
        
        // Esperar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    if (!doc || !doc.exists) {
      console.log('❌ Conta não encontrada no Firestore');
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada',
        status_device: 'Not Found'
      });
    }
    
    const data = doc.data();
    const statusDevice = data.status_device || 'Not Found';
    const isConnected = statusDevice === 'Connected';
    
    console.log(`✅ Status encontrado no Firestore: ${statusDevice}`);
    console.log(`🔗 Conectado: ${isConnected}`);
    
    return res.json({
      success: true,
      connected: isConnected,
      status_device: statusDevice,
      last_status_check: data.last_status_check || null,
      message: isConnected ? 'Dispositivo conectado' : 'Dispositivo desconectado'
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar status no Firestore:', error);
    
    // Retornar 200 para não quebrar o frontend, mas indicar erro
    return res.status(200).json({
      success: false,
      error: 'Erro ao buscar status',
      status_device: 'Unknown',
      details: error.message
    });
  }
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
}); 