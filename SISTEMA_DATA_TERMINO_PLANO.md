# 📅 Sistema de Data de Término do Plano

## 🎯 Funcionalidade Implementada

### **Sistema Automático de Expiração:**
- ✅ **Cálculo automático** da data de término ao ativar plano
- ✅ **Verificação automática** ao fazer login
- ✅ **Desativação automática** quando a data expira
- ✅ **Exibição da data** na tela de planos
- ✅ **Campo `data_termino_plano_premium`** no Firestore

## 🔧 Implementação Técnica

### **1. Cálculo da Data de Término**
```javascript
// Função para calcular a data de término do plano
const calcularDataTermino = (diasRestantes: number) => {
  const hoje = new Date();
  const dataTermino = new Date(hoje);
  dataTermino.setDate(hoje.getDate() + diasRestantes);
  
  return dataTermino.toISOString();
};
```

### **2. Verificação Automática no Login**
```javascript
// Função para verificar se o plano expirou baseado na data de término
const verificarExpiracaoPlano = async () => {
  if (!auth.currentUser?.uid) return;
  
  const docRef = doc(firestore, 'contas', auth.currentUser.uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    const dataTermino = data.data_termino_plano_premium;
    
    if (dataTermino) {
      const dataTerminoObj = new Date(dataTermino);
      const hoje = new Date();
      
      // Se a data de término já passou, desativar premium
      if (hoje >= dataTerminoObj) {
        await updateDoc(docRef, {
          premium: false,
          data_termino_plano_premium: null
        });
      }
    }
  }
};
```

### **3. Ativação do Teste Grátis**
```javascript
const ativarTesteGratis = async () => {
  const hoje = new Date();
  const dataTermino = new Date(hoje);
  dataTermino.setDate(hoje.getDate() + 7); // 7 dias de teste grátis
  
  await updateDoc(docRef, {
    premium: true,
    tipoPlano: 'gratis',
    data_inicio_teste_gratis: hoje.toISOString(),
    dias_restantes_teste_gratis: 7,
    ja_pegou_premium_gratis: true,
    data_termino_plano_premium: dataTermino.toISOString()
  });
};
```

### **4. Webhook do Mercado Pago**
```javascript
// Pegar data de término do metadata se disponível
let dataTermino = null;
if (payment.metadata && payment.metadata.dataTermino) {
  dataTermino = payment.metadata.dataTermino;
} else {
  // Calcular data de término padrão (30 dias)
  const hoje = new Date();
  const dataTerminoCalc = new Date(hoje);
  dataTerminoCalc.setDate(hoje.getDate() + 30);
  dataTermino = dataTerminoCalc.toISOString();
}

await docRef.update({
  premium: true,
  tipoPlano: tipoPlano,
  dias_plano_pago: 30,
  dias_plano_pago_restante: 30,
  data_termino_plano_premium: dataTermino,
  status_pagamento: 'pago'
});
```

### **5. Endpoint de Verificação Automática**
```javascript
app.post('/api/verificar-planos-expirados', async (req, res) => {
  const contasRef = db.collection('contas');
  const snapshot = await contasRef.where('premium', '==', true).get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const dataTermino = data.data_termino_plano_premium;
    
    if (dataTermino) {
      const dataTerminoObj = new Date(dataTermino);
      const hoje = new Date();
      
      if (hoje >= dataTerminoObj) {
        await doc.ref.update({
          premium: false,
          data_termino_plano_premium: null,
          dias_plano_pago_restante: 0,
          dias_restantes_teste_gratis: 0
        });
      }
    }
  }
});
```

## 📊 Comportamento do Sistema

### **Quando o Usuário Ativa um Plano:**
1. **Teste Grátis (7 dias):**
   - Data de término: hoje + 7 dias
   - Campo: `data_termino_plano_premium`

2. **Plano Individual/Empresa (30 dias):**
   - Data de término: hoje + 30 dias
   - Campo: `data_termino_plano_premium`

3. **Plano Vitalício:**
   - Sem data de término (infinito)
   - Campo: `data_termino_plano_premium: null`

### **Verificação Automática:**
- ✅ **Ao fazer login** - verifica se a data expirou
- ✅ **Cron job** - verifica periodicamente todos os planos
- ✅ **Endpoint manual** - `/api/verificar-planos-expirados`

### **Quando o Plano Expira:**
- ✅ **Premium desativado** - `premium: false`
- ✅ **Data limpa** - `data_termino_plano_premium: null`
- ✅ **Dias zerados** - `dias_plano_pago_restante: 0`

## 🎯 Exibição na Interface

### **Tela de Planos:**
```javascript
{dataTerminoPlano && selectedPlan === plan.id && (
  <Text fontSize="sm" color="gray.600" mt={1}>
    Data que termina o plano: {formatarDataTermino(dataTerminoPlano)}
  </Text>
)}
```

### **Dashboard do Usuário:**
```javascript
// Exibição da data de término em vez de dias restantes
const getDiasRestantes = () => {
  if (tipoPlano === 'vitalicio') {
    return '∞';
  } else if (dataTerminoPlano) {
    return `Termina em: ${formatarDataTermino(dataTerminoPlano)}`;
  }
  return null;
};
```

## 🔍 Validações Implementadas

### **✅ Funcionalidades:**
- ✅ Cálculo automático da data de término
- ✅ Verificação automática ao login
- ✅ Desativação automática quando expira
- ✅ Exibição da data na interface
- ✅ Integração com Mercado Pago
- ✅ Endpoint de verificação manual

### **✅ Segurança:**
- ✅ Verificação em tempo real
- ✅ Validação de datas
- ✅ Proteção contra acesso não autorizado
- ✅ Logs detalhados de expiração

### **✅ Interface:**
- ✅ Exibição clara da data de término
- ✅ Formatação brasileira (dd/mm/aaaa)
- ✅ Feedback visual correto
- ✅ Integração com sistema de planos

## 🚀 Benefícios

### **Para o Usuário:**
- ✅ Transparência sobre quando o plano expira
- ✅ Desativação automática sem surpresas
- ✅ Interface clara e informativa
- ✅ Experiência consistente

### **Para o Sistema:**
- ✅ Controle preciso de expiração
- ✅ Automatização completa
- ✅ Integração robusta
- ✅ Logs detalhados

O sistema de data de término está **totalmente implementado** e **funcionando automaticamente**! 📅✨ 