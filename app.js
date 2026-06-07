// -------------------------------------------------------------------------
// 2FA Debt Clock Application Logic
// -------------------------------------------------------------------------

// Constants
const WORKING_DAYS_PER_YEAR = 250;
const WORKING_HOURS_PER_DAY = 8;
const FTE_HOURS_PER_YEAR = WORKING_DAYS_PER_YEAR * WORKING_HOURS_PER_DAY; // 2000 hrs

// State
let state = {
    mode: 'simple', // 'simple' or 'roles'
    companySize: 500,
    hourlyWage: 45,
    loginsPerDay: 4,
    avgMfaTime: 25,
    roles: [
        { id: 'role-1', name: 'Project Managers', headcount: 50, wage: 65 },
        { id: 'role-2', name: 'Field Engineers', headcount: 100, wage: 50 },
        { id: 'role-3', name: 'Craft & Trade Labor', headcount: 300, wage: 35 },
        { id: 'role-4', name: 'Office Support', headcount: 50, wage: 40 }
    ],
    sessions: [],
    journeySteps: [
        { id: 'js1', name: 'Connect to Cisco AnyConnect VPN', time: 5 },
        { id: 'js2', name: 'Enter password / trigger push', time: 4 },
        { id: 'js3', name: 'Find phone & wait for push', time: 6 },
        { id: 'js4', name: 'Unlock phone & tap Approve', time: 4 },
        { id: 'js5', name: 'Dismiss broken "Stay logged in?"', time: 3 }
    ]
};

// Stopwatch state
let stopwatch = {
    startTime: null,
    timerId: null,
    running: false,
    durationSec: 0
};

// DOM Elements
const elCompanySize = document.getElementById('company-size');
const elCompanySizeVal = document.getElementById('company-size-val');
const elHourlyWage = document.getElementById('hourly-wage');
const elHourlyWageVal = document.getElementById('hourly-wage-val');
const elLoginsPerDay = document.getElementById('logins-per-day');
const elLoginsPerDayVal = document.getElementById('logins-per-day-val');
const elAvgMfaTime = document.getElementById('avg-mfa-time');
const elAvgMfaTimeVal = document.getElementById('avg-mfa-time-val');

// Tab and Role Selectors
const tabSimple = document.getElementById('tab-simple');
const tabRoles = document.getElementById('tab-roles');
const containerSimple = document.getElementById('simple-inputs');
const containerRoles = document.getElementById('roles-inputs');
const listRoles = document.getElementById('roles-list');
const btnAddRole = document.getElementById('btn-add-role');

const elCostCounter = document.getElementById('cost-counter');
const elTimeCounter = document.getElementById('time-counter');
const elHumanLifeCounter = document.getElementById('human-life-counter');
const elPerPersonCounter = document.getElementById('per-person-counter');
const elProductivityCounter = document.getElementById('productivity-counter');

const elAnnualCost = document.getElementById('annual-cost');
const elAnnualHours = document.getElementById('annual-hours');
const elAnnualFte = document.getElementById('annual-fte');
const elAnnualPerEmployee = document.getElementById('annual-per-employee');

const elStopwatchTime = document.getElementById('stopwatch-time');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnReset = document.getElementById('btn-reset');
const elMethodSelector = document.getElementById('method-selector-section');
const elPersonalStats = document.getElementById('personal-stats');
const elUserAvgTime = document.getElementById('user-avg-time');
const elUserTotalSessions = document.getElementById('user-total-sessions');
const btnApplyUserAvg = document.getElementById('btn-apply-user-avg');

const elReportText = document.getElementById('report-text');
const btnCopyReport = document.getElementById('btn-copy-report');
const btnCopyLink = document.getElementById('btn-copy-link');
const elCopyToast = document.getElementById('copy-toast');
const svgBarChart = document.getElementById('bar-chart');

