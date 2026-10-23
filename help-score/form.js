/* ---------- Content ---------- */
/* Wording follows the HER Foundation's official HELP Score Calculator verbatim (hipaa.jotform.com/222806300923145). Do not edit without checking the source. */
const SEV6 = ['0 · none', '1 · mild', '2', '3 · moderate', '4', '5 · severe'];
const TIMES6 = ['0', '1–2', '3–5', '6–8', '9–12', '13 or more'];
const QUESTIONS = [
  { key:'nausea',       q:'My nausea level most of the time', hint:'On a scale of 0 to 5.', opts:SEV6 },
  { key:'vomiting',     q:'I average _____ episodes of vomiting each day.', opts:TIMES6 },
  { key:'retching',     q:'I average _____ retching or dry heaving episodes each day.', opts:TIMES6 },
  { key:'urination',    q:'I am urinating (voiding) _____', opts:['Same','More often due to IV fluids, or light color','Slightly less often, and normal color','Once every 8 hours, slightly dark yellow','Less than every 8 hours OR darker','Rarely; dark, bloody; foul smell'] },
  { key:'afterMeds',    q:'Nausea/vomiting severity one hour after taking meds, OR after food and drink if no meds taken', opts:['0 (none)','1 (mild)','2','3 (moderate)','4','5 (severe)'] },
  { key:'hoursLost',    q:'Average number of hours a day UNABLE TO WORK adequately at my job and/or at home due to being sick', opts:['0','1–2','3–4','5–7','8–10','11+'] },
  { key:'coping',       q:'I have been coping with the nausea, vomiting, and retching:', opts:['Normal','Tired, but mood is ok','Slightly less than normal','It’s tolerable but difficult','Struggling: moody, emotional','Poorly: irritable and depressed'] },
  { key:'intake',       q:'Total amount I have been able to eat and drink AND keep down', hint:'A medium water bottle or large cup is about 2 cups (500 mL).', opts:['Same: no weight loss','About 3 meals and 6+ cups','About 2 meals and some fluid','1 meal and few cups; only fluid OR only food','Very little; frequent IV fluids','Nothing stays down; daily IV/TPN/NG'] },
  { key:'medsStayDown', q:'My anti-nausea/vomiting meds stay down / are tolerated:', opts:['No meds','Always','Nearly always','Sometimes','Rarely','Never / IV / subQ pump'] },
  { key:'trend',        q:'My symptoms compared to last week:', opts:['Great','Better','About the same','Worse','Much worse','So much worse'] },
  { key:'weightLoss',   q:'Weight loss over the last 7 days', hint:'If you entered both weights, we filled this in for you. Change it if it is not right.', opts:['0%','1%','2%','3%','4%','5% or more'] },
  { key:'medCount',     q:'Number of prescriptions used for nausea and vomiting', opts:['0','1','2','3','4','5 or more'] },
];
const CONTACT = [
  { v:'email', t:'Yes, please email me' },
  { v:'text',  t:'Yes, please text me' },
  { v:'call',  t:'Yes, please call me' },
  { v:'none',  t:'No thank you, just send me my score' },
];
const BOOK = 'https://app.acuityscheduling.com/schedule/42278e03/appointment/84722062';

/* ---------- State ---------- */
/* Where submissions go. The page itself is hosted on maternahealthcare.com; this is the Apps Script backend's /exec URL. Replace after every new deployment from a different account. */
const EXEC_URL = 'https://script.google.com/macros/s/AKfycbzU_5D2dimh1AWvKoegSgWJsUiw2v42a3GZWjnAbWcIx6_qkNB2QdCkLq6nWyTIyxtuQA/exec';
const S = { step:0, answers:{}, first:'', last:'', dob:'', edc:'', email:'', phone:'', wNow:'', wLast:'', contact:'' };
const STEPS = ['intro','about','contact','weight', ...QUESTIONS.map(q=>'q:'+q.key), 'pref','result'];
const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const lab = (...parts) => `<span class="label">${parts.map(esc).join('<span class="dot">·</span>')}</span>`;

