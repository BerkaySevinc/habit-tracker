


/* =========================
   Add / Edit Sheet
========================= */


const sheet = $('#sheet');
$('#open-add').addEventListener('click', () => openSheet());
$('#sheet-close').addEventListener('click', closeSheet);
$('.sheet-backdrop').addEventListener('click', closeSheet);



// Open the habit-type choice screen
function openSheet() {

    const choiceScreen = $('#choice-screen');
    const formScreen = $('#form-screen');

    formScreen.classList.add('hidden');
    choiceScreen.classList.remove('hidden');

    sheet.classList.remove('hidden');

    // Set sheet title
    $('#sheet-title').textContent = 'Alışkanlık Türü Seç';
}

// Close the sheet
function closeSheet() {
    sheet.classList.add('hidden');
    $('#icon-popover').classList.add('hidden');
}



// Habit type selection buttons
$$('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => openForm(null, btn.dataset.choice));
});





function openForm(habit = null, choice = null) {

    choice = choice ?? (habit.type);

    const title = $$('.choice-btn').find(b => b.dataset.choice === choice).innerText;

    const choiceScreen = $('#choice-screen');
    const formScreen = $('#form-screen');

    choiceScreen.classList.add('hidden');
    formScreen.classList.remove('hidden');

    sheet.classList.remove('hidden');

    const form = $('#habit-form');
    form.reset();

    form.dataset.choice = choice;
    const repeatType = choice === 'interval' ? 'interval' : 'weekly';
    form.dataset.repeatType = repeatType;


    // Set sheet title
    $('#sheet-title').textContent = title + ' ' + (habit ? 'Alışkanlığı Düzenle' : 'Alışkanlık Ekle');

    $('.field[name="repeat"] label').innerText = choice === 'interval' ? 'Tekrar Süresi' : 'Tekrar Günleri';

    // Focus name input
    sheet.querySelector('input[name="name"]').focus();

    // Show/hide sections based on habit type
    const isTimeSlotActive = choice === 'weekly';
    sheet.querySelector('.field[name="zaman"]').classList.toggle('hidden', !isTimeSlotActive);

    sheet.querySelector('#weekly-box').classList.toggle('hidden', choice === 'interval');
    sheet.querySelector('#interval-box').classList.toggle('hidden', choice !== 'interval');



    // Clear time slot variations (disabled — feature not yet active)
    // const tempTimeSlotVarCount = sheet.querySelector('.time-slot-wrap').querySelectorAll('.habit-card').length;
    // for (let i = 0; i < tempTimeSlotVarCount - 1; i++) {

    //     const card = sheet.querySelector('.time-slot-wrap').querySelector('.habit-card');
    //     DeleteTimeSlotVariationOnClick(card);
    // }

    // Clear weekly schedule variations
    const tempWeeklyVarCount = sheet.querySelector('#weekly-box').querySelectorAll('.habit-card').length;
    for (let i = 0; i < tempWeeklyVarCount - 1; i++) {

        const card = sheet.querySelector('#weekly-box').querySelector('.habit-card');
        DeleteWeeklyVariationOnClick(card);
    }

    // Reset day-of-week selections
    $$('#dow-grid .dow').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('not-available');
    });
    sheet.querySelector('input[name="dayGridValidation"]').type = choice === 'interval' ? 'hidden' : 'checkbox';

    form.dataset.created = habit?.created ?? todayISO;


    // Reset form to defaults for new habit
    if (!habit) {

        form.dataset.id = crypto.randomUUID();
        $('#icon-preview').textContent = '💧';
        $('#color-grid .color-swatch').click(); // select first color

        // Set default time slot
        if (isTimeSlotActive) {
            $('#time-slot').dataset.selected = $('#time-slot .seg').dataset.value;
            $('#time-slot .seg').click();
        }

        // Select all days by default for weekly habits
        if (repeatType === 'weekly') {
            $$('#dow-grid .dow').forEach(btn => {
                btn.click();
            });
        }
    }

    // Populate form fields for edit mode
    else {

        form.dataset.id = habit.id;
        form.name.value = habit.name;
        $('#icon-preview').textContent = habit.icon;

        // Restore color selection
        $$('#color-grid .color-swatch').forEach(sw => {
            if (rgbToHex(sw.style.background) === habit.color) {
                sw.click();
                $('#color-grid').dataset.selected = habit.color;
            }
        });

        // Restore time slot selection
        $$('#time-slot .seg').forEach(seg => {
            if (seg.dataset.value === habit.timeSlot) {
                $('#time-slot').dataset.selected = habit.timeSlot;
                seg.click();
            }
        });
        form.timeSlot.value = habit.timeSlot;

        // if (isTimeSlotActive) {

        //     // varyasyon yoksa
        //     if (!hasVariations(habit.timeSlot)) {

        //         $$('#time-slot .seg').forEach(seg => {
        //             if (seg.dataset.value === habit.timeSlot) {
        //                 $('#time-slot').dataset.selected = habit.timeSlot;
        //                 seg.click();
        //             }
        //         });
        //         form.timeSlot.value = habit.timeSlot;
        //     }
        //     // varyasyon varsa
        //     else {

        //         // ilki
        //         $$('#time-slot .seg').forEach(seg => {
        //             if (seg.dataset.value === habit.timeSlot[0].timeSlot) {
        //                 $('#time-slot').dataset.selected = habit.timeSlot[0].timeSlot;
        //                 seg.click();
        //             }
        //         });

        //         // kalanlar
        //         for (let i = 1; i < habit.timeSlot.length; i++) {

        //             const variation = habit.timeSlot[i];
        //             AddTimeSlotVariation(variation);
        //         }
        //     }
        // }

        // Restore weekly schedule
        if (repeatType === 'weekly') {

            // No variations
            if (!hasVariations(habit.schedule)) {

                habit.schedule.weekly.forEach(v => {
                    const b = $(`#dow-grid .dow[data-dow="${v}"]`);
                    if (b) b.click();
                });
            }
            // Has variations
            else {

                const firstVariation = habit.schedule[0];

                // First variation
                firstVariation.schedule.weekly.forEach(v => {
                    const b = $(`#dow-grid .dow[data-dow="${v}"]`);
                    if (b) b.click();
                });

                const addWeeklyVarBtn = sheet.querySelector('#add-weekly-variation');

                // Second variation
                addWeeklyVariation(addWeeklyVarBtn, habit.schedule[1], firstVariation);

                // Remaining variations
                for (let i = 2; i < habit.schedule.length; i++) {

                    const variation = habit.schedule[i];
                    addWeeklyVariation(addWeeklyVarBtn, variation);
                }
            }
        }

        // Restore interval schedule
        else {
            $('#interval-number').value = habit.schedule.interval.number;
            $('#interval-type').value = habit.schedule.interval.type;
        }
    }


    // Highlight the currently selected emoji
    $('#emoji-grid').querySelectorAll('button').forEach(b => {

        if (b.textContent === $('#icon-preview').textContent) {
            b.click();
        }
    });


    // if (repeatType === 'weekly')
    //     updateWeeklyDesc();



    // Form submit handler
    form.onsubmit = (e) => {
        
        e.preventDefault();

        const type = choice;
        const inverse = choice === 'inverse';
        form.dataset.inverse = inverse;

        const hideInCalendar = habit?.hideInCalendar || false;
        form.dataset.hideInCalendar = hideInCalendar;

        const id = form.dataset.id;
        const name = form.name.value.trim();
        const icon = $('#icon-preview').textContent;
        const color = $('#color-grid').dataset.selected || COLORS[0];

        const timeSlot = inverse ? 'inverse' : (repeatType === 'interval' ? 'interval' : $('#time-slot').dataset.selected);

        // const timeSlot = !isTimeSlotActive ? choice : getTimeSlotVariations(sheet.querySelector('.time-slot-wrap'));

        const firstWrap = [...sheet.querySelectorAll('.repeat-box')].find(b => !b.classList.contains('hidden'));
        const schedule = hasVariations(timeSlot) ? null : getScheduleVariations(firstWrap, repeatType);

        if (repeatType === 'interval' && habit && habit.schedule.type === 'interval') {

            schedule.interval.lastCompletion = habit.schedule.interval.lastCompletion;
        }


        const base = {
            id, type, name, icon, color, timeSlot, schedule, inverse,
            created: form.dataset.created, hideInCalendar
        };

        upsertHabit(base);
        closeSheet();
    };
}


