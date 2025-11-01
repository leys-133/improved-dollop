
// ===== Utilities =====
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const store = {
  set(k,v){localStorage.setItem(k,JSON.stringify(v));},
  get(k,def=null){try{return JSON.parse(localStorage.getItem(k)) ?? def}catch{return def}},
};

// Tabs
$$('#tabs button, .bottom-nav button').forEach(b=>{
  b.addEventListener('click',()=>{
    $$('#tabs button').forEach(x=>x.classList.remove('active'));
    $$('main > section').forEach(s=>s.classList.add('hidden'));
    const id = b.dataset.tab;
    if($('#'+id)){ $('#'+id).classList.remove('hidden'); }
    $$(`[data-tab="${id}"]`).forEach(x=>x.classList.add('active'));
  });
});

// ===== Home: Prayer Times =====
async function fetchPrayerTimesByCoords(lat, lon){
  $('#prayerNotice').textContent = 'جاري الجلب من Aladhan…';
  const today = new Date();
  const dateStr = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=2`;
  const res = await fetch(url);
  const data = await res.json();
  const t = data?.data?.timings || {};
  const body = $('#prayerTimes tbody');
  body.innerHTML = '';
  const rows = [
    ['الفجر', t.Fajr],
    ['الشروق', t.Sunrise],
    ['الظهر', t.Dhuhr],
    ['العصر', t.Asr],
    ['المغرب', t.Maghrib],
    ['العشاء', t.Isha],
  ];
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r[0]}</td><td>${r[1]||'-'}</td>`;
    body.appendChild(tr);
  });
  $('#prayerNotice').textContent = 'تم التحديث.';
}

$('#detectLocation').addEventListener('click',()=>{
  if(!navigator.geolocation){ alert('المتصفح لا يدعم الموقع.'); return; }
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude, longitude} = pos.coords;
    $('#locName').textContent = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
    store.set('loc', {latitude, longitude});
    fetchPrayerTimesByCoords(latitude, longitude);
  }, err=>{
    alert('تعذّر تحديد الموقع: ' + err.message);
  });
});

// Init with stored location
const savedLoc = store.get('loc');
if(savedLoc){ $('#locName').textContent = `${savedLoc.latitude.toFixed(3)}, ${savedLoc.longitude.toFixed(3)}`; fetchPrayerTimesByCoords(savedLoc.latitude, savedLoc.longitude); }

// Dhikr of day (static pool)
const dhikrPool = [
  'سبحان الله وبحمده، سبحان الله العظيم.',
  'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.',
  'اللهم صلِّ وسلم على نبينا محمد.',
  'أستغفر الله وأتوب إليه.',
  'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.'
];
function refreshDhikr(){
  const d = dhikrPool[Math.floor(Math.random()*dhikrPool.length)];
  $('#dhikrOfDay').textContent = d;
}
$('#refreshDhikr').addEventListener('click', refreshDhikr);
refreshDhikr();
$('#addToTasbih').addEventListener('click', ()=>{
  store.set('tasbihActive', {phrase: $('#dhikrOfDay').textContent, target: 100, count: 0});
  alert('تمت إضافة الذكر إلى المسبحة.');
});

// Khatma progress (simple: per surah index)
const surahNames = [
  '', 'الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه','الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة','الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر','المسد','الإخلاص','الفلق','الناس'
];
const sel = $('#khatmaSurah');
for(let i=1;i<=114;i++){ const opt=document.createElement('option'); opt.value=i; opt.textContent=`${i}. ${surahNames[i]}`; sel.appendChild(opt); }
$('#saveKhatma').addEventListener('click', ()=>{
  const idx = +$('#khatmaSurah').value || 1;
  const pct = Math.round((idx/114)*100);
  $('#khatmaProgress').textContent = pct + '%';
  store.set('khatma', {surah: idx, progress:pct});
});
const kh = store.get('khatma'); if(kh){ $('#khatmaProgress').textContent = kh.progress + '%'; $('#khatmaSurah').value = kh.surah; }

