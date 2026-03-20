

function copyHabits() {
    return habits;
}
function pasteHabits(copied) {

    switchPage('habits');

    copied.forEach(habit => {
        habit.created = todayISO;
        upsertHabit(habit);
    });
}



function copyAllData() {
    return [habits, orderMap, completions, options];
}
function pasteAllData(copied) {

    switchPage('habits');

    habits = copied[0];
    orderMap = copied[1];
    completions = copied[2];
    options = copied[3];

    setToday();
    renderWeek(todayISO);
    saveAndRenderAll();
}



function setCutoff(hour, minute = 0) {

    options.cutoff = { hour, minute };

    if (!checkShouldBeToday()) {

        setToday();
        renderWeek(todayISO);
        saveAndRenderAll();
    }

    scheduleNextUpdate(); // reschedule based on the new cutoff
}


function toggleCompletedToBottom() {
    options.completedToBottom = !options.completedToBottom;
    saveAndRenderAll();
}


function shiftDates(offset) {

    // Shift completion dates
    const result = {};
    Object.entries(completions).forEach(([dateStr, value]) => {

        const date = new Date(dateStr);
        date.setDate(date.getDate() + offset); // shift forward or backward

        const newDateStr = fmtDate(date); // YYYY-MM-DD format
        result[newDateStr] = value;
    });
    completions = result;

    // Shift habit creation dates and lastCompletedDate
    habits.forEach(h => {

        const oldCreated = h.created;

        const date = new Date(oldCreated);
        date.setDate(date.getDate() + offset);

        h.created = fmtDate(date);

        if (hasVariations(h.schedule)) {

            h.schedule.forEach(s => {

                const date = new Date(s.created);
                date.setDate(date.getDate() + offset);

                s.created = fmtDate(date);
            });
        }

        // For interval habits: also shift lastCompletion
        if (h.type === 'interval') {

            const createdYesterday = new Date(oldCreated);
            createdYesterday.setDate(createdYesterday.getDate() - 1);

            if (h.schedule.interval.lastCompletion === fmtDate(createdYesterday)) {

                const newCreatedYesterday = new Date(date);
                newCreatedYesterday.setDate(newCreatedYesterday.getDate() - 1);

                h.schedule.interval.lastCompletion = fmtDate(newCreatedYesterday);
            }
        }
    })

    saveAndRenderAll();
}



function accounts() {

    console.log(options.savedAccounts);
}


function setAccount(accountName) {

    switchPage();

    setStorage(accountName);

    setToday();
    renderWeek(todayISO);
    saveAndRenderAll();
}




function help() {

    console.log("")
    console.log("")
    console.log("accounts()")
    console.log("setAccount(string accountName)")
    console.log("")
    console.log("")
    console.log("copyAllData()")
    console.log("pasteAllData()")
    console.log("")
    console.log("copyHabits()")
    console.log("pasteHabits()")
    console.log("")
    console.log("")
    console.log("toggleCompletedToBottom()")
    console.log("")
    console.log("")
    console.log("setCutoffHour(int hour)")
    console.log("")
    console.log("shiftDates(int offset)")
    console.log("")
    console.log("")

}





// function enableVariations(bool) {

//     options.enableVariations = bool;
//     saveAll();
//     renderEnableVariation(bool);
// }

// function renderEnableVariation(bool) {

//     const addTimeSlotVariationBtn = sheet.querySelector('#add-time-variation');
//     const addWeeklyVariationBtn = sheet.querySelector('#add-weekly-variation');

//     if (!bool) {

//         sheet.querySelector('#weekly-desc').style.display = 'block';
//         // addTimeSlotVariationBtn.classList.add('hidden');
//         addWeeklyVariationBtn.classList.add('hidden');
//     }
//     else {
//         sheet.querySelector('#weekly-desc').style.display = 'none';
//         // addTimeSlotVariationBtn.classList.remove('hidden');
//         addWeeklyVariationBtn.classList.remove('hidden');
//     }

//     if (!bool) closeSheet();
// }
// renderEnableVariation(!!options.enableVariations);