function go(n){ S.step = Math.max(0, Math.min(STEPS.length-1, n)); render(); window.scrollTo({top:0, behavior:'smooth'}); }
function progress(){ const total = STEPS.length-2; return Math.round(100*Math.max(0,S.step)/total); }

function render(){
  const id = STEPS[S.step];
  $('#bar').style.width = (id==='result'?100:progress()) + '%';
  const qIdx = id.startsWith('q:') ? QUESTIONS.findIndex(q=>'q:'+q.key===id) : -1;
  $('#topline').innerHTML = (S.step>0 && id!=='result')
    ? `<button type="button" class="label" onclick="go(${S.step-1})">← Back</button>${qIdx>=0 ? lab('Question', `${qIdx+1} of ${QUESTIONS.length}`) : ''}`
    : '';
  const el = $('#screen'); el.className='screen'; void el.offsetWidth;

  if (id==='intro'){ el.className='screen wide'; return el.innerHTML = `
    <div class="intro">
      <div class="photo" role="img" aria-label="A patient receiving IV treatment at Materna Health"></div>
      <div class="text">
        <p class="eyebrow">${lab('Materna Health','HELP Score')}</p>
        <h1>How are you feeling today?</h1>
        <p class="lead">A short check in on your nausea and vomiting, one question at a time. It takes about three minutes, and your score is emailed to you at the end.</p>
        <p class="hint">Choose the one answer in each question that best describes your symptoms over the last 24 hours, unless the question says otherwise.</p>
        <div class="actions"><button class="btn" onclick="go(1)">Begin</button><span class="kbd">press <b>Enter</b></span></div>
      </div>
    </div>`; }

  if (id==='about') return el.innerHTML = `
    <p class="eyebrow">${lab('About you')}</p>
    <h2>First, a little about you</h2>
    <p class="hint">So we can match your score to your chart.</p>
    <div class="fields">
      <div class="row2">
        <label class="f"><span class="label">First name</span><input class="in" id="first" autocomplete="given-name" value="${esc(S.first)}"></label>
        <label class="f"><span class="label">Last name</span><input class="in" id="last" autocomplete="family-name" value="${esc(S.last)}"></label>
      </div>
      <div class="row2">
        <label class="f"><span class="label">Date of birth</span><input class="in" id="dob" type="date" max="${new Date().toISOString().slice(0,10)}" value="${esc(S.dob)}"></label>
        <label class="f"><span class="label">Estimated due date</span><input class="in" id="edc" type="date" value="${esc(S.edc)}"><small>If you know it. Leave blank if you are not sure.</small></label>
      </div>
    </div>
    <div class="err" id="err"></div>
    <div class="actions"><button class="btn" onclick="saveAbout()">Continue</button><span class="kbd">press <b>Enter</b></span></div>`;

  if (id==='contact') return el.innerHTML = `
    <p class="eyebrow">${lab('Your score')}</p>
    <h2>Where should we send your score?</h2>
    <div class="fields">
      <label class="f"><span class="label">Email</span><input class="in" id="email" type="email" inputmode="email" autocomplete="email" value="${esc(S.email)}"></label>
      <label class="f"><span class="label">Mobile number</span><input class="in" id="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(000) 000-0000" value="${esc(S.phone)}"><small>Optional, only if you would like a text or a call.</small></label>
    </div>
    <div class="err" id="err"></div>
    <div class="actions"><button class="btn" onclick="saveContact()">Continue</button><span class="kbd">press <b>Enter</b></span></div>`;

  if (id==='weight') return el.innerHTML = `
    <p class="eyebrow">${lab('Optional')}</p>
    <h2>Your weight</h2>
    <p class="hint">If you know both, we will work out your weight change for you.</p>
    <div class="fields"><div class="row2">
      <label class="f"><span class="label">Current weight (lb)</span><input class="in" id="wNow" type="number" inputmode="decimal" step="0.1" min="50" max="500" value="${esc(S.wNow)}"></label>
      <label class="f"><span class="label">Weight last week (lb)</span><input class="in" id="wLast" type="number" inputmode="decimal" step="0.1" min="50" max="500" value="${esc(S.wLast)}"></label>
    </div></div>
    <div class="err" id="err"></div>
    <div class="actions"><button class="btn" onclick="saveWeight()">Continue</button><button class="btn ghost" onclick="S.wNow='';S.wLast='';go(S.step+1)">Skip</button></div>`;

  if (qIdx>=0){
    const q = QUESTIONS[qIdx]; const cur = S.answers[q.key];
    return el.innerHTML = `
      <h2>${esc(q.q)}</h2>
      ${q.hint ? `<p class="hint">${esc(q.hint)}</p>` : '<p class="hint" style="margin:0 0 10px"></p>'}
      <div class="opts" role="radiogroup" aria-label="${esc(q.q)}">
        ${q.opts.map((t,i)=>`<button type="button" role="radio" aria-checked="${cur===i}" class="opt${cur===i?' on':''}" onclick="pick('${q.key}',${i})"><span class="k">${i+1}</span><span class="t">${esc(t)}</span></button>`).join('')}
      </div>
      <div class="actions"><button class="btn" id="next" ${cur==null?'disabled':''} onclick="go(S.step+1)">Continue</button><span class="kbd">press <b>1</b> to <b>6</b>, then <b>Enter</b></span></div>`;
  }

  if (id==='pref') return el.innerHTML = `
    <p class="eyebrow">${lab('One last thing')}</p>
    <h2>Would you like our care team to reach out with support and treatment options?</h2>
    <p class="hint" style="margin:0 0 10px"></p>
    <div class="opts" role="radiogroup">
      ${CONTACT.map((c,i)=>`<button type="button" role="radio" aria-checked="${S.contact===c.v}" class="opt${S.contact===c.v?' on':''}" onclick="pickContact('${c.v}')"><span class="k">${i+1}</span><span class="t">${esc(c.t)}</span></button>`).join('')}
    </div>
    <div class="err" id="err"></div>
    <div class="actions"><button class="btn" id="submit" ${S.contact?'':'disabled'} onclick="submit()">See my score</button></div>`;

  if (id==='result') return renderResult(S.result);
}

