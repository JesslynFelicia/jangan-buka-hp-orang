import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {STORY} from '../js/found-phone-story.js';

test('Scene I contains only draft contacts and WhatsApp conversations, without authored continuation', () => {
    assert.deepEqual(STORY.contacts.map(contact=>contact.name),['🌸','Adnan','Ardi','Asep sate','Bu Sarah','Bu Tari','Ega','Faza Unina','Hubungi jika darurat','Helmi','Kurdi Bubur','Mama','Mang Saep','Naz','Rara','Ridwan Ayam','Zoy']);
    assert.deepEqual(STORY.chats.map(chat=>chat.name),['Wisma Biru','Zoy','(B)EST','Adnan','Mama']);
    assert.ok(!STORY.chats.some(chat=>chat.id==='emergency'));
    assert.ok(!('chapters' in STORY) && !('ending' in STORY) && !('posts' in STORY));
    assert.equal(STORY.instagram.messages.length,0);
    assert.equal(STORY.instagram.date,'MONDAY · 22.18');
    assert.deepEqual(STORY.chats.find(chat=>chat.id==='mama').messages.filter(message=>message.text).map(message=>message.text),['kk sdh dmn ?','ini baru mau brngkt','hati2 anakku']);
    for (const chat of STORY.chats) for (const message of chat.messages) {
        assert.ok(!message.text || !/\(stiker|Aku sudah di belakangmu|nomor kedua/i.test(message.text));
        assert.ok(!('time' in message));
    }
});

test('the five original notifications preserve the script counts and reminders', () => {
    assert.deepEqual(STORY.notifications.map(({app,count})=>[app,count]),[['messages',3],['instagram',12],['x',4],['calendar',1],['reminders',1]]);
    assert.equal(STORY.notifications.find(item=>item.id==='dinner').text,'Dinner, 19.00');
    assert.match(STORY.notifications.find(item=>item.id==='fruit').text,/Beli buah buat Mama/);
    assert.deepEqual(STORY.notifications.map(item=>item.target),['','activity','activity','dinner','fruit']);
    assert.deepEqual(STORY.notes.find(note=>note.id==='fruit'),{id:'fruit',title:'Beli buah buat Mama',body:'Besok.'});
    const unread = STORY.chats.filter(chat=>chat.initialUnread);
    assert.equal(unread.reduce((total,chat)=>total+chat.initialUnread,0),3);
    for (const chat of unread) assert.ok(chat.messages.slice(-chat.initialUnread).every(message=>message.from!=='You'));
});

test('stickers are static and every contact and group has a different real photo', async () => {
    const stickers = STORY.chats.flatMap(chat=>chat.messages.filter(message=>message.sticker).map(message=>message.sticker));
    assert.equal(stickers.length,2);
    const profiles = [...STORY.contacts,...STORY.chats.filter(item=>['wisma','best'].includes(item.id))];
    assert.equal(profiles.length,19);
    assert.equal(new Set(profiles.map(item=>item.avatar)).size,19);
    const hashes = await Promise.all(profiles.map(async item=>createHash('sha256').update(await readFile(new URL('../'+item.avatar,import.meta.url))).digest('hex')));
    assert.equal(new Set(hashes).size,19);
    for (const sticker of stickers) assert.ok(sticker.src.endsWith('.png') && !('poster' in sticker));
    for (const profile of profiles) assert.match(profile.avatar,/^\.\/images\/avatars\/.+\.jpg$/);
    const images = new Set([...STORY.photos.map(photo=>photo.src),...[...STORY.contacts,...STORY.chats].map(item=>item.avatar).filter(Boolean),...stickers.map(sticker=>sticker.src)]);
    for (const source of images) {
        assert.ok(source.startsWith('./images/'));
        const bytes = await readFile(new URL('../'+source,import.meta.url));
        const signature = bytes.subarray(0,8);
        assert.ok(signature.subarray(0,3).equals(Buffer.from([255,216,255])) || signature.toString().startsWith('GIF8') || signature.equals(Buffer.from([137,80,78,71,13,10,26,10])), `${source} is an image`);
    }
    for (const sticker of stickers) {
        const bytes = await readFile(new URL('../'+sticker.src,import.meta.url));
        assert.ok(!bytes.includes(Buffer.from('acTL')),`${sticker.src} has no animated PNG control chunk`);
    }
});
