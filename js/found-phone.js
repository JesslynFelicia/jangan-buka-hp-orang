import {STORY} from './found-phone-story.js';
import {renderCalendar,renderReminders} from './phone-organizer.js';

const SAVE_KEY = 'respawnsociety:found-phone:scene-one:v2';
const apps = {video:'YouTube',instagram:'Instagram',gallery:'Foto',notes:'Catatan',browser:'Safari',music:'Musik',messages:'WhatsApp',contacts:'Kontak',camera:'Kamera',x:'X',calendar:'Kalender',reminders:'Pengingat',notifications:'Pusat Notifikasi'};

function el(tag, attributes = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
        else element.setAttribute(key, value);
    }
    for (const child of children.flat()) if (child !== null && child !== undefined) element.append(child instanceof Node ? child : document.createTextNode(String(child)));
    return element;
}

const paths = {
    back:'m15 18-6-6 6-6', lock:'M5 10h14v11H5ZM8 10V6a4 4 0 0 1 8 0',
    wifi:'M2 8.5a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M12 19h.01',
    signal:'M2 16h3v6H2Zm5-4h3v10H7Zm5-5h3v15h-3Zm5-5h3v20h-3Z',
    person:'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    search:'m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    grid:'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
    folder:'M3 6h7l2 3h9v11H3Z',
    heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
    info:'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    check:'m5 12 4 4L19 6',
};
function icon(name) {
    if (!paths[name]) return el('img', {class:'fp-ios-icon',src:`./images/icons/${name}.jpg`,alt:'',width:'60',height:'60',draggable:'false'});
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    for (const [key,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'})) svg.setAttribute(key,value);
    const path = document.createElementNS(svg.namespaceURI,'path');
    path.setAttribute('d',paths[name]);
    if (name === 'signal') {path.setAttribute('fill','currentColor');path.setAttribute('stroke','none');}
    svg.append(path);
    return svg;
}
function button(label, className, action, ...children) {
    return el('button',{type:'button',class:className,'aria-label':label,onclick:action},...(children.length ? children : [label]));
}

class FoundPhone {
    constructor(container) {
        this.container = container;
        let saved;
        try {saved = JSON.parse(localStorage.getItem(SAVE_KEY));} catch { /* The phone still works when browser storage is unavailable. */ }
        this.unlocked = saved?.unlocked === true;
        this.read = new Set(Array.isArray(saved?.read) ? saved.read.filter(id => STORY.notifications.some(item => item.id === id)) : []);
        this.readChats = new Set(Array.isArray(saved?.readChats) ? saved.readChats.filter(id=>STORY.chats.some(chat=>chat.id===id)) : []);
        this.viewedStories = new Set(Array.isArray(saved?.viewedStories) ? saved.viewedStories.filter(index=>Number.isInteger(index) && index>=0 && index<4) : []);
        this.app = '';
        this.detail = '';
        this.favoritePhotos = new Set();
        this.selectedPhotos = new Set();
        this.selectingPhotos = false;
        document.getElementById('notifications-story').addEventListener('click',()=>this.open(this.app === 'notifications' ? '' : 'notifications'));
        document.getElementById('restart-story').addEventListener('click',()=>{
            if (!confirm('Buka ulang ponsel dari lock screen dan tandai notifikasi belum dibaca?')) return;
            this.unlocked = false;
            this.read.clear();
            this.readChats.clear();
            this.viewedStories.clear();
            this.open('');
        });
        this.container.addEventListener('pointerdown',event=>{
            if (event.button!==0 || !event.isPrimary || !event.target.closest('.fp-status')) return;
            this.pull = {id:event.pointerId,x:event.clientX,y:event.clientY};
        });
        this.container.addEventListener('pointermove',event=>{
            if (this.pull?.id===event.pointerId && event.clientY-this.pull.y>8) this.container.setPointerCapture(event.pointerId);
        });
        this.container.addEventListener('pointerup',event=>{
            const pull = this.pull;
            this.pull = null;
            if (!pull || pull.id!==event.pointerId) return;
            if (this.container.hasPointerCapture(event.pointerId)) this.container.releasePointerCapture(event.pointerId);
            const distance = event.clientY-pull.y;
            if (distance>=50 && distance>Math.abs(event.clientX-pull.x)*1.3) this.open('notifications');
        });
        this.container.addEventListener('pointercancel',()=>{this.pull=null;});
        this.render();
    }
    save() {
        try {localStorage.setItem(SAVE_KEY,JSON.stringify({unlocked:this.unlocked,read:[...this.read],readChats:[...this.readChats],viewedStories:[...this.viewedStories]}));}
        catch {document.getElementById('storage-status').hidden = false;}
    }
    unread(chat) {return this.readChats.has(chat.id) ? 0 : chat.initialUnread || 0;}
    count(app) {
        if (app==='messages') return STORY.chats.reduce((total,chat)=>total+this.unread(chat),0);
        return STORY.notifications.filter(item=>item.app===app && !this.read.has(item.id)).reduce((total,item)=>total+item.count,0);
    }
    open(app,detail='') {
        this.app = app;
        this.detail = detail;
        const chat = app==='messages' ? STORY.chats.find(item=>item.id===detail) : null;
        this.openedUnread = chat ? this.unread(chat) : 0;
        if (chat) this.readChats.add(chat.id);
        if (app==='instagram' && detail.startsWith('story:')) {
            const owner = Number(detail.split(':')[1]);
            if (Number.isInteger(owner) && owner>=0 && owner<4) this.viewedStories.add(owner);
        }
        if (app !== 'notifications' && app !== 'messages') for (const notice of STORY.notifications) if (notice.app === app) this.read.add(notice.id);
        this.save();
        this.render();
        this.container.querySelector('[data-app-heading], .fp-app-header h2')?.focus({preventScroll:true});
    }
    unlock(app='',detail='') {this.unlocked = true;this.open(app,detail);}
    back() {
        const [section,id] = this.detail.split(':');
        let target = '';
        if (section==='notification') target='activity';
        else if (this.app==='instagram' && this.detail==='bunga') target='inbox';
        else if (this.app==='instagram' && (this.detail==='edit-profile' || this.detail==='share:profile')) target='profile';
        else if (section==='share' || (this.app==='instagram' && section==='comments')) target=`post:${id}`;
        else if (this.app==='x' && section==='message') target='messages';
        else if (this.app==='notes' && this.detail==='deleted') target='folders';
        else if (this.app==='gallery' && this.detail==='favorites') target='collections';
        const returnToApp = this.detail && !['calendar','reminders','notifications'].includes(this.app) && !(this.app==='notes' && this.detail==='folders');
        this.open(returnToApp ? this.app : '',target);
    }
    avatar(id,name) {
        const image = STORY.chats.find(item=>item.id===id)?.avatar || STORY.contacts.find(item=>item.id===id || item.name===name)?.avatar;
        return el('span',{class:'fp-avatar'},image ? el('img',{src:image,alt:`Foto profil ${name}`,width:'42',height:'42',loading:'lazy'}) : icon('person'));
    }
    row(title,text,action,id='') {
        return button(title,'fp-row',action,...(id ? [this.avatar(id,title)] : []),el('span',{class:'fp-row-copy'},el('strong',{},title),...(text ? [el('p',{},text)] : [])));
    }
    render() {
        const surface = el('div',{class:`fp-surface fp-wallpaper${this.app && this.app !== 'notifications' ? ` fp-in-app fp-app-${this.app}` : ''}${!this.unlocked ? ' fp-is-locked' : ''}`});
        surface.append(el('header',{class:'fp-status'},button('Buka Pusat Notifikasi','fp-notification-trigger',()=>this.open('notifications'),'19:42'),el('span',{class:'fp-island','aria-hidden':'true'}),el('span',{class:'fp-indicators','aria-label':'Sinyal aktif, baterai 89 persen'},el('span',{class:'fp-status-signal'},icon('signal')),el('span',{class:'fp-status-wifi'},icon('wifi')),el('span',{class:'fp-battery-shell','aria-hidden':'true'},el('span',{class:'fp-battery-fill'},'89')))));
        const screen = el('div',{class:'fp-screen'});
        if (this.app === 'notifications') this.notificationCenter(screen);
        else if (!this.unlocked) this.lock(screen);
        else if (!this.app) this.home(screen);
        else this.application(screen);
        surface.append(screen);
        if (this.unlocked) surface.append(el('footer',{class:'fp-footer'},button('Layar utama','fp-home-button',()=>this.open(''),el('span',{'aria-hidden':'true'}))));
        this.container.replaceChildren(surface);
        const unreadMarker = this.container.querySelector('.fp-unread-divider');
        if (unreadMarker) {
            const chatBody = this.container.querySelector('.fp-chat-body');
            chatBody.scrollTop += unreadMarker.getBoundingClientRect().top-chatBody.getBoundingClientRect().top-chatBody.clientHeight/3;
        }
        document.getElementById('notifications-story').setAttribute('aria-expanded',String(this.app==='notifications'));
    }
    notice(item) {
        const remaining = item.app==='messages' ? this.count('messages') : item.count;
        if (item.app==='messages' && !remaining) return null;
        const text = item.app==='messages' ? `${remaining} pesan` : item.text;
        return button(`${item.title}: ${text}`,`fp-notice${item.app!=='messages' && this.read.has(item.id) ? ' is-read' : ''}`,()=>{if (item.app!=='messages') this.read.add(item.id);this.unlock(item.app,item.target);},el('span',{class:`fp-notice-icon color-${item.app}`},icon(item.app)),el('div',{class:'fp-notice-copy'},el('strong',{},item.title),el('p',{},text)));
    }
    lock(screen) {
        screen.append(el('div',{class:'fp-lock'},icon('lock'),el('div',{class:'fp-lock-time'},'19:42'),el('div',{class:'fp-notifications'},...STORY.notifications.map(item=>this.notice(item))),button('Buka perangkat','fp-unlock',()=>this.unlock(),icon('lock'),el('span',{},'Buka perangkat'))));
    }
    notificationCenter(screen) {
        screen.classList.add('fp-notification-center');
        screen.append(el('header',{class:'fp-app-header'},button('Kembali','fp-back',()=>this.open(''),icon('back')),el('h2',{tabindex:'-1'},'Pusat Notifikasi')),
            el('div',{class:'fp-app-body'},el('div',{class:'fp-notifications'},...STORY.notifications.map(item=>this.notice(item)))));
    }
    home(screen) {
        const appIcon = id => button(`Buka ${apps[id]}`,'fp-app',()=>this.open(id),el('span',{class:`fp-app-icon color-${id}`},icon(id)),el('span',{class:'fp-app-name'},apps[id]),...(this.count(id) ? [el('span',{class:'fp-app-badge','aria-label':`${this.count(id)} belum dibaca`},this.count(id))] : []));
        screen.append(el('div',{class:'fp-home'},el('div',{class:'fp-widget'},el('strong',{},'19:42'),el('p',{},'☀ Cerah')),
            el('div',{class:'fp-app-grid'},...['video','instagram','gallery','notes','browser','music','calendar','reminders'].map(appIcon)),
            el('div',{class:'fp-dock'},...['messages','contacts','camera','x'].map(appIcon))));
    }
    header(screen,title,chat=null) {
        const heading = el('h2',{tabindex:'-1'},title);
        screen.append(el('header',{class:`fp-app-header${chat ? ' fp-chat-header' : ''}`},button('Kembali','fp-back',()=>this.back(),icon('back')),
            ...(chat ? [this.avatar(chat.id,chat.name),el('div',{class:'fp-chat-heading'},heading,...(chat.members ? [el('small',{},chat.members)] : []))] : [heading])));
    }
    application(screen) {
        const chat = this.app==='messages' && this.detail ? STORY.chats.find(item=>item.id===this.detail) : null;
        if (!['gallery','notes','instagram','x','calendar','reminders'].includes(this.app)) this.header(screen,chat?.name || apps[this.app],chat);
        const body = el('div',{class:`fp-app-body${chat ? ' fp-chat-body' : ''}`});
        switch (this.app) {
            case 'messages': this.messages(body,chat);break;
            case 'contacts': this.contacts(body);break;
            case 'instagram': this.instagram(body);break;
            case 'x': this.activity(body);break;
            case 'gallery': this.gallery(body);break;
            case 'notes': this.notes(body);break;
            case 'calendar': renderCalendar(this,body,{el,button,icon});break;
            case 'reminders': renderReminders(this,body,{el,button,icon});break;
            default: body.append(el('p',{class:'fp-empty'},`Belum ada ${this.app==='notes' ? 'catatan' : this.app==='browser' ? 'tab terbuka' : this.app==='music' ? 'musik' : this.app==='video' ? 'video' : this.app==='camera' ? 'foto baru' : 'aktivitas'}.`));
        }
        screen.append(body);
    }
    messages(body,chat) {
        if (!chat) {
            for (const item of STORY.chats) {
                const last = item.messages.at(-1);
                const row = this.row(item.name,last.sticker ? 'Stiker' : last.text,()=>this.open('messages',item.id),item.id);
                const unread = this.unread(item);
                if (unread) {row.classList.add('is-unread');row.setAttribute('aria-description',`${unread} pesan belum dibaca`);row.append(el('span',{class:'fp-unread','aria-hidden':'true'},unread));}
                body.append(row);
            }
            return;
        }
        const messages = el('div',{class:'fp-messages'});
        const group = Boolean(chat.members) || chat.id==='best';
        for (const [index,message] of chat.messages.entries()) {
            if (this.openedUnread && index===chat.messages.length-this.openedUnread) messages.append(el('div',{class:'fp-unread-divider'},`${this.openedUnread} pesan belum dibaca`));
            const bubble = el('div',{class:`fp-message${message.from==='You' ? ' fp-self' : ''}${message.sticker ? ' fp-sticker' : ''}`});
            if (group && message.from!=='You') bubble.append(el('span',{class:'fp-sender'},message.from));
            if (message.sticker) bubble.append(el('img',{class:'fp-sticker-image',src:message.sticker.src,alt:message.sticker.alt,width:'180',loading:'lazy'}));
            else bubble.append(el('p',{},message.text));
            messages.append(group && message.from!=='You' ? el('div',{class:'fp-incoming-group'},this.avatar('',message.from),bubble) : bubble);
        }
        body.append(messages,el('p',{class:'fp-compose'},'Riwayat percakapan'));
    }
    contacts(body) {
        if (this.detail) {
            const contact = STORY.contacts.find(item=>item.id===this.detail);
            body.append(el('div',{class:'fp-profile-header'},this.avatar(contact.id,contact.name),el('h3',{},contact.name)));
            if (STORY.chats.some(chat=>chat.id===contact.id)) body.append(button(`Buka chat ${contact.name}`,'fp-reply',()=>this.open('messages',contact.id),'Buka chat'));
            return;
        }
        for (const contact of STORY.contacts) body.append(this.row(contact.name,'',()=>this.open('contacts',contact.id),contact.id));
    }
    instagram(body) {
        body.classList.add('phone-social','social-ig');
        const route = this.detail;
        const section = route.split(':')[0];
        const index = Number(route.split(':')[1] || 0);
        if (section==='story') {this.instagramStory(body,index,Number(route.split(':')[2] || 0));return;}
        const notice = section==='notification' ? this.instagramActivity(index) : null;
        const back = target => this.socialControl('Kembali','back',()=>this.open('instagram',target));
        const heading = (title,target='') => el('header',{class:'social-header'},back(target),el('h2',{tabindex:'-1','data-app-heading':''},title),el('span',{class:'social-header-spacer'}));
        const content = el('div',{class:'social-scroll'});
        if (route==='bunga') {
            body.append(el('header',{class:'social-header ig-chat-header'},back('inbox'),this.avatar('bunga','🌸'),el('h2',{tabindex:'-1','data-app-heading':''},'🌸')));
            content.classList.add('ig-conversation');
            content.append(el('div',{class:'ig-dm-person'},this.avatar('bunga','🌸'),el('strong',{},'🌸'),el('p',{},STORY.instagram.name)),el('p',{class:'ig-message-date'},STORY.instagram.date));
            for (const message of STORY.instagram.messages) content.append(el('p',{class:`ig-message${message.from==='You' ? ' is-self' : ''}`},message.text));
            body.append(content,el('div',{class:'ig-message-compose'},this.socialIcon('camera'),el('span',{},'Pesan…'),this.socialControl('Lihat foto','image',()=>this.open('instagram','create'))));
            return;
        }
        if (!route) body.append(el('header',{class:'social-header ig-home-header'},this.socialControl('Buat postingan','plus',()=>this.open('instagram','create')),el('h2',{class:'ig-wordmark',tabindex:'-1','data-app-heading':''},'Instagram'),this.socialControl('Aktivitas Instagram','heart',()=>this.open('instagram','activity')),this.socialControl('Buka inbox Instagram','send',()=>this.open('instagram','inbox'))));
        else body.append(heading(notice?.comment ? 'Komentar' : ({inbox:'Pesan',activity:'Notifikasi',profile:'lorem_ipsum','edit-profile':'Edit profil',search:'Cari',reels:'Reels',create:'Postingan baru',comments:'Komentar',share:'Bagikan',notification:'Postingan',post:'Postingan'})[section] || 'Instagram',section==='notification' ? 'activity' : section==='comments' ? `post:${index}` : ''));
        if (!route) {
            content.append(el('div',{class:'ig-stories'},...Array.from({length:4},(_,number)=>{
                const seen = this.viewedStories.has(number);
                const story = button(number ? `Buka cerita ${number}` : 'Cerita Anda','ig-story',()=>this.open('instagram',`story:${number}`),el('span',{class:`ig-story-ring${seen ? ' is-seen' : ''}`},el('img',{src:STORY.contacts[number].avatar,alt:'',loading:'lazy'})),el('span',{},number ? 'lorem_ipsum' : 'Cerita Anda'));
                story.setAttribute('aria-description',seen ? 'Sudah dilihat' : 'Belum dilihat');
                return story;
            })));
            STORY.photos.forEach((photo,number)=>content.append(this.instagramPost(number)));
        } else if (route==='inbox') {
            content.append(this.socialSearch('Cari pesan'),el('div',{class:'social-section-heading'},el('strong',{},'Pesan'),el('span',{},'Permintaan')),
                button('Buka chat Instagram 🌸','ig-inbox-row',()=>this.open('instagram','bunga'),this.avatar('bunga','🌸'),el('span',{},el('strong',{},'🌸'),el('small',{},STORY.instagram.name)),this.socialIcon('camera')));
        } else if (route==='activity') {
            content.append(el('h3',{class:'social-section-title'},'Terbaru'));
            for (let number=1;number<=STORY.notifications.find(item=>item.app==='instagram').count;number++) {
                const activity = this.instagramActivity(number);
                content.append(button(`Buka notifikasi Instagram ${number}`,'ig-activity-row',()=>this.open('instagram',`notification:${number}`),el('span',{class:'ig-activity-avatar'},this.socialAvatar(number),el('span',{class:`ig-activity-cue${activity.comment ? ' is-comment' : ''}`,'aria-label':activity.comment ? 'Komentar' : 'Suka'},this.socialIcon(activity.comment ? 'comment' : 'heart'))),el('span',{},el('strong',{},`${activity.username} `),activity.comment ? `mengomentari: ${activity.commentText}` : 'menyukai foto Anda.',el('small',{},'Lorem ipsum')),el('img',{class:'ig-activity-thumbnail',src:this.socialPhoto(activity.photoIndex).src,alt:'',loading:'lazy'})));
            }
        } else if (route==='profile') {
            content.append(el('div',{class:'ig-profile-top'},this.socialAvatar(0),el('div',{},...['postingan','pengikut','mengikuti'].map(label=>el('span',{},el('strong',{},'—'),el('small',{},label))))),el('div',{class:'ig-profile-bio'},el('strong',{},'Lorem ipsum'),el('p',{},'Lorem ipsum dolor sit amet.')),
                el('div',{class:'ig-profile-buttons'},button('Edit profil','',()=>this.open('instagram','edit-profile'),'Edit profil'),button('Bagikan profil','',()=>this.open('instagram','share:profile'),'Bagikan profil')),el('div',{class:'ig-grid-heading'},this.socialIcon('grid')),this.socialGrid('instagram'));
        } else if (route==='search' || route==='create') content.append(this.socialSearch(route==='search' ? 'Cari' : 'Cari foto'),this.socialGrid('instagram'));
        else if (route==='reels') {
            const photo = this.socialPhoto(index);
            content.append(el('div',{class:`ig-visual-view${route==='reels' ? ' is-reel' : ''}`},el('img',{src:photo.src,alt:photo.title}),el('div',{class:'ig-visual-caption'},el('strong',{},'lorem_ipsum'),el('p',{},'Lorem ipsum dolor sit amet.')),el('div',{class:'ig-visual-actions'},this.socialToggle('Sukai','heart',`ig-visual:${route}`),this.socialControl('Komentar','comment',()=>this.open('instagram',`comments:${index}`)),this.socialControl('Bagikan','send',()=>this.open('instagram',`share:${index}`)))));
        } else if (section==='post' || section==='notification') content.append(notice?.comment ? this.instagramComment(index,true) : this.instagramPost(notice ? notice.photoIndex : index));
        else if (section==='comments') content.append(this.instagramComment(index));
        else content.append(el('div',{class:'social-placeholder'},this.socialIcon('send'),el('h3',{},'Lorem ipsum'),el('p',{},'Lorem ipsum dolor sit amet.')));
        body.append(content,this.socialNav('instagram',section));
    }
    instagramActivity(number) {
        const id = Math.max(1,Number(number) || 1);
        return {comment:id%2===0,username:`lorem_ipsum_${String(id).padStart(2,'0')}`,commentText:'Lorem ipsum dolor sit amet.',photoIndex:(id-1)%STORY.photos.length};
    }
    instagramComment(number,highlight=false) {
        const activity = this.instagramActivity(number);
        return el('section',{class:'ig-comment-thread'},button('Lihat foto yang dikomentari','ig-comment-context',()=>this.open('instagram',`post:${activity.photoIndex}`),el('img',{src:this.socialPhoto(activity.photoIndex).src,alt:''}),el('span',{},'lorem_ipsum',el('small',{},'Lorem ipsum dolor sit amet.'))),el('div',{class:`ig-comment${highlight ? ' is-highlighted' : ''}`},this.socialAvatar(number),el('div',{},el('strong',{},activity.username),el('p',{},activity.commentText),el('small',{},'Lorem ipsum')),this.socialToggle('Sukai komentar','heart',`ig-comment:${number}`)));
    }
    instagramStory(body,owner,slide=0) {
        body.classList.add('ig-story-screen');
        owner = Math.max(0,Math.min(3,Number(owner) || 0));
        const count = Math.min(3,STORY.photos.length);
        slide = Math.max(0,Math.min(count-1,Number(slide) || 0));
        const photo = this.socialPhoto(owner+slide);
        const activeRoute = this.detail;
        const navigate = direction => {
            if (slide+direction>=0 && slide+direction<count) this.open('instagram',`story:${owner}:${slide+direction}`);
            else if (direction>0) this.open('instagram',owner<3 ? `story:${owner+1}:0` : '');
            else this.open('instagram',owner ? `story:${owner-1}:${count-1}` : 'story:0:0');
        };
        const viewer = el('section',{class:'ig-story-viewer',onkeydown:event=>{
            if (event.target.tagName==='INPUT') return;
            if (event.key==='Escape') this.open('instagram');
            else if (event.key==='ArrowRight' || event.key==='ArrowLeft') {event.preventDefault();navigate(event.key==='ArrowRight' ? 1 : -1);}
        }});
        let paused = false;
        const setPaused = value => {paused=value;viewer.classList.toggle('is-paused',paused);pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',paused ? 'Lanjutkan cerita' : 'Jeda cerita');pause.textContent=paused ? '▶' : 'Ⅱ';};
        const pause = button('Jeda cerita','ig-story-pause',()=>setPaused(!paused),'Ⅱ');
        pause.setAttribute('aria-pressed','false');
        const tap = direction => {
            let started=0,held=false,previouslyPaused=false;
            const control = button(direction<0 ? 'Cerita sebelumnya' : 'Cerita berikutnya','ig-story-tap',()=>{if (held) {held=false;return;}navigate(direction);},el('span',{'aria-hidden':'true'}));
            control.addEventListener('pointerdown',event=>{if (event.button!==0 || !event.isPrimary) return;started=performance.now();held=false;previouslyPaused=paused;setPaused(true);control.setPointerCapture(event.pointerId);});
            control.addEventListener('pointerup',()=>{held=performance.now()-started>=180;setPaused(previouslyPaused);});
            control.addEventListener('pointercancel',()=>{held=true;setPaused(previouslyPaused);});
            return control;
        };
        const progress = el('div',{class:'ig-story-progress',role:'progressbar','aria-label':'Urutan cerita','aria-valuemin':'1','aria-valuemax':String(count),'aria-valuenow':String(slide+1)},...Array.from({length:count},(_,index)=>el('span',{class:index<slide ? 'is-seen' : index===slide ? 'is-current' : ''},el('i',index===slide ? {onanimationend:()=>{if (body.isConnected && this.app==='instagram' && this.detail===activeRoute && !paused) navigate(1);}} : {}))));
        const stage = el('div',{class:'ig-story-stage'},el('img',{class:'ig-story-media',src:photo.src,alt:photo.title}),el('div',{class:'ig-story-taps'},tap(-1),tap(1)),progress,el('header',{class:'ig-story-header'},this.socialAvatar(owner),el('h2',{'data-app-heading':'',tabindex:'-1'},`lorem_ipsum_${String(owner+1).padStart(2,'0')}`),pause,this.socialControl('Tutup cerita','plus',()=>this.open('instagram'),'ig-story-close')),el('span',{class:'ig-story-paused','aria-live':'polite'},'Dijeda'));
        let pausedBeforeReply = false;
        const input = el('input',{type:'text',placeholder:'Kirim pesan…','aria-label':'Balas cerita',autocomplete:'off',onfocus:()=>{pausedBeforeReply=paused;setPaused(true);},onblur:()=>setPaused(pausedBeforeReply),oninput:()=>{submit.hidden=!input.value.trim();}});
        const submit = el('button',{type:'submit',class:'ig-story-reply-send',hidden:'','aria-label':'Kirim balasan cerita'},'Kirim');
        const sent = el('span',{class:'ig-story-sent',hidden:'',role:'status'},'Terkirim');
        const reply = el('form',{class:'ig-story-reply',onsubmit:event=>{event.preventDefault();const text=input.value.trim();if (!text) return;(this.instagramReplies ||= new Map()).set(`${owner}:${slide}`,text);input.value='';submit.hidden=true;sent.hidden=false;}},input,submit);
        viewer.append(stage,el('footer',{class:'ig-story-bottom'},reply,this.socialToggle('Sukai cerita','heart',`ig-story:${owner}:${slide}`),this.socialControl('Bagikan cerita','send',()=>this.open('instagram',`share:${owner}`))),sent);
        body.append(viewer);
    }
    activity(body) {
        body.classList.add('phone-social','social-x');
        const route = this.detail;
        const section = route.split(':')[0];
        const index = Number(route.split(':')[1] || 0);
        const content = el('div',{class:'social-scroll'});
        const title = ({activity:'Notifikasi',search:'Cari',messages:'Pesan',profile:'Lorem ipsum',compose:'Posting',share:'Bagikan',notification:'Posting',post:'Posting'})[section];
        body.append(el('header',{class:'social-header x-header'},route && route!=='following' ? this.socialControl('Kembali','back',()=>this.open('x',section==='notification' ? 'activity' : '')) : button('Profil X','social-icon-button',()=>this.open('x','profile'),this.socialAvatar(0)),title ? el('h2',{tabindex:'-1','data-app-heading':''},title) : el('strong',{class:'x-wordmark',tabindex:'-1','data-app-heading':'','aria-label':'X'},el('img',{src:'./images/icons/x.jpg',alt:'',width:'28',height:'28'})),this.socialControl('Cari di X','search',()=>this.open('x','search'))));
        if (!route || route==='following') {
            body.append(el('div',{class:'x-feed-tabs'},...['Untuk Anda','Mengikuti'].map((label,number)=>button(label,`x-feed-tab${Boolean(number)===Boolean(route) ? ' is-selected' : ''}`,()=>this.open('x',number ? 'following' : ''),label))));
            for (let number=0;number<3;number++) content.append(this.xPost(number));
        } else if (route==='activity') {
            content.append(el('div',{class:'x-notification-tabs'},el('strong',{},'Semua'),el('span',{},'Terverifikasi'),el('span',{},'Sebutan')));
            for (let number=1;number<=STORY.notifications.find(item=>item.app==='x').count;number++) content.append(button(`Buka notifikasi X ${number}`,'x-activity-row',()=>this.open('x',`notification:${number}`),this.socialIcon(number%2 ? 'heart' : 'person'),el('span',{},this.socialAvatar(number),el('p',{},el('strong',{},'Lorem ipsum '),'dolor sit amet.'),el('small',{},'Lorem ipsum dolor sit amet.'))));
        } else if (section==='notification' || section==='post') {
            content.append(this.xPost(index,true),el('div',{class:'x-reply-heading'},'Balasan'),this.xPost(index+1));
        } else if (route==='search') content.append(this.socialSearch('Cari di X'),el('h3',{class:'social-section-title'},'Sedang tren'),...Array.from({length:4},(_,number)=>button(`Lihat tren ${number+1}`,'x-trend',()=>this.open('x',`post:${number}`),el('small',{},'Lorem ipsum'),el('strong',{},'Lorem ipsum'),el('small',{},'Lorem ipsum dolor sit amet.'))));
        else if (route==='profile') {
            content.append(el('img',{class:'x-profile-cover',src:this.socialPhoto(0).src,alt:''}),el('div',{class:'x-profile-info'},this.socialAvatar(0),el('h3',{},'Lorem ipsum'),el('small',{},'@lorem_ipsum'),el('p',{},'Lorem ipsum dolor sit amet.'),el('p',{},'— Mengikuti    — Pengikut')),this.xPost(0));
        } else if (route==='messages') content.append(this.socialSearch('Cari pesan'),button('Buka pesan X','ig-inbox-row',()=>this.open('x','message:0'),this.socialAvatar(1),el('span',{},el('strong',{},'Lorem ipsum'),el('small',{},'Lorem ipsum dolor sit amet.'))));
        else content.append(el('div',{class:'social-placeholder'},this.socialIcon(section==='compose' ? 'edit' : 'send'),el('h3',{},'Lorem ipsum'),el('p',{},'Lorem ipsum dolor sit amet.')));
        body.append(content,this.socialNav('x',section));
        if (!route || route==='following' || route==='activity') body.append(this.socialControl('Buat posting di X','plus',()=>this.open('x','compose'),'x-compose-button'));
    }
    socialIcon(name) {
        const paths = {back:'m15 18-6-6 6-6',plus:'M12 5v14M5 12h14',heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',send:'m22 2-7 20-4-9L2 9 22 2ZM11 13 22 2',home:'m3 10 9-7 9 7v11h-6v-7H9v7H3Z',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',reels:'M3 4h18v17H3ZM3 9h18M7 4l3 5M15 4l3 5m-8 3 6 3-6 3Z',person:'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',comment:'M21 11a9 9 0 1 1-4-7.5M21 11v10l-6-2',bookmark:'M5 3h14v18l-7-5-7 5Z',more:'M4 12h.01M12 12h.01M20 12h.01',camera:'M3 7h4l2-3h6l2 3h4v13H3Zm13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',image:'M3 3h18v18H3ZM3 17l6-6 4 4 3-3 5 5M8 7h.01',grid:'M3 3h18v18H3ZM3 9h18M3 15h18M9 3v18M15 3v18',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 10h18c0-3-3-3-3-10M10 21h4',mail:'M3 5h18v14H3ZM3 5l9 8 9-8',repost:'m7 7 3-3-3-3M3 16V7h16m-2 10-3 3 3 3m4-15v12H5',share:'M12 16V2m-5 5 5-5 5 5M5 11v10h14V11',edit:'m14 4 6 6M3 21l5-1L21 7l-5-5L3 15Z'};
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        for (const [key,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.8','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'})) svg.setAttribute(key,value);
        const path = document.createElementNS(svg.namespaceURI,'path');
        path.setAttribute('d',paths[name] || paths.more);
        svg.append(path);
        return svg;
    }
    socialControl(label,symbol,action,className='') {
        return button(label,`social-icon-button ${className}`,action,this.socialIcon(symbol));
    }
    socialPhoto(index) {return STORY.photos[Math.abs(index)%STORY.photos.length];}
    socialAvatar(index) {
        return el('span',{class:'social-avatar'},el('img',{src:STORY.contacts[Math.abs(index)%STORY.contacts.length].avatar,alt:'',loading:'lazy'}));
    }
    socialToggle(label,symbol,key) {
        this.socialReactions ||= new Set();
        const control = this.socialControl(label,symbol,()=>{
            if (this.socialReactions.has(key)) this.socialReactions.delete(key); else this.socialReactions.add(key);
            control.classList.toggle('is-active',this.socialReactions.has(key));
            control.setAttribute('aria-pressed',String(this.socialReactions.has(key)));
            control.querySelector('.social-count').textContent = this.socialReactions.has(key) ? '1' : '0';
        },this.socialReactions.has(key) ? 'is-active' : '');
        control.setAttribute('aria-pressed',String(this.socialReactions.has(key)));
        control.append(el('small',{class:'social-count'},this.socialReactions.has(key) ? '1' : '0'));
        return control;
    }
    socialSearch(label) {
        return el('label',{class:'social-search'},this.socialIcon('search'),el('input',{type:'search',placeholder:label,'aria-label':label,oninput:event=>{
            const query = event.target.value.trim().toLowerCase();
            for (const item of event.target.closest('.social-scroll').querySelectorAll('.social-grid-photo,.ig-inbox-row,.x-trend')) item.hidden = !`${item.textContent} ${item.querySelector('img')?.alt || ''}`.toLowerCase().includes(query);
        }}));
    }
    socialGrid(app) {
        return el('div',{class:'ig-photo-grid'},...STORY.photos.map((photo,index)=>button(`Buka postingan ${index+1}`,'social-grid-photo',()=>this.open(app,`post:${index}`),el('img',{src:photo.src,alt:photo.title,loading:'lazy'}))));
    }
    socialNav(app,section) {
        const items = app==='instagram' ? [['','home','Beranda Instagram'],['reels','reels','Reels'],['inbox','send','Pesan Instagram'],['search','search','Cari Instagram'],['profile','person','Profil Instagram']] : [['','home','Beranda X'],['search','search','Cari X'],['activity','bell','Notifikasi X'],['messages','mail','Pesan X']];
        return el('nav',{class:'social-bottom-nav','aria-label':`Navigasi ${apps[app]}`},...items.map(([route,symbol,label])=>{
            const control = this.socialControl(label,symbol,()=>this.open(app,route),section===route ? 'is-selected' : '');
            if (section===route) control.setAttribute('aria-current','page');
            return control;
        }));
    }
    instagramPost(index) {
        const photo = this.socialPhoto(index);
        return el('article',{class:'ig-post'},el('header',{class:'ig-post-header'},button('Buka profil lorem_ipsum','social-person-button',()=>this.open('instagram','profile'),this.socialAvatar(index),el('strong',{},'lorem_ipsum')),this.socialControl('Opsi postingan','more',()=>this.open('instagram',`share:${index}`))),button(`Lihat postingan ${index+1}`,'ig-post-photo',()=>this.open('instagram',`post:${index}`),el('img',{src:photo.src,alt:photo.title,loading:'lazy'})),
            el('div',{class:'ig-post-actions'},this.socialToggle('Sukai postingan','heart',`ig-like:${index}`),this.socialControl('Lihat komentar','comment',()=>this.open('instagram',`comments:${index}`)),this.socialControl('Bagikan postingan','send',()=>this.open('instagram',`share:${index}`)),this.socialToggle('Simpan postingan','bookmark',`ig-save:${index}`)),el('div',{class:'ig-post-caption'},el('strong',{},'lorem_ipsum '),'Lorem ipsum dolor sit amet.',el('small',{},'Lorem ipsum')));
    }
    xPost(index,detail=false) {
        return el('article',{class:`x-post${detail ? ' is-detail' : ''}`},button('Buka profil X','social-person-button x-post-avatar',()=>this.open('x','profile'),this.socialAvatar(index)),el('div',{class:'x-post-content'},
            button('Buka posting X','x-post-text',()=>this.open('x',`post:${index}`),el('span',{class:'x-post-author'},el('strong',{},'Lorem ipsum'),el('small',{},'@lorem_ipsum'),this.socialIcon('more')),el('p',{},'Lorem ipsum dolor sit amet, consectetur adipiscing elit.')),
            ...(index%3===0 ? [el('img',{class:'x-post-photo',src:this.socialPhoto(index).src,alt:this.socialPhoto(index).title,loading:'lazy'})] : []),
            ...(detail ? [el('p',{class:'x-post-meta'},'Lorem ipsum')] : []),el('div',{class:'x-post-actions'},this.socialControl('Balas posting X','comment',()=>this.open('x',`post:${index}`)),this.socialToggle('Posting ulang','repost',`x-repost:${index}`),this.socialToggle('Sukai posting X','heart',`x-like:${index}`),this.socialToggle('Simpan posting X','bookmark',`x-save:${index}`),this.socialControl('Bagikan posting X','share',()=>this.open('x',`share:${index}`)))));
    }
    document(kicker,title,text) {return el('article',{class:'fp-document'},el('small',{},kicker),el('h3',{},title),...(text ? [el('p',{},text)] : []));}
    gallery(body) {
        body.classList.add('pl-photos');
        const photo = STORY.photos.find(item=>item.id===this.detail);
        if (photo) {
            body.classList.add('pl-photo-viewer');
            body.append(el('header',{class:'pl-viewer-header'},button('Kembali ke perpustakaan','pl-icon-button',()=>this.open('gallery'),icon('back')),el('h2',{'data-app-heading':'',tabindex:'-1'},photo.title),button('Selesai melihat foto','pl-text-button',()=>this.open('gallery'),'Selesai')),
                el('div',{class:'pl-photo-stage'},el('img',{class:'fp-photo-image',src:photo.src,alt:photo.title})),
                el('div',{class:'pl-filmstrip'},...STORY.photos.map(item=>button(`Lihat foto ${item.title}`,item.id===photo.id ? 'is-active' : '',()=>this.open('gallery',item.id),el('img',{src:item.src,alt:'',width:'36',height:'44'})))),
                el('div',{class:'pl-photo-actions'},button('Favorit foto','pl-icon-button',()=>{this.favoritePhotos.has(photo.id) ? this.favoritePhotos.delete(photo.id) : this.favoritePhotos.add(photo.id);this.render();},icon('heart')),button('Info foto','pl-icon-button',()=>{this.photoInfo=!this.photoInfo;this.render();},icon('info'))));
            body.querySelector('[aria-label="Favorit foto"]').setAttribute('aria-pressed',String(this.favoritePhotos.has(photo.id)));
            if (this.photoInfo) body.append(el('section',{class:'pl-photo-info'},el('strong',{},photo.title),el('p',{},'JPEG')));
            return;
        }
        const collections = this.detail==='collections';
        const title = collections ? 'Koleksi' : this.detail==='favorites' ? 'Favorit' : this.detail==='search' ? 'Cari' : 'Perpustakaan';
        body.append(el('header',{class:'pl-library-header'},el('h2',{'data-app-heading':'',tabindex:'-1'},title),
            button('Cari foto','pl-icon-button',()=>this.open('gallery','search'),icon('search')),
            ...(!collections ? [button('Pilih foto','pl-text-button',()=>{this.selectingPhotos=!this.selectingPhotos;this.selectedPhotos.clear();this.render();},this.selectingPhotos ? 'Selesai' : 'Pilih')] : [])));
        const content = el('div',{class:'pl-library-content'});
        if (collections) {
            content.append(el('h3',{},'Album'),button('Buka album Terbaru','pl-album',()=>this.open('gallery'),el('img',{src:STORY.photos[0].src,alt:''}),el('strong',{},'Terbaru'),el('span',{},`${STORY.photos.length} foto`)),
                button('Buka album Favorit','pl-album',()=>this.open('gallery','favorites'),icon('heart'),el('strong',{},'Favorit'),el('span',{},`${this.favoritePhotos.size} foto`)));
        } else {
            const grid = el('div',{class:'pl-photo-grid'});
            for (const item of STORY.photos.filter(item=>this.detail!=='favorites' || this.favoritePhotos.has(item.id))) {
                const tile = button(`Buka foto ${item.title}`,`pl-photo-tile${this.selectedPhotos.has(item.id) ? ' is-selected' : ''}`,()=>{
                    if (this.selectingPhotos) {this.selectedPhotos.has(item.id) ? this.selectedPhotos.delete(item.id) : this.selectedPhotos.add(item.id);this.render();}
                    else {this.photoInfo=false;this.open('gallery',item.id);}
                },el('img',{class:'fp-photo-image',src:item.src,alt:item.title,loading:'lazy'}),...(this.selectingPhotos ? [el('span',{class:'pl-photo-check'},icon('check'))] : []));
                tile.dataset.search = item.title.toLowerCase();
                grid.append(tile);
            }
            if (this.detail==='search') content.append(el('input',{class:'pl-search',type:'search',placeholder:'Foto, tempat, atau orang','aria-label':'Cari foto',oninput:event=>{for (const tile of grid.children) tile.hidden=!tile.dataset.search.includes(event.target.value.toLowerCase());}}));
            content.append(grid,el('p',{class:'pl-photo-count'},this.selectingPhotos ? `${this.selectedPhotos.size} dipilih` : `${grid.children.length} foto`));
        }
        body.append(content,el('nav',{class:'pl-tabs','aria-label':'Navigasi Foto'},...[[null,'Perpustakaan','grid'],['collections','Koleksi','folder']].map(([detail,label,symbol])=>button(label,collections===(detail==='collections') ? 'is-active' : '',()=>this.open('gallery',detail || ''),icon(symbol),el('span',{},label)))));
    }
    notes(body) {
        body.classList.add('pl-notes');
        const note = STORY.notes.find(item=>item.id===this.detail);
        if (note) {
            body.append(el('header',{class:'pl-notes-toolbar'},button('Kembali ke catatan','pl-text-button',()=>this.open('notes'),icon('back'),'Catatan'),button('Selesai membaca catatan','pl-text-button',()=>this.open('notes'),'Selesai')),
                el('article',{class:'pl-note-detail'},el('h2',{'data-app-heading':'',tabindex:'-1'},note.title),el('p',{},note.body)));
            return;
        }
        const folders = this.detail==='folders';
        const deleted = this.detail==='deleted';
        body.append(el('header',{class:'pl-notes-toolbar'},button(folders ? 'Kembali ke layar utama' : 'Folder catatan','pl-text-button',()=>this.open(folders ? '' : 'notes',folders ? '' : 'folders'),icon('back'),folders ? 'Kembali' : 'Folder')),
            el('h2',{class:'pl-notes-title','data-app-heading':'',tabindex:'-1'},folders ? 'Folder' : deleted ? 'Baru Dihapus' : 'Catatan'));
        const content = el('div',{class:'pl-notes-content'});
        if (folders) {
            content.append(el('h3',{},'Di iPhone Saya'),el('div',{class:'pl-notes-list'},...[["Semua Catatan",'',STORY.notes.length],["Catatan",'',STORY.notes.length],["Baru Dihapus",'deleted',0]].map(([title,detail,count])=>button(`Buka folder ${title}`,'pl-folder-row',()=>this.open('notes',detail),icon('folder'),el('span',{},title),el('small',{},count),icon('back')))));
        } else {
            const list = el('div',{class:'pl-notes-list'});
            for (const item of deleted ? [] : STORY.notes) {
                const row = button(`Buka catatan ${item.title}`,'pl-note-row',()=>this.open('notes',item.id),el('strong',{},item.title),el('p',{},item.body));
                row.dataset.search = `${item.title} ${item.body}`.toLowerCase();
                list.append(row);
            }
            content.append(el('input',{class:'pl-search',type:'search',placeholder:'Cari','aria-label':'Cari catatan',oninput:event=>{for (const row of list.children) row.hidden=!row.dataset.search.includes(event.target.value.toLowerCase());}}),list);
            body.append(content,el('footer',{class:'pl-notes-count'},`${list.children.length} catatan`));
            return;
        }
        body.append(content);
    }
}
if (typeof document !== 'undefined') {
    const container = document.getElementById('found-phone');
    if (container) new FoundPhone(container);
}