function pick(key,i){ S.answers[key]=i; document.querySelectorAll('.opt').forEach((b,j)=>{b.classList.toggle('on',j===i);b.setAttribute('aria-checked',j===i)}); $('#next').disabled=false; setTimeout(()=>{ if(STEPS[S.step]==='q:'+key) go(S.step+1); }, 340); }
function pickContact(v){ S.contact=v; render(); }

function saveAbout(){ S.first=$('#first').value.trim(); S.last=$('#last').value.trim(); S.dob=$('#dob').value; S.edc=$('#edc').value; const e=$('#err'); [...document.querySelectorAll('.in')].forEach(i=>i.classList.remove('bad'));
  if(!S.first||!S.last){ e.textContent='Please enter your first and last name.'; (!S.first?$('#first'):$('#last')).classList.add('bad'); return; }
  if(!S.dob){ e.textContent='Please enter your date of birth.'; $('#dob').classList.add('bad'); return; } go(S.step+1); }
function saveContact(){ S.email=$('#email').value.trim(); S.phone=$('#phone').value.trim(); const e=$('#err');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S.email)){ e.textContent='Please enter a valid email so we can send your score.'; $('#email').classList.add('bad'); return; } go(S.step+1); }
function saveWeight(){ S.wNow=$('#wNow').value; S.wLast=$('#wLast').value; const a=parseFloat(S.wNow), b=parseFloat(S.wLast);
  if(a>0&&b>0){ const pct=Math.max(0,Math.round((b-a)/b*100)); S.answers.weightLoss=Math.min(5,pct); } go(S.step+1); }

