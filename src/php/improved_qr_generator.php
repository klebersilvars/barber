<?php
/**
 * Sistema Melhorado de Geração de QR Code para WhatsApp
 * Baseado no qr_generator.php e adaptado para API externa
 */

class ImprovedWhatsAppQRGenerator {
    private $apiUrl;
    private $apiKey;
    private $deviceToken;
    private $isConnected = false;
    private $lastQRCode = null;
    
    public function __construct($apiKey, $deviceToken = null) {
        $this->apiUrl = 'https://belkit.pro';
        $this->apiKey = $apiKey;
        $this->deviceToken = $deviceToken;
    }
    
    /**
     * Gera QR Code via API externa
     */
    public function generateQR($forceNew = false) {
        if (!$this->deviceToken) {
            return [
                'status' => 'error',
                'message' => 'Token do dispositivo não fornecido',
                'qrcode' => null
            ];
        }
        
        $params = [
            'device' => $this->deviceToken,
            'api_key' => $this->apiKey,
            'force' => $forceNew ? '1' : '0'
        ];
        
        $url = $this->apiUrl . '/generate-qr?' . http_build_query($params);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($response === false) {
            return [
                'status' => 'error',
                'message' => 'Erro de conexão com a API: ' . ($curlError ?: 'Sem detalhes'),
                'qrcode' => null
            ];
        }
        
        $data = json_decode($response, true);
        
        if ($httpCode !== 200) {
            $apiMessage = is_array($data) ? ($data['msg'] ?? $data['message'] ?? null) : null;
            return [
                'status' => 'error',
                'message' => "Erro da API (HTTP $httpCode): " . ($apiMessage ?: 'Resposta inválida'),
                'qrcode' => null
            ];
        }
        
        if (!is_array($data)) {
            return [
                'status' => 'error',
                'message' => 'Resposta inválida da API',
                'qrcode' => null
            ];
        }
        
        $qrCode = $data['qrcode'] ?? $data['qr'] ?? $data['qrCode'] ?? null;
        
        if ($qrCode) {
            $this->lastQRCode = $qrCode;
            return [
                'status' => 'qrcode',
                'message' => 'QR Code gerado com sucesso',
                'qrcode' => $qrCode,
                'device' => $this->deviceToken
            ];
        } else {
            return [
                'status' => 'error',
                'message' => 'QR Code não foi gerado pela API',
                'qrcode' => null
            ];
        }
    }
    
