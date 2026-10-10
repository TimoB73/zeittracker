'use strict';

const SPEICHER = 'zeittracker.v1';

// Zustand:
//   aktivitaeten: [{ id, name, uhrAb }]            (uhrAb: Zeitpunkt des letzten Zurücksetzens der Uhr)
//   eintraege:    [{ aktivitaetId, start, ende }]  (abgeschlossene Messungen, Zeitstempel in ms)
//   laufend:      { aktivitaetId, start } oder null
let zustand = laden();

const liste = document.getElementById('liste');
const leer = document.getElementById('leer');
const gesamt = document.getElementById('gesamt');
const formular = document.getElementById('neu');
const eingabe = document.getElementById('neu-name');

function laden() {
  try {
    const daten = JSON.parse(localStorage.getItem(SPEICHER));
    if (daten && Array.isArray(daten.aktivitaeten) && Array.isArray(daten.eintraege)) {
      return { aktivitaeten: daten.aktivitaeten, eintraege: daten.eintraege, laufend: daten.laufend || null };
    }
  } catch (e) {
    // Unlesbare Daten: mit leerem Zustand starten
  }
  return { aktivitaeten: [], eintraege: [], laufend: null };
}

function speichern() {
  localStorage.setItem(SPEICHER, JSON.stringify(zustand));
}

// ---------- Zeitrechnung ----------

function tagesbeginn(jetzt) {
  const d = new Date(jetzt);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function wochenbeginn(jetzt) {
  const d = new Date(tagesbeginn(jetzt));
  const tageSeitMontag = (d.getDay() + 6) % 7; // getDay(): Sonntag = 0
  d.setDate(d.getDate() - tageSeitMontag);
  return d.getTime();
}

// Summe aller Messungen einer Aktivität ab "von" bis jetzt.
// Messungen, die vor "von" begonnen haben (z. B. über Mitternacht), zählen nur anteilig.
function summe(aktivitaetId, von, jetzt) {
  let ms = 0;
  for (const e of zustand.eintraege) {
    if (e.aktivitaetId === aktivitaetId && e.ende > von) {
      ms += e.ende - Math.max(e.start, von);
    }
  }
  const l = zustand.laufend;
  if (l && l.aktivitaetId === aktivitaetId && jetzt > von) {
    ms += jetzt - Math.max(l.start, von);
  }
  return ms;
}

function zweistellig(n) {
  return String(n).padStart(2, '0');
}

function alsUhr(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(s / 3600) + ':' + zweistellig(Math.floor(s / 60) % 60) + ':' + zweistellig(s % 60);
}

function alsDauer(ms) {
  const min = Math.max(0, Math.floor(ms / 60000));
  return Math.floor(min / 60) + ':' + zweistellig(min % 60) + ' h';
}

// ---------- Aktionen ----------

function stoppen(jetzt) {
  const l = zustand.laufend;
  if (!l) return;
  zustand.eintraege.push({ aktivitaetId: l.aktivitaetId, start: l.start, ende: jetzt });
  zustand.laufend = null;
}

function umschalten(id) {
  const jetzt = Date.now();
  const liefSchon = zustand.laufend && zustand.laufend.aktivitaetId === id;
  stoppen(jetzt); // nur eine Aktivität läuft gleichzeitig
  if (!liefSchon) zustand.laufend = { aktivitaetId: id, start: jetzt };
  speichern();
  zeichnen();
}

// Die Uhr einer Aktivität zeigt alle Zeiten seit "uhrAb" und läuft beim nächsten Start dort weiter.
// Zurücksetzen stellt nur die Uhr auf 0; die Summen für heute und die Woche bleiben erhalten.
function zuruecksetzen(id) {
  zustand.aktivitaeten.find(x => x.id === id).uhrAb = Date.now();
  speichern();
  zeichnen();
}

function anlegen(name) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  zustand.aktivitaeten.push({ id, name });
  speichern();
  zeichnen();
}

function umbenennen(id) {
  const a = zustand.aktivitaeten.find(x => x.id === id);
  const neu = prompt('Neuer Name:', a.name);
  if (neu === null || !neu.trim()) return;
  a.name = neu.trim();
  speichern();
  zeichnen();
}

