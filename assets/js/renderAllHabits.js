

/* =========================
   All Habits
========================= */





function renderAllHabits() {

    TIMESLOTS.forEach(slot => {

        const slotHabits = getSlotHabits(slot);

        const timeSection = $(`#page-habits .time-section[data-slot="${slot}"]`);
        const wrap = $(`#page-habits .droplist[data-slot="${slot}"]`);
        wrap.innerHTML = '';

        // No habits in this slot — hide the section
        if (slotHabits.length === 0) {
            timeSection.classList.add('hidden');
            return;
        }
        else {
            timeSection.classList.remove('hidden');
        }

        // Render habit cards
        slotHabits.forEach(h => {

            const card = document.createElement('div');
            card.className = 'habit-card';
            card.dataset.id = h.id;
            card.style.borderLeftColor = h.color;


            card.innerHTML = `
      <div class="left">
        <div class="icon">${h.icon}</div>
        <div class="info">
          <div class="name">${h.name}</div>
          <div class="tags">${scheduleToLabel(h.schedule)}</div>
        </div>
      </div>

      <div class="right">

        <button class="small-btn hide${h.hideInCalendar ? ' checked' : ''}" title="Takvimde Gizle">
        ${h.hideInCalendar ? hiddenEyeSVG : hideEyeSVG}
        </button>
        
        <button class="small-btn edit" title="Düzenle">${editSVG}</button>

        <button class="small-btn danger del" title="Sil">${deleteSVG}</button>

      </div>
    `;

            card.querySelector('.hide').addEventListener('click', (e) => {

                const btn = card.querySelector('.hide');

                btn.classList.toggle('checked');

                const newHide = !h.hideInCalendar;

                h.hideInCalendar = newHide;

                if (hasVariations(h.schedule)) {

                    h.schedule.forEach(s => {
                        s.hideInCalendar = newHide;
                    });
                }
                btn.innerHTML = h.hideInCalendar ? hiddenEyeSVG : hideEyeSVG;
                saveAll();
                renderCalendar();
            });
            card.querySelector('.edit').addEventListener('click', () => openForm(h));
            card.querySelector('.del').addEventListener('click', () => {
                if (confirm(`“${h.name}” silinsin mi?`)) deleteHabit(h.id);
            });

            wrap.appendChild(card);
        });


        initDragAndDrop($('#page-habits'), wrap);
    });

}


/* =========================
   Drag & Drop Sorting
========================= */
function initDragAndDrop(page, droplist) {

    droplist.querySelectorAll(".habit-card").forEach(card => {
        card.setAttribute("draggable", "true");
    });

    if (droplist.dataset.ddInit) return; // skip if already initialized
    droplist.dataset.ddInit = "true";

    droplist.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("habit-card")) {
            e.target.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
        }
    });

    droplist.addEventListener("dragend", (e) => {
        if (e.target.classList.contains("habit-card")) {
            e.target.classList.remove("dragging");
            updateOrder(page, droplist);
        }
    });

    droplist.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = document.querySelector(".dragging");
        if (!dragging) return;

        // Restrict cross-slot dragging: inverse and interval cards can only be reordered within their own slot
        if (droplist.dataset.slot === "inverse" && dragging.parentElement.dataset.slot !== "inverse" ||
            droplist.dataset.slot !== "inverse" && dragging.parentElement.dataset.slot === "inverse" ||
            droplist.dataset.slot === "interval" && dragging.parentElement.dataset.slot !== "interval" ||
            droplist.dataset.slot !== "interval" && dragging.parentElement.dataset.slot === "interval"
        ) {
            return;
        }

        const afterElement = getDragAfterElement(droplist, e.clientY);
        if (afterElement == null) {
            droplist.appendChild(dragging);
        } else {
            droplist.insertBefore(dragging, afterElement);
        }
    });
}

// Returns the element that the dragged card should be inserted before
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".habit-card:not(.dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Persist the new order after a drag operation
function updateOrder(page) {

    TIMESLOTS.forEach(slot => {

        const wrap = page.querySelector(`.droplist[data-slot="${slot}"]`);
        const ids = [...wrap.querySelectorAll(".habit-card")].map(card => card.dataset.id);

        ids.forEach(i => {
            getHabits().find(h => h.id === i).timeSlot = slot;
        });
        orderMap[slot] = ids;

        const timeSection = page.querySelector(`.time-section[data-slot="${slot}"]`);

        // No habits left in this slot — hide section
        if (ids.length === 0) {
            timeSection.classList.add('hidden');
            return;
        }
        else {
            timeSection.classList.remove('hidden');
        }
    });

    saveAll();
    renderDayHabits();
    renderCalendar();
    renderStats();
}