// Passkey Upgrade UI elements
const elPasskeyCostSavings = document.getElementById('passkey-cost-savings');
const elPasskeyTimeSavings = document.getElementById('passkey-time-savings');
const elPasskeySavingsBar = document.getElementById('passkey-savings-bar');
const elPasskeySavingsPct = document.getElementById('passkey-savings-pct');

// Journey Builder Elements
const elJourneyTimeline = document.getElementById('journey-timeline');
const elJourneyTotalTime = document.getElementById('journey-total-time');
const btnAddJourneyStep = document.getElementById('btn-add-journey-step');
const btnApplyJourney = document.getElementById('btn-apply-journey');

// Initialize
function init() {
    loadLocalStorage();
    parseConfigFromUrl(); // URL config overrides local storage
    setupEventListeners();
    renderRolesList();
    renderJourneyTimeline();
    updateTabUI();
    updateSlidersDisplay();
    updateStaticMetrics();
    startTicker();
    renderChart();
    updateReport();
}

// URL Config Parser
function parseConfigFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const configParam = params.get('config');
    if (configParam) {
        try {
            const decoded = JSON.parse(atob(configParam));
            state.mode = decoded.mode ?? state.mode;
            state.companySize = decoded.companySize ?? state.companySize;
            state.hourlyWage = decoded.hourlyWage ?? state.hourlyWage;
            state.loginsPerDay = decoded.loginsPerDay ?? state.loginsPerDay;
            state.avgMfaTime = decoded.avgMfaTime ?? state.avgMfaTime;
            state.roles = decoded.roles ?? state.roles;
            
            // Sync slider inputs
            elCompanySize.value = state.companySize;
            elHourlyWage.value = state.hourlyWage;
            elLoginsPerDay.value = state.loginsPerDay;
            elAvgMfaTime.value = state.avgMfaTime;
        } catch (e) {
            console.error("Failed to parse config from URL:", e);
        }
    }
}

// LocalStorage Helper
function loadLocalStorage() {
    const saved = localStorage.getItem('2fa_debt_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.mode = parsed.mode ?? state.mode;
            state.companySize = parsed.companySize ?? state.companySize;
            state.hourlyWage = parsed.hourlyWage ?? state.hourlyWage;
            state.loginsPerDay = parsed.loginsPerDay ?? state.loginsPerDay;
            state.avgMfaTime = parsed.avgMfaTime ?? state.avgMfaTime;
            state.roles = parsed.roles ?? state.roles;
            state.sessions = parsed.sessions ?? [];
            
            // Set slider input values
            elCompanySize.value = state.companySize;
            elHourlyWage.value = state.hourlyWage;
            elLoginsPerDay.value = state.loginsPerDay;
            elAvgMfaTime.value = state.avgMfaTime;
            
            updatePersonalStatsDisplay();
        } catch (e) {
            console.error("Error loading localStorage state:", e);
        }
    }
}

function saveLocalStorage() {
    localStorage.setItem('2fa_debt_state', JSON.stringify(state));
}

