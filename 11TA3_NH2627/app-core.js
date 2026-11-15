// ==========================================
// APP-CORE.JS: Firebase, State, Utils & Smart Alerts
// ==========================================
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.keyCode === 123 || e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) e.preventDefault();
    if (e.ctrlKey && ['u','U','s','S'].includes(e.key)) e.preventDefault();
});

const firebaseConfig = {
    apiKey: "AIzaSyATUD-ddUU2Dg-3vpB9K8dO1W0FzK7ZIFI",
    authDomain: "ta3nh2627.firebaseapp.com",
    projectId: "ta3nh2627",
    storageBucket: "ta3nh2627.firebasestorage.app",
    messagingSenderId: "276398143272",
    appId: "1:276398143272:web:a32d4c9fe908c5ca4c821d",
    measurementId: "G-6D1FFK998C"
};
firebase.initializeApp(firebaseConfig);
firebase.firestore().settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED });
const db = firebase.firestore();

const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resizeCanvas;
resizeCanvas();
for (let i = 0; i < 30; i++) {
    particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 2 + 1, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3 });
}
function animateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    particles.forEach(p => {
        p.x += p.speedX; p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(animateCanvas);
}
animateCanvas();

let notifications = [], homeworks = [], albums = [], banners = [], formsList = [], subAccounts = [], trashBin = [], scheduleUrl = "";
let examSchedules = [], tempExamList = [], adminExamSubTab = '', editingExamDocId = null, tempExamFileUrl = '', isEditingModalActive = false, isEditingTempModalActive = false;
let tempHkSubjectList = [], editingHkSubIndex = null, editingTempExamIndex = null;
let currentUser = null, currentView = 'home', notiPageOffset = 0, homeworkPageOffset = 0, albumIndex = 0, editingNotiId = null, editingAlbumId = null;
let currentMultiLinks = [], currentHwMultiLinks = [], currentAlbumLinks = [], currentBannerLinks = [];
let tempPostTitle = "", tempPostContent = "", tempPostPdf = "", tempHwContent = "", tempHwPdf = "", tempAlbumTitle = "";
let menuState = { adminAccSub: false, adminNotiSub: false, adminMediaSub: false };
let lastCreatedAccountInfo = "Chưa có thông tin tài khoản được tạo...";

function parseGoogleDriveLink(url) {
    if (!url) return ""; url = url.trim(); if (url.startsWith('data:')) return url;
    let match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
    return (match && match[1]) ? `https://lh3.googleusercontent.com/d/${match[1]}` : url;
}

function parseGoogleDrivePdfEmbed(url) {
    if (!url) return ""; url = url.trim();
    let match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
    return (match && match[1]) ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
}

function parseGoogleDrivePdfDownload(url) {
    if (!url) return ""; url = url.trim();
    let match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/);
    return (match && match[1]) ? `https://drive.google.com/uc?export=download&id=${match[1]}` : url;
}

function getDayDiffFromToday(targetDateStr) {
    if (!targetDateStr) return 999;
    let today = new Date(); today.setHours(0, 0, 0, 0);
    let parts = targetDateStr.split('-');
    if (parts.length !== 3) return 999;
    let target = new Date(parts[0], parts[1] - 1, parts[2]); target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
}

function formatDateToDDMMYY(dateStr) {
    if (!dateStr) return "";
    let p = dateStr.split('-');
    return (p.length !== 3) ? dateStr : `${p[2]}/${p[1]}/${p[0].substring(2)}`;
}

function capitalizeSubject(val) {
    if (!val) return "";
    val = val.trim();
    return val.charAt(0).toUpperCase() + val.slice(1);
}

function getValidExams() {
    return examSchedules.filter(item => getDayDiffFromToday(item.examDate) >= 0).sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
}