function getScheduleVariations(wrap, repeatType) {

    return repeatType === 'weekly' ? getWeeklyScheduleVariations(wrap) : getIntervalScheduleVariations(wrap);
}

function getWeeklyScheduleVariations(weeklyWrap) {

    const form = $('#habit-form');

    let weeklyVariationCount = weeklyWrap.querySelectorAll('.habit-card').length;
    weeklyVariationCount = weeklyVariationCount === 0 ? 1 : weeklyVariationCount;

    // Single weekly schedule (no variations)
    if (weeklyVariationCount === 1) return createWeeklySchedule(weeklyWrap.querySelector('#dow-grid input').dataset.value);

    // Collect all variation data
    const variations = [];
    for (let j = 0; j < weeklyVariationCount; j++) {

        const weeklyScheduleHabitCard = weeklyWrap.querySelectorAll('.habit-card')[j];

        const parentId = form.dataset.id;
        const id = weeklyScheduleHabitCard.dataset.id ?? crypto.randomUUID();
        const name = weeklyScheduleHabitCard.querySelector('input[name="variation-name"]').value;
        const icon = weeklyScheduleHabitCard.querySelector('.icon').innerText;
        const color = rgbToHex(getComputedStyle(weeklyScheduleHabitCard).borderLeftColor);
        const schedule = createWeeklySchedule(weeklyScheduleHabitCard.querySelector('#days-grid input').dataset.value);
        const created = weeklyScheduleHabitCard.dataset.created;

        const inverse = (form.dataset.inverse.toLowerCase() === "true");
        const hideInCalendar = (form.dataset.hideInCalendar.toLowerCase() === "true");

        const variation = {
            id, name, icon, color, schedule, inverse,
            created: created, parentId, hideInCalendar
        };

        variations.push(variation);
    }

    return variations;
}
function createWeeklySchedule(list) {

    const array = list.split(",").map(Number);

    const schedule = { type: 'weekly', weekly: array };
    return schedule;
}


function getIntervalScheduleVariations(intervalWrap) {

    const number = parseInt(intervalWrap.querySelector('#interval-number').value);
    const type = intervalWrap.querySelector('#interval-type').value;

    const d = new Date(todayISO);
    d.setDate(d.getDate() - 1);
    const yesterday = fmtDate(d);

    const schedule = { type: 'interval', interval: { number: number, type: type, lastCompletion: yesterday } }

    return schedule;
}


function hasVariations(prop) {
    return Array.isArray(prop);
}













