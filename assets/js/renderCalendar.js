
/* =========================
   Calendar
========================= */

let calendarCursor;
$('#prev-month').addEventListener('click', () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
    renderCalendar();
});
$('#next-month').addEventListener('click', () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
    renderCalendar();
});




function renderCalendar() {

    $('#month-label').textContent = `${trMonths[calendarCursor.getMonth()]} ${calendarCursor.getFullYear()}`;
    const grid = $('#calendar-grid');
    grid.innerHTML = '';

    const first = startOfMonth(calendarCursor);
    const last = endOfMonth(calendarCursor);

    // Render empty padding cells (Monday-first offset)
    const startPad = (first.getDay() + 6) % 7;
    for (let i = 0; i < startPad; i++) {
        const empty = document.createElement('div');
        grid.appendChild(empty);
    }

    // Render day cells
    for (let day = 1; day <= last.getDate(); day++) {

        const d = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), day);
        const iso = fmtDate(d);

        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.innerHTML = `<div class="num">${day}</div>`;

        // Mark today
        if (todayISO === iso) cell.classList.add('today');

        // Render color dots for active habits
        let actives = getActiveHabitsOn(iso, true);

        const dotField = document.createElement('div');
        dotField.className = 'dot-field';
        cell.appendChild(dotField);

        const dots = document.createElement('div');
        dots.className = 'cell-dots';
        dotField.appendChild(dots);

        let dotsInverse = null;
        if (actives.some(h => h.inverse)) {

            dotsInverse = dots.cloneNode();
            dotField.appendChild(dotsInverse);
        }


        actives.filter(h => !h.hideInCalendar).forEach(h => {
            const dot = document.createElement('span');
            dot.className = 'dot';

            if (completions[iso] && completions[iso][h.id]) dot.classList.add('done');

            dot.title = h.name;

            if (!h.inverse) {
                dot.style.background = h.color;

                dots.appendChild(dot);
            }
            else {
                dot.style.background = 'transparent';
                dot.style.borderColor = h.color;

                dotsInverse.appendChild(dot);
            }
        });

        // Completion meter and tooltip
        if (actives.length > 0) {

            // Completion ratio
            const ratio = calculateCompletionRatio(actives, iso);

            const meter = document.createElement('div');
            meter.className = 'cell-meter ' + ((todayISO < iso /*|| daysBetween(iso, todayISO) === 0*/) && ratio === 0 ? 'none' : (ratio === 1 ? 'gold' : (ratio >= 0.5 ? 'silver' : (ratio > 0 ? 'bronze' : 'black'))));
            cell.appendChild(meter);

            const changed = !meter.classList.contains('none');

            if (changed) {
                meter.title = '%' + Math.floor((ratio * 100));
            }

            // Build tooltip summary
            let pastType = actives[0].timeSlot;
            let summary = '';
            actives.forEach(h => {

                let type = h.timeSlot;
                if (!type) {
                    type = getHabits().find(habit => habit.id === h.parentId).timeSlot;
                }

                if (type !== pastType) {

                    pastType = type;
                    summary += '\n';
                }

                if ((iso <= todayISO) || changed) {
                    const isDone = completions[iso] && completions[iso][h.id];
                    const symbol = !!isDone !== h.inverse ? '✔' : '✖';
                    summary += symbol + ' ';
                }

                summary += h.name + '\n';
            });
            cell.title = summary.trim();
        }

        cell.addEventListener('click', () => {

            renderWeek(iso);
            renderDayHabits();

            switchPage('today');
        });

        grid.appendChild(cell);
    }
}






