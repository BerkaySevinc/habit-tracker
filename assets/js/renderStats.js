



let myChart;
function renderStats() {

    const statsType = $("#stats-type").value;

    TIMESLOTS.forEach(slot => {

        const slotHabits = getSlotHabits(slot);

        const timeSection = $(`#page-stats .time-section[data-slot="${slot}"]`);
        const wrap = $(`#page-stats .droplist[data-slot="${slot}"]`);
        wrap.innerHTML = '';

        // No habits in this slot
        if (slotHabits.length === 0) {
            timeSection.classList.add('hidden');
            return;
        }
    });

    // Hide the stats tab when there are no habits
    const isEmpty = habits.length === 0;
    $('.tab-btn[data-page="stats"]').classList.toggle('hidden', isEmpty);
    if (isEmpty) {

        if (myChart) {

            myChart.destroy();
            myChart = null;
        }

        const page = Object.entries(pages).find(([k, el]) => el.classList.contains('active'));
        const [key, el] = page ?? [null, null];

        if (key === 'stats') switchPage();

        return;
    }

    const completionKeys = Object.keys(completions);

    const lastCompletionKey = completionKeys[completionKeys.length - 1];
    const end = new Date(lastCompletionKey > todayISO ? lastCompletionKey : todayISO);

    const firstHabitISO = getHabits().map(h => h.created).reduce((a, b) => a < b ? a : b);
    const firstCompletionKey = completionKeys[0];
    let start = new Date(firstCompletionKey < firstHabitISO ? firstCompletionKey : firstHabitISO);


    if (statsType === 'week') {

        const monthStart = new Date(end);
        monthStart.setDate(monthStart.getDate() - 7);

        start = new Date(start < monthStart ? monthStart : start);
    }
    else if (statsType === 'month') {

        const monthStart = new Date(end);
        monthStart.setDate(monthStart.getDate() - 30);

        start = new Date(start < monthStart ? monthStart : start);
    }
    else if (statsType === 'year') {

        const yearStart = new Date(end);
        yearStart.setFullYear(yearStart.getFullYear() - 1);

        // Correct month overflow (e.g. Feb 30 problem)
        if (yearStart.getMonth() !== end.getMonth()) {
            // Snap to 1st of the next month
            yearStart.setMonth(end.getMonth() + 1, 1);
        }

        start = new Date(start < yearStart ? yearStart : start);
    }

    const allDates = [];
    let current = new Date(start);
    while (current <= end) {
        allDates.push(fmtDate(current));
        current.setDate(current.getDate() + 1);
    }

    const chartDates = allDates.map(d => d.slice(2));

    const data = allDates.map(iso => {

        let actives = getActiveHabitsOn(iso, true);

        if (actives.length === 0) return null;

        // Completion ratio
        const ratio = calculateCompletionRatio(actives, iso);

        if ((todayISO < iso /*|| daysBetween(iso, todayISO) === 0*/) && ratio === 0) return null;

        return Math.floor((ratio * 100));
    });



    if (myChart) {
        // Update existing chart instead of destroying and recreating it
        myChart.data.labels = chartDates;
        myChart.data.datasets[0].data = data;
        myChart.update();
    }
    else {

        const ctx = document.getElementById('generalChart').getContext('2d');

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartDates,       // X axis
                datasets: [{
                    label: 'Tamamlanan (%)',
                    data: data,       // Y axis
                    borderColor: '#7aa2ff',
                    backgroundColor: 'rgba(0,0,255,0.1)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Tamamlanan (%)',
                            color: '#d6dce7ff'
                        },
                        grid: {
                            borderColor: '#d6dce7ff'
                        },
                        ticks: { color: '#d6dce7ff' },
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Tarih',
                            color: '#d6dce7ff'
                        },
                        grid: {
                            borderColor: '#d6dce7ff'
                        },
                        ticks: {
                            color: '#d6dce7ff',
                            callback: function (value, index, ticks) {
                                const label = this.getLabelForValue(value);

                                // e.g. "08-31" → split into ["08", "31"] for two-line tick label
                                if (label.includes('-')) {
                                    return label.split('-');
                                }

                                return label;
                            },
                        }
                    }
                },
                plugins: {
                    tooltip: { mode: 'index', intersect: false },
                    legend: { display: false, position: 'top' }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    }

    renderAllHabitsStats(allDates);
}

