<?php
require_once 'includes/auth.php';
requireLogin();

global $pdo;
$userId = $_SESSION['user_id'];
$success = '';
$error = '';

// Obter créditos do usuário
$userCredits = getUserCredits($userId);

// Verificar mensagens de status via GET
if (isset($_GET['status']) && isset($_GET['message'])) {
    if ($_GET['status'] === 'success') {
        $success = urldecode($_GET['message']);
    } else {
        $error = urldecode($_GET['message']);
    }
}

// Obter dados do usuário
$stmt = $pdo->prepare("SELECT api_key FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();
$apiKey = $user['api_key'];

// Obter senders do usuário
$stmt = $pdo->prepare("SELECT * FROM user_senders WHERE user_id = ?");
$stmt->execute([$userId]);
$senders = $stmt->fetchAll();

// Processar geração de QR Code
if (isset($_GET['generate_qr'])) {
    $senderId = $_GET['generate_qr'];
    
    // Verificar se o sender pertence ao usuário
    $stmt = $pdo->prepare("SELECT * FROM user_senders WHERE id = ? AND user_id = ?");
    $stmt->execute([$senderId, $userId]);
    $sender = $stmt->fetch();
    
    if ($sender) {
        // Gerar QR Code via API
        $postData = [
            // Envia ambos para compatibilidade com diferentes versões da API
            'device' => $sender['sender_token'],
            'sender' => $sender['sender_token'],
            'api_key' => $apiKey,
            'force' => true
        ];
        
        $url = 'https://belkit.pro/generate-qr?' . http_build_query($postData);
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
        
        // Debug: Verificar a resposta da API
        error_log("QR Code API Response: " . $response);
        error_log("HTTP Code: " . $httpCode);
        if ($curlError) {
            error_log("cURL Error: " . $curlError);
        }
        
        if ($response === false) {
            $error = "Erro de conexão com a API: " . ($curlError ?: 'Sem detalhes');
        } else {
            $apiResponse = json_decode($response, true);
            // Aceita diferentes chaves possíveis para o QR Code
            $qrCode = null;
            if (is_array($apiResponse)) {
                $qrCode = $apiResponse['qrcode'] ?? $apiResponse['qr'] ?? $apiResponse['qrCode'] ?? null;
            }
            
            if ($httpCode == 200 && $qrCode) {
                // Salvar QR Code no banco de dados
                $stmt = $pdo->prepare("UPDATE user_senders SET qr_code = ?, status = 'pending', last_checked = NOW() WHERE id = ?");
                if ($stmt->execute([$qrCode, $senderId])) {
                    header("Location: settings.php?status=success&message=" . urlencode('QR Code gerado com sucesso! Escaneie-o para conectar o dispositivo.'));
                    exit();
                } else {
                    header("Location: settings.php?status=error&message=" . urlencode('Erro ao salvar QR Code no banco de dados.'));
                    exit();
                }
            } else {
                $apiMessage = is_array($apiResponse) ? ($apiResponse['msg'] ?? $apiResponse['message'] ?? null) : null;
                header("Location: settings.php?status=error&message=" . urlencode("Erro ao gerar QR Code (HTTP $httpCode): " . ($apiMessage ?: (is_string($response) ? $response : 'Resposta inválida da API'))));
                exit();
            }
        }
    } else {
        header("Location: settings.php?status=error&message=" . urlencode('Dispositivo não encontrado!'));
        exit();
    }
}

// Processar desconexão de dispositivo
if (isset($_GET['disconnect_device'])) {
    $senderId = $_GET['disconnect_device'];
    
    // Verificar se o sender pertence ao usuário
    $stmt = $pdo->prepare("SELECT * FROM user_senders WHERE id = ? AND user_id = ?");
    $stmt->execute([$senderId, $userId]);
    $sender = $stmt->fetch();
    
    if ($sender) {
        // Desconectar dispositivo via API
        $postData = [
            'sender' => $sender['sender_token'],
            'api_key' => $apiKey
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://belkit.pro/logout-device');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($response === false) {
            header("Location: settings.php?status=error&message=" . urlencode("Erro de conexão: " . $curlError));
            exit();
        } else {
            $apiResponse = json_decode($response, true);
            
            // Atualizar status no banco de dados independentemente da resposta da API
            $stmt = $pdo->prepare("UPDATE user_senders SET status = 'disconnected', qr_code = NULL, device_info = NULL, last_checked = NOW() WHERE id = ?");
            if ($stmt->execute([$senderId])) {
                if ($httpCode == 200) {
                    header("Location: settings.php?status=success&message=" . urlencode('Dispositivo desconectado com sucesso!'));
                    exit();
                } else {
                    header("Location: settings.php?status=success&message=" . urlencode("Dispositivo marcado como desconectado. (API: " . ($apiResponse['msg'] ?? 'Erro desconhecido') . ")"));
                    exit();
                }
            } else {
                header("Location: settings.php?status=error&message=" . urlencode('Erro ao atualizar status no banco de dados!'));
                exit();
            }
        }
    } else {
        header("Location: settings.php?status=error&message=" . urlencode('Dispositivo não encontrado!'));
        exit();
    }
}

// Processar verificação de status do dispositivo
if (isset($_GET['check_status'])) {
    $senderId = $_GET['check_status'];
    
    // Verificar se o sender pertence ao usuário
    $stmt = $pdo->prepare("SELECT * FROM user_senders WHERE id = ? AND user_id = ?");
    $stmt->execute([$senderId, $userId]);
    $sender = $stmt->fetch();
    
    if ($sender) {
        // Verificar status via API
        $postData = [
            // Envia ambos para compatibilidade com diferentes versões da API
            'device' => $sender['sender_token'],
            'sender' => $sender['sender_token'],
            'api_key' => $apiKey
        ];
        
        $url = 'https://belkit.pro/generate-qr?' . http_build_query($postData);
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
            header("Location: settings.php?status=error&message=" . urlencode("Erro de conexão: " . ($curlError ?: 'Sem detalhes')));
            exit();
        } else {
            $apiResponse = json_decode($response, true);
            $apiMsg = is_array($apiResponse) ? ($apiResponse['msg'] ?? $apiResponse['message'] ?? '') : '';
            
            // Tratar caso de "já conectado / connected" independentemente do HTTP code
            if ($apiMsg && (
                stripos($apiMsg, 'already connected') !== false ||
                stripos($apiMsg, 'connected') !== false ||
                stripos($apiMsg, 'já conectado') !== false ||
                stripos($apiMsg, 'ja conectado') !== false ||
                stripos($apiMsg, 'conectado') !== false
            )) {
                $stmt = $pdo->prepare("UPDATE user_senders SET status = 'connected', qr_code = NULL, last_checked = NOW() WHERE id = ?");
                $stmt->execute([$senderId]);
                header("Location: settings.php?status=success&message=" . urlencode('Dispositivo conectado com sucesso!'));
                exit();
            } else if ($httpCode == 200) {
                // Aceita diferentes chaves possíveis para o QR Code
                $qrCode = is_array($apiResponse) ? ($apiResponse['qrcode'] ?? $apiResponse['qr'] ?? $apiResponse['qrCode'] ?? null) : null;
                if ($qrCode) {
                    // Ainda pendente - atualizar QR Code
                    $stmt = $pdo->prepare("UPDATE user_senders SET qr_code = ?, status = 'pending', last_checked = NOW() WHERE id = ?");
                    $stmt->execute([$qrCode, $senderId]);
                    header("Location: settings.php?status=success&message=" . urlencode('Dispositivo ainda não conectado. Por favor, escaneie o QR Code.'));
                    exit();
                } else {
                    header("Location: settings.php?status=success&message=" . urlencode("Status verificado. " . ($apiMsg ?: 'Resposta desconhecida da API.')));
                    exit();
                }
            } else {
                $apiMessage = is_array($apiResponse) ? ($apiResponse['msg'] ?? $apiResponse['message'] ?? null) : null;
                header("Location: settings.php?status=error&message=" . urlencode("Erro ao verificar status (HTTP $httpCode): " . ($apiMessage ?: (is_string($response) ? $response : 'Resposta inválida da API'))));
                exit();
            }
        }
    } else {
        header("Location: settings.php?status=error&message=" . urlencode('Dispositivo não encontrado!'));
        exit();
    }
}

