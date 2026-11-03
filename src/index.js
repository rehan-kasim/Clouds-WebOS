const startMenuButton = document.getElementById('start-menu-button');
const startMenu = document.getElementById('start-menu');
const bootScreen = document.getElementById('boot-screen');
const progressBar = document.getElementById('boot-progress');
const bootStatus = document.getElementById('boot-status');
const Time = document.getElementById('time');
const day = document.getElementById('date');
const widgetTime = document.getElementById('widget-time');
const widgetDate = document.getElementById('widget-date');

const TASKBAR_H = 48; // h-12
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
let startX = 0, startY = 0, initialX = 0, initialY = 0;
let topZ = 100; // windows count up from here

// ---------- Layering ----------
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('taskbar').style.zIndex = 9000;
    bootScreen.style.zIndex = 99999;
});

function bringToFront(app) {
    topZ += 1;
    app.style.zIndex = topZ;
}

// ---------- Start menu ----------
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

// ---------- Boot sequence ----------
document.addEventListener('DOMContentLoaded', () => {
    const bootInterval = setInterval(() => {
        progress += increment;

        if (progress >= 100) {
            progress = 100;
            clearInterval(bootInterval);
            bootScreen.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => bootScreen.remove(), 700);
        }
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (bootStatus) {
            if (progress > 75) bootStatus.textContent = statuses[3];
            else if (progress > 50) bootStatus.textContent = statuses[2];
            else if (progress > 25) bootStatus.textContent = statuses[1];
        }
    }, intervalTime);
});

// ---------- show / hide helpers ----------
function showWin(app) {
    app.classList.remove('hidden');
    app.style.display = '';
    if (getComputedStyle(app).display === 'none') app.style.display = 'block';
}

function hideWin(app) {
    app.classList.add('hidden');
    app.style.display = '';
}

// ---------- Window placement (centered on the screen, above the taskbar) ----------
function placeWindowCenter(app) {
    app.classList.remove('top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2');
    app.style.transform = 'none';
    app.style.translate = 'none';
    app.style.position = 'fixed';

    const w = app.offsetWidth;
    const h = app.offsetHeight;
    app.style.left = Math.max(0, (window.innerWidth - w) / 2) + 'px';
    app.style.top = Math.max(0, (window.innerHeight - TASKBAR_H - h) / 2) + 'px';
    app.dataset.placed = 'true';
}

// ---------- Dragging ----------
document.addEventListener('DOMContentLoaded', () => {
    // clicking anywhere on a window brings it to the front
    document.addEventListener('mousedown', (e) => {
        const win = e.target.closest('.main-window');
        if (win) bringToFront(win);
    });

    document.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;                  // left click only
        if (e.target.closest('button')) return;      // header buttons are not drag handles
        const header = e.target.closest('.window-header');
        if (!header) return;

        const win = header.closest('.main-window');
        if (!win || win.dataset.maximized === 'true' || win.dataset.animating === 'true') return;

        if (win.dataset.placed !== 'true') placeWindowCenter(win);

        activeWindow = win;
        startX = e.clientX;
        startY = e.clientY;
        initialX = parseFloat(win.style.left) || 0;
        initialY = parseFloat(win.style.top) || 0;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!activeWindow) return;

        let left = initialX + (e.clientX - startX);
        let top = initialY + (e.clientY - startY);

        // keep the header reachable
        left = Math.min(Math.max(left, 80 - activeWindow.offsetWidth), window.innerWidth - 80);
        top = Math.min(Math.max(top, 0), window.innerHeight - TASKBAR_H - 30);

        activeWindow.style.left = left + 'px';
        activeWindow.style.top = top + 'px';
    });

    document.addEventListener('mouseup', () => { activeWindow = null; });
});

// ---------- Taskbar line under the icon ----------
function setIndicator(appId, on) {
    const ind = document.querySelector(`#taskbar-icons [data-app="${appId}"] .indicator`);
    if (ind) ind.style.opacity = on ? '1' : '0';
}

// ---------- Open / Close ----------
function openApp(appId) {
    const app = document.getElementById(appId);
    startMenu.classList.add('hidden');
    if (!app) { console.error('No window with id:', appId); return; }
    if (app.dataset.animating === 'true') return;

    const wasHidden = app.classList.contains('hidden');
    const wasMinimized = app.dataset.minimized === 'true';

    // already open on screen -> just bring to front
    if (!wasHidden) {
        bringToFront(app);
        return;
    }

    showWin(app);
    if (app.dataset.placed !== 'true') placeWindowCenter(app);
    bringToFront(app);
    setIndicator(appId, true);

    if (wasMinimized) {
        delete app.dataset.minimized;
        app.style.visibility = 'hidden'; // hide the real window while the ghost plays
        const g = genieGhost(app, appId);
        if (g) {
            playGhost(app, g, { duration: 500, easing: 'ease-out', direction: 'reverse' },
                () => { app.style.visibility = ''; });
        } else {
            app.style.visibility = '';
        }
    }
}