function renderAllHabitsStats(allDates) {

    TIMESLOTS.forEach(slot => {

        const slotHabits = getSlotHabits(slot);

        const timeSection = $(`#page-stats .time-section[data-slot="${slot}"]`);
        const wrap = $(`#page-stats .droplist[data-slot="${slot}"]`);
        wrap.innerHTML = '';

        // No habits in this slot
        if (slotHabits.length === 0) {
            timeSection.classList.add('hidden');
            return;
        }
        else {
            timeSection.classList.remove('hidden');
        }

        // Render habit stat cards
        const mapped = slotHabits.map(h => {

            const hasVariation = hasVariations(h.schedule);

            // No variations
            if (!hasVariation) {

                // Veri
                const data = allDates.map(iso => getPercentageEffect(h, iso)).filter(v => v === true || v === false);

                return {
                    habit: h,
                    percentageText: getPercentageText(data)
                };
            }

            // Has variations — compute per-variation stats
            else {

                const variations = h.schedule;

                const allDatas = [];
                const maps = variations.map(variation => {

                    // Veri
                    const data = allDates.map(iso => getPercentageEffect(variation, iso)).filter(v => v === true || v === false);

                    allDatas.push(data);

                    return {
                        habit: variation,
                        percentageText: getPercentageText(data)
                    };
                });

                return {
                    habit: h,
                    percentageText: getPercentageText(allDatas.flat()),
                    variations: maps
                };
            }
        });


        mapped
            .sort((a, b) => {
                const aText = a.percentageText;
                const bText = b.percentageText;

                // Push "-" entries to the end
                if (aText === "-" && bText === "-") return 0;
                if (aText === "-") return 1;
                if (bText === "-") return -1;

                // Parse "%X" → number and sort ascending
                const aVal = parseInt(aText.replace("%", ""), 10);
                const bVal = parseInt(bText.replace("%", ""), 10);

                return aVal - bVal;
            })
            .forEach(({ habit, percentageText, variations }) => {

                if (!variations) {

                    wrap.appendChild(getCard(habit, percentageText));
                }
                else {

                    const wrapper = document.createElement('div');

                    const mainCard = getCard(habit, percentageText);
                    wrapper.appendChild(mainCard);

                    const variationCards = variations.map(v => getCard(v.habit, v.percentageText, true))
                    variationCards.forEach(card => wrapper.appendChild(card));

                    mainCard.addEventListener('click', () => {

                        const isHidden = variationCards[0].style.display === 'none';

                        mainCard.classList.toggle('expanded', isHidden);

                        variationCards.forEach(card => {

                            card.style.display = isHidden ? 'flex' : 'none';
                        });
                    });

                    wrap.appendChild(wrapper);
                }

            });
    });

}

function getPercentageEffect(h, iso) {

    // Get habits that are "must" (due) on this date
    let actives = getActiveHabitsOn(iso, true);

    // No habits due on this date
    if (actives.length === 0) return null;

    // Habit is not active (due) on this day
    if (!actives.some(a => a.id === h.id)) return null;

    const ratio = calculateCompletionRatio(actives, iso);

    // Future date with no completions — skip
    if ((todayISO < iso /*|| daysBetween(iso, todayISO) === 0*/) && ratio === 0) return null;

    const isDone = (completions[iso] ? ((completions[iso][h.id] ?? false) !== h.inverse) : h.inverse);

    // Today or future: count only completed habits; inverse habits are always counted
    if (iso >= todayISO) return isDone || h.inverse ? isDone : null;

    if (h.schedule.type === 'interval' && !isDone) {

        const daysLeft = getHabitIntervalDaysLeft(h, iso);
        let scheduleDays = getHabitIntervalDays(h, iso);

        let newIsDone;
        if (h.schedule.interval.type !== 'month' || Math.abs(daysLeft) <= scheduleDays) newIsDone = Math.abs(daysLeft) % scheduleDays === 0 ? false : null;

        else {
            while (Math.abs(daysLeft) > scheduleDays) {

                const newDate = new Date(iso);
                newDate.setDate(newDate.getDate() + scheduleDays);
                const newISO = fmtDate(newDate);

                scheduleDays += getHabitIntervalDays(h, newISO, true);
            }

            newIsDone = Math.abs(daysLeft) % scheduleDays === 0 ? false : null;
        }

        return newIsDone;
    }

    return isDone;
}

function getPercentageText(data) {

    if (data.length === 0) return '-';
    else {
        const trueCount = data.filter(v => v === true).length;
        const total = data.length;
        const ratio = trueCount / total;

        return '%' + Math.floor(ratio * 100);
    }
}

function getCard(habit, percentageText, isSub = false) {

    const card = document.createElement('div');
    card.className = 'habit-card';
    card.dataset.id = habit.id;
    card.style.borderLeftColor = habit.color;

    if (isSub) {

        card.style.marginTop = '-1px';
        card.style.width = 'calc(100% - 70px)';
        card.style.marginLeft = 'auto';
        card.style.display = 'none';
    }

    card.style.cursor = hasVariations(habit.schedule) ? 'pointer' : 'default';

    card.innerHTML = `
        <div class="left">
        <div class="icon">${habit.icon}</div>
        <div class="info">
        <div class="name">${habit.name}</div>
        <div class="tags">${scheduleToLabel(habit.schedule)}</div>
        </div>
        </div>
        <div class="right" style="margin-right: 8px">
        
            <span style="font-weight: 600;${percentageText === '-' ? '' : ' color: ' + getColor(parseInt(percentageText.replace("%", ""), 10)) + ';'}">

                ${percentageText}

            </span>
            
            </div>
            `;

    return card;
}




function getColor(percentage) {
    const p = Math.max(0, Math.min(100, percentage)) / 100;

    let r, g;

    if (p < 0.5) {
        // Red → Yellow (r fixed at 255, g: 0→255)
        r = 255;
        g = Math.round(510 * p);
    } else {
        // Yellow → Green (g fixed at 255, r: 255→0)
        g = 255;
        r = Math.round(510 * (1 - p));
    }

    return `rgb(${r}, ${g}, 0)`;
}
$("#stats-type").addEventListener("change", function () {

    renderStats();
});

