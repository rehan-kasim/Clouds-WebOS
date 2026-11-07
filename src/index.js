const startMenuButton = document.getElementById('start-menu-button');
const startMenu = document.getElementById('start-menu');
const bootScreen = document.getElementById('boot-screen');
const progressBar = document.getElementById('boot-progress');
const bootStatus = document.getElementById('boot-status');
const Time = document.getElementById('time');
const day = document.getElementById('date');
const widgetTime = document.getElementById('widget-time');
const widgetDate = document.getElementById('widget-date');

const TASKBAR_H = 56;
const statuses = [
    "Loading system core...",
    "Initializing desktop environment...",
    "Starting services...",
    "Welcome"
];
let progress = 0;
const totalBootTime = 1000;
const intervalTime = 50;
const increment = (intervalTime / totalBootTime) * 100;

let activeWindow = null;
let startX = 0, startY = 0, initialX = 0, initialY = 0;
let topZ = 100;

// taskbar has to stay above the windows, boot screen above everything
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('taskbar').style.zIndex = 9000;
    bootScreen.style.zIndex = 99999;
});

function bringToFront(app) {
    topZ += 1;
    app.style.zIndex = topZ;
}

// start menu
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

// boot screen
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

function showWin(app) {
    app.classList.remove('hidden');
    app.style.display = '';
    // some builds ignore the class change, force it
    if (getComputedStyle(app).display === 'none') app.style.display = 'block';
}

function hideWin(app) {
    app.classList.add('hidden');
    app.style.display = '';
}

// plain px instead of the tailwind translate stuff, it kept fighting with dragging
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

// dragging
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('mousedown', (e) => {
        const win = e.target.closest('.main-window');
        if (win) bringToFront(win);
    });

    document.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button')) return; // dont drag when clicking - [] x
        const header = e.target.closest('.window-header');
        if (!header) return;

        const win = header.closest('.main-window');
        if (!win || win.dataset.maximized === 'true' || win.dataset.animating === 'true') return;

        if (win.dataset.placed !== 'true') placeWindowCenter(win);

        activeWindow = win;
        document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');
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

        left = Math.min(Math.max(left, 80 - activeWindow.offsetWidth), window.innerWidth - 80);
        top = Math.min(Math.max(top, 0), window.innerHeight - TASKBAR_H - 30);

        activeWindow.style.left = left + 'px';
        activeWindow.style.top = top + 'px';
    });

    document.addEventListener('mouseup', () => {
    activeWindow = null;
    document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = '');
});
});

function setIndicator(appId, on) {
    const ind = document.querySelector(`#taskbar-icons [data-app="${appId}"] .indicator`);
    if (ind) ind.style.opacity = on ? '1' : '0';
}