function closeApp(appId) {
    const app = document.getElementById(appId);
    if (!app) return;
    hideWin(app);
    app.style.visibility = '';
    delete app.dataset.minimized;
    delete app.dataset.animating;
    setIndicator(appId, false);
}

// ---------- Maximize / Restore ----------
function maximize(appId) {
    const app = document.getElementById(appId);
    if (!app || app.dataset.animating === 'true') return;

    if (app.dataset.maximized === 'true') {
        restorewindow(appId);
        return;
    }
    if (app.dataset.placed !== 'true') placeWindowCenter(app);

    app.dataset.prev = JSON.stringify({
        left: app.style.left, top: app.style.top,
        width: app.style.width, height: app.style.height,
        borderRadius: app.style.borderRadius
    });
    app.dataset.maximized = 'true';

    app.style.left = '0px';
    app.style.top = '0px';
    app.style.width = '100%';
    app.style.height = `calc(100% - ${TASKBAR_H}px)`;
    app.style.borderRadius = '0';
    bringToFront(app);
}

function restorewindow(appId) {
    const app = document.getElementById(appId);
    if (!app || app.dataset.maximized !== 'true') return;
    const prev = JSON.parse(app.dataset.prev || '{}');
    app.style.left = prev.left || '0px';
    app.style.top = prev.top || '0px';
    app.style.width = prev.width || '';
    app.style.height = prev.height || '';
    app.style.borderRadius = prev.borderRadius || '';
    delete app.dataset.maximized;
}

// ---------- Genie animation woowww ----------
// Animates a temporary copy (ghost) of the window so it never fights with your classes.
function genieGhost(app, appId) {
    const icon = document.querySelector(`#taskbar-icons [data-app="${appId}"]`);
    if (!icon) return null;

    const a = app.getBoundingClientRect();
    const i = icon.getBoundingClientRect();
    const dx = (i.left + i.width / 2) - (a.left + a.width / 2);
    const dy = (i.top + i.height / 2) - (a.top + a.height / 2);
    const radius = getComputedStyle(app).borderRadius;

    const ghost = app.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    ghost.classList.remove('hidden', 'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2');
    ghost.style.cssText =
        `position:fixed;left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;` +
        `margin:0;transform:none;translate:none;border-radius:${radius};` +
        `pointer-events:none;z-index:8000;`;
    document.body.appendChild(ghost);

    // every clip-path needs the same number of points so it can interpolate
    const frames = [
        { transform: 'translate(0px,0px) scale(1,1)', opacity: 1,
          clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)' },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5}px) scale(0.8,0.6)`, opacity: 1, offset: 0.55,
          clipPath: 'polygon(0% 0%,100% 0%,70% 100%,30% 100%)' },
        { transform: `translate(${dx}px,${dy}px) scale(0.05,0.05)`, opacity: 0.2,
          clipPath: 'polygon(40% 0%,60% 0%,52% 100%,48% 100%)' }
    ];
    return { ghost, frames };
}

// runs the ghost animation and ALWAYS cleans up, even if the animation gets cancelled
function playGhost(app, g, options, done) {
    app.dataset.animating = 'true';
    let ended = false;
    const end = () => {
        if (ended) return;
        ended = true;
        g.ghost.remove();
        delete app.dataset.animating;
        if (done) done();
    };
    const anim = g.ghost.animate(g.frames, options);
    anim.onfinish = end;
    anim.oncancel = end;
    setTimeout(end, options.duration + 200); // safety net
}

function minimize(appId) {
    const app = document.getElementById(appId);
    if (!app || app.dataset.animating === 'true') return;

    const g = genieGhost(app, appId);   // measure BEFORE hiding
    app.dataset.minimized = 'true';
    hideWin(app);                       // real window hides, ghost plays instead
    if (g) playGhost(app, g, { duration: 500, easing: 'ease-in', fill: 'forwards' });
}

// ---------- Calculator Logic ----------
function appendtodisplay(value) {
    document.getElementById('calculator-display').value += value;
}

function cleardisplay() {
    document.getElementById('calculator-display').value = '';
}

function deleteLastChar() {
    const display = document.getElementById('calculator-display');
    display.value = display.value.slice(0, -1);
}

function calculate() {
    const display = document.getElementById('calculator-display');
    if (!display.value) return;

    try {
        display.value = Function(`'use strict'; return (${display.value})`)();
    } catch (error) {
        display.value = 'Error';
        setTimeout(() => cleardisplay(), 1500);
    }
}

// ---------- Settings App Logic ----------
function setWallpaper(wallpaperUrl) {
    document.body.style.backgroundImage = `url('${wallpaperUrl}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
}

// ---------- Clock Logic ----------
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

updateClock();
setInterval(updateClock, 1000);