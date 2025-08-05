# 🔍 Debug da Data de Término

## 🎯 Problema Identificado

### **Issue:**
- ❌ **Data não exibida corretamente** na interface
- ❌ **Campo `data_termino_plano_premium`** salvo em formato ISO 8601
- ❌ **Interface não mostra** a data real do Firebase

## 🔧 Logs de Debug Implementados

### **1. Debug do Carregamento dos Dados:**
```javascript
console.log('=== DEBUG DATA DE TÉRMINO ===');
console.log('Data bruta do Firebase:', contaData.data_termino_plano_premium);
console.log('Tipo da data:', typeof contaData.data_termino_plano_premium);
console.log('Data é válida?', !isNaN(new Date(contaData.data_termino_plano_premium).getTime()));

try {
  const dataObj = new Date(contaData.data_termino_plano_premium);
  console.log('Data convertida:', dataObj);
  console.log('Data formatada:', dataObj.toLocaleDateString('pt-BR'));
  console.log('Data ISO:', dataObj.toISOString());
} catch (error) {
  console.error('Erro ao processar data:', error);
}

console.log('Estado dataTerminoPlano será:', contaData.data_termino_plano_premium || null);
console.log('=== FIM DEBUG ===');
```

### **2. Debug da Função getDiasRestantes:**
```javascript
console.log('=== getDiasRestantes CHAMADO ===');
console.log('Parâmetros:', {
  tipoPlano,
  dataTerminoPlano,
  diasRestantesTeste,
  diasPlanoPagoRestante
});

if (dataTerminoPlano) {
  console.log('Usando dataTerminoPlano:', dataTerminoPlano);
  const dataFormatada = formatarDataTermino(dataTerminoPlano);
  console.log('Data formatada:', dataFormatada);
  const resultado = `Termina em: ${dataFormatada}`;
  console.log('Retornando:', resultado);
  return resultado;
}
```

### **3. Debug da Função formatarDataTermino:**
```javascript
console.log('=== formatarDataTermino CHAMADO ===');
console.log('Data recebida:', dataISO);
console.log('Tipo da data:', typeof dataISO);

if (dataISO.includes('/')) {
  console.log('Detectado formato brasileiro');
  const partes = dataISO.split('/');
  console.log('Partes da data:', partes);
} else {
  console.log('Tentando como ISO string');
}

console.log('Data objeto criado:', data);
console.log('Data é válida?', !isNaN(data.getTime()));
console.log('Resultado formatado:', resultado);
```

### **4. Debug da Exibição da Interface:**
```javascript
console.log('=== EXIBIÇÃO DA INTERFACE ===');
console.log('tipoPlano:', tipoPlano);
console.log('dataTerminoPlano:', dataTerminoPlano);
console.log('getDiasRestantes():', getDiasRestantes());
console.log('Resultado final:', resultado);
console.log('=== FIM EXIBIÇÃO ===');
```

## 📊 O que Verificar nos Logs

### **1. Carregamento dos Dados:**
- ✅ **Data bruta:** Qual formato está vindo do Firebase?
- ✅ **Tipo da data:** É string, number, ou outro?
- ✅ **Validade:** A data é válida?
- ✅ **Conversão:** A conversão para Date funciona?

### **2. Estado do Componente:**
- ✅ **dataTerminoPlano:** Está sendo setado corretamente?
- ✅ **tipoPlano:** Qual plano está ativo?
- ✅ **Outros estados:** diasRestantesTeste, diasPlanoPagoRestante

### **3. Lógica de Exibição:**
- ✅ **Condições:** Qual condição está sendo atendida?
- ✅ **Formatação:** A função formatarDataTermino funciona?
- ✅ **Resultado final:** O que está sendo exibido?

## 🎯 Possíveis Problemas

### **1. Dados não Carregados:**
```javascript
// Verificar se dataTerminoPlano está sendo setado
console.log('dataTerminoPlano após carregamento:', dataTerminoPlano);
```

### **2. Formato Incorreto:**
```javascript
// Verificar formato da data no Firebase
console.log('Formato da data no Firebase:', contaData.data_termino_plano_premium);
```

### **3. Lógica de Exibição:**
```javascript
// Verificar qual condição está sendo atendida
console.log('Condições:', {
  isVitalicio: tipoPlano === 'vitalicio',
  hasDataTermino: !!dataTerminoPlano,
  hasDiasRestantes: getDiasRestantes() !== null
});
```

## 🚀 Como Usar os Logs

### **1. Abrir Console do Navegador:**
- F12 → Console
- Recarregar a página
- Verificar logs detalhados

### **2. Verificar Sequência:**
1. **Carregamento:** Dados vêm do Firebase?
2. **Estado:** dataTerminoPlano é setado?
3. **Lógica:** getDiasRestantes retorna correto?
4. **Formatação:** formatarDataTermino funciona?
5. **Exibição:** Interface mostra correto?

### **3. Identificar Problema:**
- Se dados não carregam → Problema no Firebase
- Se estado não seta → Problema no useEffect
- Se lógica falha → Problema na função getDiasRestantes
- Se formatação falha → Problema na função formatarDataTermino
- Se exibição falha → Problema na renderização

Os logs vão mostrar **exatamente onde está o problema**! 🔍✨ 