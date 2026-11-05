/* Belegauswertung bleibt lokal. Unklare Zeilen werden nie ungeprüft gebucht. */
const cents=value=>Math.round(Number(String(value).replace(/\s|€/g,'').replace(',','.'))*100);
const fromCents=value=>(value/100).toFixed(2);
function parseReceipt(text,defaultDate){
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),items=[];
 let total=null,date=defaultDate,afterTotal=false;
 for(const line of lines){
  const dm=line.match(/\b(\d{2})[./](\d{2})[./](\d{4}|\d{2})\b/);
  if(dm){const year=dm[3].length===2?'20'+dm[3]:dm[3];const candidate=`${year}-${dm[2]}-${dm[1]}`;if(validDate(candidate))date=candidate;}
  // Übliche REWE-Kennzeichen (A/B) und OCR-Abstand im Centbetrag zulassen.
  const m=line.match(/^(.*?)\s+(-?\d{1,5}[,.]\s?\d{2})\s*(?:€|EUR)?\s*[ABab*]?\s*$/);
  if(!m)continue;
  const name=m[1].trim(),price=cents(m[2]);
  if(!Number.isFinite(price))continue;
  if(/^(?:SUMME|GESAMT(?:BETRAG)?|ENDSUMME|ZU\s+ZAHLEN|TOTAL)\b/i.test(name)){
   if(total===null)total=price;afterTotal=true;continue;
  }
  if(afterTotal)continue;
  if(/(?:\bMWST\b|\bUST\b|STEUER|\bNETTO\b|\bBRUTTO\b|GEGEBEN|RÜCKGELD|RUECKGELD|KARTENZAHLUNG|EC.CASH|GIROCARD|KREDITKARTE|BARZAHLUNG|BEZAHLT|\bBELEG\b|BON.NR|TERMINAL|\bEUR\b)/i.test(name))continue;
  // Mengen- und Grundpreiszeilen nicht nochmals als Artikel zählen.
  if(!/[A-Za-zÄÖÜäöüß]/.test(name)||/^\d+[,.]?\d*\s*(?:x|X|\*|kg|g|l)\b/.test(name)||/\b(?:EUR|€)\s*\//i.test(name))continue;
  items.push({name,amount:price});
 }
 return {merchant:/\bREWE\b/i.test(text)?'REWE':'Supermarkt',date,total,items,raw:text};
}
function validDate(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const d=new Date(date+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===date;
}
function receiptCategory(name){
 if(/pfand/i.test(name))return 'Pfand';
 if(/rabatt|coupon|gutschein|ersparnis/i.test(name))return 'Rabatte';
 if(/hähn|haehn|huhn|puten|hack|rind|fleisch|filet|lachs|thunf|fisch|schinken/i.test(name))return 'Fleisch & Fisch';
 if(/milch|jogh|quark|skyr|käse|kaese|gouda|parmesan|eier|\bei\b/i.test(name))return 'Milchprodukte & Eier';
 if(/banan|apfel|äpfel|aepfel|tomat|brokk|gurk|paprika|kartoff|gemüse|gemuese|obst|beeren|zwiebel|avocado/i.test(name))return 'Obst & Gemüse';
 if(/reis|nudel|pasta|brot|hafer|cousc|wrap|müsli|muesli/i.test(name))return 'Getreide & Brot';
 if(/tofu|lins|bohnen|edamame|hummus|kicher/i.test(name))return 'Hülsenfrüchte & Tofu';
 if(/mandel|nuss|nüsse|nuesse|waln|öl|oel/i.test(name))return 'Nüsse & Öle';
 return 'Sonstiges';
}
function receiptFingerprint(receipt){
 return JSON.stringify([receipt.merchant.trim().toLowerCase(),receipt.date,receipt.total,receipt.items.map(x=>[x.name.toLowerCase().replace(/\s/g,''),x.amount]).sort((a,b)=>a[0].localeCompare(b[0]))]);
}
let ocrLoad=null;
function loadOCR(){
 if(window.Tesseract)return Promise.resolve();
 if(ocrLoad)return ocrLoad;
 ocrLoad=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
  script.onload=resolve;script.onerror=()=>{script.remove();ocrLoad=null;reject(Error('Die Texterkennung konnte nicht geladen werden. Bitte Internetverbindung prüfen und erneut versuchen.'));};document.head.append(script);
 });return ocrLoad;
}
async function receiptImage(file){
 if(file.size>25*1024*1024)throw Error('Das Bild ist zu groß. Bitte ein Foto unter 25 MB wählen.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  // Lange Bons lesbar halten und gleichzeitig den Speicher auf dem Handy begrenzen.
  const scale=Math.min(1,2400/image.naturalWidth,7000/image.naturalHeight,Math.sqrt(12000000/(image.naturalWidth*image.naturalHeight)));
  const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
  const context=canvas.getContext('2d');context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);return canvas;
 }catch(e){if(e.message.includes('groß'))throw e;throw Error('Dieses Bild konnte nicht geöffnet werden. Bitte ein JPG-/PNG-Foto oder einen Screenshot des Bons wählen.');}
 finally{URL.revokeObjectURL(url);}
}