function submit(){
  const btn=$('#submit'); btn.disabled=true; btn.innerHTML='Scoring<span class="spin"></span>';
  const payload={ firstName:S.first, lastName:S.last, dob:S.dob, edc:S.edc, email:S.email, phone:S.phone, weightNow:S.wNow, weightLastWeek:S.wLast, answers:S.answers, contactPref:S.contact };
  const ok=r=>{ S.result=r; go(STEPS.length-1); };
  const fail=err=>{ btn.disabled=false; btn.textContent='See my score'; $('#err').textContent='Something went wrong: '+(err&&err.message||err)+'. Please try again.'; };
  if (typeof google!=='undefined' && google.script) google.script.run.withSuccessHandler(ok).withFailureHandler(fail).submitHelpScore(payload);
  else if (EXEC_URL && location.protocol!=='file:' && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    /* hosted on maternahealthcare.com: POST as text/plain (no CORS preflight, no Google cookies) and follow Google's redirect */
    fetch(EXEC_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow'})
      .then(r=>r.json()).then(j=>{ if(j&&j.ok) ok(j.result); else fail(j&&j.error||'no response'); }).catch(fail);
  }
  else { /* local preview: score in the browser */ const total=Object.values(S.answers).reduce((a,b)=>a+b,0); setTimeout(()=>ok({ total, category: total>=33?'severe':total>=20?'moderate':'mild', label: total>=33?'Severe':total>=20?'Moderate':'Mild' }),700); }
}

function renderResult(r){
  const meaning = r.category==='severe'
    ? 'A score of 33 to 60 suggests hyperemesis gravidarum. Symptoms at this level can become serious and often call for IV fluids, medication and advanced care, all of which are available at Materna Health, often the same day. If you are not keeping fluids down for more than 24 hours, not urinating, or feeling faint, please seek urgent medical care.'
    : r.category==='moderate'
    ? 'A score of 20 to 32 means your symptoms are in the moderate range. Symptoms at this level may need medical support, medication and closer monitoring, and they respond well to treatment.'
    : 'A score under 20 is often typical nausea and vomiting of pregnancy. Early support and small changes help many women feel better. You can retake this questionnaire any time your symptoms change.';
  const followUp = S.contact && S.contact!=='none' ? 'Since you asked us to follow up, our care team will contact you within 24 hours. ' : '';
  $('#screen').innerHTML = `
    <div class="result">
      <p class="eyebrow">${lab('Your HELP Score')}</p>
      <div class="score"><div class="n">${r.total}<small>/ 60</small></div><div class="c">${esc(r.label)}</div></div>
      <div class="scale"><div class="${r.category==='mild'?'on':''}">Under 20<br>Mild</div><div class="${r.category==='moderate'?'on':''}">20 to 32<br>Moderate</div><div class="${r.category==='severe'?'on':''}">33 to 60<br>Severe</div></div>
      <p class="lead">${meaning}</p>
      <p class="hint" style="margin:0 auto 36px">${followUp}A copy has been emailed to ${esc(S.email)}.</p>
      <div class="actions" style="justify-content:center"><a class="btn" href="${BOOK}" target="_blank" rel="noopener">Book a visit</a><a class="btn ghost" href="tel:+19179387745">Call (917) 938-7745</a></div>
    </div>`;
}

/* keyboard: Enter advances, 1–6 picks */
document.addEventListener('keydown', e => {
  const id = STEPS[S.step]; const tag = (e.target.tagName||'').toLowerCase();
  if (e.key==='Enter' && tag!=='button') {
    if (id==='intro') go(1); else if (id==='about') saveAbout(); else if (id==='contact') saveContact(); else if (id==='weight') saveWeight();
    else if (id.startsWith('q:') && S.answers[id.slice(2)]!=null) go(S.step+1);
    else if (id==='pref' && S.contact) submit();
  }
  if (/^[1-6]$/.test(e.key) && tag!=='input') {
    if (id.startsWith('q:')) pick(id.slice(2), +e.key-1);
    else if (id==='pref' && CONTACT[+e.key-1]) pickContact(CONTACT[+e.key-1].v);
  }
});
render();