// Populate emoji picker
const grid = sheet.querySelector('#emoji-grid');
if (!grid.dataset.ready) {

    grid.innerHTML = '';

    EMOJIS.forEach(e => {

        const b = document.createElement('button');
        b.type = 'button'; b.textContent = e;

        b.addEventListener('click', () => {
            grid.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
            b.classList.add('selected');
            sheet.querySelector('#icon-preview').textContent = e;
            sheet.querySelector('#icon-popover').classList.add('hidden');
        });

        grid.appendChild(b);

    });

    grid.dataset.ready = '1';
}

// Toggle emoji picker
sheet.querySelector('#icon-preview').onclick = () => sheet.querySelector('#icon-popover').classList.toggle('hidden');


// Populate color picker
const cgrid = sheet.querySelector('#color-grid');
cgrid.innerHTML = '';

COLORS.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'color-swatch'; b.style.background = c;

    b.addEventListener('click', () => {
        sheet.querySelectorAll('.color-swatch', cgrid).forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        cgrid.dataset.selected = c;

        sheet.querySelectorAll('.habit-card').forEach(card => {

            card.style.borderLeftColor = c;
        });
    });

    cgrid.appendChild(b);
});




// Day-of-week selection (old implementation, replaced below)
// const dowSel = new Set();
// sheet.querySelectorAll('#dow-grid .dow').forEach(btn => {
//     btn.addEventListener('click', () => {

//         const v = Number(btn.dataset.dow);

//         if (dowSel.has(v)) dowSel.delete(v); else dowSel.add(v);
//         btn.classList.toggle('active');

//         updateWeeklyDesc();
//     });
// });
sheet.querySelectorAll('#dow-grid .dow').forEach(btn => {
    btn.addEventListener('click', () => {

        WeeklyDayOnClick(btn);

        // updateWeeklyDesc();
    });
});

function WeeklyDayOnClick(btn) {

    if (btn.classList.contains('not-available')) return;

    btn.classList.toggle('active');

    const grid = btn.parentElement;
    const days = [...grid.querySelectorAll('.dow')];
    const validationInput = grid.querySelector('input[name=dayGridValidation]')

    const dowSel = new Set();
    days.forEach(d => {

        const v = Number(d.dataset.dow);
        if (d.classList.contains('active')) dowSel.add(v);
    });

    validationInput.checked = dowSel.size !== 0;

    const value = [...dowSel].join(",")
    validationInput.dataset.value = value;

    if (!grid.parentElement.parentElement.classList.contains('habit-card')) return;

    const weeklyBox = grid.parentElement.parentElement.parentElement;
    updateWeeklyGridAvailables(weeklyBox);
}

function updateWeeklyGridAvailables(box) {
    // Mark days that are already claimed by another variation as not-available
    const dows = [...box.querySelectorAll('.habit-card')].map(c => [...c.querySelectorAll('.dow')]).flat();
    const selecteds = [...new Set(dows.filter(d => d.classList.contains('active')).map(d => d.dataset.dow))];

    dows.forEach(d => {

        if (selecteds.includes(d.dataset.dow) && !d.classList.contains('active')) d.classList.add('not-available');
        else d.classList.remove('not-available');
    });
}








function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g);  // [r, g, b]
    if (!result) return null;
    return (
        "#" +
        result
            .slice(0, 3)
            .map(x => parseInt(x).toString(16).padStart(2, "0"))
            .join("")
    );
}


// Time slot selection
sheet.querySelectorAll('#time-slot .seg').forEach(seg => seg.addEventListener('click', () => TimeSlotOnClick(seg)));

function TimeSlotOnClick(seg) {

    if (seg.classList.contains('not-available')) return;

    const parentTimeSlot = seg.parentElement;
    const oldActive = [...parentTimeSlot.querySelectorAll('.seg')].find(s => s.classList.contains('active'))?.dataset.value;

    parentTimeSlot.querySelectorAll('.seg').forEach(s => s.classList.remove('active'));
    seg.classList.add('active');
    seg.classList.add('not-available');
    parentTimeSlot.dataset.selected = seg.dataset.value;

    // Update not-available state for other time slot buttons
    const segs = [...sheet.querySelectorAll('#time-slot .seg')];
    segs.forEach(s => {

        if (s.dataset.value === oldActive) {

            if (!s.classList.contains('active')) s.classList.remove('not-available');
            return;
        }


        if (s.dataset.value === seg.dataset.value) {

            s.classList.add('not-available');
            return;
        }
    });
}