// Event Listeners Setup
function setupEventListeners() {
    // Tabs
    tabSimple.addEventListener('click', () => {
        state.mode = 'simple';
        updateTabUI();
        updateStaticMetrics();
        updateSlidersDisplay();
        updateReport();
        renderChart();
        saveLocalStorage();
    });

    tabRoles.addEventListener('click', () => {
        state.mode = 'roles';
        updateTabUI();
        updateStaticMetrics();
        updateSlidersDisplay();
        updateReport();
        renderChart();
        saveLocalStorage();
    });

    // Add Role
    btnAddRole.addEventListener('click', addCustomRole);

    // Sliders
    elCompanySize.addEventListener('input', (e) => {
        state.companySize = parseInt(e.target.value);
        updateSlidersDisplay();
        updateStaticMetrics();
        updateReport();
        renderChart();
        saveLocalStorage();
    });
    
    elHourlyWage.addEventListener('input', (e) => {
        state.hourlyWage = parseInt(e.target.value);
        updateSlidersDisplay();
        updateStaticMetrics();
        updateReport();
        renderChart();
        saveLocalStorage();
    });
    
    elLoginsPerDay.addEventListener('input', (e) => {
        state.loginsPerDay = parseInt(e.target.value);
        updateSlidersDisplay();
        updateStaticMetrics();
        updateReport();
        renderChart();
        saveLocalStorage();
    });
    
    elAvgMfaTime.addEventListener('input', (e) => {
        state.avgMfaTime = parseInt(e.target.value);
        updateSlidersDisplay();
        updateStaticMetrics();
        updateReport();
        renderChart();
        saveLocalStorage();
    });

    // Stopwatch Controls
    btnStart.addEventListener('click', startStopwatch);
    btnStop.addEventListener('click', stopStopwatch);
    btnReset.addEventListener('click', resetStopwatch);

    // 2FA Method Logging
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const methodBtn = e.target.closest('.method-btn');
            const method = methodBtn.dataset.method;
            log2faSession(method);
        });
    });

    // Apply User Average to Slider
    btnApplyUserAvg.addEventListener('click', () => {
        const avg = calculateUserAverage();
        if (avg > 0) {
            state.avgMfaTime = Math.round(avg);
            elAvgMfaTime.value = state.avgMfaTime;
            updateSlidersDisplay();
            updateStaticMetrics();
            updateReport();
            renderChart();
            saveLocalStorage();
        }
    });

    // Report Copy
    btnCopyReport.addEventListener('click', () => {
        navigator.clipboard.writeText(elReportText.innerText).then(() => {
            elCopyToast.classList.remove('hidden');
            setTimeout(() => {
                elCopyToast.classList.add('hidden');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });

    // Copy Shareable Configuration Link
    btnCopyLink.addEventListener('click', () => {
        try {
            const configObj = {
                mode: state.mode,
                companySize: state.companySize,
                hourlyWage: state.hourlyWage,
                loginsPerDay: state.loginsPerDay,
                avgMfaTime: state.avgMfaTime,
                roles: state.roles
            };
            const serialized = btoa(JSON.stringify(configObj));
            const shareUrl = `${window.location.origin}${window.location.pathname}?config=${serialized}`;
            
            navigator.clipboard.writeText(shareUrl).then(() => {
                elCopyToast.innerText = "Link Copied!";
                elCopyToast.classList.remove('hidden');
                setTimeout(() => {
                    elCopyToast.classList.add('hidden');
                    elCopyToast.innerText = "Copied!"; // Reset back to default
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy link: ', err);
            });
        } catch (e) {
            console.error('Failed to generate share link: ', e);
        }
    });

    // Apply Benchmark Preset click events
    document.querySelectorAll('.btn-apply-benchmark').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('.benchmark-row');
            const seconds = parseInt(row.dataset.time);
            state.avgMfaTime = seconds;
            elAvgMfaTime.value = seconds;
            updateSlidersDisplay();
            updateStaticMetrics();
            updateReport();
            renderChart();
            saveLocalStorage();
        });
    });

    // Journey Builder
    btnAddJourneyStep.addEventListener('click', () => {
        state.journeySteps.push({
            id: 'js' + Date.now(),
            name: 'New Step',
            time: 2
        });
        saveLocalStorage();
        renderJourneyTimeline();
    });

    btnApplyJourney.addEventListener('click', () => {
        const total = state.journeySteps.reduce((acc, step) => acc + step.time, 0);
        state.avgMfaTime = total;
        elAvgMfaTime.value = state.avgMfaTime; // Also update slider value directly
        saveLocalStorage();
        updateSlidersDisplay();
        updateStaticMetrics();
        updateReport();
        renderChart();
    });
}

// Render the Login Journey Timeline
function renderJourneyTimeline() {
    elJourneyTimeline.innerHTML = '';
    state.journeySteps.forEach((step, idx) => {
        const el = document.createElement('div');
        el.className = 'journey-step';
        el.innerHTML = `
            <div class="journey-step-dot">${idx + 1}</div>
            <input type="text" class="journey-step-input" value="${escapeAttr(step.name)}" data-id="${escapeAttr(step.id)}">
            <div class="journey-step-time-wrap">
                <input type="number" class="journey-step-time" value="${step.time}" min="0" max="300" data-id="${escapeAttr(step.id)}">
                <span class="journey-step-unit">s</span>
            </div>
            <button type="button" class="journey-step-remove" aria-label="Remove step" data-id="${escapeAttr(step.id)}">×</button>
        `;
        elJourneyTimeline.appendChild(el);
    });

    // Event listeners for journey step inputs
    elJourneyTimeline.querySelectorAll('.journey-step-input').forEach(el => {
        el.addEventListener('input', (e) => {
            const step = state.journeySteps.find(s => s.id === e.target.dataset.id);
            if (step) step.name = e.target.value;
            saveLocalStorage();
        });
    });

    elJourneyTimeline.querySelectorAll('.journey-step-time').forEach(el => {
        el.addEventListener('input', (e) => {
            const step = state.journeySteps.find(s => s.id === e.target.dataset.id);
            if (step) step.time = parseFloat(e.target.value) || 0;
            updateJourneyTotal();
            saveLocalStorage();
        });
    });

    elJourneyTimeline.querySelectorAll('.journey-step-remove').forEach(el => {
        el.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            state.journeySteps = state.journeySteps.filter(s => s.id !== id);
            saveLocalStorage();
            renderJourneyTimeline();
        });
    });

    updateJourneyTotal();
}