// Processar obtenção de informações do dispositivo
if (isset($_GET['get_info'])) {
    $senderId = $_GET['get_info'];
    
    // Verificar se o sender pertence ao usuário
    $stmt = $pdo->prepare("SELECT * FROM user_senders WHERE id = ? AND user_id = ?");
    $stmt->execute([$senderId, $userId]);
    $sender = $stmt->fetch();
    
    if ($sender) {
        // Obter informações do dispositivo via API
        $postData = [
            'number' => $sender['sender_token'],
            'api_key' => $apiKey
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://belkit.pro/info-devices');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($response === false) {
            header("Location: settings.php?status=error&message=" . urlencode("Erro de conexão: " . $curlError));
            exit();
        } else {
            $apiResponse = json_decode($response, true);
            
            if ($httpCode == 200) {
                // Salvar informações no banco de dados
                $deviceInfo = json_encode($apiResponse, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                $stmt = $pdo->prepare("UPDATE user_senders SET device_info = ?, last_checked = NOW() WHERE id = ?");
                if ($stmt->execute([$deviceInfo, $senderId])) {
                    header("Location: settings.php?status=success&message=" . urlencode('Informações do dispositivo obtidas com sucesso!'));
                    exit();
                } else {
                    header("Location: settings.php?status=error&message=" . urlencode('Erro ao salvar informações no banco de dados!'));
                    exit();
                }
            } else {
                header("Location: settings.php?status=error&message=" . urlencode("Erro ao obter informações: " . ($apiResponse['msg'] ?? 'Erro HTTP: ' . $httpCode)));
                exit();
            }
        }
    } else {
        header("Location: settings.php?status=error&message=" . urlencode('Dispositivo não encontrado!'));
        exit();
    }
}

// Processar alteração de senha
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['change_password'])) {
    $currentPassword = $_POST['current_password'];
    $newPassword = $_POST['new_password'];
    $confirmPassword = $_POST['confirm_password'];
    
    // Verificar senha atual
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (password_verify($currentPassword, $user['password'])) {
        if ($newPassword === $confirmPassword) {
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            if ($stmt->execute([$hashedPassword, $userId])) {
                // Enviar notificação de alteração de senha via Telegram
                try {
                    require_once 'includes/telegram.php';
                    $notifications = new TelegramNotifications();
                    $ip = getUserIP();
                    $notifications->notifyPasswordChange($_SESSION['username'], $ip, $_SESSION['is_admin'] ?? false);
                } catch (Exception $e) {
                    // Log do erro mas não interrompe a alteração
                    error_log("Erro ao enviar notificação de alteração de senha: " . $e->getMessage());
                }
                
                header("Location: settings.php?status=success&message=" . urlencode('Senha alterada com sucesso!'));
                exit();
            } else {
                header("Location: settings.php?status=error&message=" . urlencode('Erro ao alterar senha!'));
                exit();
            }
        } else {
            header("Location: settings.php?status=error&message=" . urlencode('As novas senhas não coincidem!'));
            exit();
        }
    } else {
        header("Location: settings.php?status=error&message=" . urlencode('Senha atual incorreta!'));
        exit();
    }
}

// Processar alteração de API key
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['change_api_key'])) {
    $newApiKey = trim($_POST['api_key']);
    
    $stmt = $pdo->prepare("UPDATE users SET api_key = ? WHERE id = ?");
    if ($stmt->execute([$newApiKey, $userId])) {
        $apiKey = $newApiKey;
        header("Location: settings.php?status=success&message=" . urlencode('API Key atualizada com sucesso!'));
        exit();
    } else {
        header("Location: settings.php?status=error&message=" . urlencode('Erro ao atualizar API Key!'));
        exit();
    }
}

// Processar adição de sender
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_sender'])) {
    $senderToken = trim($_POST['sender_token']);
    $deviceName = trim($_POST['device_name']);
    
    $stmt = $pdo->prepare("INSERT INTO user_senders (user_id, sender_token, device_name) VALUES (?, ?, ?)");
    if ($stmt->execute([$userId, $senderToken, $deviceName])) {
        // Enviar notificação de adição de dispositivo via Telegram
        try {
            require_once 'includes/telegram.php';
            $notifications = new TelegramNotifications();
            $ip = getUserIP();
            $notifications->notifyDeviceAdded($_SESSION['username'], $deviceName ?: 'Sem nome', $senderToken, $ip);
        } catch (Exception $e) {
            // Log do erro mas não interrompe a adição
            error_log("Erro ao enviar notificação de adição de dispositivo: " . $e->getMessage());
        }
        
        // Tentar gerar QR Code imediatamente na API
        $newSenderId = $pdo->lastInsertId();
        $params = [
            'device' => $senderToken,
            'api_key' => $apiKey,
            'force' => '1'
        ];
        
        $url = 'https://belkit.pro/generate-qr?' . http_build_query($params);
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
        
        if ($response !== false) {
            $apiResponse = json_decode($response, true);
            $qrCode = is_array($apiResponse) ? ($apiResponse['qrcode'] ?? $apiResponse['qr'] ?? $apiResponse['qrCode'] ?? null) : null;
            if ($httpCode == 200 && $qrCode) {
                // Salvar QR e marcar como pendente
                $stmt = $pdo->prepare("UPDATE user_senders SET qr_code = ?, status = 'pending', last_checked = NOW() WHERE id = ?");
                $stmt->execute([$qrCode, $newSenderId]);
                $success = "Dispositivo adicionado e QR Code gerado com sucesso! Escaneie para conectar.";
            } else {
                $apiMessage = is_array($apiResponse) ? ($apiResponse['msg'] ?? $apiResponse['message'] ?? null) : null;
                $success = "Dispositivo adicionado. Não foi possível gerar o QR agora (HTTP $httpCode). " . ($apiMessage ?: 'Tente gerar o QR nas ações do dispositivo.');
            }
        } else {
            $success = "Dispositivo adicionado. Falha ao contactar API para gerar o QR: " . ($curlError ?: 'Sem detalhes');
        }
        
        // Recarregar lista de senders
        $stmt = $pdo->prepare("SELECT * FROM user_senders WHERE user_id = ?");
        $stmt->execute([$userId]);
        $senders = $stmt->fetchAll();
        
        // Não redirecionar se foi gerado QR Code - mostrar na mesma página
        if (strpos($success, 'QR Code gerado') !== false) {
            // QR Code foi gerado com sucesso - não redirecionar
        } else {
            header("Location: settings.php?status=success&message=" . urlencode($success));
            exit();
        }
    } else {
        header("Location: settings.php?status=error&message=" . urlencode('Erro ao adicionar dispositivo!'));
        exit();
    }
}

