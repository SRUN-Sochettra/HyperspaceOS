import BaseApp from "../BaseApp.js";

export default class Calendar extends BaseApp {
  async setup() {
    this.currentDate = new Date();
    this.selectedDate = new Date();

    this.container.innerHTML = `
            <div class="calendar-container">
              <div class="calendar-main">
                <div class="calendar-header">
                    <button class="calendar-nav-btn" id="cal-prev-${this.windowId}">◀</button>
                    <h2 id="cal-month-year-${this.windowId}"></h2>
                    <button class="calendar-nav-btn" id="cal-next-${this.windowId}">▶</button>
                </div>
                <div class="calendar-grid">
                    <div class="calendar-days-header">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
                        <div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>
                    <div class="calendar-days" id="cal-days-${this.windowId}"></div>
                </div>
              </div>
                <div class="calendar-events-panel" id="cal-events-panel-${this.windowId}">
                    <div class="calendar-events-header">
                        <h3 id="cal-selected-date-title-${this.windowId}">Events</h3>
                        <button class="glass-btn primary" id="cal-add-event-${this.windowId}">+ Add Event</button>
                    </div>
                    <div class="calendar-events-list" id="cal-events-list-${this.windowId}"></div>
                </div>
            </div>
        `;

    this.monthYearEl = this.$(`#cal-month-year-${this.windowId}`);
    this.daysEl = this.$(`#cal-days-${this.windowId}`);
    this.eventsListEl = this.$(`#cal-events-list-${this.windowId}`);
    this.selectedDateTitleEl = this.$(`#cal-selected-date-title-${this.windowId}`);

    this.$(`#cal-prev-${this.windowId}`).addEventListener("click", () =>
      this.changeMonth(-1),
    );
    this.$(`#cal-next-${this.windowId}`).addEventListener("click", () =>
      this.changeMonth(1),
    );

    this.renderCalendar();
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.monthYearEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.daysEl.innerHTML = "";

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      const emptyDiv = this.createElement("div", "calendar-day empty");
      this.daysEl.appendChild(emptyDiv);
    }

    const today = new Date();

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDiv = this.createElement("div", "calendar-day", i);

      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        i === today.getDate()
      ) {
        dayDiv.classList.add("today");
      }

      if (
        year === this.selectedDate.getFullYear() &&
        month === this.selectedDate.getMonth() &&
        i === this.selectedDate.getDate()
      ) {
        dayDiv.classList.add("selected");
      }

      dayDiv.addEventListener("click", () => {
        this.selectedDate = new Date(year, month, i);
        this.renderCalendar();
      });

      this.daysEl.appendChild(dayDiv);
    }
  }

  changeMonth(delta) {
    this.currentDate.setMonth(this.currentDate.getMonth() + delta);
    this.renderCalendar();
  }
}
