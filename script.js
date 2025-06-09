/**
 * Sistema de Presença QR - Funções Principais
 * Este arquivo contém todas as funções de utilidade e gerenciamento de dados
 * para o sistema de presença baseado em códigos QR.
 */

// ==========================================
// CONSTANTES E CONFIGURAÇÕES
// ==========================================

const STORAGE_KEYS = {
    SESSIONS: 'attendanceSessions',
    ATTENDANCES: 'attendanceRecords'
};

// ==========================================
// UTILITÁRIOS GERAIS
// ==========================================

/**
 * Gera um ID único para sessões
 * @returns {string} ID único baseado em timestamp e caracteres aleatórios
 */
function generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${randomStr}`;
}

/**
 * Gera um ID único para registros de presença
 * @returns {string} ID único para presença
 */
function generateAttendanceId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `attendance_${timestamp}_${randomStr}`;
}

/**
 * Formata data e hora para exibição em português brasileiro
 * @param {string} timestamp - Timestamp ISO string
 * @returns {string} Data e hora formatada
 */
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Formata apenas o horário para exibição
 * @param {string} timestamp - Timestamp ISO string
 * @returns {string} Horário formatado
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formata apenas a data para exibição
 * @param {string} timestamp - Timestamp ISO string
 * @returns {string} Data formatada
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Valida se uma string não está vazia após trim
 * @param {string} value - Valor a ser validado
 * @returns {boolean} True se válido
 */
function isValidString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Valida formato de matrícula (alfanumérico)
 * @param {string} studentId - ID do estudante
 * @returns {boolean} True se válido
 */
function isValidStudentId(studentId) {
    const regex = /^[A-Za-z0-9]+$/;
    return isValidString(studentId) && regex.test(studentId.trim());
}

// ==========================================
// GERENCIAMENTO DE SESSÕES
// ==========================================

/**
 * Salva uma nova sessão no localStorage
 * @param {Object} sessionData - Dados da sessão
 * @param {string} sessionData.id - ID único da sessão
 * @param {string} sessionData.professorName - Nome do professor
 * @param {string} sessionData.subject - Matéria/disciplina
 * @param {number} sessionData.validity - Validade em minutos
 * @param {string} sessionData.createdAt - Timestamp de criação
 * @param {string} sessionData.expiresAt - Timestamp de expiração
 */
function saveSession(sessionData) {
    try {
        // Validar dados da sessão
        if (!sessionData.id || !isValidString(sessionData.professorName) || 
            !isValidString(sessionData.subject) || !sessionData.validity) {
            throw new Error('Dados da sessão inválidos');
        }

        const sessions = getAllSessions();
        sessions.push(sessionData);
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
        
        console.log('Sessão salva com sucesso:', sessionData.id);
    } catch (error) {
        console.error('Erro ao salvar sessão:', error);
        throw new Error('Falha ao salvar sessão. Tente novamente.');
    }
}

/**
 * Recupera uma sessão específica pelo ID
 * @param {string} sessionId - ID da sessão
 * @returns {Object|null} Dados da sessão ou null se não encontrada
 */
function getSession(sessionId) {
    try {
        if (!sessionId) {
            return null;
        }

        const sessions = getAllSessions();
        const session = sessions.find(s => s.id === sessionId);
        
        if (session) {
            console.log('Sessão encontrada:', sessionId);
        } else {
            console.log('Sessão não encontrada:', sessionId);
        }
        
        return session || null;
    } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
        return null;
    }
}

/**
 * Recupera todas as sessões salvas
 * @returns {Array} Array de sessões
 */
function getAllSessions() {
    try {
        const sessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
        console.error('Erro ao recuperar sessões:', error);
        return [];
    }
}

/**
 * Verifica se uma sessão ainda está válida (não expirou)
 * @param {string} sessionId - ID da sessão
 * @returns {boolean} True se a sessão ainda está válida
 */
function isSessionValid(sessionId) {
    const session = getSession(sessionId);
    if (!session) {
        return false;
    }

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const isValid = now <= expiresAt;
    
    console.log(`Sessão ${sessionId} ${isValid ? 'válida' : 'expirada'}`);
    return isValid;
}

/**
 * Remove sessões expiradas do localStorage
 * @returns {number} Número de sessões removidas
 */
function cleanupExpiredSessions() {
    try {
        const sessions = getAllSessions();
        const now = new Date();
        const validSessions = sessions.filter(session => {
            return new Date(session.expiresAt) > now;
        });
        
        const removedCount = sessions.length - validSessions.length;
        
        if (removedCount > 0) {
            localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(validSessions));
            console.log(`${removedCount} sessões expiradas removidas`);
        }
        
        return removedCount;
    } catch (error) {
        console.error('Erro ao limpar sessões expiradas:', error);
        return 0;
    }
}

// ==========================================
// GERENCIAMENTO DE PRESENÇAS
// ==========================================

/**
 * Salva um registro de presença
 * @param {Object} attendanceData - Dados da presença
 * @param {string} attendanceData.id - ID único da presença
 * @param {string} attendanceData.sessionId - ID da sessão
 * @param {string} attendanceData.studentName - Nome do estudante
 * @param {string} attendanceData.studentId - Matrícula do estudante
 * @param {string} attendanceData.timestamp - Timestamp do registro
 * @param {string} attendanceData.professorName - Nome do professor
 * @param {string} attendanceData.subject - Matéria
 * @param {string} attendanceData.sessionDate - Data da sessão
 */
function saveAttendance(attendanceData) {
    try {
        // Validar dados da presença
        if (!attendanceData.id || !attendanceData.sessionId || 
            !isValidString(attendanceData.studentName) || 
            !isValidStudentId(attendanceData.studentId)) {
            throw new Error('Dados da presença inválidos');
        }

        const attendances = getAllAttendances();
        attendances.push(attendanceData);
        localStorage.setItem(STORAGE_KEYS.ATTENDANCES, JSON.stringify(attendances));
        
        console.log('Presença registrada com sucesso:', attendanceData.id);
    } catch (error) {
        console.error('Erro ao salvar presença:', error);
        throw new Error('Falha ao registrar presença. Tente novamente.');
    }
}

/**
 * Recupera todas as presenças salvas
 * @returns {Array} Array de presenças
 */
function getAllAttendances() {
    try {
        const attendances = localStorage.getItem(STORAGE_KEYS.ATTENDANCES);
        return attendances ? JSON.parse(attendances) : [];
    } catch (error) {
        console.error('Erro ao recuperar presenças:', error);
        return [];
    }
}

/**
 * Recupera presenças de uma sessão específica
 * @param {string} sessionId - ID da sessão
 * @returns {Array} Array de presenças da sessão
 */
function getAttendancesBySession(sessionId) {
    try {
        if (!sessionId) {
            return [];
        }

        const attendances = getAllAttendances();
        return attendances.filter(attendance => attendance.sessionId === sessionId);
    } catch (error) {
        console.error('Erro ao recuperar presenças da sessão:', error);
        return [];
    }
}

/**
 * Verifica se um estudante já registrou presença em uma sessão
 * @param {string} sessionId - ID da sessão
 * @param {string} studentId - Matrícula do estudante
 * @returns {boolean} True se já registrou presença
 */
function hasStudentAttended(sessionId, studentId) {
    const attendances = getAttendancesBySession(sessionId);
    return attendances.some(attendance => 
        attendance.studentId.toLowerCase() === studentId.toLowerCase()
    );
}

/**
 * Recupera presenças por matéria
 * @param {string} subject - Nome da matéria
 * @returns {Array} Array de presenças da matéria
 */
function getAttendancesBySubject(subject) {
    try {
        const attendances = getAllAttendances();
        return attendances.filter(attendance => 
            attendance.subject && attendance.subject.toLowerCase() === subject.toLowerCase()
        );
    } catch (error) {
        console.error('Erro ao recuperar presenças por matéria:', error);
        return [];
    }
}

/**
 * Recupera presenças por professor
 * @param {string} professorName - Nome do professor
 * @returns {Array} Array de presenças do professor
 */
function getAttendancesByProfessor(professorName) {
    try {
        const attendances = getAllAttendances();
        return attendances.filter(attendance => 
            attendance.professorName && 
            attendance.professorName.toLowerCase() === professorName.toLowerCase()
        );
    } catch (error) {
        console.error('Erro ao recuperar presenças por professor:', error);
        return [];
    }
}

/**
 * Recupera presenças por data
 * @param {string} date - Data no formato YYYY-MM-DD
 * @returns {Array} Array de presenças da data
 */
function getAttendancesByDate(date) {
    try {
        const attendances = getAllAttendances();
        return attendances.filter(attendance => {
            const attendanceDate = new Date(attendance.timestamp).toISOString().split('T')[0];
            return attendanceDate === date;
        });
    } catch (error) {
        console.error('Erro ao recuperar presenças por data:', error);
        return [];
    }
}

// ==========================================
// ESTATÍSTICAS E RELATÓRIOS
// ==========================================

/**
 * Calcula estatísticas gerais do sistema
 * @returns {Object} Objeto com estatísticas
 */
function calculateStatistics() {
    try {
        const sessions = getAllSessions();
        const attendances = getAllAttendances();
        
        const totalSessions = sessions.length;
        const totalAttendances = attendances.length;
        const averageAttendance = totalSessions > 0 ? 
            (totalAttendances / totalSessions).toFixed(1) : 0;
        
        // Estatísticas por matéria
        const subjectStats = {};
        sessions.forEach(session => {
            const sessionAttendances = getAttendancesBySession(session.id);
            if (!subjectStats[session.subject]) {
                subjectStats[session.subject] = {
                    sessions: 0,
                    attendances: 0
                };
            }
            subjectStats[session.subject].sessions++;
            subjectStats[session.subject].attendances += sessionAttendances.length;
        });
        
        // Estatísticas por professor
        const professorStats = {};
        sessions.forEach(session => {
            const sessionAttendances = getAttendancesBySession(session.id);
            if (!professorStats[session.professorName]) {
                professorStats[session.professorName] = {
                    sessions: 0,
                    attendances: 0
                };
            }
            professorStats[session.professorName].sessions++;
            professorStats[session.professorName].attendances += sessionAttendances.length;
        });
        
        return {
            total: {
                sessions: totalSessions,
                attendances: totalAttendances,
                average: averageAttendance
            },
            bySubject: subjectStats,
            byProfessor: professorStats
        };
    } catch (error) {
        console.error('Erro ao calcular estatísticas:', error);
        return {
            total: { sessions: 0, attendances: 0, average: 0 },
            bySubject: {},
            byProfessor: {}
        };
    }
}

/**
 * Exporta todos os dados para JSON
 * @returns {Object} Objeto com todos os dados do sistema
 */
function exportAllData() {
    try {
        const sessions = getAllSessions();
        const attendances = getAllAttendances();
        const statistics = calculateStatistics();
        
        return {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: {
                sessions,
                attendances,
                statistics
            }
        };
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        throw new Error('Falha ao exportar dados');
    }
}

/**
 * Limpa todos os dados do sistema
 * @returns {boolean} True se os dados foram limpos com sucesso
 */
function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.SESSIONS);
        localStorage.removeItem(STORAGE_KEYS.ATTENDANCES);
        console.log('Todos os dados foram limpos');
        return true;
    } catch (error) {
        console.error('Erro ao limpar dados:', error);
        return false;
    }
}

// ==========================================
// VALIDAÇÕES E VERIFICAÇÕES
// ==========================================

/**
 * Valida dados de uma nova sessão
 * @param {Object} sessionData - Dados da sessão para validar
 * @returns {Object} Resultado da validação
 */
function validateSessionData(sessionData) {
    const errors = [];
    
    if (!isValidString(sessionData.professorName)) {
        errors.push('Nome do professor é obrigatório');
    }
    
    if (!isValidString(sessionData.subject)) {
        errors.push('Matéria é obrigatória');
    }
    
    if (!sessionData.validity || sessionData.validity < 1 || sessionData.validity > 180) {
        errors.push('Validade deve ser entre 1 e 180 minutos');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida dados de presença do estudante
 * @param {Object} attendanceData - Dados da presença para validar
 * @returns {Object} Resultado da validação
 */
function validateAttendanceData(attendanceData) {
    const errors = [];
    
    if (!isValidString(attendanceData.studentName)) {
        errors.push('Nome do estudante é obrigatório');
    }
    
    if (!isValidStudentId(attendanceData.studentId)) {
        errors.push('Matrícula deve conter apenas letras e números');
    }
    
    if (!attendanceData.sessionId) {
        errors.push('ID da sessão é obrigatório');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// ==========================================
// INICIALIZAÇÃO E MANUTENÇÃO
// ==========================================

/**
 * Inicializa o sistema e executa tarefas de manutenção
 */
function initializeSystem() {
    try {
        console.log('Inicializando sistema de presença QR...');
        
        // Limpar sessões expiradas
        const removedSessions = cleanupExpiredSessions();
        if (removedSessions > 0) {
            console.log(`${removedSessions} sessões expiradas foram removidas`);
        }
        
        // Verificar integridade dos dados
        const sessions = getAllSessions();
        const attendances = getAllAttendances();
        
        console.log(`Sistema inicializado: ${sessions.length} sessões, ${attendances.length} presenças`);
        
        // Configurar limpeza automática a cada 5 minutos
        setInterval(() => {
            cleanupExpiredSessions();
        }, 5 * 60 * 1000);
        
    } catch (error) {
        console.error('Erro na inicialização do sistema:', error);
    }
}

// ==========================================
// EVENTOS E MANIPULAÇÃO DOM
// ==========================================

/**
 * Mostra uma mensagem de feedback para o usuário
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da mensagem (success, error, info)
 * @param {number} duration - Duração em ms (padrão: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Remove notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Definir cores baseadas no tipo
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #dc3545, #fd7e14)';
            break;
        case 'info':
        default:
            notification.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            break;
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após duração especificada
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Debounce function para otimizar eventos
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função com debounce aplicado
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==========================================
// INICIALIZAÇÃO AUTOMÁTICA
// ==========================================

// Inicializar sistema quando o DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
} else {
    initializeSystem();
}

// Exportar funções para uso global (se necessário)
if (typeof window !== 'undefined') {
    window.AttendanceSystem = {
        // Sessões
        saveSession,
        getSession,
        getAllSessions,
        isSessionValid,
        
        // Presenças
        saveAttendance,
        getAllAttendances,
        getAttendancesBySession,
        hasStudentAttended,
        
        // Utilitários
        generateSessionId,
        generateAttendanceId,
        formatDateTime,
        formatTime,
        formatDate,
        
        // Validações
        validateSessionData,
        validateAttendanceData,
        
        // Estatísticas
        calculateStatistics,
        exportAllData,
        clearAllData,
        
        // UI
        showNotification,
        debounce
    };
}
