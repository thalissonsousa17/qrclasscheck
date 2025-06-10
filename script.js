// Funções de Utilitário para gerenciar dados no localStorage
function initializeSystem() {
    if (!localStorage.getItem('attendanceSessions')) {
        localStorage.setItem('attendanceSessions', JSON.stringify([]));
    }
    if (!localStorage.getItem('attendanceRecords')) {
        localStorage.setItem('attendanceRecords', JSON.stringify([]));
    }
}

function generateSessionId() {
    return 'sess-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function generateAttendanceId() {
    return 'att-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function saveSession(session) {
    const sessions = getAllSessions();
    sessions.push(session);
    localStorage.setItem('attendanceSessions', JSON.stringify(sessions));
}

function getSession(sessionId) {
    const sessions = getAllSessions();
    return sessions.find(s => s.id === sessionId);
}

function getAllSessions() {
    return JSON.parse(localStorage.getItem('attendanceSessions') || '[]');
}

function saveAttendance(attendance) {
    const attendances = getAllAttendances();
    attendances.push(attendance);
    localStorage.setItem('attendanceRecords', JSON.stringify(attendances));
}

function getAllAttendances() {
    return JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// NOVAS FUNÇÕES PARA GERENCIAR A SESSÃO ATIVA DO QR CODE
function saveActiveQrSession(sessionData) {
    localStorage.setItem('currentActiveQrSession', JSON.stringify(sessionData));
}

function getActiveQrSession() {
    const data = localStorage.getItem('currentActiveQrSession');
    return data ? JSON.parse(data) : null;
}

function removeActiveQrSession() {
    localStorage.removeItem('currentActiveQrSession');
}