function updateJourneyTotal() {
    const total = state.journeySteps.reduce((acc, step) => acc + step.time, 0);
    elJourneyTotalTime.innerText = `${total.toFixed(1)}s`;
}

// Render the active roles list in UI
function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderRolesList() {
    listRoles.innerHTML = '';
    state.roles.forEach((role) => {
        const row = document.createElement('div');
        row.className = 'role-item';
        row.innerHTML = `
            <input type="text" class="role-name" value="${escapeAttr(role.name)}" placeholder="Role Name" data-id="${escapeAttr(role.id)}">
            <input type="number" class="role-headcount" value="${role.headcount}" placeholder="Count" min="0" data-id="${escapeAttr(role.id)}">
            <input type="number" class="role-wage" value="${role.wage}" placeholder="$/hr" min="0" data-id="${escapeAttr(role.id)}">
            <button type="button" class="btn-delete-role" aria-label="Remove role" data-id="${escapeAttr(role.id)}">✖</button>
        `;
        listRoles.appendChild(row);
    });
    
    // Attach event listeners to newly generated fields
    listRoles.querySelectorAll('.role-name').forEach(el => {
        el.addEventListener('input', (e) => {
            const id = e.target.dataset.id;
            const role = state.roles.find(r => r.id === id);
            if (role) role.name = e.target.value;
            updateStaticMetrics();
            updateReport();
            renderChart();
            saveLocalStorage();
        });
    });
    
    listRoles.querySelectorAll('.role-headcount').forEach(el => {
        el.addEventListener('input', (e) => {
            const id = e.target.dataset.id;
            const role = state.roles.find(r => r.id === id);
            if (role) role.headcount = parseInt(e.target.value) || 0;
            updateStaticMetrics();
            updateReport();
            renderChart();
            saveLocalStorage();
        });
    });

    listRoles.querySelectorAll('.role-wage').forEach(el => {
        el.addEventListener('input', (e) => {
            const id = e.target.dataset.id;
            const role = state.roles.find(r => r.id === id);
            if (role) role.wage = parseInt(e.target.value) || 0;
            updateStaticMetrics();
            updateReport();
            renderChart();
            saveLocalStorage();
        });
    });

    listRoles.querySelectorAll('.btn-delete-role').forEach(el => {
        el.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            state.roles = state.roles.filter(r => r.id !== id);
            renderRolesList();
            updateStaticMetrics();
            updateReport();
            renderChart();
            saveLocalStorage();
        });
    });
}

