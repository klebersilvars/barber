<?php
/**
 * Endpoint AJAX para gerar QR Code e retornar apenas a URL
 * Usando o sistema melhorado
 */

require_once 'auth.php';
require_once 'database.php';
require_once 'improved_qr_generator.php';

// Verificar se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

// Verificar se o ID do dispositivo foi fornecido
if (!isset($_GET['device_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID do dispositivo não fornecido']);
    exit;
}

$deviceId = $_GET['device_id'];
$userId = $_SESSION['user_id'];

// Verificar se o dispositivo pertence ao usuário
$stmt = $pdo->prepare("SELECT * FROM user_senders WHERE id = ? AND user_id = ?");
$stmt->execute([$deviceId, $userId]);
$device = $stmt->fetch();

if (!$device) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Dispositivo não encontrado']);
    exit;
}

// Obter API key do usuário
$stmt = $pdo->prepare("SELECT api_key FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();
$apiKey = $user['api_key'];

// Verificar se deve forçar nova geração
$forceNew = isset($_GET['force_new']) && $_GET['force_new'] == '1';

// Usar o sistema melhorado de QR Code
$qrGenerator = new ImprovedWhatsAppQRGenerator($apiKey, $device['sender_token']);
$result = $qrGenerator->generateQR($forceNew);

if ($result['status'] === 'qrcode' && $result['qrcode']) {
    // Salvar QR Code no banco de dados
    $stmt = $pdo->prepare("UPDATE user_senders SET qr_code = ?, status = 'pending', last_checked = NOW() WHERE id = ?");
    if ($stmt->execute([$result['qrcode'], $deviceId])) {
        $message = $forceNew ? 'Novo QR Code gerado com sucesso!' : 'QR Code atualizado com sucesso!';
        echo json_encode([
            'success' => true,
            'qr_code' => $result['qrcode'],
            'message' => $message,
            'force_new' => $forceNew,
            'api_status' => $result['status'],
            'api_message' => $result['message']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao salvar QR Code no banco de dados'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => $result['message'] ?: 'Erro desconhecido ao gerar QR Code',
        'api_status' => $result['status'],
        'api_response' => $result
    ]);
}
?>