function loeschen(id) {
  const a = zustand.aktivitaeten.find(x => x.id === id);
  if (!confirm('„' + a.name + '“ mit allen erfassten Zeiten löschen?')) return;
  zustand.aktivitaeten = zustand.aktivitaeten.filter(x => x.id !== id);
  zustand.eintraege = zustand.eintraege.filter(e => e.aktivitaetId !== id);
  if (zustand.laufend && zustand.laufend.aktivitaetId === id) zustand.laufend = null;
  speichern();
  zeichnen();
}

// ---------- Anzeige ----------

function element(tag, klasse, text) {
  const el = document.createElement(tag);
  if (klasse) el.className = klasse;
  if (text !== undefined) el.textContent = text;
  return el;
}

function zeichnen() {
  liste.textContent = '';
  for (const a of zustand.aktivitaeten) {
    const laeuft = !!zustand.laufend && zustand.laufend.aktivitaetId === a.id;

    const karte = element('li', laeuft ? 'karte laeuft' : 'karte');
    karte.dataset.id = a.id;

    const kopf = element('div', 'kopf');
    kopf.append(element('h2', 'name', a.name));
    const stift = element('button', 'klein', '✎');
    stift.dataset.aktion = 'umbenennen';
    stift.setAttribute('aria-label', a.name + ' umbenennen');
    const kreuz = element('button', 'klein', '✕');
    kreuz.dataset.aktion = 'loeschen';
    kreuz.setAttribute('aria-label', a.name + ' löschen');
    kopf.append(stift, kreuz);
    karte.append(kopf);

    const uhrzeile = element('div', 'uhrzeile');
    uhrzeile.append(element('div', 'uhr'));
    const zurueck = element('button', 'zurueck', 'Zurücksetzen');
    zurueck.dataset.aktion = 'zuruecksetzen';
    uhrzeile.append(zurueck);
    karte.append(uhrzeile);

    const summen = element('div', 'summen');
    const heute = element('span', null, 'Heute ');
    heute.append(element('b', 'heute'));
    const woche = element('span', null, 'Woche ');
    woche.append(element('b', 'woche'));
    summen.append(heute, woche);
    karte.append(summen);

    const knopf = element('button', 'startstopp', laeuft ? 'Stopp' : 'Start');
    knopf.dataset.aktion = 'umschalten';
    karte.append(knopf);

    liste.append(karte);
  }
  leer.hidden = zustand.aktivitaeten.length > 0;
  zeitenAktualisieren();
}

// Aktualisiert nur die Zahlen, damit die Liste nicht jede Sekunde neu aufgebaut wird.
function zeitenAktualisieren() {
  const jetzt = Date.now();
  const tag = tagesbeginn(jetzt);
  const woche = wochenbeginn(jetzt);
  let heuteGesamt = 0;

  for (const karte of liste.children) {
    const id = karte.dataset.id;
    const heute = summe(id, tag, jetzt);
    heuteGesamt += heute;
    karte.querySelector('.heute').textContent = alsDauer(heute);
    karte.querySelector('.woche').textContent = alsDauer(summe(id, woche, jetzt));
    const a = zustand.aktivitaeten.find(x => x.id === id);
    karte.querySelector('.uhr').textContent = alsUhr(summe(id, a.uhrAb || 0, jetzt));
  }
  gesamt.textContent = 'Heute gesamt: ' + alsDauer(heuteGesamt);
}

// ---------- Ereignisse ----------

liste.addEventListener('click', ereignis => {
  const knopf = ereignis.target.closest('button[data-aktion]');
  if (!knopf) return;
  const id = knopf.closest('.karte').dataset.id;
  if (knopf.dataset.aktion === 'umschalten') umschalten(id);
  if (knopf.dataset.aktion === 'zuruecksetzen') zuruecksetzen(id);
  if (knopf.dataset.aktion === 'umbenennen') umbenennen(id);
  if (knopf.dataset.aktion === 'loeschen') loeschen(id);
});

formular.addEventListener('submit', ereignis => {
  ereignis.preventDefault();
  const name = eingabe.value.trim();
  if (!name) return;
  anlegen(name);
  eingabe.value = '';
  eingabe.blur();
});

setInterval(zeitenAktualisieren, 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) zeitenAktualisieren();
});

zeichnen();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