// Weekly day variations
sheet.querySelector('#add-weekly-variation').onclick = (e) => addWeeklyVariation(e.target);
function addWeeklyVariation(addVariationBtn, variation = null, firstVariation = null) {

    const form = $('#habit-form');

    let name = variation?.name ?? form.name.value.trim();
    // name = name !== '' ? name : 'Varyasyon';
    const icon = variation?.icon ?? $('#icon-preview').textContent;
    const color = variation?.color ?? ($('#color-grid').dataset.selected || COLORS[0]);
    const created = variation?.created ?? todayISO;

    const card = document.createElement('div');
    card.className = 'habit-card';
    card.style = "flex-direction: column; gap: 8px;";
    card.style.borderLeftColor = color;
    card.dataset.created = created;

    if (variation) card.dataset.id = variation.id;

    card.innerHTML = `

    <div style="display: flex; width: 100%; justify-content: space-between; margin-bottom: 2px;">

        <div class="left">

            <div class="icon">${icon}</div>

        </div>

        <div class="info">

            <input name="variation-name" type="text" style="width: 350px; text-align: center;" required></input>

        </div>
            
        <div class="right">

            <button type="button" class="small-btn danger del" title="Sil">${deleteSVG}</button>

        </div>
    
    </div>

    <div style="width: 100%">
        <div class="dow-grid" id="days-grid">
            <input type="checkbox" name="dayGridValidation" style="width: 1px; height: 1px; opacity: 0; border: none; padding: 0; position: absolute; align-self: center; justify-self: center;" required>
            <button type="button" data-dow="0" class="dow">Pzt</button>
            <button type="button" data-dow="1" class="dow">Sal</button>
            <button type="button" data-dow="2" class="dow">Çar</button>
            <button type="button" data-dow="3" class="dow">Per</button>
            <button type="button" data-dow="4" class="dow">Cum</button>
            <button type="button" data-dow="5" class="dow">Cmt</button>
            <button type="button" data-dow="6" class="dow">Paz</button>
        </div>
    </div>
    `;

    const icons = sheet.querySelector('#icon-popover').cloneNode(true);
    icons.style = "margin-top: 5px;"
    icons.querySelector('#emoji-grid').style = "overflow-x: hidden;";
    card.appendChild(icons);

    const weeklyWrap = addVariationBtn.parentElement.parentElement;

    let weeklyVariationCount = weeklyWrap.querySelectorAll('.habit-card').length;
    weeklyVariationCount = weeklyVariationCount === 0 ? 1 : weeklyVariationCount;

    if (weeklyVariationCount === 1) {

        const cloneCard = card.cloneNode(true);

        if (firstVariation) {
            cloneCard.querySelector('.icon').textContent = firstVariation.icon;
            cloneCard.style.borderLeftColor = firstVariation.color;
            cloneCard.dataset.created = firstVariation.created;
            cloneCard.dataset.id = firstVariation.id;
        }
        else {
            cloneCard.dataset.created = form.dataset.created;
        }

        const days = weeklyWrap.querySelector('#dow-grid');
        days.style.display = "none";

        weeklyWrap.style.width = "100%;";

        const selecteds = [...days.querySelectorAll('.dow')].filter(s => s.classList.contains('active')).map(s => s.dataset.dow);
        const daysGrid = cloneCard.querySelector('#days-grid');
        daysGrid.querySelectorAll('.dow').forEach(d => {
            if (selecteds.includes(d.dataset.dow)) d.classList.add('active');
        })

        const dows = [...daysGrid.querySelectorAll('.dow')];
        const validationInput = daysGrid.querySelector('input[name=dayGridValidation]')

        const dowSel = new Set();
        dows.forEach(d => {

            const v = Number(d.dataset.dow);
            if (d.classList.contains('active')) dowSel.add(v);
        });

        validationInput.checked = dowSel.size !== 0;

        const value = [...dowSel].join(",")
        validationInput.dataset.value = value;

        cloneCard.querySelector('input[name="variation-name"]').value = firstVariation?.name ?? name; /*name + ' (' + weeklyVariationCount + ')';*/

        daysGrid.querySelectorAll('.dow').forEach(btn => {
            btn.addEventListener('click', () => {

                WeeklyDayOnClick(btn);
            });
        });

        weeklyWrap.insertBefore(cloneCard, addVariationBtn.parentElement);
        cloneCard.querySelector('.del').addEventListener('click', () => {

            if (!confirm(`“${cloneCard.querySelector('input[name="variation-name"]').value}” silinsin mi?`)) return;

            DeleteWeeklyVariationOnClick(cloneCard);
        });

        const iconGrid = cloneCard.querySelector('#icon-popover');
        cloneCard.querySelector('.icon').addEventListener('click', () => { iconGrid.classList.toggle('hidden'); });

        const emojiButtons = iconGrid.querySelectorAll('button');
        emojiButtons.forEach(b => {

            b.addEventListener('click', () => {
                emojiButtons.forEach(btn => btn.classList.remove('selected'));

                b.classList.add('selected');
                cloneCard.querySelector('.icon').textContent = b.textContent;
                iconGrid.classList.add('hidden');
            });
        });

        // Highlight the selected emoji in the cloned card
        emojiButtons.forEach(b => {

            b.classList.toggle('selected', b.textContent === cloneCard.querySelector('.icon').textContent);
        });
    }

    // Find first available (not yet claimed) days
    const selections = [...sheet.querySelector('#dow-grid').querySelectorAll('.dow')].map(o => o.dataset.dow);
    const selecteds = [...weeklyWrap.querySelectorAll('#days-grid .dow')].filter(s => s.classList.contains('active')).map(s => s.dataset.dow);
    const availables = variation?.schedule.weekly.map(d => d.toString()) ?? selections.filter(s => !selecteds.includes(s));

    const weeklySelection = card.querySelector('#days-grid');
    if (availables.length !== 0) {

        weeklySelection.querySelectorAll('.dow').forEach(d => {

            d.classList.toggle('active', availables.includes(d.dataset.dow));
        });
    }

    const dows = [...weeklySelection.querySelectorAll('.dow')];
    const validationInput = weeklySelection.querySelector('input[name=dayGridValidation]');

    const dowSel = new Set();
    dows.forEach(d => {

        const v = Number(d.dataset.dow);
        if (d.classList.contains('active')) dowSel.add(v);
    });

    validationInput.checked = dowSel.size !== 0;

    const value = [...dowSel].join(",")
    validationInput.dataset.value = value;

    card.querySelector('input[name="variation-name"]').value = name; /*name + ' (' + (weeklyVariationCount + 1) + ')';*/

    weeklySelection.querySelectorAll('.dow').forEach(btn => {
        btn.addEventListener('click', () => {

            WeeklyDayOnClick(btn);
        });
    });

    weeklyWrap.insertBefore(card, addVariationBtn.parentElement);

    updateWeeklyGridAvailables(weeklyWrap);

    card.querySelector('.del').addEventListener('click', () => {

        if (!confirm(`“${card.querySelector('input[name="variation-name"]').value}” silinsin mi?`)) return;

        DeleteWeeklyVariationOnClick(card);
    });

    const iconGrid = card.querySelector('#icon-popover');
    card.querySelector('.icon').addEventListener('click', () => { iconGrid.classList.toggle('hidden'); });

    const emojiButtons = iconGrid.querySelectorAll('button');
    emojiButtons.forEach(b => {

        b.addEventListener('click', () => {
            emojiButtons.forEach(btn => btn.classList.remove('selected'));
            b.classList.add('selected');
            card.querySelector('.icon').textContent = b.textContent;
            iconGrid.classList.add('hidden');
        });
    });

    // Highlight the selected emoji in the new variation card
    emojiButtons.forEach(b => {

        b.classList.toggle('selected', b.textContent === card.querySelector('.icon').textContent);
    });

    weeklyVariationCount++;

    if (weeklyVariationCount === 7) {
        addVariationBtn.classList.add('hidden');
    }
};

