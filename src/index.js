const startMenuButton = document.getElementById('start-menu-button');
const startMenu = document.getElementById('start-menu');
const bootScreen = document.getElementById('boot-screen');
const progressBar = document.getElementById('boot-progress');
const bootStatus = document.getElementById('boot-status');
const Time = document.getElementById('time');
const day = document.getElementById('date');
const widgetTime = document.getElementById('widget-time');
const widgetDate = document.getElementById('widget-date');

const statuses = [
        "Loading system core...",
        "Initializing desktop environment...",
        "Starting services...",
        "Welcome"
    ];
let progress = 0;
const totalBootTime = 5000;
const intervalTime = 50;
const increment = (intervalTime / totalBootTime) * 100;
let activeWindow = null;
let startX = 0;
let startY = 0;
let initialX = 0;
let initialY = 0;

document.addEventListener('DOMContentLoaded', () => {
    startMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && !startMenuButton.contains(e.target)) {
            startMenu.classList.add('hidden');
        }
    });
});

// Handle Boot Sequence & Login Screen
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        bootScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            bootScreen.remove();
        }, 100);
    }, 1000);
});

document.addEventListener('DOMContentLoaded', () => {
    const bootInterval = setInterval(() => {
        progress += increment;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(bootInterval);
            bootScreen.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                bootScreen.remove();
            }, 700);
        }
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (bootStatus) {
            if (progress > 75) bootStatus.textContent = statuses[3];
            else if (progress > 50) bootStatus.textContent = statuses[2];
            else if (progress > 25) bootStatus.textContent = statuses[1];
        }
    }, intervalTime);
});

// App Window Management

// Universal Window Draging FUnction

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('mousedown', (e) => {
        const header = e.target.closest('.window-header');
        if (!header) return;
        activeWindow = header.closest('.main-window') || header.closest('.app-window');
        if (!activeWindow) return;
        activeWindow.style.zIndex = 100;
        startX = e.clientX;
        startY = e.clientY;
        const rect = activeWindow.getBoundingClientRect();
        if (activeWindow.classList.contains('transform')) {
            activeWindow.classList.remove('top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2');
            activeWindow.style.left = `${rect.left}px`;
            activeWindow.style.top = `${rect.top}px`;
        }
        initialX = rect.left;
        initialY = rect.top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!activeWindow) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        activeWindow.style.left = `${initialX + dx}px`;
        activeWindow.style.top = `${initialY + dy}px`;
    });

    document.addEventListener('mouseup', () => {
        activeWindow = null;
    });
});

function openApp(appId) {
    const app = document.getElementById(appId);
    if (app) {
        app.classList.remove('hidden');
    }
    // Close start menu when an app is launched
    document.getElementById('start-menu').classList.add('hidden');
}

function closeApp(appId) {
    const app = document.getElementById(appId);
    if (app) {
        app.classList.add('hidden');
    }
}

function maximize(appId) {
     const app = document.getElementById(appId);
    if (!app) return;
    if (app.dataset.maximized === 'true') {
        minimize(appId);
        return;
    }
    app.dataset.prev = JSON.stringify({
        left: app.style.left,
        top: app.style.top,
        width: app.style.width,
        height: app.style.height,
        transform: app.style.transform,
        borderRadius: app.style.borderRadius
    });
    app.dataset.maximized = 'true';
    app.style.left = '0';
    app.style.top = '0';
    app.style.width = '100%';
    app.style.height = 'calc(100% - 3rem)';
    app.style.transform = 'none';
    app.style.borderRadius = '0';
}


function minimize(appId) {
    const app = document.getElementById(appId);
    if (!app || app.dataset.maximized !== 'true') return;
    const prev = JSON.parse(app.dataset.prev || '{}');
    app.style.left = prev.left || '';
    app.style.top = prev.top || '';
    app.style.width = prev.width || '';
    app.style.height = prev.height || '';
    app.style.transform = prev.transform || '';
    app.style.borderRadius = prev.borderRadius || '';
    delete app.dataset.maximized;
}

// Calculator Logic
function appendtodisplay(value) {
    const display = document.getElementById('calculator-display');
    display.value += value;
}

function cleardisplay() {
    const display = document.getElementById('calculator-display');
    display.value = '';
}

function deleteLastChar() {
    const display = document.getElementById('calculator-display');
    display.value = display.value.slice(0, -1);
}

function calculate() {
    const display = document.getElementById('calculator-display');
    if (!display.value) return;
    
    try {
        // Safely evaluate math expression string
        display.value = Function(`'use strict'; return (${display.value})`)();
    } catch (error) {
        display.value = 'Error';
        setTimeout(() => cleardisplay(), 1500);
    }
}

// Settings App Logic

// Wallpaper logic
function setWallpaper(wallpaperUrl) {
    document.body.style.backgroundImage = `url('${wallpaperUrl}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
}

// Clock Logic
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    Time.textContent = `${hours}:${minutes}:${seconds}`;
    day.textContent = now.toDateString();
    widgetTime.textContent = `${hours}:${minutes}:${seconds}`;
    widgetDate.textContent = now.toDateString();
}

// Right Click Functions

setInterval(updateClock, 1000);