function getAdaptiveGreetingBanner(isMainHome = false) {
    let currentHour = new Date().getHours();
    let visitorGreeting = (currentHour < 12) ? "Chào buổi sáng! Chúc bạn và gia đình một ngày mới ngập tràn niềm vui, năng lượng tích cực và thật nhiều may mắn! ✨" : (currentHour < 18 ? "Chúc bạn một buổi chiều ấm áp, công việc thuận lợi và luôn giữ trọn nụ cười rạng rỡ trên môi! 🌟" : "Chúc bạn một buổi tối an lành, thảnh thơi bên người thân và có một giấc ngủ thật ngon! 🌙");
    let visitorBg = (currentHour < 12) ? "linear-gradient(135deg, #fff9db 0%, #ffe8cc 100%)" : (currentHour < 18 ? "linear-gradient(135deg, #e3fafc 0%, #c5f6fa 100%)" : "linear-gradient(135deg, #f3f0ff 0%, #e5dbff 100%)");
    let visitorColor = (currentHour < 12) ? "#d9480f" : (currentHour < 18 ? "#0c8599" : "#5f3dc4");
    if (isMainHome) return `<div class="landscape-greeting" style="background:${visitorBg}; color:${visitorColor}; padding:22px 24px; border-radius:12px; margin:0 auto 12px auto; font-family:'Dancing Script', cursive; font-size:clamp(1.6rem, 3.2vw, 2.3rem); font-weight:700; text-align:center; box-shadow:0 3px 12px rgba(0,0,0,0.05); width:100%; max-width:900px; box-sizing:border-box; line-height:1.45; text-wrap:balance;">${visitorGreeting}</div>`;
    return `<div class="landscape-greeting" style="background:${visitorBg}; color:${visitorColor}; padding:6px 12px; border-radius:8px; margin:0 auto 6px auto; font-family:'Dancing Script', cursive; font-size:clamp(0.95rem, 1.8vw, 1.05rem); font-weight:700; text-align:center; box-shadow:0 2px 6px rgba(0,0,0,0.03); flex-shrink:0; line-height:1.3; text-wrap:balance; width:100%; box-sizing:border-box;">${visitorGreeting}</div>`;
}

function openSmartAlertModal(htmlContent) {
    let m = document.getElementById('smartAlertModal');
    let b = document.getElementById('smartAlertModalBody');
    if (m && b) {
        b.innerHTML = htmlContent;
        m.style.display = 'flex';
    }
}

function closeSmartAlertModal() {
    let m = document.getElementById('smartAlertModal');
    if (m) m.style.display = 'none';
}

/* HỆ THỐNG CẢNH BÁO THÔNG MINH TOÀN DIỆN CHO TẤT CẢ CÁC THẺ PHẦN A */
function getCrossNotificationBanners(currentTab) {
    let bannersHtml = '';
    
    // 1. Cảnh báo kiểm tra khẩn cấp (1-2 ngày tới) -> hiển thị ở mọi thẻ trừ thẻ xem lịch kiểm tra
    let urgentExamsCount = getValidExams().filter(item => { let diff = getDayDiffFromToday(item.examDate); return diff === 1 || diff === 2; }).length;
    if (currentTab !== 'exam_schedule_view' && urgentExamsCount > 0) {
        let pulseClass = (currentTab === 'forms_user_list' || currentTab === 'noti_list' || currentTab === 'homework_list') ? ' pulse-banner' : '';
        bannersHtml += `<div class="alert-banner-home landscape-alert${pulseClass}" onclick="closeSmartAlertModal(); switchView('exam_schedule_view')">⚠️ BẠN CÓ ${urgentExamsCount} BÀI KIỂM TRA TRONG VÀI NGÀY TỚI, HÃY CLICK VÀO ĐÂY ĐỂ XEM CHI TIẾT! 🔔</div>`;
    }

    // 2. Tính số lượng thông báo mới trong 24-48h
    let now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let newNotiCount = notifications.filter(n => {
        if (!n.date) return false;
        let dateParts = n.date.split(' ')[0].split('-');
        return dateParts.length === 3 && new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) >= yesterday;
    }).length;

    // 3. Tìm báo bài mới nhất còn hiệu lực
    let recentHw = null, sortedHw = [...homeworks].sort((a,b) => b.id - a.id);
    if (sortedHw.length > 0) {
        let latestHw = sortedHw[0];
        if (latestHw.title) {
            let matchDate = latestHw.title.match(/ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
            if (matchDate) {
                let deadline = new Date(parseInt(matchDate[3], 10), parseInt(matchDate[2], 10) - 1, parseInt(matchDate[1], 10), 17, 0, 0, 0);
                if (now <= deadline) recentHw = latestHw;
            } else if (latestHw.date) {
                let dParts = latestHw.date.split(' ')[0].split('-');
                if (dParts.length === 3) {
                    let deadline = new Date(parseInt(dParts[0],10), parseInt(dParts[1],10)-1, parseInt(dParts[2],10), 17, 0, 0, 0);
                    deadline.setDate(deadline.getDate() + 1);
                    if (now <= deadline) recentHw = latestHw;
                }
            }
        }
    }

    let hwDatePhrase = "";
    if (recentHw && recentHw.title) {
        let match = recentHw.title.match(/thứ\s+[^\s,]+\s+ngày\s+\d{1,2}\/\d{1,2}\/\d{4}/i);
        hwDatePhrase = match ? match[0] : recentHw.title.replace(/^BÁO BÀI\s*/i, '');
    }

    // 4. Phân luồng hiển thị thông minh theo thẻ hiện tại
    let showNoti = (newNotiCount > 0) && (currentTab !== 'noti_list') && (currentTab !== 'full_detail');
    let showHw = Boolean(hwDatePhrase) && (currentTab !== 'homework_list') && (currentTab !== 'homework_detail');
    let pulseClass = (currentTab === 'forms_user_list' || currentTab === 'noti_list' || currentTab === 'homework_list') ? ' pulse-banner' : '';

    if (showNoti && showHw) {
        bannersHtml += `<div class="smart-notice-banner landscape-alert${pulseClass}" onclick="closeSmartAlertModal(); switchView('homework_list')">📢 Bạn có ${newNotiCount} thông báo mới và báo bài cho ngày ${hwDatePhrase}, bạn vào xem nhé! 📚</div>`;
    } else if (showNoti) {
        bannersHtml += `<div class="smart-notice-banner landscape-alert${pulseClass}" onclick="closeSmartAlertModal(); switchView('noti_list')">📢 Bạn có ${newNotiCount} thông báo mới, bạn vào xem nhé!</div>`;
    } else if (showHw) {
        bannersHtml += `<div class="smart-notice-banner landscape-alert${pulseClass}" onclick="closeSmartAlertModal(); switchView('homework_list')">📚 Bạn có báo bài cho ngày ${hwDatePhrase}, bạn vào xem nhé!</div>`;
    }

    return bannersHtml;
}