    /**
     * Verifica status da conexão
     */
    public function checkStatus() {
        if (!$this->deviceToken) {
            return [
                'status' => 'error',
                'message' => 'Token do dispositivo não fornecido',
                'connected' => false
            ];
        }
        
        // Verificar no banco externo
        try {
            require_once 'external_db.php';
            $externalStatus = checkExternalDeviceStatus($this->deviceToken);
            
            if ($externalStatus['connected']) {
                $this->isConnected = true;
                return [
                    'status' => 'connected',
                    'message' => 'Dispositivo conectado com sucesso!',
                    'connected' => true,
                    'external_status' => $externalStatus
                ];
            } else {
                $this->isConnected = false;
                return [
                    'status' => 'pending',
                    'message' => 'Aguardando conexão...',
                    'connected' => false,
                    'external_status' => $externalStatus
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Erro ao verificar status: ' . $e->getMessage(),
                'connected' => false
            ];
        }
    }
    
    /**
     * Monitora conexão em tempo real
     */
    public function monitorConnection($callback = null, $maxAttempts = 60) {
        $attempt = 0;
        
        while ($attempt < $maxAttempts) {
            $status = $this->checkStatus();
            
            if ($callback && is_callable($callback)) {
                $callback($status, $attempt);
            }
            
            if ($status['status'] === 'connected') {
                return $status;
            }
            
            if ($status['status'] === 'error') {
                return $status;
            }
            
            sleep(5); // Aguarda 5 segundos
            $attempt++;
        }
        
        return [
            'status' => 'timeout',
            'message' => 'Timeout na conexão após ' . ($maxAttempts * 5) . ' segundos',
            'connected' => false
        ];
    }
    
    /**
     * Desconecta dispositivo
     */
    public function disconnect() {
        if (!$this->deviceToken) {
            return [
                'status' => 'error',
                'message' => 'Token do dispositivo não fornecido'
            ];
        }
        
        try {
            require_once 'external_db.php';
            $result = deleteExternalDevice($this->deviceToken);
            
            $this->isConnected = false;
            $this->lastQRCode = null;
            
            return [
                'status' => 'success',
                'message' => 'Dispositivo desconectado com sucesso',
                'deletion_result' => $result
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Erro ao desconectar: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Gera novo QR Code
     */
    public function refreshQR() {
        return $this->generateQR(true);
    }
    
    /**
     * Verifica se está conectado
     */
    public function isConnected() {
        return $this->isConnected;
    }
    
    /**
     * Obtém o último QR Code gerado
     */
    public function getLastQRCode() {
        return $this->lastQRCode;
    }
    
    /**
     * Define o token do dispositivo
     */
    public function setDeviceToken($token) {
        $this->deviceToken = $token;
    }
    
    /**
     * Obtém informações do dispositivo
     */
    public function getDeviceInfo() {
        return [
            'device_token' => $this->deviceToken,
            'api_key' => $this->apiKey ? substr($this->apiKey, 0, 8) . '...' : null,
            'is_connected' => $this->isConnected,
            'last_qr_code' => $this->lastQRCode ? 'Disponível' : 'Não gerado'
        ];
    }
}

/**
 * Interface Web para o gerador de QR Code
 */
class QRWebInterface {
    private $qrGenerator;
    private $userId;
    
    public function __construct($userId, $apiKey, $deviceToken = null) {
        $this->userId = $userId;
        $this->qrGenerator = new ImprovedWhatsAppQRGenerator($apiKey, $deviceToken);
    }
    
    /**
     * Processa requisições AJAX
     */
    public function handleRequest() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        header('Content-Type: application/json');
        
        switch ($action) {
            case 'generate_qr':
                $deviceToken = $input['device_token'] ?? null;
                if ($deviceToken) {
                    $this->qrGenerator->setDeviceToken($deviceToken);
                }
                $result = $this->qrGenerator->generateQR($input['force_new'] ?? false);
                echo json_encode($result);
                break;
                
            case 'check_status':
                $deviceToken = $input['device_token'] ?? null;
                if ($deviceToken) {
                    $this->qrGenerator->setDeviceToken($deviceToken);
                }
                $result = $this->qrGenerator->checkStatus();
                echo json_encode($result);
                break;
                
            case 'disconnect':
                $deviceToken = $input['device_token'] ?? null;
                if ($deviceToken) {
                    $this->qrGenerator->setDeviceToken($deviceToken);
                }
                $result = $this->qrGenerator->disconnect();
                echo json_encode($result);
                break;
                
            case 'refresh_qr':
                $deviceToken = $input['device_token'] ?? null;
                if ($deviceToken) {
                    $this->qrGenerator->setDeviceToken($deviceToken);
                }
                $result = $this->qrGenerator->refreshQR();
                echo json_encode($result);
                break;
                
            case 'device_info':
                $deviceToken = $input['device_token'] ?? null;
                if ($deviceToken) {
                    $this->qrGenerator->setDeviceToken($deviceToken);
                }
                $result = $this->qrGenerator->getDeviceInfo();
                echo json_encode($result);
                break;
                
            default:
                echo json_encode(['status' => 'error', 'message' => 'Ação inválida']);
        }
    }
    
    /**
     * Renderiza página de teste
     */
    public function renderTestPage() {
        ?>
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Teste QR Code Generator</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .qr-container { margin: 20px 0; padding: 20px; border: 2px dashed #ddd; border-radius: 10px; text-align: center; }
                .qr-image { max-width: 300px; height: auto; }
                .status { padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; }
                .status.connected { background-color: #d4edda; color: #155724; }
                .status.qrcode { background-color: #fff3cd; color: #856404; }
                .status.error { background-color: #f8d7da; color: #721c24; }
                .status.pending { background-color: #d1ecf1; color: #0c5460; }
                .btn { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
                .btn:hover { background-color: #0056b3; }
                .btn:disabled { background-color: #6c757d; cursor: not-allowed; }
                .hidden { display: none; }
                .form-group { margin: 10px 0; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
                .form-group input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                .logs { margin-top: 20px; background: #f8f9fa; padding: 15px; border-radius: 5px; max-height: 300px; overflow-y: auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔗 Teste QR Code Generator</h1>
                
                <div class="form-group">
                    <label for="device-token">Token do Dispositivo:</label>
                    <input type="text" id="device-token" placeholder="Digite o token do dispositivo">
                </div>
                
                <div id="status" class="status pending">Aguardando token...</div>
                
                <div id="qr-container" class="qr-container hidden">
                    <h3>QR Code</h3>
                    <img id="qr-image" class="qr-image" alt="QR Code">
                    <p id="qr-message">Aguarde...</p>
                </div>
                
                <div id="controls">
                    <button id="generate-btn" class="btn" onclick="generateQR()">Gerar QR Code</button>
                    <button id="check-btn" class="btn" onclick="checkStatus()">Verificar Status</button>
                    <button id="refresh-btn" class="btn" onclick="refreshQR()">Atualizar QR</button>
                    <button id="disconnect-btn" class="btn" onclick="disconnect()">Desconectar</button>
                </div>
                
                <div class="logs">
                    <h4>Logs:</h4>
                    <div id="log-content"></div>
                </div>
            </div>

            <script>
                let currentToken = null;
                let monitoring = false;
                
                function log(message) {
                    const logContent = document.getElementById('log-content');
                    const timestamp = new Date().toLocaleTimeString();
                    logContent.innerHTML += `[${timestamp}] ${message}<br>`;
                    logContent.scrollTop = logContent.scrollHeight;
                }
                
                function updateStatus(status, message, qrcode = null) {
                    const statusEl = document.getElementById('status');
                    const qrContainer = document.getElementById('qr-container');
                    const qrImage = document.getElementById('qr-image');
                    const qrMessage = document.getElementById('qr-message');
                    
                    statusEl.className = `status ${status}`;
                    statusEl.textContent = message;
                    
                    if (qrcode) {
                        qrContainer.classList.remove('hidden');
                        qrImage.src = qrcode;
                        qrMessage.textContent = 'Escaneie este QR Code com seu WhatsApp';
                    } else {
                        qrContainer.classList.add('hidden');
                    }
                }
                
                async function makeRequest(action, data = {}) {
                    const response = await fetch('', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action, ...data })
                    });
                    return response.json();
                }
                
                async function generateQR() {
                    const token = document.getElementById('device-token').value.trim();
                    if (!token) {
                        alert('Digite o token do dispositivo');
                        return;
                    }
                    
                    currentToken = token;
                    log('Gerando QR Code...');
                    updateStatus('pending', 'Gerando QR Code...');
                    
                    try {
                        const data = await makeRequest('generate_qr', { device_token: token, force_new: true });
                        
                        if (data.qrcode) {
                            updateStatus('qrcode', data.message, data.qrcode);
                            log('QR Code gerado com sucesso');
                            startMonitoring();
                        } else {
                            updateStatus('error', data.message);
                            log(`Erro: ${data.message}`);
                        }
                    } catch (error) {
                        log(`Erro: ${error.message}`);
                        updateStatus('error', 'Erro ao gerar QR Code');
                    }
                }
                
                async function checkStatus() {
                    if (!currentToken) {
                        alert('Gere um QR Code primeiro');
                        return;
                    }
                    
                    log('Verificando status...');
                    try {
                        const data = await makeRequest('check_status', { device_token: currentToken });
                        updateStatus(data.status, data.message, data.qrcode);
                        log(`Status: ${data.message}`);
                    } catch (error) {
                        log(`Erro: ${error.message}`);
                    }
                }
                
                async function refreshQR() {
                    if (!currentToken) {
                        alert('Gere um QR Code primeiro');
                        return;
                    }
                    
                    log('Atualizando QR Code...');
                    try {
                        const data = await makeRequest('refresh_qr', { device_token: currentToken });
                        
                        if (data.qrcode) {
                            updateStatus('qrcode', data.message, data.qrcode);
                            log('QR Code atualizado');
                        } else {
                            updateStatus('error', data.message);
                            log(`Erro: ${data.message}`);
                        }
                    } catch (error) {
                        log(`Erro: ${error.message}`);
                    }
                }
                
                async function disconnect() {
                    if (!currentToken) {
                        alert('Nenhum dispositivo conectado');
                        return;
                    }
                    
                    log('Desconectando...');
                    try {
                        const data = await makeRequest('disconnect', { device_token: currentToken });
                        updateStatus('disconnected', data.message);
                        log(`Desconectado: ${data.message}`);
                        currentToken = null;
                        monitoring = false;
                    } catch (error) {
                        log(`Erro: ${error.message}`);
                    }
                }
                
                function startMonitoring() {
                    if (monitoring) return;
                    monitoring = true;
                    
                    const monitor = setInterval(async () => {
                        if (!monitoring || !currentToken) {
                            clearInterval(monitor);
                            return;
                        }
                        
                        try {
                            const data = await makeRequest('check_status', { device_token: currentToken });
                            
                            if (data.status === 'connected') {
                                updateStatus('connected', 'Conectado com sucesso!');
                                log('WhatsApp conectado!');
                                monitoring = false;
                                clearInterval(monitor);
                            } else if (data.status === 'error') {
                                updateStatus('error', data.message);
                                log(`Erro: ${data.message}`);
                                monitoring = false;
                                clearInterval(monitor);
                            } else {
                                updateStatus(data.status, data.message, data.qrcode);
                            }
                        } catch (error) {
                            log(`Erro no monitoramento: ${error.message}`);
                        }
                    }, 5000);
                }
                
                log('Sistema inicializado');
            </script>
        </body>
        </html>
        <?php
    }
}
?>