// Processar adição de dispositivo via AJAX
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ajax_add_sender'])) {
    $senderToken = trim($_POST['sender_token']);
    $deviceName = trim($_POST['device_name']);
    
    $stmt = $pdo->prepare("INSERT INTO user_senders (user_id, sender_token, device_name) VALUES (?, ?, ?)");
    if ($stmt->execute([$userId, $senderToken, $deviceName])) {
        $newSenderId = $pdo->lastInsertId();
        
        // Enviar notificação de adição de dispositivo via Telegram
        try {
            require_once 'includes/telegram.php';
            $notifications = new TelegramNotifications();
            $ip = getUserIP();
            $notifications->notifyDeviceAdded($_SESSION['username'], $deviceName ?: 'Sem nome', $senderToken, $ip);
        } catch (Exception $e) {
            error_log("Erro ao enviar notificação de adição de dispositivo: " . $e->getMessage());
        }
        
        // Tentar gerar QR Code automaticamente
        $params = [
            'device' => $senderToken,
            'api_key' => $apiKey,
            'force' => '1'
        ];
        
        $url = 'https://belkit.pro/generate-qr?' . http_build_query($params);
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
        
        $result = ['success' => true, 'message' => 'Dispositivo adicionado com sucesso!'];
        
        if ($response !== false) {
            $apiResponse = json_decode($response, true);
            $qrCode = is_array($apiResponse) ? ($apiResponse['qrcode'] ?? $apiResponse['qr'] ?? $apiResponse['qrCode'] ?? null) : null;
            if ($httpCode == 200 && $qrCode) {
                // Salvar QR e marcar como pendente
                $stmt = $pdo->prepare("UPDATE user_senders SET qr_code = ?, status = 'pending', last_checked = NOW() WHERE id = ?");
                $stmt->execute([$qrCode, $newSenderId]);
                $result['qr_code'] = $qrCode;
                $result['device_id'] = $newSenderId;
                $result['device_token'] = $senderToken;
                $result['message'] = 'Dispositivo adicionado e QR Code gerado com sucesso!';
            } else {
                $apiMessage = is_array($apiResponse) ? ($apiResponse['msg'] ?? $apiResponse['message'] ?? null) : null;
                $result['message'] = "Dispositivo adicionado. Não foi possível gerar o QR agora (HTTP $httpCode). " . ($apiMessage ?: 'Tente gerar o QR nas ações do dispositivo.');
            }
        } else {
            $result['message'] = "Dispositivo adicionado. Falha ao contactar API para gerar o QR: " . ($curlError ?: 'Sem detalhes');
        }
        
        header('Content-Type: application/json');
        echo json_encode($result);
        exit();
    } else {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Erro ao adicionar dispositivo!']);
        exit();
    }
}

// Processar verificação de status via AJAX (sem redirecionamento)
if (isset($_GET['ajax_check_status'])) {
    $senderId = $_GET['ajax_check_status'];
    
    // Verificar se o sender pertence ao usuário
    $stmt = $pdo->prepare("SELECT * FROM user_senders WHERE id = ? AND user_id = ?");
    $stmt->execute([$senderId, $userId]);
    $sender = $stmt->fetch();
    
    if ($sender) {
        // Verificar status via API
        $postData = [
            'device' => $sender['sender_token'],
            'sender' => $sender['sender_token'],
            'api_key' => $apiKey
        ];
        
        $url = 'https://belkit.pro/check-status?' . http_build_query($postData);
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_SSL_VERIFYPEER => 0,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($response !== false) {
            $apiResponse = json_decode($response, true);
            $apiMsg = is_array($apiResponse) ? ($apiResponse['msg'] ?? $apiResponse['message'] ?? '') : '';
            
            // Tratar caso de "já conectado / connected"
            if ($apiMsg && (
                stripos($apiMsg, 'already connected') !== false ||
                stripos($apiMsg, 'connected') !== false ||
                stripos($apiMsg, 'já conectado') !== false ||
                stripos($apiMsg, 'ja conectado') !== false ||
                stripos($apiMsg, 'conectado') !== false
            )) {
                // Atualizar status no banco
                $stmt = $pdo->prepare("UPDATE user_senders SET status = 'connected', qr_code = NULL, last_checked = NOW() WHERE id = ?");
                $stmt->execute([$senderId]);
                
                // Retornar JSON indicando conexão
                header('Content-Type: application/json');
                echo json_encode(['status' => 'connected', 'message' => 'Dispositivo conectado com sucesso!']);
                exit();
            } else if ($httpCode == 200) {
                // Ainda pendente
                header('Content-Type: application/json');
                echo json_encode(['status' => 'pending', 'message' => 'Aguardando conexão...']);
                exit();
            } else {
                header('Content-Type: application/json');
                echo json_encode(['status' => 'error', 'message' => 'Erro ao verificar status']);
                exit();
            }
        } else {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Erro de conexão']);
            exit();
        }
    } else {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Dispositivo não encontrado']);
        exit();
    }
}

// Processar marcação manual como conectado
if (isset($_POST['manual_connect'])) {
    $senderId = $_POST['sender_id'];
    
    if ($senderId) {
        try {
            // Atualizar status no banco para conectado
            $stmt = $pdo->prepare("UPDATE user_senders SET status = 'connected', qr_code = NULL, last_checked = NOW() WHERE id = ?");
            if ($stmt->execute([$senderId])) {
                header('Content-Type: application/json');
                echo json_encode(['status' => 'success', 'message' => 'Dispositivo marcado como conectado com sucesso!']);
                exit();
            } else {
                header('Content-Type: application/json');
                echo json_encode(['status' => 'error', 'message' => 'Erro ao atualizar status no banco de dados']);
                exit();
            }
        } catch (Exception $e) {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Erro: ' . $e->getMessage()]);
            exit();
        }
    } else {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'ID do dispositivo não fornecido']);
        exit();
    }
}