// Switch UI visibility between tabs
function updateTabUI() {
    if (state.mode === 'simple') {
        tabSimple.classList.add('active');
        tabSimple.setAttribute('aria-selected', 'true');
        tabRoles.classList.remove('active');
        tabRoles.setAttribute('aria-selected', 'false');
        containerSimple.classList.remove('hidden');
        containerRoles.classList.add('hidden');
    } else {
        tabSimple.classList.remove('active');
        tabSimple.setAttribute('aria-selected', 'false');
        tabRoles.classList.add('active');
        tabRoles.setAttribute('aria-selected', 'true');
        containerSimple.classList.add('hidden');
        containerRoles.classList.remove('hidden');
    }
}

// Add a custom role row
function addCustomRole() {
    const newId = 'role-' + Date.now();
    state.roles.push({
        id: newId,
        name: 'New Custom Role',
        headcount: 10,
        wage: 45
    });
    renderRolesList();
    updateStaticMetrics();
    updateReport();
    renderChart();
    saveLocalStorage();
}

// Display Updates
function updateSlidersDisplay() {
    if (state.mode === 'simple') {
        elCompanySizeVal.innerText = `${state.companySize.toLocaleString()} employee${state.companySize > 1 ? 's' : ''}`;
        elHourlyWageVal.innerText = `$${state.hourlyWage} / hr`;
    } else {
        elCompanySizeVal.innerText = `${state.companySize.toLocaleString()} employees (weighted)`;
        elHourlyWageVal.innerText = `$${state.hourlyWage} / hr (weighted)`;
    }
    elLoginsPerDayVal.innerText = `${state.loginsPerDay} login${state.loginsPerDay > 1 ? 's' : ''}`;
    elAvgMfaTimeVal.innerText = `${state.avgMfaTime} second${state.avgMfaTime > 1 ? 's' : ''}`;
}

// Calculations and Static UI Update
let annualCost = 0;
let annualHours = 0;
let fteLost = 0;
let annualCostPerEmployee = 0;
let overheadPercent = 0;

function updateStaticMetrics() {
    if (state.mode === 'roles') {
        // Calculate company size from roles list
        state.companySize = state.roles.reduce((acc, r) => acc + r.headcount, 0);
        
        // Calculate weighted average wage
        const totalHeadcount = state.companySize;
        if (totalHeadcount > 0) {
            const totalWageProduct = state.roles.reduce((acc, r) => acc + (r.headcount * r.wage), 0);
            state.hourlyWage = Math.round(totalWageProduct / totalHeadcount);
        } else {
            state.hourlyWage = 0;
        }
    }

    // Annual time lost in hours per employee
    const annualHoursPerEmployee = (state.loginsPerDay * state.avgMfaTime * WORKING_DAYS_PER_YEAR) / 3600;
    
    // Total annual time lost company-wide
    annualHours = annualHoursPerEmployee * state.companySize;
    
    // Total annual cost
    annualCost = annualHours * state.hourlyWage;
    
    // Equivalent full time workers
    fteLost = annualHours / FTE_HOURS_PER_YEAR;
    
    // Wasted cost per employee
    annualCostPerEmployee = annualHoursPerEmployee * state.hourlyWage;
    
    // Overhead percent (MFA hours / standard hours)
    overheadPercent = (annualHoursPerEmployee / FTE_HOURS_PER_YEAR) * 100;

    // Update UI Elements
    elAnnualCost.innerText = `$${Math.round(annualCost).toLocaleString()}`;
    elAnnualHours.innerText = `${Math.round(annualHours).toLocaleString()} hrs`;
    elAnnualFte.innerText = `${fteLost.toFixed(2)} FTEs`;
    elAnnualPerEmployee.innerText = `$${Math.round(annualCostPerEmployee).toLocaleString()} / yr`;
    
    elProductivityCounter.innerText = `${overheadPercent.toFixed(3)}%`;

    // Passkey Upgrade Calculations (4s benchmark)
    const passkeyTimeSec = 4;
    const passkeyHoursPerEmployee = (state.loginsPerDay * passkeyTimeSec * WORKING_DAYS_PER_YEAR) / 3600;
    const passkeyAnnualHours = passkeyHoursPerEmployee * state.companySize;
    const passkeyAnnualCost = passkeyAnnualHours * state.hourlyWage;

    const timeSaved = Math.max(0, annualHours - passkeyAnnualHours);
    const costSaved = Math.max(0, annualCost - passkeyAnnualCost);
    
    let frictionReduction = 0;
    if (state.avgMfaTime > passkeyTimeSec) {
        frictionReduction = ((state.avgMfaTime - passkeyTimeSec) / state.avgMfaTime) * 100;
    }

    elPasskeyCostSavings.innerText = `$${Math.round(costSaved).toLocaleString()}`;
    elPasskeyTimeSavings.innerText = `${Math.round(timeSaved).toLocaleString()} hrs`;
    elPasskeySavingsBar.style.width = `${frictionReduction}%`;
    elPasskeySavingsPct.innerText = `${Math.round(frictionReduction)}% friction reduced`;

    // Dynamic Glow based on severity
    elTimeCounter.classList.remove('severity-high', 'severity-low');
    if (annualCost >= 500000) {
        elTimeCounter.classList.add('severity-high');
    } else if (state.avgMfaTime <= 4) {
        elTimeCounter.classList.add('severity-low');
    }
}

