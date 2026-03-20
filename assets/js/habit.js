




function upsertHabit(h) {
    const idx = habits.findIndex(x => x.id === h.id);
    const oldHabit = habits[idx];

    // Upsert habit in array
    if (idx >= 0) habits[idx] = h;
    else habits.push(h);

    // Update orderMap
    if (idx < 0 || h.timeSlot !== oldHabit.timeSlot) {

        // Remove from old slot (only if time slot changed)
        if (idx >= 0) {
            orderMap[oldHabit.timeSlot] = orderMap[oldHabit.timeSlot].filter(id => id !== oldHabit.id);
        }
        // Add to new slot
        orderMap[h.timeSlot].push(h.id);
    }

    saveAndRenderAll();
}

function deleteHabit(id) {
    habits = habits.filter(x => x.id !== id);
    Object.keys(orderMap).forEach(k => {
        orderMap[k] = orderMap[k].filter(x => x !== id);
    });
    // Remove all completions for this habit
    Object.keys(completions).forEach(day => {

        if (completions[day] && completions[day][id]) {

            delete completions[day][id];
            if (completions[day] && Object.keys(completions[day]).length === 0) delete completions[day];
        }
    });
    saveAndRenderAll();
}

function clearStorage() {

    clearAll();
    saveAndRenderAll();
}

function saveAndRenderAll() {
    saveAll();
    renderDayHabits();
    renderCalendar();
    renderAllHabits();
    renderStats();

    console.log("")
    console.log("")
    console.log(account)
    console.log("")
    console.log("")
    console.log("Habits:")
    console.log(habits);    
    console.log("")
    console.log("Completions:")
    console.log(completions);
    console.log("")
    console.log("Order:")
    console.log(orderMap);
    console.log("")
    console.log("Options:")
    console.log(options);
    console.log("")
    console.log("")

}


function getHabits() {

    return TIMESLOTS.map(s => getSlotHabits(s)).flat();
}
function getSlotHabits(slot) {

    return orderMap[slot].map(id => habits.find(habit => habit.id === id));
}

function getHabitsSeperated() {

    return TIMESLOTS.map(s => getSlotHabitsSeperated(s)).flat();
}
function getSlotHabitsSeperated(slot) {

    return orderMap[slot].map(id => habits.find(habit => habit.id === id)).map(h => !hasVariations(h.schedule) ? h : h.schedule).flat();
}



function getActiveHabitsOn(date, must = false) {

    return getHabitsSeperated().filter(h => isHabitActiveOn(h, date, must));
}

function isHabitActiveOn(h, date, must = false) {

    const d = (date instanceof Date) ? date : parseISO(date);
    const iso = fmtDate(d);

    // Before creation date: not active
    if (iso < h.created) return false;

    // Weekly schedule: active if the weekday matches
    if (h.schedule.type === 'weekly') {
        const js = (d.getDay() + 6) % 7; // 0..6, Monday=0
        return h.schedule.weekly.includes(js);
    }

    // Interval schedule
    else {

        // Already completed on this date: active
        const isDone = completions[iso]?.[h.id];
        if (isDone) return true;

        const daysLeft = getHabitIntervalDaysLeft(h, iso);

        if (must) {

            // Not yet due: not active
            if (daysLeft > 0) return false;

            // Future date and not due: not active
            if (iso > todayISO && daysLeft !== 0) return false;

            return true;
        }
        else {

            // Due or overdue: active
            if (daysLeft <= 0) return true;

            // Show from lastCompletion onwards; hide if it's still ahead
            return iso >= h.schedule.interval.lastCompletion;
        }
    }
}







function getHabitLastCompletion(habit, dateISO = null) {

    let lastCompletion = Object.keys(completions).reverse().find(key => {

        // Skip future dates
        if (dateISO && key >= dateISO) return false;

        const dateCompletions = completions[key];
        if (Object.keys(dateCompletions).some(id => id === habit.id)) return true;
        else return false;
    });

    // Fall back to the day before creation if no completions exist
    if (!lastCompletion) {

        const d = new Date(habit.created);
        d.setDate(d.getDate() - 1);
        lastCompletion = fmtDate(d);
    }

    return lastCompletion;
}


function getHabitIntervalDays(intervalHabit, dateISO, useDateAsLastCompletion = false) {

    const schedule = intervalHabit.schedule.interval;

    if (schedule.type === 'day') return schedule.number;
    else if (schedule.type === 'week') return schedule.number * 7;

    // Month interval: find the same day in the next month
    else {

        const lastCompletion = useDateAsLastCompletion ? dateISO : getHabitLastCompletion(intervalHabit, dateISO);

        let date = new Date(lastCompletion);
        let day = date.getDate();

        // Compute next month
        let next = new Date(date);
        next.setMonth(next.getMonth() + schedule.number, 1); // advance month, reset to 1st

        // Last day of next month
        let lastDayOfNextMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();

        // Clamp day to avoid month overflow (e.g. Jan 31 → Feb 28)
        next.setDate(Math.min(day, lastDayOfNextMonth));

        return daysBetween(lastCompletion, fmtDate(next));
    }
}

function getHabitIntervalDaysLeft(intervalHabit, dateISO) {

    const lastCompletion = getHabitLastCompletion(intervalHabit, dateISO);
    const daysPassed = daysBetween(lastCompletion, dateISO);

    const daysLeft = getHabitIntervalDays(intervalHabit, lastCompletion) - daysPassed;

    return daysLeft;
}




function calculateCompletionRatio(habits, dateISO) {

    const completedCount =
        completions[dateISO]
            // Count habits where completion state differs from inverse flag (i.e. "effectively done")
            ? habits.filter(h => (completions[dateISO][h.id] ?? false) !== h.inverse).length
            // No completions recorded: future=0, past=count of inverse habits (they are done by default)
            : (todayISO < dateISO ? 0 : habits.filter(h => h.inverse).length);

    const ratio = habits.length ? (completedCount / habits.length) : 0;

    return ratio;
}