// Ramadan countdown (approximate to next Ramadan start placeholder)
function nextRamadanEstimate(){
  // Rough heuristic: move to next Apr 1 as a placeholder (replace with proper hijri calc later)
  const now = new Date();
  let target = new Date(now.getFullYear(), 3, 1);
  if(target < now) target = new Date(now.getFullYear()+1, 3, 1);
  return target;
}
function renderCountdown(){
  const t = nextRamadanEstimate().getTime() - Date.now();
  const d = Math.max(0, Math.floor(t/(1000*60*60*24)));
  $('#ramadanCountdown').textContent = d + ' يوم';
}
renderCountdown();
setInterval(renderCountdown, 60*60*1000);

// ===== Quran: Fetch surah text =====
for(let i=1;i<=114;i++){ const opt=document.createElement('option'); opt.value=i; opt.textContent=`${i}. ${surahNames[i]}`; $('#surahList').appendChild(opt); }

$('#loadSurah').addEventListener('click', async ()=>{
  const s = +$('#surahList').value || 1;
  $('#quranText').textContent = 'جاري التحميل…';
  try{
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${s}?language=ar`);
    const data = await res.json();
    const ayat = data?.data?.ayahs?.map(a=>a.text).join(' ۝ ') || 'تعذر الجلب.';
    $('#quranText').textContent = ayat;
  }catch(e){
    $('#quranText').textContent = 'تعذّر الجلب. تحقق من الاتصال.';
  }
});

// Audio (simple demo links via everyayah CDN pattern; may vary)
$('#playAudio').addEventListener('click', ()=>{
  const r = $('#reciter').value; // e.g., ar.alafasy
  const s = (''+($('#audioSurah').value||1)).padStart(3,'0');
  // Known pattern (may not cover all reciters). User may adapt later.
  const url = `https://everyayah.com/data/${r}/${r}${s}.mp3`;
  $('#player').src = url;
  $('#player').play().catch(()=>{});
});

// ===== Adhkar =====
const adhkar = {
  morning: [
    {text:'أصبحنا وأصبح الملك لله…', repeat:1},
    {text:'سبحان الله وبحمده 100 مرة.', repeat:100},
  ],
  evening: [
    {text:'أمسينا وأمسى الملك لله…', repeat:1},
    {text:'أستغفر الله العظيم 100 مرة.', repeat:100},
  ],
  after_prayer: [
    {text:'سبحان الله 33', repeat:33},
    {text:'الحمد لله 33', repeat:33},
    {text:'الله أكبر 34', repeat:34},
  ],
  sleep: [
    {text:'آية الكرسي', repeat:1},
    {text:'سورة الإخلاص والمعوذتان', repeat:3},
  ]
};
$('#loadAdhkar').addEventListener('click', ()=>{
  const t = $('#adhkarType').value;
  const list = $('#adhkarList');
  list.innerHTML = '';
  adhkar[t].forEach((z,i)=>{
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<div>${z.text}</div><div class="badge">تكرار: ${z.repeat}</div>`;
    list.appendChild(div);
  });
});
$('#loadAdhkar').click();

// ===== Tasbih =====
function renderTasbih(){
  const t = store.get('tasbihActive', {phrase:'', target:0, count:0});
  $('#tasbihPhrase').value = t.phrase || '';
  $('#tasbihTarget').value = t.target || '';
  $('#tasbihCount').textContent = t.count || 0;
  $('#tasbihGoal').textContent = t.target || '—';
  const hist = store.get('tasbihHistory', []);
  const list = $('#tasbihHistory'); list.innerHTML='';
  hist.slice().reverse().forEach(h=>{
    const d = document.createElement('div');
    d.className='item';
    d.innerHTML = `<div>${h.phrase}</div><div class="small">${h.count}/${h.target} — ${new Date(h.time).toLocaleString('ar')}</div>`;
    list.appendChild(d);
  });
}
$('#startTasbih').addEventListener('click', ()=>{
  const obj = {phrase: $('#tasbihPhrase').value||'ذكر', target:+$('#tasbihTarget').value||100, count:0};
  store.set('tasbihActive', obj); renderTasbih();
});
$('#incTasbih').addEventListener('click', ()=>{
  const obj = store.get('tasbihActive', {phrase:'', target:0, count:0});
  obj.count = (obj.count||0) + 1;
  store.set('tasbihActive', obj); renderTasbih();
  if(obj.target && obj.count>=obj.target){
    const hist = store.get('tasbihHistory',[]);
    hist.push({phrase:obj.phrase, target:obj.target, count:obj.count, time:Date.now()});
    store.set('tasbihHistory', hist);
    alert('ما شاء الله! تم بلوغ الهدف.');
    obj.count = 0; store.set('tasbihActive', obj); renderTasbih();
  }
});
$('#resetTasbih').addEventListener('click', ()=>{
  store.set('tasbihActive', {phrase:'', target:0, count:0}); renderTasbih();
});
renderTasbih();

// ===== Calendar / Hijri (simple info from Aladhan) =====
async function renderHijri(){
  try{
    const res = await fetch('https://api.aladhan.com/v1/gToH');
    const data = await res.json();
    $('#hijriInfo').textContent = 'تمت المزامنة الهجرية تقريبًا. للمزيد استخدم حاسبة خارجية أو API مباشرة في الإصدار القادم.';
  }catch{
    $('#hijriInfo').textContent = 'تعذّر المزامنة الآن.';
  }
}
renderHijri();

// ===== Assistant (Gemini) =====
const SYSTEM_PROMPT = `
أنت مساعد داخل تطبيق إسلامي اسمه "رفيق" من استوديو seven_code7 بقيادة ليث وبالله.
- تحدّث بأدب وروح إسلامية، واذكر المصادر عند المسائل الحساسة.
- ذكّر المستخدم بالصلاة والأذكار عند طلبه، وتجنّب الفتاوى دون مراجع معتبرة.
- قدّم إجابات موجزة وواضحة بالعربية أولًا.
`;

function appendMsg(role, text){
  const div = document.createElement('div');
  div.className = 'msg ' + (role==='user'?'user':'assistant');
  div.textContent = (role==='user'?'👤 ':'🤖 ') + text;
  $('#chatBox').appendChild(div);
  $('#chatBox').scrollTop = $('#chatBox').scrollHeight;
}

$('#sendMsg').addEventListener('click', async ()=>{
  const key = $('#apiKey').value.trim();
  const url = $('#apiUrl').value.trim();
  const msg = $('#userMsg').value.trim();
  if(!msg) return;
  appendMsg('user', msg);
  $('#userMsg').value='';

  try{
    const res = await fetch(url + `?key=${encodeURIComponent(key)}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        contents: [
          { role:'user', parts:[{text: SYSTEM_PROMPT + "\n\nسؤال المستخدم: " + msg}]}
        ]
      })
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n') || 'تعذر الحصول على رد.';
    appendMsg('assistant', text);
  }catch(e){
    appendMsg('assistant', 'تعذّر الاتصال بواجهة Gemini. تأكد من المفتاح والرابط.');
    console.error(e);
  }
});

// ===== Profile =====
function loadProfile(){
  const p = store.get('profile', {name:'', theme:'dark'});
  $('#userName').value = p.name || '';
  $('#theme').value = p.theme || 'dark';
  document.documentElement.style.setProperty('--bg', p.theme==='light'?'#f8fafc':'#0b1220');
  document.documentElement.style.setProperty('--text', p.theme==='light'?'#0b1220':'#e5f2e9');
  document.documentElement.style.setProperty('--card', p.theme==='light'?'#ffffff':'#0f172a');
}
$('#saveProfile').addEventListener('click', ()=>{
  const p = {name: $('#userName').value.trim(), theme: $('#theme').value};
  store.set('profile', p); loadProfile();
});
loadProfile();