function DeleteWeeklyVariationOnClick(card) {

    const form = $('#habit-form');

    const weeklyWrap = card.parentElement;
    let weeklyVariationCount = weeklyWrap.querySelectorAll('.habit-card').length;
    weeklyVariationCount = weeklyVariationCount === 0 ? 1 : weeklyVariationCount;

    card.remove();
    weeklyVariationCount--;

    updateWeeklyGridAvailables(weeklyWrap);

    if (weeklyVariationCount === 1) {

        const weeklySelection = weeklyWrap.querySelector('#dow-grid');
        const lastCard = weeklyWrap.querySelector('.habit-card');

        const selecteds = [...weeklyWrap.querySelector('#days-grid').querySelectorAll('.dow')].filter(s => s.classList.contains('active')).map(s => s.dataset.dow);

        weeklySelection.querySelectorAll('.dow').forEach(d => {

            d.classList.toggle('active', selecteds.includes(d.dataset.dow));
        });

        const dows = [...weeklySelection.querySelectorAll('.dow')];
        const validationInput = weeklySelection.querySelector('input[name=dayGridValidation]')

        const dowSel = new Set();
        dows.forEach(d => {

            const v = Number(d.dataset.dow);
            if (d.classList.contains('active')) dowSel.add(v);
        });

        validationInput.checked = dowSel.size !== 0;

        const value = [...dowSel].join(",")
        validationInput.dataset.value = value;


        weeklyWrap.style.width = "";
        weeklySelection.style.display = "grid";
        lastCard.remove();

        form.dataset.created = lastCard.dataset.created;
    }
    else {
        const createds = [...weeklyWrap.querySelectorAll('.habit-card')].map(c => c.dataset.created);

        const oldest = createds.reduce((min, curr) =>
            new Date(curr) < new Date(min) ? curr : min
        );

        form.dataset.created = oldest;
    }

    if (weeklyVariationCount === 6) {

        const addVariationBtn = weeklyWrap.querySelector('#add-weekly-variation');
        addVariationBtn.classList.remove('hidden');
    }

}













// let timeSlotVariationCount = 1;
// sheet.querySelector('#add-time-variation').onclick = () => {

//     const icon = $('#icon-preview').textContent;

//     const segs = [...sheet.querySelectorAll('#time-slot .seg')];

//     // Find first available slot
//     const availables = [...new Set(
//         segs
//             .filter(seg =>
//                 !seg.classList.contains('not-available')
//             )
//             .map(seg => seg.dataset.value)
//     )];

//     const firstAvailable = availables[0];

//     const card = document.createElement('div');
//     card.className = 'habit-card';
//     card.style = "display: flex; flex-direction: column; padding: 8px 10px 10px 10px; cursor: default; margin-bottom: 10px;";
//     // card.dataset.id = h.id;
//     // card.style.borderLeftColor = h.color;

//     const info = document.createElement('div');
//     info.className = 'info';
//     info.style = "display: flex; align-items: center; margin-bottom: 10px";
//     card.appendChild(info);

//     const iconElement = document.createElement('div');
//     iconElement.className = 'icon';
//     iconElement.innerText = icon;
//     info.appendChild(iconElement);

//     const name = document.createElement('div');
//     name.className = 'name';
//     name.style = "margin-bottom: 0";
//     name.innerText = 'Deneme';
//     info.appendChild(name);

//     const right =
//         `
//     <div class="right" style="margin-top:10px; justify-content: center;">

//         <button class="small-btn edit" title="Düzenle">${editSVG}</button>

//         <button class="small-btn danger del" title="Sil">${deleteSVG}</button>

//     </div>
//     `

//     if (timeSlotVariationCount === 1) {

//         const cloneCard = card.cloneNode(true);

//         const timeSlot = sheet.querySelector('#time-slot');
//         timeSlot.style = "display: block";

//         timeSlot.parentElement.insertBefore(cloneCard, timeSlot);
//         cloneCard.appendChild(timeSlot);

