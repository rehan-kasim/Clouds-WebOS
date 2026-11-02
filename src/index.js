document.addEventListener('DOMContentLoaded', () => {
    const startMenuButton = document.getElementById('start-menu-button');
    const startMenu = document.getElementById('start-menu');

    // Toggle Start Menu visibility
    startMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('hidden');
    });

    // Close Start Menu when clicking outside on the desktop
    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && !startMenuButton.contains(e.target)) {
            startMenu.classList.add('hidden');
        }
    });
});

// Handle Boot Sequence & Login
document.addEventListener('DOMContentLoaded', () => {
    const bootScreen = document.getElementById('boot-screen');
    const loginScreen = document.getElementById('login-screen');

    // Simulate boot sequence for 2.5 seconds
    setTimeout(() => {
        bootScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            bootScreen.remove(); // Completely remove from DOM
            loginScreen.classList.remove('hidden'); // Show login screen
        }, 100); // Matches CSS transition duration
    }, 5000);
});

document.addEventListener('DOMContentLoaded', () => {
    const bootScreen = document.getElementById('boot-screen');
    const loginScreen = document.getElementById('login-screen');
    const progressBar = document.getElementById('boot-progress');
    const bootStatus = document.getElementById('boot-status');

    const statuses = [
        "Loading system core...",
        "Initializing desktop environment...",
        "Starting services...",
        "Welcome"
    ];

    let progress = 0;
    const totalBootTime = 2500; // Total time in milliseconds (2.5 seconds)
    const intervalTime = 30;    // Update frequency
    const increment = (intervalTime / totalBootTime) * 100;

    const bootInterval = setInterval(() => {
        progress += increment;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(bootInterval);
            
            // Fade out boot screen
            bootScreen.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                bootScreen.remove();
                loginScreen.classList.remove('hidden');
            }, 700);
        }

        // Update progress bar width
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        // Dynamically update status text based on progress
        if (bootStatus) {
            if (progress > 75) bootStatus.textContent = statuses[3];
            else if (progress > 50) bootStatus.textContent = statuses[2];
            else if (progress > 25) bootStatus.textContent = statuses[1];
        }
    }, intervalTime);
});

function handleLogin(event) {
    event.preventDefault();
    const passwordInput = document.getElementById('login-password');
    const loginScreen = document.getElementById('login-screen');

    // Add simple validation or let any password pass for now
    if (passwordInput.value === "123456789") {
        loginScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            loginScreen.remove(); // Reveal desktop
        }, 500);
    }
    else {
        const errorMessage = document.getElementById('login-error');
        errorMessage.textContent = "Incorrect password. Try '123456789'";
        errorMessage.classList.remove('hidden');
    }
}



// App Window Management

// Universal Window Draging FUnction

document.addEventListener('DOMContentLoaded', () => {
    let activeWindow = null;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    // Listen for mouse down on any window header
    document.addEventListener('mousedown', (e) => {
        const header = e.target.closest('.window-header');
        if (!header) return;

        // Find the parent window container
        activeWindow = header.closest('.main-window') || header.closest('.app-window');
        if (!activeWindow) return;

        // Bring active window to the front
        activeWindow.style.zIndex = 100;

        startX = e.clientX;
        startY = e.clientY;

        // Get current window coordinates
        const rect = activeWindow.getBoundingClientRect();
        
        // Remove Tailwind centering transform classes so absolute positioning works cleanly
        if (activeWindow.classList.contains('transform')) {
            activeWindow.classList.remove('top-1/2', 'left-1/2', 'transform', '-translate-x-1/2', '-translate-y-1/2');
            activeWindow.style.left = `${rect.left}px`;
            activeWindow.style.top = `${rect.top}px`;
        }

        initialX = rect.left;
        initialY = rect.top;

        e.preventDefault(); // Prevent text highlighting while dragging
    });

    // Move the window on mouse move
    document.addEventListener('mousemove', (e) => {
        if (!activeWindow) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        activeWindow.style.left = `${initialX + dx}px`;
        activeWindow.style.top = `${initialY + dy}px`;
    });

    // Release the window on mouse up
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
    if (app) {
        app.classList.add('fixed', 'inset-0', 'w-full', 'h-full', 'z-50');
    }
}

function minimize(appId) {
    const app = document.getElementById(appId);
    if (app) {
        app.classList.remove('fixed', 'inset-0', 'w-full', 'h-full', 'z-50');
    }
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