// Real-time ticking engine
function startTicker() {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
    
    function tick() {
        const now = Date.now();
        const msElapsed = now - startOfYear;
        
        // Rates per millisecond (based on annual totals smoothed over 365 days)
        const msPerYear = 365 * 24 * 3600 * 1000;
        const costPerMs = annualCost / msPerYear;
        const hoursPerMs = annualHours / msPerYear;
        
        // Accumulated values
        const currentCost = msElapsed * costPerMs;
        const currentHours = msElapsed * hoursPerMs;
        const currentSeconds = currentHours * 3600;
        
        // Update cost counter (now secondary)
        elCostCounter.innerText = `$${currentCost.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
        
        // Format time lost: Days, Hours, Minutes, Seconds, Milliseconds
        const days = Math.floor(currentHours / 24);
        const hours = Math.floor(currentHours % 24);
        const minutes = Math.floor((currentSeconds / 60) % 60);
        const seconds = Math.floor(currentSeconds % 60);
        const ms = Math.floor((currentSeconds * 1000) % 1000);
        
        elTimeCounter.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s ${ms.toString().padStart(3, '0')}ms`;

        // Human life: convert total hours to years (8,760 hrs/year of waking+sleeping life)
        const humanYears = currentHours / 8760;
        if (humanYears >= 1) {
            const wholeYears = Math.floor(humanYears);
            const remainingDays = Math.floor((humanYears - wholeYears) * 365);
            elHumanLifeCounter.innerText = `${wholeYears} yr ${remainingDays} days`;
        } else {
            const humanDays = humanYears * 365;
            const humanHrs = Math.floor((humanDays % 1) * 24);
            elHumanLifeCounter.innerText = `${Math.floor(humanDays)} days ${humanHrs} hrs`;
        }

        // Per-person: hours each individual has lost since Jan 1
        const perPersonHours = currentHours / (state.companySize || 1);
        if (perPersonHours >= 1) {
            elPerPersonCounter.innerText = `${perPersonHours.toFixed(1)} hrs`;
        } else {
            elPerPersonCounter.innerText = `${Math.floor(perPersonHours * 60)} min`;
        }

        requestAnimationFrame(tick);
    }
    
    requestAnimationFrame(tick);
}

