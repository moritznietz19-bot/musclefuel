'use strict';
const KEY='musclefuel-free';
const today=()=>new Date().toLocaleDateString('sv-SE');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=value=>Number(value).toLocaleString('de-DE',{maximumFractionDigits:1});
const money=value=>(Number(value)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
const icons={Heute:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',Woche:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 11h18m-13 4h2m4 0h2"/>',Statistik:'<path d="M4 3v18h17M9 16v-5m5 5V7m5 9V4"/>',Ziele:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'};
let page='Heute',period='7',selectedDay=0,receiptDraft=null,ocrBusy=false,ocrWorker=null,ocrJob=0;
function notice(text,error=false){document.getElementById('notice').innerHTML=text?`<div class="notice ${error?'error':''}">${esc(text)}</div>`:'';}
function save(){try{localStorage.setItem(KEY,JSON.stringify(s));return true;}catch(e){notice('Deine Änderungen konnten nicht auf diesem Gerät gespeichert werden. Bitte exportiere unter Ziele eine Sicherung.',true);return false;}}
function defaultState(){return {start:today(),plan:[],done:{},hidden:{},history:[],receipts:[],kcal:2800,protein:150,schema:4};}
function validateState(data){
 if(!data||typeof data!=='object'||!validDate(data.start)||!Array.isArray(data.plan)||data.plan.length!==7||!data.plan.every(day=>Array.isArray(day)&&day.length===4&&day.every(id=>Number.isInteger(id)&&R[id])))throw Error('Ungültiger Wochenplan');
 if(!Number.isFinite(data.kcal)||data.kcal<1000||data.kcal>6000||!Number.isFinite(data.protein)||data.protein<30||data.protein>350)throw Error('Ungültige Ziele');
 if(data.history!==undefined&&(!Array.isArray(data.history)||!data.history.every(x=>x&&typeof x.key==='string'&&validDate(x.date)&&Number.isInteger(x.id)&&R[x.id]&&(!x.snapshot||(typeof x.snapshot.name==='string'&&Array.isArray(x.snapshot.mac)&&x.snapshot.mac.length===4&&x.snapshot.mac.every(n=>Number.isFinite(n)&&n>=0))))))throw Error('Ungültiger Verlauf');
 if(data.receipts!==undefined&&(!Array.isArray(data.receipts)||!data.receipts.every(x=>x&&typeof x.id==='string'&&typeof x.merchant==='string'&&validDate(x.date)&&Number.isInteger(x.total)&&x.total>0&&Array.isArray(x.items)&&x.items.every(item=>item&&typeof item.name==='string'&&Number.isInteger(item.amount)))))throw Error('Ungültige Belege');
 for(const key of ['done','hidden'])if(data[key]!==undefined&&(!data[key]||Array.isArray(data[key])||typeof data[key]!=='object'))throw Error('Ungültige Mahlzeitendaten');
 return data;
}
function mealDate(i,state=s){const d=new Date(state.start+'T12:00:00');d.setDate(d.getDate()+i);return d.toLocaleDateString('sv-SE');}
function migrate(data){
 data.done=data.done||{};data.hidden=data.hidden||{};data.history=data.history||[];data.receipts=data.receipts||[];
 // Rezept-Snapshots sichern die alten Nährwerte auch bei späteren Rezeptänderungen.
 data.history=data.history.map(x=>({...x,snapshot:x.snapshot||mealSnapshot(x.id)}));
 if((data.schema||0)<4){
  data.plan.forEach((day,i)=>day.forEach((id,j)=>{
   const k=i+'-'+j,dayDate=mealDate(i,data),key=dayDate+'-'+j;
   if(data.done[k]&&!data.hidden[k]&&!data.history.some(x=>x.key===key))data.history.push({key,date:dayDate,id,snapshot:mealSnapshot(id)});
   if(!data.done[k]&&dayDate>=today()&&id<8)day[j]=REPLACEMENTS[id];
  }));
  data.schema=4;
 }
 return data;
}
let s;let storageFailure=false;
try{const raw=localStorage.getItem(KEY);if(raw){const parsed=validateState(JSON.parse(raw));if((parsed.schema||0)<4)localStorage.setItem(KEY+'-before-update',raw);s=migrate(parsed);}else s=defaultState();}
catch(e){storageFailure=true;s=defaultState();notice('Deine gespeicherten Daten konnten nicht sicher geladen werden. Sie wurden nicht überschrieben. Bitte lade eine gültige Sicherung unter Ziele oder exportiere zuerst die bisherigen Rohdaten.',true);}
const ordinarySave=save;
save=function(){return storageFailure?(notice('Speichern ist zum Schutz deiner bisherigen Daten pausiert. Bitte zuerst eine gültige Sicherung importieren.',true),false):ordinarySave();};
function generate(offset=0,keepToday=false){
 const oldToday=keepToday?s.plan[di()]:null,oldDone={},oldHidden={};
 if(oldToday){for(let j=0;j<4;j++){oldDone['0-'+j]=s.done[di()+'-'+j];oldHidden['0-'+j]=s.hidden[di()+'-'+j];}}
 s.start=today();s.plan=Array.from({length:7},(_,i)=>POOLS.map((pool,j)=>pool[(i+offset+j)%pool.length]));s.done=oldToday?oldDone:{};s.hidden=oldToday?oldHidden:{};
 if(oldToday)s.plan[0]=oldToday;save();
}
function di(){return Math.max(0,Math.min(6,Math.round((new Date(today()+'T12:00:00')-new Date(s.start+'T12:00:00'))/86400000)));}
if(!s.plan.length)generate();else if(today()>mealDate(6))generate();else save();
selectedDay=di();
function dateLabel(date){return new Date(date+'T12:00:00').toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'});}
function visible(i,j){return !s.hidden[i+'-'+j];}
function mealData(i,j){const record=s.history.find(x=>x.key===mealDate(i)+'-'+j);return s.done[i+'-'+j]&&record?record.snapshot:mealSnapshot(s.plan[i][j]);}
function logMeal(i,j,checked){const date=mealDate(i),key=date+'-'+j;s.history=s.history.filter(x=>x.key!==key);if(checked)s.history.push({key,date,id:s.plan[i][j],snapshot:mealSnapshot(s.plan[i][j])});}
function totals(i,onlyDone=false){return s.plan[i].reduce((t,id,j)=>{if(visible(i,j)&&(!onlyDone||s.done[i+'-'+j]))mealData(i,j).mac.forEach((v,k)=>t[k]+=v);return t;},[0,0,0,0]);}
function bar(value,max){return `<div class="bar"><span style="width:${Math.max(0,Math.min(100,value/Math.max(1,max)*100))}%"></span></div>`;}
function nav(){document.getElementById('nav').innerHTML=Object.entries(icons).map(([name,icon])=>`<button data-page="${name}" ${page===name?'aria-current="page"':''} class="${page===name?'active':''}"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>${name}</button>`).join('');}
function recipeCard(i,j){
 const id=s.plan[i][j],r=R[id],key=i+'-'+j,done=s.done[key],snap=mealData(i,j),slot=['Frühstück','Mittagessen','Abendessen','Snack'][j];
 if(!visible(i,j))return '';
 return `<details class="card meal ${done?'done':''}"><summary><span class="meal-icon" aria-hidden="true">${done?'✓':['◒','♧','☾','◈'][j]}</span><span class="meal-info"><span class="eyebrow">${slot}${r[8]?' · '+r[8]+' MIN.':''}</span><span class="meal-name">${esc(snap.name)}</span><small>${number(snap.mac[0])} kcal <span aria-hidden="true">·</span> ${number(snap.mac[1])} g Protein</small></span><span class="chevron" aria-hidden="true">›</span></summary><div class="recipe-body"><div class="row"><h3>Zutaten</h3><span class="pill">1 PORTION</span></div>${r[6].map(([name,n,unit])=>`<div class="row ingredient"><span>${esc(name)}</span><b>${number(n)} ${esc(unit)}</b></div>`).join('')}<p class="tiny">Gewichte vor der Zubereitung, sofern nicht anders angegeben. Salz, Pfeffer und Kräuter nach Geschmack.</p><h3>Zubereitung</h3><ol class="steps">${(Array.isArray(r[7])?r[7]:[r[7]]).map(step=>`<li>${esc(step)}</li>`).join('')}</ol><div class="actions"><button class="primary" data-togglemeal="${key}">${done?'✓ Gegessen · rückgängig':'Als gegessen abhaken'}</button><button class="quiet" data-hide="${key}">Entfernen</button></div>${!done?`<label for="swap-${key}">Anderes Gericht wählen</label><select id="swap-${key}" data-swap="${key}">${[...new Set([...POOLS[j],id])].map(n=>`<option value="${n}" ${n===id?'selected':''}>${esc(R[n][0])}</option>`).join('')}</select>`:''}</div></details>`;
}
function removedMeals(i){const items=s.plan[i].map((id,j)=>visible(i,j)?'':`<div class="row item"><span>${esc(R[id][0])}</span><button data-restore="${i}-${j}">Hinzufügen</button></div>`).join('');return items?`<details class="card"><summary>Entfernte Mahlzeiten (${s.plan[i].filter((_,j)=>!visible(i,j)).length})</summary>${items}</details>`:'';}
function todayView(){
 const i=di(),t=totals(i,true),planned=totals(i),count=s.plan[i].filter((_,j)=>visible(i,j)&&s.done[i+'-'+j]).length;
 return `<div class="intro"><p class="eyebrow">${esc(dateLabel(today()).toUpperCase())} · DEIN TAG</p><h1>Gut essen.<br>Stärker werden.</h1><p>Einfacher Plan. Mehr Protein. Dein Tempo.</p></div><div class="card hero"><div class="row"><small>DEINE KALORIEN HEUTE</small><span class="pill">${count} / ${s.plan[i].filter((_,j)=>visible(i,j)).length} GEGESSEN</span></div><div class="hero-number">${number(t[0])} <span>/ ${number(s.kcal)} kcal</span></div>${bar(t[0],s.kcal)}<small>${t[0]>=s.kcal?'Kalorienziel erreicht':number(s.kcal-t[0])+' kcal bis zu deinem Ziel'}</small></div><div class="grid macros">${['Protein','Kohlenhydrate','Fett'].map((name,k)=>`<div class="stat ${k===0?'protein':''}"><small>${name}</small><strong>${number(t[k+1])}<em> g</em></strong><small>${k===0?'Ziel: '+number(s.protein)+' g':'heute gegessen'}</small>${k===0?bar(t[1],s.protein):''}</div>`).join('')}</div><div class="row section-title"><h2>Deine Mahlzeiten</h2><small>Antippen für Zutaten ↗</small></div>${s.plan[i].map((_,j)=>recipeCard(i,j)).join('')}<div class="hint">Dein sichtbarer Tagesplan: <b>${number(planned[0])} kcal · ${number(planned[1])} g Protein.</b> ${planned[0]<s.kcal-200?'Er liegt unter deinem Kalorienziel. Ergänze bei Bedarf eine Portion oder wähle ein anderes Gericht.':'Nährwerte sind Schätzwerte und hängen von deinen Produkten ab.'}</div>${removedMeals(i)}<details class="card"><summary>Heute anders essen</summary><p>Wenn du heute nur das Abendessen aus dem Plan brauchst, kannst du die übrigen Mahlzeiten ausblenden. Bereits gegessene Mahlzeiten bleiben erhalten.</p><button class="quiet" id="onlyDinner">Nur Abendessen behalten</button></details>`;
}
function weekView(){
 const i=selectedDay,t=totals(i);
 return `<div class="intro"><p class="eyebrow">WENIGER PLANEN, GUT ESSEN</p><h1>Deine Woche.</h1><p>Jeder Tag mit Zutaten für genau eine Portion.</p></div><div class="chips" aria-label="Tag auswählen">${s.plan.map((_,d)=>`<button data-day="${d}" class="${i===d?'active':''}" aria-pressed="${i===d}">${esc(dateLabel(mealDate(d)))}</button>`).join('')}</div><div class="row section-title"><h2>${esc(dateLabel(mealDate(i)))}</h2><span class="day-summary">${number(t[0])} kcal · ${number(t[1])} g Protein</span></div>${s.plan[i].map((_,j)=>recipeCard(i,j)).join('')}${removedMeals(i)}<div class="card"><h3>Abwechslung für die nächsten Tage</h3><p>Ein neuer 7-Tage-Plan startet heute. Dein heutiger Tag und dein bisheriger Verlauf bleiben erhalten.</p><button class="quiet wide" id="regen">Neuen Wochenplan erstellen</button></div>`;
}
function rangeStart(){if(period==='all')return '0000-01-01';const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()-Number(period)+1);return d.toLocaleDateString('sv-SE');}
function statsView(){
 const cut=rangeStart(),rows=s.history.filter(x=>x.date>=cut&&x.date<=today()),receipts=s.receipts.filter(x=>x.date>=cut&&x.date<=today());
 const sum=[0,0,0,0],days={},counts={};
 rows.forEach(x=>{const r=x.snapshot; r.mac.forEach((v,n)=>sum[n]+=v);counts[r.name]=(counts[r.name]||0)+1;if(!days[x.date])days[x.date]=[0,0];days[x.date][0]+=r.mac[0];days[x.date][1]+=r.mac[1];});
 const dates=Object.keys(days).sort(),max=Math.max(1,...dates.map(d=>days[d][0])),total=receipts.reduce((a,r)=>a+r.total,0),categories={};
 receipts.forEach(r=>{r.items.forEach(item=>{const category=receiptCategory(item.name);categories[category]=(categories[category]||0)+item.amount;});const diff=r.total-r.items.reduce((a,x)=>a+x.amount,0);if(diff)categories['Nicht zugeordnet']=(categories['Nicht zugeordnet']||0)+diff;});
 return `<div class="intro"><p class="eyebrow">DEIN ALLTAG IN ZAHLEN</p><h1>Dein Fortschritt.</h1><p>Was du gegessen und eingekauft hast.</p></div><div class="chips">${[['7','7 Tage'],['30','30 Tage'],['all','Gesamt']].map(([id,label])=>`<button data-period="${id}" class="${period===id?'active':''}" aria-pressed="${period===id}">${label}</button>`).join('')}</div><p class="tiny">Ernährung: nur abgehakte Mahlzeiten. Einkauf: nur gespeicherte Belege.</p><div class="grid stats">${[['Mahlzeiten',rows.length,''],['Protein',number(sum[1]),'g'],['Kalorien',number(sum[0]),'kcal'],['Kohlenhydrate',number(sum[2]),'g'],['Fett',number(sum[3]),'g'],['Einkaufsausgaben',money(total),'']].map(([name,v,unit])=>`<div class="stat"><small>${name}</small><strong>${v}</strong><small>${unit||'im Zeitraum'}</small></div>`).join('')}</div><section class="card"><h3>Dein Tagesdurchschnitt</h3><div class="grid"><div><small>Kalorien</small><h2>${dates.length?number(Math.round(sum[0]/dates.length)):'–'} kcal</h2></div><div><small>Protein</small><h2>${dates.length?number(Math.round(sum[1]/dates.length)):'–'} g</h2></div></div><small>Über ${dates.length} ${dates.length===1?'Tag':'Tage'} mit protokollierten Mahlzeiten.</small></section><section class="card"><h3>Kalorien im Verlauf</h3>${dates.length?dates.slice(-14).map(d=>`<div class="chart-row"><span>${d.slice(8)}.${d.slice(5,7)}.</span>${bar(days[d][0],max)}<b>${number(days[d][0])}</b></div>`).join(''):'<div class="empty"><div class="empty-icon">↗</div><p>Deine erste abgehakte Mahlzeit macht den Anfang.</p></div>'}<small>${dates.length?'Letzte '+Math.min(14,dates.length)+' Tage mit Einträgen · kcal':''}</small></section><section class="card"><h3>Deine Lieblingsgerichte</h3>${Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,n],i)=>`<div class="row item"><span class="rank">${i+1}</span><span style="flex:1">${esc(name)}</span><b>${n}×</b></div>`).join('')||'<p>Hier siehst du bald, was du am häufigsten isst.</p>'}</section><section class="card"><div class="row receipt-head"><div><p class="eyebrow">DEINE EINKÄUFE</p><h2>Kassenbon statt Tippen.</h2></div><span class="meal-icon" aria-hidden="true">≡</span></div><p>REWE-Bon fotografieren oder ein Bild auswählen. Artikel und Gesamtbetrag werden automatisch erkannt. Kurz prüfen und speichern.</p><label for="receiptFile">${ocrBusy?'Bon wird gelesen …':'Kassenbon auswählen'}</label><input id="receiptFile" type="file" accept="image/*" ${ocrBusy?'disabled':''}><p class="tiny">JPG/PNG oder Screenshot · kein PDF. Beim ersten Mal ist Internet nötig, um die Texterkennung zu laden. Dein Bild wird auf deinem Gerät verarbeitet und nicht hochgeladen.</p><div id="ocrProgress" role="status" aria-live="polite">${ocrBusy?'<p>Texterkennung läuft …</p>':''}</div>${ocrBusy?'<button id="cancelOCR" class="quiet">Abbrechen</button>':''}<details><summary>Digitalen Bon-Text einfügen</summary><p class="tiny">Alternativ Text aus einem digitalen Bon kopieren. Gleiche automatische Auswertung, ohne Foto.</p><textarea id="receiptText" placeholder="REWE&#10;VOLLKORNBROT 2,29 B&#10;SUMME EUR 2,29"></textarea><button id="parseText" class="quiet">Text auslesen</button></details></section>${draftView()}<section class="card"><div class="row"><h3>Wofür du Geld ausgibst</h3><span class="pill">${receipts.length} BELEGE</span></div>${Object.entries(categories).sort((a,b)=>b[1]-a[1]).map(([name,n])=>`<div class="row item"><span>${esc(name)}</span><b>${money(n)}</b></div>`).join('')||'<p>Noch keine Belege im gewählten Zeitraum.</p>'}<p class="tiny">Kategorien werden anhand der Artikelbezeichnungen geschätzt. Das sind Einkaufsausgaben, keine Kosten pro gegessener Portion. „Nicht zugeordnet“ zeigt Differenzen zum Bon-Gesamtbetrag.</p></section><section class="card"><h3>Deine Belege</h3>${receipts.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<details class="item"><summary><span>${esc(r.merchant)} · ${esc(dateLabel(r.date))}</span> <b>${money(r.total)}</b></summary>${r.items.map(item=>`<div class="row ingredient"><span>${esc(item.name)}<br><small>${esc(receiptCategory(item.name))}</small></span><b>${money(item.amount)}</b></div>`).join('')}<p class="tiny">${r.total!==r.items.reduce((a,x)=>a+x.amount,0)?'Nicht zugeordnet: '+money(r.total-r.items.reduce((a,x)=>a+x.amount,0)):r.items.length+' Artikel · Summe stimmt überein.'}</p><button class="quiet danger" data-delete-receipt="${esc(r.id)}">Beleg löschen</button></details>`).join('')||'<p>Gespeicherte Belege erscheinen hier mit ihren Artikeln.</p>'}</section>`;
}
function draftView(){
 if(!receiptDraft)return '';
 const sum=receiptDraft.items.reduce((a,x)=>a+x.amount,0),difference=receiptDraft.total===null?null:receiptDraft.total-sum;
 return `<section class="card" id="draft"><p class="eyebrow">ERKANNT · NOCH NICHT GESPEICHERT</p><h2>Einmal kurz prüfen.</h2><p class="tiny">Abkürzungen, Rabatte oder Pfand können falsch erkannt werden. Vergleiche Artikel und Gesamtbetrag mit deinem Bon.</p><div class="grid"><div><label for="draftMerchant">Geschäft</label><input id="draftMerchant" value="${esc(receiptDraft.merchant)}"></div><div><label for="draftDate">Einkaufsdatum</label><input type="date" id="draftDate" value="${esc(receiptDraft.date)}" max="${today()}"></div></div><div class="receipt-items">${receiptDraft.items.map((item,i)=>`<div class="receipt-edit"><div><label for="itemName${i}">Artikel ${i+1}</label><input id="itemName${i}" data-item-name="${i}" value="${esc(item.name)}"></div><div><label for="itemAmount${i}">Preis (€)</label><input id="itemAmount${i}" data-item-amount="${i}" type="number" step="0.01" value="${fromCents(item.amount)}"></div><button data-remove-item="${i}" aria-label="Artikel ${i+1} entfernen">×</button></div>`).join('')}</div><button id="addReceiptItem" class="quiet">+ Artikel ergänzen</button><label for="draftTotal">Gesamtbetrag auf dem Bon (€)</label><input id="draftTotal" type="number" step="0.01" min="0.01" value="${receiptDraft.total===null?'':fromCents(receiptDraft.total)}"><p class="tiny" id="draftDifference">${draftDifference(sum,difference)}</p><label class="row"><span>Ich habe Datum, Artikel und Gesamtbetrag geprüft.</span><input type="checkbox" id="reviewed" ${receiptDraft.reviewed?'checked':''}></label><div class="actions"><button class="primary" id="saveReceipt">Geprüften Beleg speichern</button><button class="quiet" id="discardReceipt">Verwerfen</button></div><details style="margin-top:18px"><summary>Erkannten Text ansehen</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px">${esc(receiptDraft.raw)}</pre></details></section>`;
}
function draftDifference(sum,difference){return `Artikelsumme: ${money(sum)}. ${difference===null?'Keine Gesamtsumme erkannt – bitte vom Bon übernehmen.':difference===0?'✓ Passt zum Gesamtbetrag.':'Differenz zum Bon: '+money(difference)+'. Artikel korrigieren oder die Differenz als nicht zugeordnet speichern.'}`;}
function goalsView(){return `<div class="intro"><p class="eyebrow">PASSEND ZU DEINEM ALLTAG</p><h1>Deine Ziele.</h1><p>Muskelaufbau bleibt der Fokus.</p></div><section class="card"><h3>Deine Tagesziele</h3><div class="grid"><div><label for="kcal">Kalorien (kcal)</label><input type="number" id="kcal" min="1000" max="6000" value="${s.kcal}"></div><div><label for="protein">Protein (g)</label><input type="number" id="protein" min="30" max="350" value="${s.protein}"></div></div><p><button class="primary" id="goals">Ziele speichern</button></p><small>Deine bisherigen Ziele bleiben als Startwerte erhalten. Die Rezepte werden nicht automatisch auf diese Ziele skaliert.</small></section><section class="card"><h3>So isst du gerne</h3><ul class="note-list"><li>Proteinreiche, unkomplizierte Mahlzeiten.</li><li>Kein Magerquark oder Skyr als Hauptbestandteil.</li><li>Joghurt nur in kleinen Mengen als Dip oder Sauce.</li><li>Zutaten direkt in der jeweiligen Mahlzeit.</li></ul></section><section class="card"><h3>Deine Daten sichern</h3><p>Dein Verlauf, deine Ziele und die Belege bleiben auf diesem Gerät. Eine Sicherung schützt sie, falls du Browserdaten löschst oder das Handy wechselst.</p><button id="export" class="quiet wide">Sicherung exportieren</button><label for="import">Sicherung importieren</label><input type="file" id="import" accept=".json,application/json"><p class="tiny">Beim Import wird dein aktueller Stand nach Rückfrage ersetzt.</p></section><p class="tiny">Version 4 · Nährwerte sind gerundete Schätzungen. Alte Mahlzeiten bleiben mit ihren damaligen Werten im Verlauf.</p>`;}
function render(){nav();document.getElementById('view').innerHTML=({Heute:todayView,Woche:weekView,Statistik:statsView,Ziele:goalsView}[page]||todayView)();}
function captureDraft(){if(!receiptDraft||!document.getElementById('draft'))return;receiptDraft.merchant=document.getElementById('draftMerchant').value;receiptDraft.date=document.getElementById('draftDate').value;const val=document.getElementById('draftTotal').value;receiptDraft.total=val===''?null:cents(val);receiptDraft.reviewed=document.getElementById('reviewed').checked;document.querySelectorAll('[data-item-name]').forEach(x=>receiptDraft.items[+x.dataset.itemName].name=x.value);document.querySelectorAll('[data-item-amount]').forEach(x=>receiptDraft.items[+x.dataset.itemAmount].amount=x.value===''?NaN:cents(x.value));}
function saveReceipt(){
 captureDraft();const d=receiptDraft;if(!d)return;
 if(!d.reviewed)return notice('Bitte prüfe den erkannten Beleg und bestätige die Prüfung vor dem Speichern.',true);
 if(!d.merchant.trim()||!validDate(d.date)||d.date>today()||!Number.isInteger(d.total)||d.total<=0||d.total>10000000||d.items.some(x=>!x.name.trim()||!Number.isInteger(x.amount)||Math.abs(x.amount)>10000000))return notice('Bitte Geschäft, Datum, Gesamtbetrag und Artikelpreise prüfen. Leere Zeilen ergänzen oder entfernen.',true);
 const r={id:globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2),merchant:d.merchant.trim(),date:d.date,total:d.total,items:d.items.map(x=>({name:x.name.trim(),amount:x.amount}))};
 const fingerprint=receiptFingerprint(r);if(s.receipts.some(x=>receiptFingerprint(x)===fingerprint))return notice('Dieser Beleg ist bereits gespeichert. Er wird nicht doppelt gezählt.',true);
 if(s.receipts.some(x=>x.date===r.date&&x.total===r.total&&x.merchant.toLowerCase()===r.merchant.toLowerCase())&&!confirm('Für diesen Tag gibt es bereits einen Beleg mit gleichem Geschäft und Gesamtbetrag. Diesen weiteren Beleg trotzdem speichern?'))return;
 s.receipts.push(r);if(!save()){s.receipts.pop();return;}receiptDraft=null;render();notice('Beleg gespeichert. Deine Einkaufsausgaben sind aktualisiert.');
}
function downloadBackup(){let raw;try{raw=storageFailure?localStorage.getItem(KEY):JSON.stringify(s,null,2);}catch(e){return notice('Die Sicherung konnte nicht gelesen werden.',true);}const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='musclefuel-backup-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function startOCR(file){
 if(!file||ocrBusy)return;
 if(receiptDraft&&!confirm('Den noch nicht gespeicherten Beleg durch ein neues Foto ersetzen?'))return;
 ocrBusy=true;const job=++ocrJob;page='Statistik';render();notice('');let worker=null,timer,cancelled=false;
 const update=message=>{const node=document.getElementById('ocrProgress');if(node&&job===ocrJob)node.innerHTML=`<p class="tiny">${esc(message)}</p>`;};
 try{
  const canvas=await receiptImage(file);if(job!==ocrJob)return;
  update('Texterkennung wird geladen …');
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Das Auslesen dauert zu lange. Bitte Internetverbindung prüfen oder ein schärferes Foto versuchen.')),150000);});
  const task=(async()=>{
   await loadOCR();if(job!==ocrJob||cancelled)return null;
   worker=await Tesseract.createWorker('deu',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',logger:m=>update(m.status==='recognizing text'?'Bon wird gelesen: '+Math.round(m.progress*100)+' %':'Texterkennung wird vorbereitet …')});
   if(job!==ocrJob||cancelled){await worker.terminate();return null;}ocrWorker=worker;
   const result=await worker.recognize(canvas);return result.data.text;
  })();
  const text=await Promise.race([task,timeout]);if(job!==ocrJob||text===null)return;
  if(!text.trim())throw Error('Kein lesbarer Text erkannt. Bitte fotografiere den Bon flach, gut beleuchtet und vollständig.');
  receiptDraft={...parseReceipt(text,today()),reviewed:false};notice('Bon ausgelesen. Bitte die erkannten Angaben unten prüfen.');
 }catch(e){if(job===ocrJob)notice(e.message||'Der Bon konnte nicht gelesen werden. Bitte ein neues Foto versuchen.',true);}
 finally{cancelled=true;clearTimeout(timer);if(worker)await worker.terminate().catch(()=>{});if(job===ocrJob){ocrBusy=false;ocrWorker=null;render();}}
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.page){captureDraft();page=d.page;render();window.scrollTo({top:0});return;}
 if(d.day!==undefined){selectedDay=Number(d.day);render();return;}
 if(d.period){captureDraft();period=d.period;render();return;}
 if(d.togglemeal){const [i,j]=d.togglemeal.split('-').map(Number);if(mealDate(i)>today())return notice('Diese Mahlzeit liegt noch in der Zukunft. Du kannst sie am jeweiligen Tag abhaken.',true);s.done[d.togglemeal]=!s.done[d.togglemeal];logMeal(i,j,s.done[d.togglemeal]);save();render();return;}
 if(d.hide){if(s.done[d.hide])return notice('Bereits gegessene Mahlzeiten bleiben im Verlauf. Markiere sie zuerst als nicht gegessen, wenn du sie entfernen möchtest.',true);s.hidden[d.hide]=true;save();render();return;}
 if(d.restore){delete s.hidden[d.restore];save();render();return;}
 if(d.removeItem!==undefined){captureDraft();receiptDraft.items.splice(+d.removeItem,1);receiptDraft.reviewed=false;render();return;}
 if(d.deleteReceipt){if(confirm('Diesen Beleg und seine Ausgaben löschen?')){const old=s.receipts;s.receipts=s.receipts.filter(x=>x.id!==d.deleteReceipt);if(!save())s.receipts=old;render();}return;}
 if(b.id==='onlyDinner'){const i=di();s.plan[i].forEach((_,j)=>{if(j!==2&&!s.done[i+'-'+j])s.hidden[i+'-'+j]=true;});save();render();}
 if(b.id==='regen'&&confirm('Ab heute einen neuen Wochenplan erstellen? Der heutige Tag und dein Verlauf bleiben erhalten.')){generate(Math.floor(Math.random()*40)+1,true);selectedDay=0;render();notice('Dein neuer Wochenplan ist bereit.');}
 if(b.id==='goals'){const kcal=+document.getElementById('kcal').value,protein=+document.getElementById('protein').value;if(kcal<1000||kcal>6000||protein<30||protein>350||!Number.isFinite(kcal)||!Number.isFinite(protein))return notice('Bitte Kalorien zwischen 1.000 und 6.000 und Protein zwischen 30 und 350 g eingeben.',true);s.kcal=kcal;s.protein=protein;if(save())notice('Deine Ziele sind gespeichert.');}
 if(b.id==='export')downloadBackup();
 if(b.id==='parseText'){if(receiptDraft&&!confirm('Den noch nicht gespeicherten Beleg ersetzen?'))return;const text=document.getElementById('receiptText').value;if(!text.trim())return notice('Bitte zuerst den Text deines Bons einfügen.',true);receiptDraft={...parseReceipt(text,today()),reviewed:false};render();document.getElementById('draft').scrollIntoView({block:'start'});}
 if(b.id==='addReceiptItem'){captureDraft();receiptDraft.items.push({name:'',amount:0});receiptDraft.reviewed=false;render();}
 if(b.id==='discardReceipt'){if(confirm('Den noch nicht gespeicherten Beleg verwerfen?')){receiptDraft=null;render();}}
 if(b.id==='saveReceipt')saveReceipt();
 if(b.id==='cancelOCR'){ocrJob++;ocrBusy=false;if(ocrWorker)await ocrWorker.terminate().catch(()=>{});ocrWorker=null;render();notice('Auslesen abgebrochen.');}
});
document.addEventListener('input',e=>{if(e.target.closest('#draft')){if(e.target.id!=='reviewed')document.getElementById('reviewed').checked=false;captureDraft();const sum=receiptDraft.items.reduce((a,x)=>a+x.amount,0);document.getElementById('draftDifference').textContent=draftDifference(sum,receiptDraft.total===null?null:receiptDraft.total-sum);}});
document.addEventListener('change',async e=>{
 const x=e.target;
 if(x.dataset.swap){const [i,j]=x.dataset.swap.split('-').map(Number),id=Number(x.value);if(s.done[x.dataset.swap]||!POOLS[j].includes(id))return;s.plan[i][j]=id;save();render();}
 if(x.id==='receiptFile')startOCR(x.files[0]);
 if(x.id==='import'){
  try{if(!x.files[0])return;const data=migrate(validateState(JSON.parse(await x.files[0].text())));if(!confirm('Deinen aktuellen Stand durch diese Sicherung ersetzen?')){x.value='';return;}const old=s,failed=storageFailure;s=data;storageFailure=false;if(!save()){s=old;storageFailure=failed;return;}if(today()>mealDate(6))generate();selectedDay=di();render();notice('Sicherung importiert. Dein Verlauf und deine Ziele sind geladen.');}
  catch(e){notice('Diese Datei ist keine gültige MuscleFuel-Sicherung. Deine bisherigen Daten wurden nicht verändert.',true);}
 }
});
render();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(today()>mealDate(6))generate();selectedDay=di();if(page==='Heute')render();}});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').then(r=>r.update()).catch(()=>{}));