//         timeSlot.innerHTML += right;

//         timeSlot.parentElement.parentElement.style = "width: 100%;";

//         sheet.querySelectorAll('#time-slot .seg').forEach(seg => AddTimeSlotOnClick(seg));
//     }

//     const slots = sheet.querySelectorAll('#time-slot');
//     const timeSlot = slots[slots.length - 1];
//     const clone = timeSlot.cloneNode(true);

//     const cloneSegs = [...clone.querySelectorAll('.seg')];

//     cloneSegs.forEach(seg => seg.classList.remove('active'));
//     cloneSegs.forEach(seg => AddTimeSlotOnClick(seg));
//     cloneSegs.find(seg => seg.dataset.value === firstAvailable).click();

//     card.appendChild(clone);
//     timeSlot.parentElement.after(card);

//     timeSlotVariationCount++;

//     if (timeSlotVariationCount === 4) {
//         sheet.querySelector('#add-time-variation').classList.add('hidden');
//     }
// };






// // Kaydet
// form.onsubmit = (e) => {
//     e.preventDefault();

//     const id = form.id.value ? parseInt(form.id.value) : (habits.length === 0 ? 0 : Math.max(...habits.map(h => h.id)) + 1);
//     const name = form.name.value.trim();
//     const icon = $('#icon-preview').textContent;
//     const color = $('#color-grid').dataset.selected || COLORS[0];

//     const inverse = choice === 'inverse';
//     const repeatType = sheet.querySelector('#weekly-box').classList.contains('hidden') ? 'interval' : 'weekly';

//     const timeSlot = inverse ? 'inverse' : (repeatType === 'interval' ? 'interval' : $('#time-slot').dataset.selected);

//     const hideInCalendar = habit?.hideInCalendar || false;

//     let schedule;
//     if (repeatType === 'weekly') {
//         const arr = [...new Set([...$$('#dow-grid .dow.active').map(b => Number(b.dataset.dow))])];
//         if (arr.length === 0) { alert('En az bir gün seçmelisin.'); return; }
//         schedule = { type: 'weekly', weekly: arr };
//     }
//     else {
//         const number = parseInt($('#interval-number').value);
//         const type = $('#interval-type').value;

//         const d = new Date(todayISO);
//         d.setDate(d.getDate() - 1);
//         const yesterday = fmtDate(d);

//         const lastCompletion = habit && habit.schedule.type === 'interval' ? habit.schedule.interval.lastCompletion : yesterday;

//         schedule = { type: 'interval', interval: { number: number, type: type, lastCompletion: lastCompletion } }
//     }

//     const base = {
//         id, name, icon, color, timeSlot, schedule, inverse,
//         created: habit?.created || todayISO, hideInCalendar
//     };

//     upsertHabit(base);
//     closeSheet();
// };






// // Zaman dilimi varyasyonu
// sheet.querySelector('#add-time-variation').onclick = () => {
//     AddTimeSlotVariation();
// };


// let timeSlotVariationCount = 1;
// function AddTimeSlotVariation(variation = null) {

//     const form = $('#habit-form');


//     let name = variation?.name ?? form.name.value.trim();
//     // name = name !== '' ? name : 'Varyasyon';
//     const icon = variation?.icon ?? $('#icon-preview').textContent;
//     const color = variation?.color ?? ($('#color-grid').dataset.selected || COLORS[0]);
//     const id = variation?.innerId ?? timeSlotVariationCount;

//     const card = document.createElement('div');
//     card.className = 'habit-card';
//     card.style = "margin-bottom: 10px; flex-direction: column;";
//     card.style.borderLeftColor = color;
//     card.dataset.id = id;
//     card.innerHTML = `

//     <div style="display: flex; width: 100%; justify-content: space-between;">

//         <div class="left">

//             <div class="icon">${icon}</div>

//             <div class="info">
//             <input name="variation-name" type="text" style="width: 300px;" required></input>
//             </div>

//         </div>

//             <div>
//                 <select id="time-slot-selection">
//                     <option value="start">🌅 Gün Başı</option>
//                     <option value="day">🌤️ Gün İçi</option>
//                     <option value="end">🌙 Gün Sonu</option>
//                     <option value="any">🌀 Herhangi</option>
//                 </select>
//             </div>

//         <div class="right">

//             <button type="button" class="small-btn danger del" title="Sil">${deleteSVG}</button>

//         </div>

//     </div>

//     `;

//     const icons = sheet.querySelector('#icon-popover').cloneNode(true);
//     icons.style = "margin-top: 5px;"
//     icons.querySelector('#emoji-grid').style = "overflow-x: hidden;";
//     card.appendChild(icons);

//     const weeklyWrap = sheet.querySelector('#weekly-box');
//     const timeSlotWrap = sheet.querySelector('.time-slot-wrap');
//     const addVariationBtn = timeSlotWrap.querySelector('#add-time-variation');

//     if (timeSlotVariationCount === 1) {

//         const cloneCard = card.cloneNode(true);
//         cloneCard.dataset.id = 0;

//         const timeSlot = sheet.querySelector('#time-slot');
//         timeSlot.style = "display: none";

//         timeSlotWrap.style = "width: 100%;";

//         const selected = [...timeSlot.querySelectorAll('.seg')].find(s => s.classList.contains('active')).dataset.value;
//         const timeSlotSelection = cloneCard.querySelector('#time-slot-selection');
//         timeSlotSelection.value = selected;