// Stopwatch Logic
function startStopwatch() {
    if (stopwatch.running) return;
    
    stopwatch.running = true;
    stopwatch.startTime = Date.now();
    btnStart.disabled = true;
    btnStop.disabled = false;
    btnReset.disabled = true;
    elMethodSelector.classList.add('hidden');
    
    stopwatch.timerId = setInterval(() => {
        const elapsed = Date.now() - stopwatch.startTime;
        stopwatch.durationSec = elapsed / 1000;
        
        const minutes = Math.floor(stopwatch.durationSec / 60);
        const seconds = Math.floor(stopwatch.durationSec % 60);
        const ms = Math.floor((elapsed % 1000) / 10);
        
        elStopwatchTime.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }, 33); // ~30 fps update
}

function stopStopwatch() {
    if (!stopwatch.running) return;
    
    stopwatch.running = false;
    clearInterval(stopwatch.timerId);
    btnStop.disabled = true;
    btnReset.disabled = false;
    
    // Reveal method selector
    elMethodSelector.classList.remove('hidden');
}

function resetStopwatch() {
    stopwatch.running = false;
    clearInterval(stopwatch.timerId);
    stopwatch.durationSec = 0;
    elStopwatchTime.innerText = "00:00.00";
    btnStart.disabled = false;
    btnStop.disabled = true;
    btnReset.disabled = true;
    elMethodSelector.classList.add('hidden');
}

function log2faSession(method) {
    const session = {
        duration: stopwatch.durationSec,
        method: method,
        timestamp: Date.now()
    };
    
    state.sessions.push(session);
    saveLocalStorage();
    
    // Reset stopwatch UI
    resetStopwatch();
    
    // Update personal stats panel
    updatePersonalStatsDisplay();
    updateReport();
}

function calculateUserAverage() {
    if (state.sessions.length === 0) return 0;
    const sum = state.sessions.reduce((acc, s) => acc + s.duration, 0);
    return sum / state.sessions.length;
}

function updatePersonalStatsDisplay() {
    const count = state.sessions.length;
    if (count > 0) {
        elPersonalStats.classList.remove('hidden');
        const avg = calculateUserAverage();
        elUserAvgTime.innerText = `${avg.toFixed(1)}s`;
        elUserTotalSessions.innerText = count.toString();
    } else {
        elPersonalStats.classList.add('hidden');
    }
}

// Chart Rendering (SVG)
function renderChart() {
    const userAvg = state.avgMfaTime;
    const items = [
        { label: 'Your 2FA Time (Annualized)', value: userAvg * state.loginsPerDay * WORKING_DAYS_PER_YEAR / 3600, color: 'var(--accent-cyan)' },
        { label: 'Standard Paid Sick Leave', value: 40, color: 'var(--text-muted)' },
        { label: 'Typical Corporate Training', value: 24, color: 'var(--text-muted)' },
        { label: 'Annual Paid Vacation (10 Days)', value: 80, color: 'var(--accent-red)' }
    ];
    
    const maxVal = Math.max(...items.map(i => i.value), 10);
    
    let svgContent = '';
    
    // Grid Lines
    for (let i = 0.25; i <= 1.0; i += 0.25) {
        const x = 120 + i * 350;
        svgContent += `
            <line x1="${x}" y1="20" x2="${x}" y2="160" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2" />
            <text x="${x}" y="175" fill="var(--text-muted)" font-size="9" text-anchor="middle" font-family="var(--font-mono)">${Math.round(i * maxVal)}h</text>
        `;
    }
    
    // Bars
    items.forEach((item, index) => {
        const y = 30 + index * 32;
        const barWidth = (item.value / maxVal) * 350;
        
        svgContent += `
            <!-- Label -->
            <text x="10" y="${y + 14}" fill="var(--text-secondary)" font-size="10" font-family="var(--font-sans)">${item.label}</text>
            
            <!-- Background bar -->
            <rect x="120" y="${y}" width="350" height="18" fill="rgba(255,255,255,0.02)" rx="3" />
            
            <!-- Colored bar -->
            <rect x="120" y="${y}" width="${barWidth}" height="18" fill="${item.color}" rx="3">
                <animate attributeName="width" from="0" to="${barWidth}" dur="0.8s" fill="freeze" />
            </rect>
            
            <!-- Value text -->
            <text x="${120 + barWidth + 8}" y="${y + 13}" fill="${item.color}" font-size="10" font-family="var(--font-mono)" font-weight="bold">${item.value.toFixed(1)} hrs</text>
        `;
    });
    
    // Base Axis
    svgContent += `<line x1="120" y1="20" x2="120" y2="160" stroke="rgba(255,255,255,0.15)" />`;
    
    svgBarChart.innerHTML = svgContent;
}

