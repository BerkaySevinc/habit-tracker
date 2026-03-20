








// 7-day strip
let lastRenderedMonday;
let selectedDateISO;
function renderWeek(anchorDateISO, isFromHelper = false, oldTodayISO) {

    // If triggered by helper (auto day change) and the previously selected date was "today",
    // advance the selection to the new today; otherwise keep whatever date was selected.
    const selectedTodayChanged = isFromHelper && (selectedDateISO === oldTodayISO);
    if (!isFromHelper || selectedTodayChanged) selectedDateISO = anchorDateISO;

    const anchor = parseISO(anchorDateISO);

    // JS getDay(): 0=Sunday … 6=Saturday; shift so Monday=0
    const jsDay = (anchor.getDay() + 6) % 7;

    // Monday of the anchor week
    const monday = addDays(anchor, -jsDay);
    const mondayISO = fmtDate(monday)

    // If triggered by helper and new today is in a different week, keep rendering the old week;
    // if same week, re-render it with the new today highlighted.
    const renderingMonday =
        !isFromHelper || selectedTodayChanged
            ? monday
            : parseISO(lastRenderedMonday);

    console.log("Rendered Week: today = " + todayISO + ",   Saat: " + new Date().getHours() + ":" + new Date().getMinutes());

    const wrap = $('#seven-days');
    wrap.innerHTML = '';

    lastRenderedMonday = mondayISO;

    for (let i = 0; i < 7; i++) {
        const d = addDays(renderingMonday, i);
        const iso = fmtDate(d);

        const chip = document.createElement('div');
        chip.className = 'day-chip';

        // Mark today
        if (todayISO === iso) {
            chip.classList.add('today');
        }

        // Mark selected day
        if (selectedDateISO === iso) {
            chip.classList.add('selected');
        }

        console.log("Day: " + iso + "                -   istoday: " + (todayISO === iso));

        chip.innerHTML = `
            <span class="dow">${trDows[(d.getDay() + 6) % 7]}</span>
            <span class="date">${d.getDate()}</span>
        `;

        chip.addEventListener('click', () => {

            if (selectedDateISO === iso) return;

            selectedDateISO = iso;
            $$('.day-chip', wrap).forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');

            renderDayHabits();
        });

        wrap.appendChild(chip);
    }
}



function renderDayHabits() {

    const actives = getActiveHabitsOn(selectedDateISO);

    const doneSet = (completions[selectedDateISO] || {});

    TIMESLOTS.forEach(slot => {

        let slotHabits = orderMap[slot].map(id => actives.find(h => (h.parentId ?? h.id) === id)).filter(Boolean);

        // Sort interval habits by days remaining ascending (most urgent first)
        if (slot === 'interval') slotHabits = slotHabits.sort((a, b) => getHabitIntervalDaysLeft(a, selectedDateISO) - getHabitIntervalDaysLeft(b, selectedDateISO));

        const timeSection = $(`#page-today .time-section[data-slot="${slot}"]`);
        const wrap = $(`#page-today .droplist[data-slot="${slot}"]`);
        wrap.innerHTML = '';

        // No active habits for this slot — hide the section
        if (slotHabits.length === 0) {
            timeSection.classList.add('hidden');
            return;
        }
        else {
            timeSection.classList.remove('hidden');
        }

        // Render habit cards
        if (!options.completedToBottom) slotHabits.forEach(h => addCardToDay(wrap, h, !!doneSet[h.id]));
        else {

            const incomplete = slotHabits.filter(h => !doneSet[h.id]);
            const complete = slotHabits.filter(h => doneSet[h.id]);

            incomplete.forEach(h => addCardToDay(wrap, h, false));
            complete.forEach(h => addCardToDay(wrap, h, true));
        }

        // For interval slot: add a visual gap between due and future habits
        if (slot === "interval") {

            const cards = Array.from(wrap.querySelectorAll('.habit-card'));

            const mustFound =
                !options.completedToBottom
                    ? cards.some(c => c.dataset.daysLeft <= 0)
                    : cards.some(c => !c.classList.contains('done') && c.dataset.daysLeft <= 0);

            const futureFound = cards.some(c => c.dataset.daysLeft > 0);

            if (mustFound && futureFound) {

                const firstFutureCard = cards.find(c => c.dataset.daysLeft > 0);
                firstFutureCard.style.marginTop = "35px";
            }
        }
    });
}


function addCardToDay(wrap, h, isDone) {

    const card = document.createElement('div');
    card.className = 'habit-card';
    card.dataset.id = h.id;
    card.style.borderLeftColor = h.color;
    card.innerHTML = `
      <div class="left">
        <div class="icon">${h.icon}</div>
        <div class="info">
          <div class="name">${h.name}</div>
          <div class="tags">${scheduleToLabelToday(card, h, h.schedule)}</div>
        </div>
      </div>
      <div class="right">
        <button class="checkbox-btn" title="Yapıldı">✔</button>
      </div>
    `;

    const btn = card.querySelector('.checkbox-btn');


    // Apply done styling if completion state differs from inverse flag
    if (isDone !== h.inverse) {
        card.classList.add('done');
        btn.classList.add('done');
    }

    // If inverse
    if (h.inverse) {

        card.classList.add('inverse');

        if (isDone) {
            btn.innerText = '✖';
            btn.classList.add('not-done');
        }
        else {
            btn.innerText = '✔';
            btn.classList.add('done');
        }
    }

    // If interval
    else if (h.schedule.type === 'interval') {

        card.classList.add('interval');

        if (isDone || parseInt(card.dataset.daysLeft) <= 0) {
            btn.innerText = '✔';
        }
        else {
            btn.innerText = '✚';
            btn.classList.add('add');
        }
    }

    // Show ✖ for missed habits on past days
    if (selectedDateISO < todayISO && !isDone && ((!h.inverse && h.schedule.type !== 'interval') || (h.schedule.type === 'interval' && card.classList.contains('alert')))) {

        const btn = card.querySelector('.checkbox-btn');
        btn.innerText = '✖';
        btn.classList.add('not-done');
    }

    card.addEventListener('click', () => toggleDone(h));

    wrap.appendChild(card);
}


function toggleDone(h) {

    const isDone = !completions[selectedDateISO]?.[h.id];

    // Mark as done
    if (isDone) {
        completions[selectedDateISO] ??= {};
        completions[selectedDateISO][h.id] = true;

        // Keep completions sorted oldest to newest
        completions = Object.fromEntries(
            Object.keys(completions)
                .sort((a, b) => new Date(a) - new Date(b))
                .map(key => [key, completions[key]])
        );
    }
    // Mark as undone
    else {
        delete completions[selectedDateISO][h.id];
        if (completions[selectedDateISO] && Object.keys(completions[selectedDateISO]).length === 0) delete completions[selectedDateISO];
    }

    // Update lastCompletion for interval habits
    if (h.schedule.type === 'interval') {
        h.schedule.interval.lastCompletion = getHabitLastCompletion(h);
    }

    saveAll();
    renderDayHabits();
    renderCalendar();
    renderStats();
}