function togglePasswordVisibility() {
    let passInput = document.getElementById('loginPass');
    let toggleBtn = document.querySelector('.toggle-password');
    if (passInput.type === 'password') { passInput.type = 'text'; toggleBtn.innerText = '🙈'; }
    else { passInput.type = 'password'; toggleBtn.innerText = '👁️'; }
}

function initRealtimeDatabase() {
    db.collection("notifications").onSnapshot( s => { notifications = []; s.forEach(d => notifications.push({ ...d.data(), docId: d.id })); renderApp(); });
    db.collection("homeworks").onSnapshot( s => { homeworks = []; s.forEach(d => homeworks.push({ ...d.data(), docId: d.id })); renderApp(); });
    db.collection("albums").onSnapshot( s => { albums = []; s.forEach(d => { if (d.data().title !== "Album banner") albums.push({ ...d.data(), docId: d.id }); }); renderApp(); });
    db.collection("trashBin").onSnapshot( s => { trashBin = []; s.forEach(d => trashBin.push({ ...d.data(), docId: d.id })); renderApp(); });
    db.collection("subAccounts").onSnapshot( s => {
        subAccounts = []; s.forEach(d => subAccounts.push({ ...d.data(), docId: d.id }));
        if (!subAccounts.find(a => a.name === "admin")) subAccounts.push({ name: "admin", pass: "ad1234", studentName: "Quản Trị Viên Phụ", isAdmin: true });
        renderApp();
    });
    db.collection("settings").doc("general").onSnapshot( d => {
        if (d.exists) {
            let data = d.data();
            if (data.scheduleUrl !== undefined) scheduleUrl = data.scheduleUrl;
            if (data.banners && Array.isArray(data.banners)) banners = data.banners;
            if (data.formsList && Array.isArray(data.formsList)) formsList = data.formsList;
            renderApp();
        }
    });
    db.collection("exam_schedules").onSnapshot( s => { examSchedules = []; s.forEach(d => examSchedules.push({ ...d.data(), docId: d.id })); renderApp(); });
}

async function autoCleanupExpiredExams() {
    if (!currentUser) return;
    try {
        let batch = db.batch(), hasExpired = false;
        examSchedules.forEach(item => {
            if (getDayDiffFromToday(item.examDate) < 0 && item.docId) { batch.delete(db.collection("exam_schedules").doc(item.docId)); hasExpired = true; }
        });
        if (hasExpired) await batch.commit();
    } catch (e) { console.log("Lỗi tự dọn dẹp:", e); }
}

async function saveSettingsToFirebase() {
    return db.collection("settings").doc("general").set({ banners: banners || [], formsList: formsList || [], scheduleUrl: scheduleUrl || "" }, { merge: true });
}

function checkDirectFileSizeLimit(input) {
    if (input.files && input.files.length > 0) {
        let totalBytes = 0; for (let i = 0; i < input.files.length; i++) totalBytes += input.files[i].size;
        if (totalBytes > 750 * 1024) { alert("⚠️ Dung lượng ảnh tải lên quá lớn (tối đa 1MB)! Vui lòng dùng link Google Drive để ảnh nét và nhẹ hơn."); input.value = ""; }
    }
}