// Management Report Builder
function updateReport() {
    const company = state.companySize.toLocaleString();
    const annualDollars = Math.round(annualCost).toLocaleString();
    const annualHrsFormatted = Math.round(annualHours).toLocaleString();
    const fte = fteLost.toFixed(2);
    const avgCostEmployee = Math.round(annualCostPerEmployee).toLocaleString();
    const delay = state.avgMfaTime.toFixed(1);
    
    // Passkey comparison values
    const passkeyHours = (state.loginsPerDay * 4 * WORKING_DAYS_PER_YEAR) / 3600 * state.companySize;
    const passkeyCost = passkeyHours * state.hourlyWage;
    const costRecovered = Math.max(0, annualCost - passkeyCost);
    const hoursRecovered = Math.max(0, annualHours - passkeyHours);
    // Journey Breakdown logic
    let journeyBreakdown = '';
    const journeyTotal = state.journeySteps.reduce((acc, step) => acc + step.time, 0);
    if (Math.abs(state.avgMfaTime - journeyTotal) < 1.0) {
        journeyBreakdown = `\nTYPICAL LOGIN JOURNEY BREAKDOWN:
-----------------------------------------
`;
        state.journeySteps.forEach((step, idx) => {
            journeyBreakdown += `Step ${idx + 1}: ${step.name.padEnd(40)} | ${step.time.toFixed(1)}s\n`;
        });
        journeyBreakdown += `-----------------------------------------
Total Estimated Friction: ${journeyTotal.toFixed(1)}s per login
`;
    }

    const text = `=========================================
      MFA FRICTION WASTE ANALYSIS REPORT
=========================================
Organization Scale : ${company} Employees
Avg. Hourly Wage   : $${state.hourlyWage}.00 / hr
SSO/MFA Prompts    : ${state.loginsPerDay} per day per employee
Avg. Login Delay   : ${delay} seconds
${journeyBreakdown}
ANNUAL SYSTEMIC LOSSES (Current):
-----------------------------------------
- Total Labor Cost Wasted: $${annualDollars} / year
- Total Productive Hours : ${annualHrsFormatted} hours / year
- Headcount Equivalency  : ${fte} Full-Time Employees (FTEs)
- Lost Cost per Employee : $${avgCostEmployee} / year

PROPOSED SOLUTION (FIDO2 Passkeys):
-----------------------------------------
Upgrading from your current login delay (${delay}s) to secure FIDO2 Passkeys (4.0s average) yields:
- Wasted Cost Reduction  : Save $${Math.round(costRecovered).toLocaleString()} / year
- Reclaimed Focus Time   : Reclaim ${Math.round(hoursRecovered).toLocaleString()} hours / year
- Net Friction Reduction : ${state.avgMfaTime > 4 ? Math.round(((state.avgMfaTime - 4) / state.avgMfaTime) * 100) : 0}% less overhead

OBSERVATIONS:
- Multi-Factor Authentication is critical for security, but traditional factors (SMS OTP, Email OTP, app prompt codes) introduce heavy corporate time debt.
- Upgrading to FIDO2 Passkeys (TouchID, FaceID, Windows Hello) replaces manual transcription delays with instant hardware biometrics.
- Implementing Passkeys eliminates credential phishing, strengthens security, and directly recovers lost operational capital.`;

    elReportText.innerText = text;
}

// Start application
init();