function openApp(appId) {
    const app = document.getElementById(appId);
    startMenu.classList.add('hidden');
    if (!app) { console.error('No window with id:', appId); return; }
    if (app.dataset.animating === 'true') return;

    const wasHidden = app.classList.contains('hidden');
    const wasMinimized = app.dataset.minimized === 'true';

    if (!wasHidden) {
        bringToFront(app);
        return;
    }

    showWin(app);
    if (app.dataset.placed !== 'true') placeWindowCenter(app);
    bringToFront(app);
    setIndicator(appId, true);
    bringToFront(app);
    setIndicator(appId, true);
    if (appId == 'weather-app')
        loadWeather();

    if (wasMinimized) {
        delete app.dataset.minimized;
        app.style.visibility = 'hidden';
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

// genie animation woowww
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
    ghost.querySelectorAll('iframe').forEach(f => f.remove());
    ghost.classList.remove('hidden', 'top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2');
    ghost.style.cssText =
        `position:fixed;left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;` +
        `margin:0;transform:none;translate:none;border-radius:${radius};` +
        `pointer-events:none;z-index:8000;`;
    document.body.appendChild(ghost);

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
    setTimeout(end, options.duration + 200);
}

function minimize(appId) {
    const app = document.getElementById(appId);
    if (!app || app.dataset.animating === 'true') return;

    const g = genieGhost(app, appId);
    app.dataset.minimized = 'true';
    hideWin(app);
    if (g) playGhost(app, g, { duration: 500, easing: 'ease-in', fill: 'forwards' });
}

// calculator
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

// wallpaper
function setWallpaper(wallpaperUrl) {
    document.body.style.backgroundImage = `url('${wallpaperUrl}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
}

// clock
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

// weather app logic
const ApiKey = '1d67ecf8acbc6348a362b908df6b380c';
const city = document.getElementById('CityName');
const temp = document.getElementById('temperatureinfo');
const humidity = document.getElementById('humidityinfo');
const sky = document.getElementById('skyinfo');
const emoji = document.getElementById('emojiinfo');
const widgetcity = document.getElementById('widget-city');
const widgettemp = document.getElementById('widget-temp');
const WEATHER_EVERY = 10 * 60 * 1000;

let lastWeather = 0;
let weatherData = null;   // cached last response
let weatherLoading = false;

function weatherEmoji(main, icon) {
    const night = icon.endsWith('n');
    if (main === 'Clear') return night ? '🌙' : '🌞';
    if (main === 'Clouds') return '☁️';
    if (main === 'Rain') return '🌧️';
    if (main === 'Drizzle') return '🌦️';
    if (main === 'Thunderstorm') return '⛈️';
    if (main === 'Snow') return '❄️';
    return '🌫️';
}

async function getLocation() {
    try {
        const res = await fetch('https://ipwho.is/');
        const data = await res.json();
        if (data.success) return { lat: data.latitude, lon: data.longitude };
    } catch (err) {
        console.log('ip lookup failed, using delhi');
    }
    return { lat: 28.61, lon: 77.21 };
}

// draws the data into BOTH the widget and the app window
function renderWeather(data) {
    const t = `${Math.round(data.main.temp)}°C`;
    widgetcity.textContent = data.name;
    widgettemp.textContent = t;
    city.textContent = data.name;
    temp.textContent = t;
    humidity.textContent = `Humidity: ${data.main.humidity}%`;
    sky.textContent = `Sky: ${data.weather[0].main}`;
    emoji.textContent = weatherEmoji(data.weather[0].main, data.weather[0].icon);
}

async function loadWeather() {
    if (weatherData && Date.now() - lastWeather < WEATHER_EVERY) {
        renderWeather(weatherData);
        return;
    }
    if (weatherLoading) return;
    weatherLoading = true;
    city.textContent = 'Loading...';

    try {
        const loc = await getLocation();
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&units=metric&appid=${ApiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('openweather said ' + res.status);
        weatherData = await res.json();
        lastWeather = Date.now();
        renderWeather(weatherData);
    } catch (err) {
        console.log('weather failed:', err);
        city.textContent = 'No data';
        sky.textContent = "Couldn't load weather";
        widgetcity.textContent = 'No data';
    } finally {
        weatherLoading = false;
    }
}
// stopwatch logic
const stopwatchtime = document.getElementById('stopwatch-time');
const stopwatchstart = document.getElementById('stopwatch-start');
const stopwatchstop = document.getElementById('stopwatch-stop');
const stopwatchreset = document.getElementById('stopwatch-reset');

let swtimer = null;
let totaltime = 0;

function showStopwatch(){
    const mins = Math.floor(totaltime / 60000).toString().padStart(2, '0');
    const secs = Math.floor((totaltime % 60000) / 1000).toString().padStart(2, '0');
    const cs = Math.floor((totaltime % 1000) / 10).toString().padStart(2, '0');
    stopwatchtime.textContent = `${mins}:${secs}.${cs}`;
}

stopwatchstart.onclick = function() {
    if (swtimer) return; // already running, dont start a second timer
    swtimer = setInterval(() => {
        totaltime += 10;
        showStopwatch();
    }, 10);
    console.log("btn prsed")
};

stopwatchstop.onclick = function() {
    clearInterval(swtimer);
    swtimer = null;
};

stopwatchreset.onclick = function() {
    clearInterval(swtimer);
    swtimer = null;
    totaltime = 0;
    showStopwatch();
};

// browser logic
const browserFrame = document.getElementById('browser-frame');
const browserUrlInput = document.getElementById('browser-url');

function go_to_url(url) {
    urltogo = browserUrlInput.value.trim();
    browserFrame.src = urltogo;
}

function refresh_browser() {
    browserFrame.src = browserFrame.src;
}

// right click menu logic
const rightClickMenu = document.getElementById('right-click-menu');

function hideRightClickMenu() {
    rightClickMenu.classList.add('hidden');
}

function showRightClickMenu(x, y) {
    rightClickMenu.style.left = `${x}px`;
    rightClickMenu.style.top = `${y}px`;
    rightClickMenu.classList.remove('hidden');
}

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showRightClickMenu(e.clientX, e.clientY);
});

document.addEventListener('click', (e) => {
    if (!rightClickMenu.contains(e.target)) {
        hideRightClickMenu();
    }
});

function changewallpaperrandom() {
    let wallpapers = ['assets/wallpapers/wallpaper1.jpg', 'assets/wallpapers/wallpaper2.jpg', 'assets/wallpapers/wallpaper3.jpg',"assets/wallpapers/wallpaper4.jpg","assets/wallpapers/wallpaper5.jpg","assets/wallpapers/wallpaper6.jpg","assets/wallpapers/wallpaper7.jpg","assets/wallpapers/wallpaper8.jpg","assets/wallpapers/wallpaper9.jpg","assets/wallpapers/wallpaper10.png"];
    const rand_num = Math.floor(Math.random() * 10);
    wall = wallpapers[rand_num];
    setWallpaper(wall);
}


loadWeather();
updateClock(); // Initial call to set the clock immediately
setInterval(updateClock, 1000);