// Processar remoção de sender
if (isset($_GET['delete_sender'])) {
    $senderId = $_GET['delete_sender'];
    
    // Verificar se o sender pertence ao usuário
    $stmt = $pdo->prepare("SELECT * FROM user_senders WHERE id = ? AND user_id = ?");
    $stmt->execute([$senderId, $userId]);
    $sender = $stmt->fetch();
    
    if ($sender) {
        $deviceToken = $sender['sender_token'];
        $messages = [];
        
        // Se estiver conectado, desconectar primeiro
        if ($sender['status'] == 'connected') {
            $postData = [
                'sender' => $deviceToken,
                'api_key' => $apiKey
            ];
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://belkit.pro/logout-device');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Accept: application/json'
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode == 200) {
                $messages[] = 'Dispositivo desconectado da API';
            } else {
                $messages[] = 'Erro ao desconectar da API (HTTP ' . $httpCode . ')';
            }
        }
        
        // Excluir do banco externo
        try {
            require_once 'includes/external_db.php';
            $externalResult = deleteExternalDevice($deviceToken);
            if ($externalResult['deleted']) {
                $messages[] = 'Dispositivo excluído: ' . $externalResult['message'];
            } else {
                $messages[] = 'Aviso: ' . $externalResult['message'];
            }
        } catch (Exception $e) {
            $messages[] = 'Erro ao excluir: ' . $e->getMessage();
        }
        
        // Excluir do banco local
        $stmt = $pdo->prepare("DELETE FROM user_senders WHERE id = ?");
        if ($stmt->execute([$senderId])) {
            $messages[] = 'Dispositivo removido!';
            
            // Enviar notificação de remoção de dispositivo via Telegram
            try {
                require_once 'includes/telegram.php';
                $notifications = new TelegramNotifications();
                $ip = getUserIP();
                $notifications->notifyDeviceRemoved($_SESSION['username'], $sender['device_name'] ?: 'Sem nome', $deviceToken, $ip);
            } catch (Exception $e) {
                // Log do erro mas não interrompe a remoção
                error_log("Erro ao enviar notificação de remoção de dispositivo: " . $e->getMessage());
            }
            
            // Recarregar lista de senders
            $stmt = $pdo->prepare("SELECT * FROM user_senders WHERE user_id = ?");
            $stmt->execute([$userId]);
            $senders = $stmt->fetchAll();
            
            $successMessage = 'Dispositivo removido com sucesso! ' . implode(' | ', $messages);
            header("Location: settings.php?status=success&message=" . urlencode($successMessage));
            exit();
        } else {
            header("Location: settings.php?status=error&message=" . urlencode('Erro ao remover dispositivo do banco local!'));
            exit();
        }
    } else {
        header("Location: settings.php?status=error&message=" . urlencode('Dispositivo não encontrado!'));
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurações - <?php echo SITE_NAME; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="css/style.css" rel="stylesheet">
    <style>
        .qr-code-container {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .qr-code {
            max-width: 200px;
            margin: 0 auto;
        }
        .device-status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .status-connected {
            background: #d4edda;
            color: #155724;
        }
        .status-disconnected {
            background: #f8d7da;
            color: #721c24;
        }
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        .device-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
            font-family: monospace;
            font-size: 0.9rem;
            max-height: 300px;
            overflow-y: auto;
        }
        .btn-group {
            display: flex;
            gap: 5px;
        }
        .btn-group .btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
        }
        
        /* Estilos para modal de QR Code responsivo */
        .qr-code-container {
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            margin: 10px 0;
        }
        
        .qr-code-image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .connection-status {
            padding: 10px;
            border-radius: 5px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
        }
        
        /* Responsividade para mobile */
        @media (max-width: 768px) {
            .modal-dialog {
                margin: 10px;
                max-width: calc(100% - 20px);
            }
            
            .qr-code-container {
                padding: 15px;
            }
            
            .qr-code-image {
                max-width: 250px;
            }
            
            .modal-body {
                padding: 15px;
            }
            
            .modal-footer {
                padding: 10px 15px;
            }
            
            .modal-footer .btn {
                font-size: 0.9rem;
                padding: 8px 16px;
            }
        }
        
        @media (max-width: 480px) {
            .modal-dialog {
                margin: 5px;
                max-width: calc(100% - 10px);
            }
            
            .qr-code-image {
                max-width: 200px;
            }
            
            .modal-title {
                font-size: 1.1rem;
            }
            
            .connection-status {
                font-size: 0.9rem;
            }
        }
    </style>