//         const input = cloneCard.querySelector('input[name="variation-name"]');

//         input.value = name; /*name + ' (' + [...timeSlotSelection.options[timeSlotSelection.selectedIndex].text].slice(2).join('').trim() + ')';*/

//         input.addEventListener('input', () => OnNameChanged(cloneCard));
//         timeSlotSelection.addEventListener('change', () => { OnSelectionChanged(cloneCard); OnNameChanged(cloneCard); });

//         timeSlotWrap.insertBefore(cloneCard, addVariationBtn.parentElement);
//         cloneCard.querySelector('.del').addEventListener('click', () => {

//             if (!confirm(`“${cloneCard.querySelector('input[name="variation-name"]').value}” silinsin mi?`)) return;

//             DeleteTimeSlotVariationOnClick(cloneCard);
//         });

//         const iconGrid = cloneCard.querySelector('#icon-popover');
//         cloneCard.querySelector('.icon').addEventListener('click', () => { iconGrid.classList.toggle('hidden'); });

//         const emojiButtons = iconGrid.querySelectorAll('button');
//         emojiButtons.forEach(b => {

//             b.addEventListener('click', () => {
//                 emojiButtons.forEach(btn => btn.classList.remove('selected'));
//                 b.classList.add('selected');
//                 cloneCard.querySelector('.icon').textContent = b.textContent;
//                 iconGrid.classList.add('hidden');
//             });
//         });

//         weeklyWrap.dataset.id = 0;
//         weeklyWrap.style = "border: 1px solid var(--border); border-radius: 14px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px;"
//         $('#variation-name').style.display = 'block';

//         const selectedOption = timeSlotSelection.options[timeSlotSelection.selectedIndex].text;
//         weeklyWrap.querySelector('#variation-name').innerText = name === '' ? selectedOption : (name + ' - ' + selectedOption);
//     }


//     // Find first available slot
//     const selections = [...sheet.querySelector('#time-slot-selection').querySelectorAll('option')].map(o => o.value);
//     const selecteds = [...sheet.querySelectorAll('#time-slot-selection')].map(s => s.value);
//     const availables = selections.filter(s => !selecteds.some(selected => selected === s));

//     const timeSlotSelection = card.querySelector('#time-slot-selection');

//     [...timeSlotSelection.options].forEach(o => {
//         o.style.display = availables.includes(o.value) ? 'block' : 'none';
//     })

//     if (availables.length !== 0) {

//         const firstAvailable = variation?.timeSlot ?? availables[0];
//         timeSlotSelection.value = firstAvailable;

//         timeSlotWrap.querySelectorAll('#time-slot-selection').forEach(selection => {
//             [...selection.options].find(o => o.value === firstAvailable).style.display = 'none';
//         });
//     }



//     const input = card.querySelector('input[name="variation-name"]');

//     input.value = name; /*name + ' (' + [...timeSlotSelection.options[timeSlotSelection.selectedIndex].text].slice(2).join('').trim() + ')';*/

//     input.addEventListener('input', () => OnNameChanged(card));
//     timeSlotSelection.addEventListener('change', () => { OnSelectionChanged(card); OnNameChanged(card); });

//     timeSlotWrap.insertBefore(card, addVariationBtn.parentElement);
//     card.querySelector('.del').addEventListener('click', () => {

//         if (!confirm(`“${card.querySelector('input[name="variation-name"]').value}” silinsin mi?`)) return;

//         DeleteTimeSlotVariationOnClick(card);
//     });

//     const iconGrid = card.querySelector('#icon-popover');
//     card.querySelector('.icon').addEventListener('click', () => { iconGrid.classList.toggle('hidden'); });

//     const emojiButtons = iconGrid.querySelectorAll('button');
//     emojiButtons.forEach(b => {

//         b.addEventListener('click', () => {
//             emojiButtons.forEach(btn => btn.classList.remove('selected'));
//             b.classList.add('selected');
//             card.querySelector('.icon').textContent = b.textContent;
//             iconGrid.classList.add('hidden');
//         });
//     });

//     timeSlotVariationCount++;

//     if (timeSlotVariationCount === 4) {
//         addVariationBtn.classList.add('hidden');
//     }

//     // Weekly variationu da ekle
//     const weeklyWrapClone = weeklyWrap.cloneNode(true);
//     weeklyWrapClone.dataset.id = id;
//     weeklyWrapClone.querySelectorAll('.habit-card').forEach(c => c.remove());
//     weeklyWrapClone.querySelector('#dow-grid').style.display = 'grid';

//     const selectedOption = timeSlotSelection.options[timeSlotSelection.selectedIndex].text;
//     weeklyWrapClone.querySelector('#variation-name').innerText = name === '' ? selectedOption : (name + ' - ' + selectedOption);

//     weeklyWrap.parentElement.appendChild(weeklyWrapClone);

//     weeklyWrapClone.querySelector('#add-weekly-variation').onclick = (e) => addWeeklyVariation(e.target);

//     weeklyWrapClone.querySelectorAll('.dow').forEach(btn => {

//         btn.classList.add('active');

//         btn.addEventListener('click', () => {

//             WeeklyDayOnClick(btn);
//         });
//     });

//     const grid = weeklyWrapClone.querySelector('#dow-grid');
//     const days = [...grid.querySelectorAll('.dow')];
//     const validationInput = grid.querySelector('input[name=dayGridValidation]')

//     const dowSel = new Set();
//     days.forEach(d => {

//         const v = Number(d.dataset.dow);
//         if (d.classList.contains('active')) dowSel.add(v);
//     });

