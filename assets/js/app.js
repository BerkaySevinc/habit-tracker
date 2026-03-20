


// Tab switching
const pages = {
    today: $('#page-today'),
    calendar: $('#page-calendar'),
    habits: $('#page-habits'),
    stats: $('#page-stats'),
};

$$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
});

function switchPage(name) {

    name ??= 'today';

    const oldPage = Object.entries(pages).find(([k, el]) => el.classList.contains('active'));
    const [oldKey, oldEl] = oldPage ?? [null, null];

    if (oldKey === name) return;

    $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.page === name));
    Object.entries(pages).forEach(([k, el]) => el.classList.toggle('active', k === name));

    if (oldEl === pages.stats) {

        pages.stats.querySelectorAll('.habit-card').forEach(card => {
            if (card.classList.contains('expanded')) card.click();
        })
    }
}



/* =========================
   Initialization
========================= */

setToday();
renderWeek(todayISO);
saveAndRenderAll();
switchPage();

// Make app visible after all scripts are loaded
$('#app').style.display = 'block';

console.log("")
console.log("help() - for commands")
console.log("")



// TODO: Add interval variation support
// TODO: Allow reordering variations via drag and drop
// TODO: Add a description / details section to habits
// TODO: Add a "go to today" button; add left/right arrow navigation in the week strip (like the calendar)
// TODO: Add transitions for dynamically added/removed elements
// TODO: Show sub-variations on click in the All Habits page (same as the Stats page)
// TODO: Editing an interval or weekly schedule affects historical data.
//       Save the edit date and apply old settings only to entries before that date.
// TODO: Persist the selected stats view option (week / month / year / all)