</head>
<body>
    <!-- Mobile Header -->
    <div class="mobile-header">
        <h5><i class="fab fa-apple me-2"></i>BELKIT</h5>
        <button class="hamburger-menu" id="mobileToggle">
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
        </button>
    </div>
    
    <!-- Overlay para fechar o menu -->
    <div class="sidebar-overlay"></div>
    
    <div class="dashboard-container">
        <!-- Conteúdo Principal -->
        <div class="main-content">
            <div class="content-header">
                <h4>Configurações</h4>
                <div class="user-info">
                    <div class="credits-info">
                        <span class="credits-badge">
                            <i class="fas fa-coins me-1"></i>
                            Saldo:  <strong><?php echo $userCredits; ?></strong> créditos
                        </span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span>Olá, <?php echo $_SESSION['username']; ?></span>
                        <a href="logout.php" class="btn btn-outline-secondary btn-sm ms-2"><i class="fas fa-sign-out-alt me-1"></i>Sair</a>
                    </div>
                </div>
            </div>

            <div class="content-body">
                <!-- Alertas -->
                <?php if ($success): ?>
                <div class="alert alert-success"><?php echo $success; ?></div>
                <?php endif; ?>
                <?php if ($error): ?>
                <div class="alert alert-danger"><?php echo $error; ?></div>
                <?php endif; ?>
                
                <!-- Indicador de Sistema Automático -->
                <div id="auto-system-indicator" class="alert alert-info" style="display: none;">
                    <i class="fas fa-cog fa-spin me-2"></i>
                    <strong>Sistema Automático Ativo:</strong>
                    <span id="auto-system-status">Verificando dispositivos pendentes...</span>
                </div>

                <div class="row">
                    <!-- Alterar Senha -->
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-key me-2"></i>Alterar Senha</h5>
                            </div>
                            <div class="card-body">
                                <form method="POST">
                                    <div class="mb-3">
                                        <label for="current_password" class="form-label">Senha Atual</label>
                                        <input type="password" class="form-control" id="current_password" name="current_password" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="new_password" class="form-label">Nova Senha</label>
                                        <input type="password" class="form-control" id="new_password" name="new_password" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="confirm_password" class="form-label">Confirmar Nova Senha</label>
                                        <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                                    </div>
                                    <button type="submit" name="change_password" class="btn btn-primary">Alterar Senha</button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Configuração da API -->
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-code me-2"></i>API Key</h5>
                            </div>
                            <div class="card-body">
                                <form method="POST">
                                    <div class="mb-3">
                                        <label for="api_key" class="form-label">API KEY BELKIT</label>
                                        <input type="text" class="form-control" id="api_key" name="api_key" value="<?php echo htmlspecialchars($apiKey); ?>" required>
                                    </div>
                                    <button type="submit" name="change_api_key" class="btn btn-primary">Salvar API Key</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Gerenciar Dispositivos -->
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-mobile-alt me-2"></i>Gerenciar Dispositivos</h5>
                    </div>
                    <div class="card-body">
                        <!-- Formulário para adicionar dispositivo -->
                        <form id="add-device-form" class="mb-4">
                            <div class="row">
                                <div class="col-md-5">
                                    <label for="sender_token" class="form-label">Token do Dispositivo</label>
                                    <input type="text" class="form-control" id="sender_token" name="sender_token" required>
                                </div>
                                <div class="col-md-5">
                                    <label for="device_name" class="form-label">Nome do Dispositivo (opcional)</label>
                                    <input type="text" class="form-control" id="device_name" name="device_name">
                                </div>
                                <div class="col-md-2 d-flex align-items-end">
                                    <button type="submit" class="btn btn-success">
                                        <span class="btn-text">Adicionar</span>
                                        <span class="btn-loading" style="display: none;">
                                            <i class="fas fa-spinner fa-spin me-1"></i>Adicionando...
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </form>

                        <!-- Lista de dispositivos -->
                        <h6>Meus Dispositivos</h6>
                        <?php if (count($senders) > 0): ?>
                        <!-- Desktop Table -->
                        <div class="table-responsive d-none d-md-block">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Token</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($senders as $sender): ?>
                                    <tr data-device-id="<?php echo $sender['id']; ?>">
                                        <td><?php echo htmlspecialchars($sender['device_name'] ?: 'Sem nome'); ?></td>
                                        <td><code><?php echo htmlspecialchars($sender['sender_token']); ?></code></td>
                                        <td>
                                            <span class="device-status status-<?php echo $sender['status']; ?>" data-status="<?php echo $sender['status']; ?>">
                                                <?php 
                                                if ($sender['status'] == 'connected') echo 'Conectado';
                                                elseif ($sender['status'] == 'pending') echo 'Pendente';
                                                else echo 'Desconectado';
                                                ?>
                                            </span>
                                        </td>
                                        <td>
                                            <div class="btn-group">
                                                <?php if ($sender['status'] == 'disconnected'): ?>
                                                <button onclick="generateQRCodeManual(<?php echo $sender['id']; ?>)" class="btn btn-sm btn-primary" title="Gerar QR Code">
                                                    <i class="fas fa-qrcode"></i>
                                                </button>
                                                <?php elseif ($sender['status'] == 'pending'): ?>
                                                <button onclick="checkStatusManual(<?php echo $sender['id']; ?>)" class="btn btn-sm btn-warning" title="Verificar Status">
                                                    <i class="fas fa-sync-alt"></i>
                                                </button>
                                                <?php else: ?>
                                                <a href="settings.php?get_info=<?php echo $sender['id']; ?>" class="btn btn-sm btn-info" title="Obter Informações">
                                                    <i class="fas fa-info-circle"></i>
                                                </a>
                                                <a href="settings.php?disconnect_device=<?php echo $sender['id']; ?>" class="btn btn-sm btn-danger" title="Desconectar" onclick="return confirm('Tem certeza que deseja desconectar este dispositivo?')">
                                                    <i class="fas fa-plug"></i>
                                                </a>
                                                <?php endif; ?>
                                                <a href="settings.php?delete_sender=<?php echo $sender['id']; ?>" class="btn btn-sm btn-danger" title="Remover" onclick="return confirm('Tem certeza que deseja remover este dispositivo?')">
                                                    <i class="fas fa-trash"></i>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                    <?php if ($sender['qr_code']): ?>
                                    <tr>
                                        <td colspan="5">
                                            <div class="qr-code-container">
                                                <h6>QR Code para Conexão</h6>
                                                <img src="<?php echo $sender['qr_code']; ?>" class="qr-code img-fluid" alt="QR Code">
                                                <p class="mt-2">Escaneie este QR Code com o WhatsApp para conectar o dispositivo.</p>
                                            </div>
                                        </td>
                                    </tr>
                                    <?php endif; ?>
                                    <?php if ($sender['device_info']): ?>
                                    <tr>
                                        <td colspan="5">
                                            <h6>Informações do Dispositivo</h6>
                                            <div class="device-info">
                                                <pre><?php echo htmlspecialchars($sender['device_info']); ?></pre>
                                            </div>
                                        </td>
                                    </tr>
                                    <?php endif; ?>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>

                        <!-- Mobile Cards -->
                        <div class="d-md-none">
                            <?php foreach ($senders as $sender): ?>
                            <div class="card mb-3">
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-8">
                                            <strong><?php echo htmlspecialchars($sender['device_name'] ?: 'Sem nome'); ?></strong>
                                            <div class="text-muted small"><code><?php echo htmlspecialchars($sender['sender_token']); ?></code></div>
                                        </div>
                                        <div class="col-4 text-end">
                                            <span class="device-status status-<?php echo $sender['status']; ?>">
                                                <?php 
                                                if ($sender['status'] == 'connected') echo 'Conectado';
                                                elseif ($sender['status'] == 'pending') echo 'Pendente';
                                                else echo 'Desconectado';
                                                ?>
                                            </span>
                                        </div>
                                    </div>

                                    <?php if ($sender['qr_code']): ?>
                                    <div class="qr-code-container mt-2">
                                        <img src="<?php echo $sender['qr_code']; ?>" class="qr-code img-fluid" alt="QR Code">
                                    </div>
                                    <?php endif; ?>

                                    <div class="d-flex gap-2 mt-2 justify-content-end">
                                        <?php if ($sender['status'] == 'disconnected'): ?>
                                        <a href="settings.php?generate_qr=<?php echo $sender['id']; ?>" class="btn btn-sm btn-primary"><i class="fas fa-qrcode me-1"></i>Gerar QR</a>
                                        <?php elseif ($sender['status'] == 'pending'): ?>
                                        <a href="settings.php?check_status=<?php echo $sender['id']; ?>" class="btn btn-sm btn-warning"><i class="fas fa-sync-alt me-1"></i>Verificar</a>
                                        <?php else: ?>
                                        <a href="settings.php?get_info=<?php echo $sender['id']; ?>" class="btn btn-sm btn-info"><i class="fas fa-info-circle me-1"></i>Info</a>
                                        <a href="settings.php?disconnect_device=<?php echo $sender['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Tem certeza que deseja desconectar este dispositivo?')"><i class="fas fa-plug me-1"></i>Desconectar</a>
                                        <?php endif; ?>
                                        <a href="settings.php?delete_sender=<?php echo $sender['id']; ?>" class="btn btn-sm btn-outline-danger" onclick="return confirm('Tem certeza que deseja remover este dispositivo?')"><i class="fas fa-trash me-1"></i>Remover</a>
                                    </div>

                                    <?php if ($sender['device_info']): ?>
                                    <div class="device-info mt-2">
                                        <pre class="mb-0"><?php echo htmlspecialchars($sender['device_info']); ?></pre>
                                    </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        <?php else: ?>
                        <p class="text-muted">Nenhum dispositivo cadastrado.</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/script.js"></script>
    <script>
        // Inicializar a aplicação
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof belkitApp !== 'undefined') {
                belkitApp.init();
            }
            
            // Inicializar sistema de QR Code automático
            initQRCodeSystem();
            
            // Inicializar formulário de adição de dispositivo
            initAddDeviceForm();
        });
        
        // Inicializar formulário de adição de dispositivo
        function initAddDeviceForm() {
            const form = document.getElementById('add-device-form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    addDevice();
                });
            }
        }
        
        // Adicionar dispositivo via AJAX
        function addDevice() {
            const form = document.getElementById('add-device-form');
            const formData = new FormData(form);
            formData.append('ajax_add_sender', '1');
            
            const button = form.querySelector('button[type="submit"]');
            const btnText = button.querySelector('.btn-text');
            const btnLoading = button.querySelector('.btn-loading');
            
            // Mostrar loading
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            button.disabled = true;
            
            fetch('settings.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Mostrar mensagem de sucesso
                    showAlert('success', data.message);
                    
                    // Se tem QR Code, mostrar
                    if (data.qr_code) {
                        // Obter deviceId e token do dispositivo recém-criado
                        const deviceId = data.device_id;
                        const deviceToken = data.device_token;
                        showQRCode(data.qr_code, deviceId, deviceToken);
                    } else {
                        // Recarregar a página apenas se não tem QR Code
                        setTimeout(() => {
                            location.reload();
                        }, 2000);
                    }
                } else {
                    showAlert('danger', data.message);
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                showAlert('danger', 'Erro ao adicionar dispositivo');
            })
            .finally(() => {
                // Restaurar botão
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                button.disabled = false;
            });
        }
        
        // Mostrar QR Code - Sistema simplificado
        function showQRCode(qrCodeUrl, deviceId = null, deviceToken = null) {
            // Fechar modal existente se houver
            closeQRModal();
            
            // Armazenar dados do dispositivo
            if (deviceId) {
                currentDeviceId = deviceId;
            }
            if (deviceToken) {
                currentDeviceToken = deviceToken;
            }
            
            console.log('Exibindo QR Code:', {
                qrCodeUrl: qrCodeUrl,
                deviceId: currentDeviceId,
                deviceToken: currentDeviceToken
            });
            
            // Criar modal simples
            const modal = document.createElement('div');
            modal.id = 'qrCodeModal';
            modal.className = 'modal fade show';
            modal.style.display = 'block';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-qrcode me-2"></i>Conectar Dispositivo
                            </h5>
                            <button type="button" class="btn-close" onclick="closeQRModal()"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div class="qr-code-container">
                                <img src="${qrCodeUrl}" alt="QR Code" class="img-fluid qr-code-image" style="max-width: 300px; height: auto;">
                                <p class="mt-3 mb-2">Escaneie este QR Code com seu WhatsApp</p>
                                
                                <!-- Botão centralizado abaixo do QR Code -->
                                <div class="mt-4 mb-3">
                                    <button type="button" class="btn btn-success btn-lg" onclick="markAsConnected()" id="markConnectedBtn">
                                        <i class="fas fa-check me-2"></i>Já Conectei
                                    </button>
                                </div>
                                
                                <div class="connection-status mt-3">
                                    <div class="text-info">
                                        <i class="fas fa-info-circle me-2"></i>
                                        Aguardando conexão...
                                        <br><small class="text-muted">Verificando no banco externo da API</small>
                                    </div>
                                </div>
                                <div class="debug-info mt-2" style="font-size: 0.8rem; color: #666;">
                                    <small>
                                        <strong>Debug:</strong> 
                                        Device ID: <span id="debugDeviceId">${currentDeviceId || 'N/A'}</span> | 
                                        Token: <span id="debugToken">${currentDeviceToken ? currentDeviceToken.substring(0, 8) + '...' : 'N/A'}</span>
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" onclick="closeQRModal()">Fechar</button>
                            <button type="button" class="btn btn-primary" onclick="generateNewQR()">Novo QR Code</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Adicionar backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.style.zIndex = '9998';
            document.body.appendChild(backdrop);
            
            // Iniciar verificação simples
            startSimpleConnectionCheck();
        }
        
        // Fechar modal do QR Code
        function closeQRModal() {
            const modal = document.getElementById('qrCodeModal');
            const backdrop = document.querySelector('.modal-backdrop');
            
            // Parar verificação de conexão
            stopSimpleConnectionCheck();
            
            if (modal) {
                modal.style.display = 'none';
                modal.remove();
            }
            if (backdrop) backdrop.remove();
        }
        
        // Marcar dispositivo como conectado manualmente
        function markAsConnected() {
            if (!currentDeviceId) {
                showAlert('error', 'ID do dispositivo não encontrado');
                return;
            }
            
            // Confirmar ação
            if (!confirm('Tem certeza que o dispositivo já está conectado? Esta ação irá marcar o dispositivo como conectado no sistema.')) {
                return;
            }
            
            // Mostrar loading no botão
            const btn = document.getElementById('markConnectedBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Marcando...';
            btn.disabled = true;
            
            // Enviar requisição AJAX
            const formData = new FormData();
            formData.append('manual_connect', '1');
            formData.append('sender_id', currentDeviceId);
            
            fetch('settings.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showAlert('success', data.message);
                    
                    // Atualizar status no modal
                    const statusElement = document.querySelector('.connection-status');
                    if (statusElement) {
                        statusElement.innerHTML = `
                            <div class="text-success">
                                <i class="fas fa-check-circle me-2"></i>
                                <strong>Dispositivo conectado com sucesso!</strong>
                            </div>
                        `;
                    }
                    
                    // Fechar modal após 2 segundos
                    setTimeout(() => {
                        closeQRModal();
                        location.reload();
                    }, 2000);
                } else {
                    showAlert('error', data.message);
                    // Restaurar botão
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            })
            .catch(error => {
                console.error('Erro ao marcar como conectado:', error);
                showAlert('error', 'Erro ao marcar dispositivo como conectado');
                // Restaurar botão
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        }
        
        // Variáveis para controle simplificado
        let currentDeviceId = null;
        let currentDeviceToken = null;
        let simpleCheckInterval = null;
        
        // Verificação simples de conexão
        function startSimpleConnectionCheck() {
            if (!currentDeviceId || !currentDeviceToken) {
                console.log('Dados do dispositivo não disponíveis para verificação');
                return;
            }
            
            console.log('Iniciando verificação simples para dispositivo:', currentDeviceId);
            
            // Verificar a cada 10 segundos
            simpleCheckInterval = setInterval(() => {
                checkSimpleConnectionStatus();
            }, 10000);
        }
        
        // Parar verificação simples
        function stopSimpleConnectionCheck() {
            if (simpleCheckInterval) {
                clearInterval(simpleCheckInterval);
                simpleCheckInterval = null;
            }
        }
        
        // Verificar status de conexão melhorado
        function checkSimpleConnectionStatus() {
            if (!currentDeviceToken) {
                console.log('Token do dispositivo não disponível');
                return;
            }
            
            console.log('Verificando status do dispositivo:', currentDeviceToken);
            
            fetch('includes/check_external_status.php?device_token=' + encodeURIComponent(currentDeviceToken))
                .then(response => {
                    console.log('Resposta HTTP:', response.status);
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Status recebido:', data);
                    
                    const statusElement = document.querySelector('.connection-status');
                    if (!statusElement) return;
                    
                    // Log detalhado para debug
                    if (data.debug_info) {
                        console.log('Debug info:', data.debug_info);
                    }
                    
                    if (data.status === 'connected') {
                        console.log('Dispositivo conectado!');
                        statusElement.innerHTML = `
                            <div class="text-success">
                                <i class="fas fa-check-circle me-2"></i>
                                <strong>Dispositivo conectado com sucesso!</strong>
                            </div>
                        `;
                        
                        // Fechar modal após 3 segundos
                        setTimeout(() => {
                            closeQRModal();
                            location.reload();
                        }, 3000);
                        
                        // Parar verificação
                        stopSimpleConnectionCheck();
                    } else if (data.status === 'pending') {
                        console.log('Dispositivo ainda pendente');
                        statusElement.innerHTML = `
                            <div class="text-info">
                                <i class="fas fa-clock me-2"></i>
                                Aguardando conexão...
                            </div>
                        `;
                    } else if (data.status === 'error') {
                        console.log('Erro na verificação:', data.message);
                        statusElement.innerHTML = `
                            <div class="text-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Erro na verificação
                            </div>
                        `;
                    } else {
                        console.log('Status desconhecido:', data.status);
                        statusElement.innerHTML = `
                            <div class="text-muted">
                                <i class="fas fa-question-circle me-2"></i>
                                Status desconhecido
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Erro ao verificar status:', error);
                    const statusElement = document.querySelector('.connection-status');
                    if (statusElement) {
                        statusElement.innerHTML = `
                            <div class="text-danger">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                Erro na verificação
                            </div>
                        `;
                    }
                });
        }
        
        // Gerar novo QR Code melhorado
        function generateNewQR() {
            if (!currentDeviceId) {
                console.log('ID do dispositivo não disponível');
                return;
            }
            
            console.log('Gerando novo QR Code para dispositivo:', currentDeviceId);
            
            const statusElement = document.querySelector('.connection-status');
            const qrImage = document.querySelector('.qr-code-image');
            
            if (statusElement) {
                statusElement.innerHTML = `
                    <div class="text-primary">
                        <i class="fas fa-spinner fa-spin me-2"></i>
                        Gerando novo QR Code...
                    </div>
                `;
            }
            
            // Gerar novo QR Code via API melhorada
            fetch('includes/generate_qr_ajax.php?device_id=' + currentDeviceId + '&force_new=1')
                .then(response => {
                    console.log('Resposta HTTP da geração:', response.status);
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Resposta da geração:', data);
                    
                    if (data.success && data.qr_code) {
                        console.log('QR Code gerado com sucesso');
                        
                        // Atualizar a imagem do QR Code
                        if (qrImage) {
                            qrImage.src = data.qr_code;
                            console.log('Imagem do QR Code atualizada');
                        }
                        
                        // Mostrar mensagem de sucesso
                        if (statusElement) {
                            statusElement.innerHTML = `
                                <div class="text-success">
                                    <i class="fas fa-check-circle me-2"></i>
                                    Novo QR Code gerado!
                                    <br><small>Escaneie com seu WhatsApp</small>
                                </div>
                            `;
                        }
                        
                        // Reiniciar verificação de status
                        if (currentDeviceToken) {
                            console.log('Reiniciando verificação de status...');
                            startSimpleConnectionCheck();
                        }
                        
                        // Voltar ao status normal após 3 segundos
                        setTimeout(() => {
                            if (statusElement) {
                                statusElement.innerHTML = `
                                    <div class="text-info">
                                        <i class="fas fa-clock me-2"></i>
                                        Aguardando conexão...
                                    </div>
                                `;
                            }
                        }, 3000);
                    } else {
                        console.log('Erro na geração:', data.message);
                        if (statusElement) {
                            statusElement.innerHTML = `
                                <div class="text-danger">
                                    <i class="fas fa-exclamation-circle me-2"></i>
                                    Erro ao gerar QR Code
                                </div>
                            `;
                        }
                    }
                })
                .catch(error => {
                    console.error('Erro ao gerar QR Code:', error);
                    if (statusElement) {
                        statusElement.innerHTML = `
                            <div class="text-danger">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                Erro na comunicação
                            </div>
                        `;
                    }
                });
        }
        
        
        
        
        
        // Mostrar alerta
        function showAlert(type, message) {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
            alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            // Inserir no topo da página
            const contentBody = document.querySelector('.content-body');
            if (contentBody) {
                contentBody.insertBefore(alertDiv, contentBody.firstChild);
                
                // Remover após 5 segundos
                setTimeout(() => {
                    if (alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 5000);
            }
        }
        
        // Sistema de QR Code automático
        function initQRCodeSystem() {
            // Verificar se há dispositivos pendentes
            const pendingDevices = document.querySelectorAll('.device-status[data-status="pending"]');
            
            if (pendingDevices.length > 0) {
                console.log('Iniciando sistema de QR Code automático para', pendingDevices.length, 'dispositivos');
                
                // Mostrar indicador
                const indicator = document.getElementById('auto-system-indicator');
                const status = document.getElementById('auto-system-status');
                indicator.style.display = 'block';
                status.textContent = `Monitorando ${pendingDevices.length} dispositivo(s) pendente(s)`;
                
                // Atualizar QR Code a cada 60 segundos
                setInterval(updateQRCodes, 60000);
                
                // Verificar conexão a cada 1 segundo
                setInterval(checkConnections, 1000);
                
                // Primeira verificação imediata
                checkConnections();
                
                // Atualizar contador de tempo
                let seconds = 0;
                setInterval(() => {
                    seconds++;
                    const minutes = Math.floor(seconds / 60);
                    const remainingSeconds = seconds % 60;
                    status.textContent = `Monitorando ${pendingDevices.length} dispositivo(s) - Tempo: ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                }, 1000);
            }
        }
        
        // Atualizar QR Codes
        function updateQRCodes() {
            const pendingDevices = document.querySelectorAll('.device-status[data-status="pending"]');
            
            pendingDevices.forEach(device => {
                const deviceRow = device.closest('tr');
                if (!deviceRow) {
                    console.log('Linha do dispositivo não encontrada, pulando...');
                    return;
                }
                
                // O data-device-id está na própria tr
                const deviceId = deviceRow.dataset.deviceId;
                if (!deviceId) {
                    console.log('ID do dispositivo não encontrado na tr, pulando...');
                    return;
                }
                
                generateQRCode(deviceId);
            });
        }
        
        // Gerar QR Code manual melhorado (botão na tabela)
        function generateQRCodeManual(deviceId) {
            console.log('Gerando QR Code manual para dispositivo:', deviceId);
            
            // Mostrar loading
            const statusElement = document.querySelector(`tr[data-device-id="${deviceId}"] .device-status`);
            if (statusElement) {
                statusElement.innerHTML = '<span class="text-primary">Gerando QR...</span>';
            }
            
            // Gerar QR Code via API melhorada
            fetch('includes/generate_qr_ajax.php?device_id=' + deviceId + '&force_new=1')
                .then(response => {
                    console.log('Resposta HTTP da geração manual:', response.status);
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Resposta da geração manual:', data);
                    
                    if (data.success && data.qr_code) {
                        console.log('QR Code gerado com sucesso');
                        
                        // Obter token do dispositivo
                        const deviceRow = document.querySelector(`tr[data-device-id="${deviceId}"]`);
                        const tokenElement = deviceRow.querySelector('code');
                        const deviceToken = tokenElement ? tokenElement.textContent.trim() : null;
                        
                        // Mostrar modal com QR Code
                        showQRCode(data.qr_code, deviceId, deviceToken);
                        
                        // Atualizar status na tabela
                        if (statusElement) {
                            statusElement.innerHTML = '<span class="text-warning">Pendente</span>';
                        }
                        
                        // Mostrar alerta de sucesso
                        showAlert('success', 'QR Code gerado com sucesso! Escaneie com seu WhatsApp.');
                    } else {
                        console.log('Erro na geração:', data.message);
                        showAlert('error', 'Erro ao gerar QR Code');
                        
                        if (statusElement) {
                            statusElement.innerHTML = '<span class="text-danger">Erro</span>';
                        }
                    }
                })
                .catch(error => {
                    console.error('Erro ao gerar QR Code:', error);
                    showAlert('error', 'Erro ao gerar QR Code');
                    
                    if (statusElement) {
                        statusElement.innerHTML = '<span class="text-danger">Erro</span>';
                    }
                });
        }
        
        // Verificar status manual melhorado (botão na tabela)
        function checkStatusManual(deviceId) {
            console.log('Verificando status manual para dispositivo:', deviceId);
            
            // Mostrar loading
            const statusElement = document.querySelector(`tr[data-device-id="${deviceId}"] .device-status`);
            if (statusElement) {
                statusElement.innerHTML = '<span class="text-primary">Verificando...</span>';
            }
            
            // Obter token do dispositivo
            const deviceRow = document.querySelector(`tr[data-device-id="${deviceId}"]`);
            const tokenElement = deviceRow.querySelector('code');
            const deviceToken = tokenElement ? tokenElement.textContent.trim() : null;
            
            if (!deviceToken) {
                showAlert('error', 'Token do dispositivo não encontrado');
                if (statusElement) {
                    statusElement.innerHTML = '<span class="text-danger">Erro</span>';
                }
                return;
            }
            
            // Verificar status no banco externo melhorado
            fetch('includes/check_external_status.php?device_token=' + encodeURIComponent(deviceToken))
                .then(response => {
                    console.log('Resposta HTTP da verificação manual:', response.status);
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Status manual recebido:', data);
                    
                    // Log detalhado para debug
                    if (data.debug_info) {
                        console.log('Debug info da verificação manual:', data.debug_info);
                    }
                    
                    if (data.status === 'connected') {
                        console.log('Dispositivo conectado!');
                        showAlert('success', 'Dispositivo conectado com sucesso!');
                        
                        if (statusElement) {
                            statusElement.innerHTML = '<span class="text-success">Conectado</span>';
                            statusElement.setAttribute('data-status', 'connected');
                        }
                        
                        // Recarregar página após 2 segundos
                        setTimeout(() => {
                            location.reload();
                        }, 2000);
                    } else if (data.status === 'pending') {
                        console.log('Dispositivo ainda pendente');
                        showAlert('info', 'Dispositivo ainda não conectado');
                        
                        if (statusElement) {
                            statusElement.innerHTML = '<span class="text-warning">Pendente</span>';
                        }
                    } else if (data.status === 'error') {
                        console.log('Erro na verificação:', data.message);
                        showAlert('error', 'Erro na verificação');
                        
                        if (statusElement) {
                            statusElement.innerHTML = '<span class="text-danger">Erro</span>';
                        }
                    } else {
                        console.log('Status desconhecido:', data.status);
                        showAlert('warning', 'Status desconhecido');
                        
                        if (statusElement) {
                            statusElement.innerHTML = '<span class="text-muted">Desconhecido</span>';
                        }
                    }
                })
                .catch(error => {
                    console.error('Erro ao verificar status:', error);
                    showAlert('error', 'Erro ao verificar status');
                    
                    if (statusElement) {
                        statusElement.innerHTML = '<span class="text-danger">Erro</span>';
                    }
                });
        }

        
    </script>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav" style="position: fixed; bottom: 0; left: 0; right: 0; width: 100%; height: 56px; background: white; border-top: 1px solid #e5e5e7; display: flex; align-items: center; justify-content: space-around; z-index: 1100; padding: 8px 0;">
        <a href="dashboard.php" style="display: inline-flex; align-items: center; gap: 8px; color: #1d1d1f; text-decoration: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; flex-direction: column; text-align: center; min-width: 60px;"><i class="fas fa-paper-plane"></i> <span style="font-size: 0.7rem; margin-top: 2px;">Início</span></a>
        <a href="sms.php" style="display: inline-flex; align-items: center; gap: 8px; color: #1d1d1f; text-decoration: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; flex-direction: column; text-align: center; min-width: 60px;"><i class="fas fa-sms"></i> <span style="font-size: 0.7rem; margin-top: 2px;">SMS</span></a>
        <a href="voz.php" style="display: inline-flex; align-items: center; gap: 8px; color: #1d1d1f; text-decoration: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; flex-direction: column; text-align: center; min-width: 60px;"><i class="fas fa-phone"></i> <span style="font-size: 0.7rem; margin-top: 2px;">Voz</span></a>
        <a href="verificador.php" style="display: inline-flex; align-items: center; gap: 8px; color: #1d1d1f; text-decoration: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; flex-direction: column; text-align: center; min-width: 60px;"><i class="fas fa-search"></i> <span style="font-size: 0.7rem; margin-top: 2px;">Verificador</span></a>
        <a href="recharge.php" style="display: inline-flex; align-items: center; gap: 8px; color: #1d1d1f; text-decoration: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; flex-direction: column; text-align: center; min-width: 60px;"><i class="fas fa-credit-card"></i> <span style="font-size: 0.7rem; margin-top: 2px;">Recarga</span></a>
        <a href="recharge_history.php" style="display: inline-flex; align-items: center; gap: 8px; color: #1d1d1f; text-decoration: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; flex-direction: column; text-align: center; min-width: 60px;"><i class="fas fa-history"></i> <span style="font-size: 0.7rem; margin-top: 2px;">Histórico</span></a>
        <?php if (isAdmin()): ?>
        <a href="admin_recharge_history.php" style="display: inline-flex; align-items: center; gap: 8px; color: #1d1d1f; text-decoration: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; flex-direction: column; text-align: center; min-width: 60px;"><i class="fas fa-crown"></i> <span style="font-size: 0.7rem; margin-top: 2px;">Admin</span></a>
        <?php endif; ?>
        <a href="settings.php" class="active" style="display: inline-flex; align-items: center; gap: 8px; color: #007aff; text-decoration: none; padding: 8px 12px; border-radius: 8px; font-weight: 600; flex-direction: column; text-align: center; min-width: 60px; background: #f5f5f7;"><i class="fas fa-cog"></i> <span style="font-size: 0.7rem; margin-top: 2px;">Configurações</span></a>
    </nav>
</body>
</html>