//     validationInput.checked = dowSel.size !== 0;

//     const value = [...dowSel].join(",")
//     validationInput.dataset.value = value;
// };


// function DeleteTimeSlotVariationOnClick(card) {

//     card.remove();
//     timeSlotVariationCount--;

//     const timeSlotWrap = sheet.querySelector('.time-slot-wrap');

//     const weeklyWrap = [...sheet.querySelectorAll('#weekly-box')].find(w => w.dataset.id === card.dataset.id);
//     weeklyWrap.remove();

//     let id = 0;
//     timeSlotWrap.querySelectorAll('.habit-card').forEach(c => {

//         const oldId = c.dataset.id;

//         c.dataset.id = id;

//         const weeklyWrap = [...sheet.querySelectorAll('#weekly-box')].find(w => w.dataset.id === oldId);
//         weeklyWrap.dataset.id = id;

//         id++;
//     });

//     const selections = [...sheet.querySelector('#time-slot-selection').querySelectorAll('option')].map(o => o.value);
//     const selecteds = [...sheet.querySelectorAll('#time-slot-selection')].map(s => s.value);
//     const availables = selections.filter(s => !selecteds.some(selected => selected === s));

//     timeSlotWrap.querySelectorAll('#time-slot-selection').forEach(selection => {
//         [...selection.options].forEach(o => {

//             if (selection.value === o.value) return;

//             o.style.display = availables.includes(o.value) ? 'block' : 'none';
//         });
//     });

//     if (timeSlotVariationCount === 1) {

//         const form = $('#habit-form');
//         const timeSlot = sheet.querySelector('#time-slot');
//         const lastCard = timeSlotWrap.querySelector('.habit-card');

//         const selected = lastCard.querySelector('#time-slot-selection').value;
//         timeSlot.querySelectorAll('.seg').forEach(seg => {

//             if (seg.dataset.value === selected) {

//                 timeSlot.dataset.selected = selected;
//                 seg.click();
//             }
//         });
//         form.timeSlot.value = selected;


//         timeSlotWrap.style.width = "";
//         timeSlotWrap.style.display = "inline-block";
//         timeSlot.style = "display: flex";
//         lastCard.remove();

//         sheet.querySelector('#weekly-box').style = "display: flex; flex-direction: column; gap: 10px;";
//         $('#variation-name').style.display = 'none';
//     }

//     if (timeSlotVariationCount === 3) {

//         const addVariationBtn = timeSlotWrap.querySelector('#add-time-variation');
//         addVariationBtn.classList.remove('hidden');
//     }

// }

// function OnNameChanged(card) {

//     const input = card.querySelector('input[name="variation-name"]');
//     const timeSlotSelection = card.querySelector('#time-slot-selection');

//     const id = card.dataset.id;

//     const weeklyWrap = [...sheet.querySelectorAll('#weekly-box')].find(w => w.dataset.id === id);
//     const nameLabel = weeklyWrap.querySelector('#variation-name')

//     const name = input.value.trim();
//     const selectedOption = timeSlotSelection.options[timeSlotSelection.selectedIndex].text;

//     nameLabel.innerText = name === '' ? selectedOption : (name + ' - ' + selectedOption);
// }

// function OnSelectionChanged(card) {

//     const timeSlotWrap = card.parentElement;
//     const timeSlotSelection = card.querySelector('#time-slot-selection');

//     const selections = [...sheet.querySelector('#time-slot-selection').querySelectorAll('option')].map(o => o.value);
//     const selecteds = [...sheet.querySelectorAll('#time-slot-selection')].map(s => s.value);
//     const availables = selections.filter(s => !selecteds.some(selected => selected === s));

//     timeSlotWrap.querySelectorAll('#time-slot-selection').forEach(selection => {

//         if (selection === timeSlotSelection) return;

//         [...selection.options].forEach(o => {

//             if (selection.value === o.value) return;

//             o.style.display = availables.includes(o.value) ? 'block' : 'none';
//         });
//     });
// }







// function getTimeSlotVariations(timeSlotWrap) {

//     // Single time slot (no variations)
//     if (timeSlotVariationCount === 1) return timeSlotWrap.querySelector('#time-slot').dataset.selected;

//     // Collect all variation data
//     const variations = [];
//     for (let i = 0; i < timeSlotVariationCount; i++) {

//         const timeSlotHabitCard = timeSlotWrap.querySelectorAll('.habit-card')[i];
//         const weeklyWrap = timeSlotVariationCount === 1 ? sheet.querySelector('#weekly-box') : [...sheet.querySelectorAll('#weekly-box')].find(w => w.dataset.id === timeSlotHabitCard.dataset.id);

//         const innerId = i;
//         const name = timeSlotHabitCard.querySelector('input[name="variation-name"]').value;
//         const icon = timeSlotHabitCard.querySelector('.icon').innerText;
//         const color = rgbToHex(getComputedStyle(timeSlotHabitCard).borderLeftColor);
//         const timeSlot = timeSlotHabitCard.querySelector('#time-slot-selection').value;
//         const schedule = getWeeklyScheduleVariations(weeklyWrap);

//         const variation = {
//             innerId, name, icon, color, timeSlot, schedule,
//             created: todayISO
//         };

//         variations.push(variation);
//     }

//     return variations;
// }



// function updateWeeklyDesc() {
//     // sheet.querySelector('#weekly-desc').textContent = weeklyScheduleToLabel(dowSel);
// }
