


/* =========================
   Helpers and Date Utilities
========================= */
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

function fmtDate(input) {
    const d = (input instanceof Date) ? input : new Date(input);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
const parseISO = (iso) => new Date(iso + 'T00:00:00');

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function daysBetween(iso1, iso2) {
    const d1 = new Date(iso1);
    const d2 = new Date(iso2);
    const diffMs = Math.abs(d2 - d1); // difference in milliseconds
    const diffDays = diffMs / (1000 * 60 * 60 * 24); // convert to days
    return diffDays;
}



let today;
let todayISO;
function setToday() {

    today = new Date();

    const cutoffHour = options.cutoff?.hour ?? 0;
    const cutoffMinute = options.cutoff?.minute ?? 0;

    // If before cutoff time, treat it as the previous day
    if (
        today.getHours() < cutoffHour ||
        (today.getHours() === cutoffHour && today.getMinutes() < cutoffMinute)
    ) {
        today.setDate(today.getDate() - 1);
    }

    todayISO = fmtDate(today);

    calendarCursor = today;
}

let cutoffTimer;
function scheduleNextUpdate() {

    if (cutoffTimer) clearTimeout(cutoffTimer);

    const cutoffHour = options.cutoff?.hour ?? 0;
    const cutoffMinute = options.cutoff?.minute ?? 0;

    const now = new Date();
    let next = new Date(now);
    next.setHours(cutoffHour, cutoffMinute, 0, 0);

    // If cutoff has already passed today, schedule for tomorrow
    if (now >= next) {
        next.setDate(next.getDate() + 1);
    }

    const msUntilNext = next - now;

    console.log("Scheduled to: " + `${Math.floor(msUntilNext / 3600000)} saat ${Math.floor(msUntilNext / 60000) % 60} dakika ${Math.floor(msUntilNext / 1000) % 60} saniye`);
    cutoffTimer = setTimeout(() => {

        if (!checkShouldBeToday()) {

            let oldTodayISO = todayISO;
            setToday();
            renderWeek(todayISO, true, oldTodayISO);
            saveAndRenderAll();
        }

        scheduleNextUpdate(); // reschedule for the next cycle

    }, msUntilNext);
}
scheduleNextUpdate();


function checkShouldBeToday() {

    const cutoffHour = options.cutoff?.hour ?? 0;
    const cutoffMinute = options.cutoff?.minute ?? 0;

    const now = new Date();
    let shouldBeToday = new Date(now);
    if (
        now.getHours() < cutoffHour ||
        (now.getHours() === cutoffHour && now.getMinutes() < cutoffMinute)
    ) {
        shouldBeToday.setDate(shouldBeToday.getDate() - 1);
    }

    const shouldBeISO = fmtDate(shouldBeToday);

    return shouldBeISO === todayISO;
}


function checkCutoff() {

    console.log("Checked Cutoff: " + new Date().getHours() + ":" + new Date().getMinutes() + " - " + (new Date().getHours() < (options.cutoffHour ?? 0)));

    if (!checkShouldBeToday()) {

        let oldTodayISO = todayISO;
        setToday();
        renderWeek(todayISO, true, oldTodayISO);
        saveAndRenderAll();
    }
}

// Re-check cutoff when the page becomes visible again
document.addEventListener("visibilitychange", () => {

    if (!document.hidden) {
        checkCutoff();
        scheduleNextUpdate();
    }
});





const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

function getSameWeekday(isoDate) {
    const todayDow = today.getDay();
    const d = new Date(isoDate);
    const dow = d.getDay();

    // Find the start of the week (Sunday=0 basis)
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - dow);

    // Same weekday within that week as today
    const target = new Date(weekStart);
    target.setDate(weekStart.getDate() + todayDow);

    return fmtDate(target);
}




function scheduleToLabel(schedule) {

    let label;

    if (schedule.type === 'weekly' || hasVariations(schedule)) {

        let scheduleResult;

        if (!hasVariations(schedule)) scheduleResult = schedule.weekly;
        else {
            scheduleResult = schedule.map(variation => variation.schedule.weekly).flat();
        }

        label = weeklyScheduleToLabel(scheduleResult);
    }
    else label = intervalScheduleToLabel(schedule.interval);

    if (hasVariations(schedule)) label += ' (' + schedule.length + ' Varyasyon)'

    return label;
}

function weeklyScheduleToLabel(schedule) {

    const names = trDows;

    const arr = [...schedule].sort();

    let txt = '';
    if (arr.length === 7) txt = 'Her Gün';
    else if (arr.join(',') === '0,1,2,3,4') txt = 'Hafta İçi Her Gün';
    else if (arr.join(',') === '5,6') txt = 'Hafta Sonu Her Gün';
    else if (arr.length === 6) {
        const missing = [0, 1, 2, 3, 4, 5, 6].find(v => !arr.includes(v));
        txt = `${names[missing]} Dışında Her Gün`;
    } else if (arr.length === 5) {
        const missing = [0, 1, 2, 3, 4, 5, 6].filter(v => !arr.includes(v));
        if (missing.length === 2) txt = `${names[missing[0]]} ve ${names[missing[1]]} Dışında Her Gün`;
        else txt = arr.map(v => names[v]).join(' ') + ' Günleri';
    } else if (arr.length === 1) {
        txt = `${names[arr[0]]} Günü`;
    } else if (arr.length === 2) {
        txt = arr.map(v => names[v]).join(' ve ') + ' Günleri';
    }
    else {
        txt = arr.length ? (arr.map(v => names[v]).join(', ') + ' Günleri') : 'Gün seçilmedi';
    }

    return txt;
}

function intervalScheduleToLabel(schedule) {

    const typeText = schedule.type === 'day' ? 'Günde' : (schedule.type === 'week' ? 'Haftada' : 'Ayda');
    return (schedule.number === 1 ? '' : (schedule.number + ' ')) + typeText + ' 1';
}



function scheduleToLabelToday(card, habit, schedule) {
    if (schedule.type === 'weekly') {
        return weeklyScheduleToLabel(schedule.weekly);
    }
    else {
        return intervalScheduleToLabelLeft(card, habit);
    }
}


function intervalScheduleToLabelLeft(card, habit) {

    const daysLeft = getHabitIntervalDaysLeft(habit, selectedDateISO);
    const leftRatio = daysLeft / getHabitIntervalDays(habit, selectedDateISO);

    const text = daysLeft === 0 ? 'Son Gün' : (daysLeft > 0 ? daysLeft + ' Gün Kaldı' : Math.abs(daysLeft) + ' Gün Geçti');

    card.dataset.daysLeft = daysLeft;
    card.classList.add(leftRatio < 0 ? 'alert' : (leftRatio === 0 ? 'warning' : (leftRatio <= 1 / 7 ? 'notice' : 'info')));

    return text;
}

