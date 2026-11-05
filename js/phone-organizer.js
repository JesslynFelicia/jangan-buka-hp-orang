import {STORY} from './found-phone-story.js';

const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dateFromKey = key => {const [year,month,day]=key.split('-').map(Number);return new Date(year,month-1,day);};
const fullDate = date => date.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

export function renderCalendar(player, body, {el,button,icon}) {
    body.classList.add('org-calendar');
    const today = new Date();
    const todayKey = dateKey(today);
    if (!player.calendarMonth || player.detail==='dinner') {
        player.calendarMonth = new Date(today.getFullYear(),today.getMonth(),1);
        player.calendarDate = todayKey;
    }
    const selected = dateFromKey(player.calendarDate);
    const header = (label,action,title) => el('header',{class:'org-toolbar'},button(label,'org-back',action,icon('back'),el('span',{},label)),el('h2',{'data-app-heading':'',tabindex:'-1'},title));
    if (player.detail==='dinner-detail') {
        body.append(header('Kalender',()=>player.open('calendar'),'Detail Acara'),
            el('div',{class:'org-calendar-scroll'},el('article',{class:'org-event-detail'},
                el('h3',{},'Dinner'),el('p',{class:'org-event-date'},fullDate(today)),el('p',{class:'org-event-time'},'19.00'),
                el('div',{class:'org-event-field'},el('span',{},'Kalender'),el('strong',{},el('i',{'aria-hidden':'true'}),'Kalender')))));
        return;
    }
    const select = date => {
        player.calendarDate = dateKey(date);
        player.calendarMonth = new Date(date.getFullYear(),date.getMonth(),1);
        player.open('calendar');
    };
    const moveMonth = offset => select(new Date(player.calendarMonth.getFullYear(),player.calendarMonth.getMonth()+offset,1));
    const month = player.calendarMonth;
    const monthLabel = month.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
    body.append(header('Kembali',()=>player.open(''),'Kalender'));
    const content = el('div',{class:'org-calendar-scroll'});
    const grid = el('div',{class:'org-month-grid',role:'group','aria-label':`Tanggal ${monthLabel}`});
    for (const day of ['Min','Sen','Sel','Rab','Kam','Jum','Sab']) grid.append(el('span',{class:'org-weekday','aria-hidden':'true'},day));
    for (let blank=0;blank<month.getDay();blank++) grid.append(el('span',{'aria-hidden':'true'}));
    const days = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
    for (let day=1;day<=days;day++) {
        const date = new Date(month.getFullYear(),month.getMonth(),day);
        const key = dateKey(date);
        const control = button(`Pilih tanggal ${fullDate(date)}`,`org-calendar-day${key===todayKey ? ' is-today' : ''}${key===player.calendarDate ? ' is-selected' : ''}`,()=>select(date),el('span',{},day),...(key===todayKey ? [el('i',{class:'org-event-dot','aria-hidden':'true'})] : []));
        control.setAttribute('data-date',key);
        control.setAttribute('aria-pressed',String(key===player.calendarDate));
        grid.append(control);
    }
    content.append(el('div',{class:'org-month-heading'},el('h3',{},monthLabel),
        el('div',{},button('Bulan sebelumnya','org-month-arrow',()=>moveMonth(-1),'‹'),button('Bulan berikutnya','org-month-arrow',()=>moveMonth(1),'›'))),grid);
    const agenda = el('section',{class:'org-day-agenda','aria-label':'Acara pada tanggal terpilih'},el('h3',{},fullDate(selected)));
    if (player.calendarDate===todayKey) {
        const timeline = el('div',{class:'org-day-timeline'});
        for (const hour of ['18.00','19.00','20.00']) timeline.append(el('div',{class:'org-hour'},el('time',{},hour),el('span',{'aria-hidden':'true'})));
        timeline.append(button('Lihat acara Dinner pukul 19.00',`org-dinner${player.detail==='dinner' ? ' is-highlighted' : ''}`,()=>player.open('calendar','dinner-detail'),el('strong',{},'Dinner'),el('time',{},'19.00')));
        agenda.append(timeline);
    } else agenda.append(el('p',{class:'org-empty'},'Tidak ada acara.'));
    content.append(agenda);
    body.append(content,el('footer',{class:'org-calendar-bottom'},button('Kembali ke hari ini','org-text-button',()=>select(today),'Hari Ini'),el('span',{},'Kalender')));
}

export function renderReminders(player, body, {el,button,icon}) {
    body.classList.add('org-reminders');
    const reminder = STORY.notes.find(note=>note.id==='fruit');
    const remaining = player.reminderDone ? 0 : 1;
    const overview = player.detail==='lists';
    body.append(el('header',{class:'org-toolbar'},button(overview ? 'Kembali' : 'Daftar','org-back',()=>player.open(overview ? '' : 'reminders',overview ? '' : 'lists'),icon('back'),el('span',{},overview ? 'Kembali' : 'Daftar'))));
    const content = el('div',{class:'org-reminders-scroll'});
    if (overview) {
        content.append(el('h2',{class:'org-lists-title','data-app-heading':'',tabindex:'-1'},'Pengingat'),
            el('div',{class:'org-smart-lists'},...[
                ['today','Hari Ini','☀',0],['scheduled','Terjadwal','▦',remaining],['all','Semua','≡',remaining],
            ].map(([route,title,symbol,count])=>button(`Buka pengingat ${title}`,`org-smart-list org-smart-${route}`,()=>player.open('reminders',route),
                el('span',{class:'org-smart-icon','aria-hidden':'true'},symbol),el('strong',{},count),el('span',{class:'org-smart-label'},title)))),
            el('h3',{class:'org-list-section'},'Daftar Saya'),button('Buka daftar Pengingat','org-list-entry',()=>player.open('reminders'),
                el('span',{class:'org-smart-icon','aria-hidden':'true'},'≡'),el('strong',{},'Pengingat'),el('small',{},remaining),el('span',{'aria-hidden':'true'},'›')));
        body.append(content);
        return;
    }
    const isToday = player.detail==='today';
    const title = ({today:'Hari Ini',scheduled:'Terjadwal',all:'Semua'})[player.detail] || 'Pengingat';
    content.append(el('div',{class:'org-reminder-heading'},el('h2',{'data-app-heading':'',tabindex:'-1'},title),el('strong',{},isToday ? 0 : remaining)));
    const search = el('input',{class:'org-reminder-search',type:'search',placeholder:'Cari','aria-label':'Cari pengingat'});
    const empty = el('p',{class:'org-empty'},isToday ? 'Tidak ada pengingat hari ini.' : 'Tidak ada hasil.');
    const list = el('div',{class:'org-reminder-list'});
    const checkbox = el('input',{type:'checkbox','aria-label':`Tandai ${reminder.title} selesai`,...(player.reminderDone ? {checked:''} : {}),onchange:event=>{
        player.reminderDone = event.target.checked;
        player.open('reminders',player.detail);
    }});
    const row = el('label',{class:`org-reminder-row${player.reminderDone ? ' is-complete' : ''}${player.detail==='fruit' ? ' is-highlighted' : ''}`},checkbox,
        el('span',{class:'org-reminder-copy'},el('strong',{},reminder.title),el('small',{},reminder.body.replace(/\.$/,''))));
    const filter = () => {
        row.hidden = isToday || !`${reminder.title} ${reminder.body}`.toLocaleLowerCase('id-ID').includes(search.value.toLocaleLowerCase('id-ID'));
        empty.hidden = !row.hidden;
    };
    search.addEventListener('input',filter);
    list.append(row);
    content.append(search,list,empty);
    body.append(content);
    filter();
}
