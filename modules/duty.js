/* ==========================================================
 * modules/duty.js — V122 Module Lịch trực ban HQKV8
 * Bỏ Trụ sở Đội Kiểm soát Hải quan và Văn phòng vì dùng chung Trụ sở Chi cục HQKV VIII.
 * Trộn ô theo từng trụ sở khi các ngày liên tiếp có người trực giống nhau; tinh gọn giao diện tổng hợp.
 * ========================================================== */
(function(){
  const DUTY_VERSION = 'duty_v122_remove_vanphong_merge_chicuc';
  const DEFAULT_UNITS = [
    {code:'CHICUC', name:'Trụ sở Chi cục HQKV VIII', order:1},
    {code:'HONGAI', name:'Trụ sở HQCK cảng Hòn Gai', order:2},
    {code:'CAMPHA', name:'Trụ sở HQCK cảng Cẩm Phả', order:3},
    {code:'VANGIA', name:'Trụ sở HQCK cảng Vạn Gia', order:4},
    {code:'HOANHMO', name:'Trụ sở HQCK Hoành Mô', order:5},
    {code:'BPS', name:'Trụ sở HQCK Bắc Phong Sinh', order:6},
    {code:'MONGCAI', name:'Trụ sở HQCK quốc tế Móng Cái', order:7},
    {code:'KSHQ_HL', name:'Đội Kiểm soát Hải quan - Khu vực Hạ Long', order:8},
    {code:'KSHQ_MC', name:'Đội Kiểm soát Hải quan - Khu vực Móng Cái', order:9}
  ];

  function $(id){ return document.getElementById(id); }
  function E(s){ return (window.esc ? esc(s) : String(s==null?'':s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))); }
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim(); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function parseDate(v){ if(window.parseIsoDate) return parseIsoDate(v); if(!v)return null; const m=String(v).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); return m?new Date(+m[1],+m[2]-1,+m[3]):null; }
  function dateShort(v){ if(window.dateVNShort) return dateVNShort(v); const d=parseDate(v); return d?pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear():String(v||''); }
  function weekday(v){ const d=parseDate(v); return d?['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][d.getDay()]:''; }
  function todayIso(){ const d=new Date(); d.setHours(0,0,0,0); return iso(d); }
  function addDays(v,n){ const d=parseDate(v)||new Date(); d.setDate(d.getDate()+n); return iso(d); }
  function nextSaturday(){ const d=new Date(); d.setHours(0,0,0,0); const day=d.getDay(); const add=(6-day+7)%7; d.setDate(d.getDate()+add); return iso(d); }
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }


  function installDutyV119Styles(){
    if(document.getElementById('dutyV121Styles')) return;
    const css = `
      .duty-wrap{color:#0f172a;display:flex;flex-direction:column;gap:12px}
      .duty-shell-head{display:flex;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(135deg,#063a63 0%,#0b67b2 100%);border-radius:18px;padding:16px 18px;color:#fff;box-shadow:0 12px 30px rgba(6,58,99,.18)}
      .duty-title-block{display:flex;flex-direction:column;gap:4px;min-width:0}
      .duty-title-main{font-size:1.28rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;line-height:1.15}
      .duty-title-sub{font-size:.78rem;color:rgba(255,255,255,.82);font-weight:600}
      .duty-head-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      .duty-entry-menu{position:relative;display:inline-flex}
      .duty-entry-menu-panel{display:none;position:absolute;right:0;top:calc(100% + 8px);z-index:60;min-width:210px;background:#fff;border:1px solid #d7e3f2;border-radius:14px;box-shadow:0 18px 40px rgba(15,23,42,.20);padding:7px;color:#0f172a}
      .duty-entry-menu.open .duty-entry-menu-panel{display:block;animation:dutyMenuIn .14s ease-out}
      @keyframes dutyMenuIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
      .duty-entry-menu-panel button{width:100%;border:0;background:#fff;color:#0f2f53;border-radius:10px;padding:10px 11px;text-align:left;font-weight:800;display:flex;align-items:center;gap:8px;cursor:pointer}
      .duty-entry-menu-panel button:hover{background:#eef6ff;color:#0b67b2}
      .duty-toolbar.card-soft,.duty-table-card,.duty-entry-form,.duty-side{border:1px solid #d7e3f2;box-shadow:0 10px 28px rgba(15,23,42,.06)}
      .duty-toolbar.card-soft{padding:10px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#fff;border-radius:16px}
      .duty-toolbar-main .duty-left-tools,.duty-toolbar-main .duty-right-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .duty-toolbar-main .duty-left-tools{flex:1 1 auto;min-width:280px}
      .duty-toolbar-main .duty-right-tools{margin-left:auto;justify-content:flex-end}
      .duty-toolbar-main label{font-size:.78rem;color:#475569;font-weight:800;display:inline-flex;align-items:center;gap:5px}
      .duty-active-range{font-size:.82rem;color:#0f3a61;background:#eef7ff;border:1px solid #c7ddf3;border-radius:999px;padding:6px 11px;font-weight:800}
      .duty-fallback-note{font-size:.84rem;color:#92400e;background:linear-gradient(90deg,#fff7ed 0%,#fffbeb 100%);border:1px solid #fed7aa;border-radius:12px;padding:9px 12px;margin:0;box-shadow:0 6px 18px rgba(15,23,42,.04)}
      .duty-matrix-scroll{overflow:auto;border:1px solid #cbdcf0;border-radius:18px;background:linear-gradient(180deg,#f8fbff 0%,#ffffff 100%);box-shadow:0 14px 36px rgba(15,23,42,.08);max-height:calc(100svh - 238px)}
      .duty-matrix-table{width:100%;min-width:1260px;border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:.89rem;background:transparent}
      .duty-matrix-table th,.duty-matrix-table td{border-right:1px solid #d6e2ef;border-bottom:1px solid #d6e2ef;padding:10px 8px;vertical-align:top;text-align:center;background:#fff}
      .duty-matrix-table thead th{position:sticky;top:0;z-index:4;background:linear-gradient(180deg,#0f4c81 0%,#155f9f 100%);color:#fff;font-weight:800;line-height:1.3;box-shadow:inset 0 -1px 0 rgba(255,255,255,.08)}
      .duty-matrix-table thead th:not(.duty-date-col){font-size:.84rem;padding-top:12px;padding-bottom:12px}
      .duty-matrix-table th:first-child,.duty-matrix-table td:first-child{border-left:1px solid #d6e2ef}
      .duty-matrix-table thead tr:first-child th{border-top:1px solid #0f4c81}
      .duty-matrix-table tbody tr:nth-child(odd) td:not(.duty-date-col){background:#fbfdff}
      .duty-matrix-table tbody tr:hover td:not(.duty-date-col){background:#f3f8fe}
      .duty-matrix-table .duty-date-col{width:128px;min-width:128px;background:linear-gradient(180deg,#eff6ff 0%,#e0efff 100%);font-weight:800;color:#0f2f53;vertical-align:middle;position:sticky;left:0;z-index:2}
      .duty-matrix-table thead .duty-date-col{z-index:6;background:linear-gradient(180deg,#08375f 0%,#0c4b7d 100%);color:#fff}
      .duty-date-range{font-weight:900;font-size:1rem;line-height:1.18;color:inherit}
      .duty-date-weekdays{font-size:.79rem;color:inherit;opacity:.92;line-height:1.25;margin-top:5px}
      .duty-cell-merged{background:linear-gradient(180deg,#f9fcff 0%,#eef7ff 100%)!important;vertical-align:middle!important;box-shadow:inset 0 0 0 2px rgba(28,113,184,.06)}
      .duty-merge-badge{display:inline-block;margin-top:8px;border-radius:999px;background:#dff2ff;color:#0a4b7a;border:1px solid #bee3f8;padding:2px 8px;font-size:.72rem;font-weight:900}
      .duty-compact-note{font-size:.84rem;color:#0f3a61;background:linear-gradient(90deg,#eef7ff 0%,#f8fcff 100%);border:1px solid #c7ddf3;border-radius:12px;padding:10px 12px;margin:0 0 10px 0;box-shadow:0 6px 18px rgba(15,23,42,.04)}
      .duty-matrix-cell{min-height:88px;display:flex;flex-direction:column;gap:8px;align-items:stretch;justify-content:center}
      .duty-person{padding:9px 10px;border:1px solid #d7e6f5;border-left:4px solid #1c71b8;border-radius:12px;line-height:1.24;background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);box-shadow:0 4px 12px rgba(15,23,42,.05)}
      .duty-person:last-child{margin-bottom:0}
      .duty-person-name{font-weight:900;color:#0b2948;font-size:.95rem;line-height:1.2}
      .duty-person-pos{font-weight:700;color:#1e3a5f;margin-top:4px;font-size:.84rem}
      .duty-person-phone{display:inline-block;font-weight:800;color:#0a4b7a;margin-top:6px;white-space:nowrap;background:#eaf4ff;border:1px solid #cfe3fb;border-radius:999px;padding:3px 10px;font-size:.82rem}
      .duty-person-note{font-size:.74rem;color:#64748b;margin-top:5px;font-style:italic}
      .duty-date-picks{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 2px}
      .duty-date-pick{display:inline-flex;align-items:center;gap:6px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:999px;padding:6px 10px;font-size:.8rem;font-weight:800;color:#334155;cursor:pointer;user-select:none}
      .duty-date-pick input{accent-color:#0b67b2}
      .duty-form-row.multiday{grid-template-columns:repeat(4,minmax(0,1fr))}
      .duty-entry-grid.duty-single{grid-template-columns:1fr!important}
      .duty-progress{font-size:.82rem;color:#475569;margin-top:6px}
      @media(max-width:1100px){.duty-shell-head{align-items:flex-start;flex-direction:column}.duty-head-actions{width:100%;justify-content:flex-start}.duty-toolbar-main .duty-right-tools{margin-left:0}}
      @media(max-width:900px){.duty-matrix-table{min-width:1020px;font-size:.8rem}.duty-matrix-table th,.duty-matrix-table td{padding:7px 6px}.duty-person{padding:8px 8px}.duty-person-name{font-size:.85rem}.duty-form-row.multiday{grid-template-columns:1fr}.duty-entry-grid.duty-single{grid-template-columns:1fr!important}.duty-matrix-scroll{max-height:none}.duty-toolbar-main .duty-left-tools,.duty-toolbar-main .duty-right-tools{width:100%;justify-content:flex-start}.duty-entry-menu-panel{left:0;right:auto}}
    
    `;
    const st=document.createElement('style');
    st.id='dutyV121Styles';
    st.textContent=css;
    document.head.appendChild(st);
  }

  function patchDutyLabels(){
    try{
      document.querySelectorAll('[data-screen="duty"] .nav-label').forEach(el=>{ el.textContent='Lịch trực ban'; });
      document.querySelectorAll('.nav-btn[data-screen="duty"] .nav-label').forEach(el=>{ el.textContent='Lịch trực ban'; });
    }catch(_){ }
  }

  function positionRank(pos){
    const s=norm(pos);
    if(/chi cuc truong/.test(s) && !/pho/.test(s)) return 10;
    if(/pho chi cuc truong/.test(s)) return 20;
    if(/chanh van phong/.test(s) && !/pho/.test(s)) return 30;
    if(/truong phong|doi truong|truong doi/.test(s) && !/pho/.test(s)) return 30;
    if(/pho chanh van phong|pho truong phong|pho doi truong|pho truong doi/.test(s)) return 40;
    if(/cong chuc/.test(s)) return 60;
    return 80;
  }
  function sortEntries(a,b){
    return String(a.dutyDate||'').localeCompare(String(b.dutyDate||'')) ||
      (unitOrder(a.unitCode)-unitOrder(b.unitCode)) ||
      positionRank(a.position)-positionRank(b.position) ||
      String(a.fullname||'').localeCompare(String(b.fullname||''),'vi');
  }

  function dutyState(){
    window.APP = window.APP || {};
    APP.duty = APP.duty || {};
    const st=APP.duty;
    if(!st.inited){
      st.inited=true;
      st.version=DUTY_VERSION;
      st.tab='summary';
      st.startDate=nextSaturday();
      st.endDate=addDays(st.startDate,1);
      st.unitFilter='all';
      st.formUnit='CHICUC';
      st.formDate=st.startDate;
      st.formEndDate=addDays(st.formDate,1);
      st.formDateChecks=null;
      st.formType='Thứ 7/CN';
      st.loaded=false;
      st.units=DEFAULT_UNITS.slice();
      st.entries=[];
      st.statuses=[];
      st.message='';
      st.importRows=[];
      st.importInvalid=[];
      st.importUploadId='';
      st.importFileName='';
      st.fallbackNotice='';
    }
    return st;
  }
  function canonicalUnitCode(code){
    const c=String(code||'').trim().toUpperCase();
    // V122: Văn phòng và Trụ sở Đội Kiểm soát Hải quan dùng chung Trụ sở Chi cục HQKV VIII.
    // Dữ liệu cũ/import có mã VANPHONG hoặc KSHQ được quy về CHICUC để không tạo thêm cột riêng.
    return (c==='KSHQ' || c==='VANPHONG') ? 'CHICUC' : c;
  }
  function cleanUnits(units){
    const source=(units&&units.length?units:DEFAULT_UNITS).map(u=>Object.assign({},u,{code:canonicalUnitCode(u.code)}));
    const map={};
    source.forEach(u=>{
      if(!u.code || u.code==='KSHQ' || u.code==='VANPHONG') return;
      if(!map[u.code]) map[u.code]=u;
    });
    const arr=Object.values(map).filter(u=>u.code!=='KSHQ' && u.code!=='VANPHONG');
    arr.sort((a,b)=>Number(a.order||999)-Number(b.order||999));
    return arr;
  }
  function normalizeDutyEntry(r){
    r=Object.assign({},r||{});
    r.unitCode=canonicalUnitCode(r.unitCode || r.UNIT_CODE || '');
    if(r.unitCode==='CHICUC' && /văn phòng|van phong|đội kiểm soát hải quan|doi kiem soat hai quan|kshq/i.test(String(r.unitName||r.UNIT_NAME||''))){
      r.unitName='Trụ sở Chi cục HQKV VIII';
    }
    return r;
  }
  function unitOrder(code){ const c=canonicalUnitCode(code); const u=cleanUnits(dutyState().units||DEFAULT_UNITS).find(x=>x.code===c); return u?Number(u.order||999):999; }
  function unitName(code){ const c=canonicalUnitCode(code); const u=cleanUnits(dutyState().units||DEFAULT_UNITS).find(x=>x.code===c); return u?u.name:(c||''); }
  function unitOptions(selected){ const sel=canonicalUnitCode(selected); return cleanUnits(dutyState().units||DEFAULT_UNITS).map(u=>`<option value="${E(u.code)}" ${u.code===sel?'selected':''}>${E(u.name)}</option>`).join(''); }
  function activeEntries(){
    const st=dutyState();
    return (st.entries||[]).map(normalizeDutyEntry).filter(e=>!(st.unitFilter && st.unitFilter!=='all' && canonicalUnitCode(e.unitCode)!==canonicalUnitCode(st.unitFilter))).sort(sortEntries);
  }
  function entriesForForm(){
    const st=dutyState();
    return (st.entries||[]).map(normalizeDutyEntry).filter(e=>e.dutyDate===st.formDate && canonicalUnitCode(e.unitCode)===canonicalUnitCode(st.formUnit)).sort(sortEntries);
  }
  function setMsg(msg, type='ok'){
    const st=dutyState(); st.message = msg ? `<div class="duty-msg ${type}">${E(msg)}</div>` : '';
    const box=$('dutyMsg'); if(box) box.innerHTML=st.message;
  }

  function chooseRecentDutyRange(entries){
    const dates=Array.from(new Set((entries||[]).map(e=>e.dutyDate).filter(Boolean))).sort();
    if(!dates.length) return null;
    const today=todayIso();
    const future=dates.filter(d=>d>=today);
    if(future.length){
      const first=future[0];
      const prev=addDays(first,-1), next=addDays(first,1);
      const start=(dates.includes(prev) && prev>=today) ? prev : first;
      const end=dates.includes(next) ? next : first;
      return {startDate:start,endDate:end};
    }
    const latest=dates[dates.length-1];
    const prev=addDays(latest,-1);
    const start=dates.includes(prev) ? prev : latest;
    return {startDate:start,endDate:latest};
  }

  async function loadDuty(force){
    const st=dutyState();
    if(st.loaded && !force) return;
    st.fallbackNotice='';
    const res = await api('getDutyData', {startDate:st.startDate, endDate:st.endDate});
    st.units = cleanUnits((res.units && res.units.length) ? res.units : DEFAULT_UNITS.slice());
    if(st.unitFilter==='KSHQ' || st.unitFilter==='VANPHONG') st.unitFilter='all';
    if(st.formUnit==='KSHQ' || st.formUnit==='VANPHONG') st.formUnit='CHICUC';
    st.entries = (res.entries || []).map(normalizeDutyEntry);
    st.statuses = (res.statuses || []).map(x=>Object.assign({},x,{unitCode:canonicalUnitCode(x.unitCode||x.UNIT_CODE||'')}));

    // V122: nếu khoảng đang xem chưa có lịch trực mới, tự hiển thị lịch trực gần nhất đã nhập; Văn phòng/KSHQ gom về Trụ sở Chi cục.
    if(!st.entries.length){
      try{
        const t=todayIso();
        const fbRes = await api('getDutyData', {startDate:addDays(t,-370), endDate:addDays(t,60)});
        const fbEntries=(fbRes.entries||[]).map(normalizeDutyEntry).filter(x=>x.dutyDate);
        const rg=chooseRecentDutyRange(fbEntries);
        if(rg){
          st.startDate=rg.startDate;
          st.endDate=rg.endDate;
          st.units=cleanUnits((fbRes.units&&fbRes.units.length)?fbRes.units:st.units);
          st.entries=fbEntries.filter(x=>x.dutyDate>=rg.startDate && x.dutyDate<=rg.endDate);
          st.statuses=(fbRes.statuses||[]).map(x=>Object.assign({},x,{unitCode:canonicalUnitCode(x.unitCode||x.UNIT_CODE||'')}));
          st.fallbackNotice='Chưa có lịch trực mới trong khoảng đã chọn, đang hiển thị lịch trực ban gần nhất: '+dateRangeShort(rg.startDate,rg.endDate)+'.';
        }
      }catch(_){ }
    }
    st.loaded = true;
  }

  window.renderDutyModule = async function(){
    installDutyV119Styles();
    patchDutyLabels();
    const box=$('screen-duty'); if(!box) return;
    const st=dutyState();
    box.innerHTML='<div class="loading"><div class="spin"></div><span>Đang tải lịch trực ban...</span></div>';
    try{ await loadDuty(false); }
    catch(e){ box.innerHTML=`<div class="msg err">Không tải được module Lịch trực ban: ${E(e.message||e)}</div>`; return; }
    box.innerHTML = renderDutyShell();
    if(st.tab==='entry') renderDutyEntryTab();
    else if(st.tab==='detail') renderDutyDetailTab();
    else if(st.tab==='import') renderDutyImportTab();
    else renderDutySummaryTab();
  };

  function renderDutyShell(){
    const st=dutyState();
    const rangeText=dateRangeShort(st.startDate, st.endDate);
    const fallbackHtml=st.fallbackNotice ? `<div class="duty-fallback-note">${E(st.fallbackNotice)}</div>` : '';
    return `
      <div class="duty-wrap" data-duty-version="${E(DUTY_VERSION)}">
        <div class="duty-shell-head">
          <div class="duty-title-block">
            <div class="duty-title-main">LỊCH TRỰC BAN</div>
            <div class="duty-title-sub">Tổng hợp lãnh đạo, công chức trực theo ngày và trụ sở</div>
          </div>
          <div class="duty-head-actions">
            <div class="duty-entry-menu" id="dutyEntryMenuWrap">
              <button class="btn primary" onclick="dutyToggleEntryMenu(event)">+ Nhập lịch trực ▾</button>
              <div class="duty-entry-menu-panel" id="dutyEntryMenu">
                <button onclick="dutySetTab('entry'); dutyCloseEntryMenu();">✍️ Nhập thủ công</button>
                <button onclick="dutySetTab('import'); dutyCloseEntryMenu();">📥 Nhập từ Excel</button>
              </div>
            </div>
            <button class="btn" onclick="dutyReload()">↻ Tải lại</button>
          </div>
        </div>
        <div class="duty-toolbar card-soft duty-toolbar-main">
          <div class="duty-left-tools">
            <button class="btn sm ${st.tab==='summary'?'primary':''}" onclick="dutySetTab('summary')">Bảng tổng hợp</button>
            <button class="btn sm ${st.tab==='detail'?'primary':''}" onclick="dutySetTab('detail')">Dữ liệu chi tiết</button>
            <span class="duty-active-range">${E(rangeText)}</span>
            <button class="btn sm" onclick="dutyQuickRange('today')">Hôm nay</button>
            <button class="btn sm" onclick="dutyQuickRange('weekend')">Cuối tuần này</button>
            <button class="btn sm" onclick="dutyQuickRange('7days')">7 ngày</button>
            <label>Từ <input class="input mini" type="date" value="${E(st.startDate)}" onchange="dutySetDateRange(this.value,null)"></label>
            <label>Đến <input class="input mini" type="date" value="${E(st.endDate)}" onchange="dutySetDateRange(null,this.value)"></label>
            <select class="select-field mini" onchange="dutySetUnitFilter(this.value)">
              <option value="all">Tất cả trụ sở</option>${cleanUnits(st.units||DEFAULT_UNITS).map(u=>`<option value="${E(u.code)}" ${st.unitFilter===u.code?'selected':''}>${E(u.name)}</option>`).join('')}
            </select>
          </div>
          <div class="duty-right-tools">
            <button class="btn sm primary" onclick="dutyCopyReport()">📋 Copy báo cáo</button>
            <button class="btn sm" onclick="dutyExportExcel()">⬇ Xuất Excel</button>
            <button class="btn sm" onclick="window.print()">🖨 In</button>
          </div>
        </div>
        ${fallbackHtml}
        <div id="dutyMsg">${st.message||''}</div>
        <div id="dutyContent"></div>
      </div>`;
  }

  function renderDutySummaryTab(){
    const box=$('dutyContent'); if(!box) return;
    const rows=activeEntries();
    box.innerHTML=`<div class="duty-table-card">${renderSummaryTable(rows)}</div>`;
  }
  function groupByDate(rows){ const map={}; rows.forEach(r=>{ (map[r.dutyDate]||(map[r.dutyDate]=[])).push(r); }); return Object.keys(map).sort().map(d=>({date:d, rows:map[d].sort(sortEntries)})); }
  function groupByUnit(rows){ const units=dutyState().units||DEFAULT_UNITS; return units.map(u=>({unit:u, rows:rows.filter(r=>r.unitCode===u.code).sort(sortEntries)})).filter(x=>x.rows.length); }
  function matrixUnitColumns(rows){
    const st=dutyState();
    let units=cleanUnits(st.units&&st.units.length?st.units:DEFAULT_UNITS);
    if(st.unitFilter && st.unitFilter!=='all') return units.filter(u=>u.code===canonicalUnitCode(st.unitFilter));
    // V122: không hiển thị cột Văn phòng và không hiển thị cột Trụ sở Đội Kiểm soát Hải quan.
    // Văn phòng và KSHQ cùng đưa vào cột Trụ sở Chi cục HQKV VIII.
    return units.filter(u=>u.code!=='VANPHONG' && u.code!=='KSHQ');
  }
  function matrixCellRows(rows, date, unitCode){
    return (rows||[]).filter(r=>{
      if(r.dutyDate!==date) return false;
      if(unitCode==='CHICUC') return canonicalUnitCode(r.unitCode)==='CHICUC';
      return r.unitCode===unitCode;
    }).sort(sortEntries);
  }
  function dateRangeList(start,end,maxDays=62){
    const a=parseDate(start), b=parseDate(end||start);
    if(!a || !b) return [];
    let from=a, to=b;
    if(from>to){ const tmp=from; from=to; to=tmp; }
    const out=[]; const d=new Date(from.getFullYear(),from.getMonth(),from.getDate());
    while(d<=to && out.length<maxDays){ out.push(iso(d)); d.setDate(d.getDate()+1); }
    return out;
  }
  function personKey(r){
    return [norm(r.fullname), norm(r.position), String(r.phone||'').replace(/\D/g,''), norm(r.note)].join('~');
  }
  function matrixSignature(rows, date, units){
    return JSON.stringify(units.map(u=>matrixCellRows(rows,date,u.code).map(personKey)));
  }
  function cellSignatureForRows(cell){
    return (cell||[]).map(personKey).join('|');
  }
  function computeCellSpans(rows, dates, units){
    const spans={};
    let mergeCount=0;
    units.forEach(u=>{
      spans[u.code]={};
      let i=0;
      while(i<dates.length){
        const d=dates[i];
        const cell=matrixCellRows(rows,d,u.code);
        const sig=cellSignatureForRows(cell);
        let j=i+1;
        while(j<dates.length){
          const nextCell=matrixCellRows(rows,dates[j],u.code);
          const nextSig=cellSignatureForRows(nextCell);
          if(!sig || sig!==nextSig || addDays(dates[j-1],1)!==dates[j]) break;
          j++;
        }
        const span=j-i;
        spans[u.code][d]={rowspan:span,skip:false,merged:span>1 && !!sig};
        if(span>1 && sig){
          mergeCount++;
          for(let k=i+1;k<j;k++) spans[u.code][dates[k]]={rowspan:0,skip:true,merged:true};
        }else{
          spans[u.code][d]={rowspan:1,skip:false,merged:false};
        }
        i=j;
      }
    });
    return {spans, mergeCount};
  }
  function dateRangeShort(start,end){
    if(start===end) return dateShort(start);
    const a=parseDate(start), b=parseDate(end);
    if(!a || !b) return dateShort(start)+' - '+dateShort(end);
    if(a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth()){
      return pad(a.getDate())+'-'+pad(b.getDate())+'/'+pad(a.getMonth()+1)+'/'+a.getFullYear();
    }
    if(a.getFullYear()===b.getFullYear()){
      return pad(a.getDate())+'/'+pad(a.getMonth()+1)+' - '+pad(b.getDate())+'/'+pad(b.getMonth()+1)+'/'+a.getFullYear();
    }
    return dateShort(start)+' - '+dateShort(end);
  }
  function renderSummaryTable(rows){
    if(!rows.length) return '<div class="empty-state">Chưa có dữ liệu trực ban trong khoảng thời gian đã chọn.</div>';
    const st=dutyState();
    const units=matrixUnitColumns(rows);
    let dates=dateRangeList(st.startDate, st.endDate, 62);
    const dataDates=groupByDate(rows).map(x=>x.date);
    dates=dates.filter(d=>dataDates.includes(d));
    if(!dates.length) dates=dataDates;
    const calc=computeCellSpans(rows, dates, units);
    let html='';
    if(calc.mergeCount>0){
      html += `<div class="duty-compact-note">Đã trộn ${E(calc.mergeCount)} ô có lịch trực giống nhau giữa các ngày liên tiếp để bảng gọn và dễ đọc hơn.</div>`;
    }
    html += '<div class="duty-matrix-scroll"><table class="duty-matrix-table"><thead><tr><th class="duty-date-col">Ngày</th>';
    units.forEach(u=>{ html += `<th>${E(u.name)}</th>`; });
    html += '</tr></thead><tbody>';
    dates.forEach(d=>{
      html += `<tr><td class="duty-date-col"><div class="duty-date-range">${E(dateShort(d))}</div><div class="duty-date-weekdays">${E(weekday(d))}</div></td>`;
      units.forEach(u=>{
        const sp=(calc.spans[u.code]&&calc.spans[u.code][d]) || {rowspan:1,skip:false,merged:false};
        if(sp.skip) return;
        const cell=matrixCellRows(rows,d,u.code);
        const rowAttr=sp.rowspan>1 ? ` rowspan="${sp.rowspan}"` : '';
        const cellClass=sp.merged ? ' class="duty-cell-merged"' : '';
        const badge=sp.merged ? `<div class="duty-merge-badge">Trùng ${sp.rowspan} ngày</div>` : '';
        html += `<td${rowAttr}${cellClass}>` + (cell.length ? `<div class="duty-matrix-cell">${cell.map(personCellHtml).join('')}${badge}</div>` : '') + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }
  function cleanPersonName(name){
    let s=String(name||'').trim();
    s=s.replace(/^\s*(đ\/c|đc|dc)\.?\s*/i,'').trim();
    return s;
  }
  function formatPhoneDisplay(phone){
    const raw=String(phone||'').trim();
    const digits=raw.replace(/\D+/g,'');
    if(digits.length===10) return `${digits.slice(0,4)}.${digits.slice(4,7)}.${digits.slice(7)}`;
    if(digits.length===11) return `${digits.slice(0,4)}.${digits.slice(4,7)}.${digits.slice(7)}`;
    return raw;
  }
  function personCellHtml(r){
    const name=cleanPersonName(r.fullname);
    const phone=formatPhoneDisplay(r.phone);
    return `<div class="duty-person"><div class="duty-person-name">Đ/c ${E(name)}</div><div class="duty-person-pos">${E(r.position||'')}</div>${phone?`<div class="duty-person-phone">${E(phone)}</div>`:''}${r.note?`<div class="duty-person-note">${E(r.note)}</div>`:''}</div>`;
  }
  function formDateOptionsHtml(st){
    const dates=dateRangeList(st.formDate, st.formEndDate||st.formDate, 31);
    if(!dates.length) return '<div class="duty-help">Chưa chọn khoảng ngày.</div>';
    const checks=st.formDateChecks || {};
    return `<div class="duty-date-picks">${dates.map(d=>{
      const checked = checks[d] !== false;
      return `<label class="duty-date-pick"><input type="checkbox" ${checked?'checked':''} onchange="dutyToggleFormDate('${E(d)}',this.checked)"><span>${E(dateShort(d))} - ${E(weekday(d))}</span></label>`;
    }).join('')}</div>`;
  }
  function selectedFormDates(){
    const st=dutyState();
    const dates=dateRangeList(st.formDate, st.formEndDate||st.formDate, 31);
    const checks=st.formDateChecks || {};
    return dates.filter(d=>checks[d]!==false);
  }
  function readEntryRows(){
    const entries=[];
    document.querySelectorAll('#dutyEntryTable tbody tr').forEach(tr=>{
      const fullname=tr.querySelector('.duty-fullname')?.value.trim()||'';
      const position=tr.querySelector('.duty-position')?.value.trim()||'';
      const phone=tr.querySelector('.duty-phone')?.value.trim()||'';
      const note=tr.querySelector('.duty-note')?.value.trim()||'';
      if(fullname) entries.push({fullname, position, phone, note});
    });
    return entries;
  }
  function groupRowsForSave(rows){
    const map={};
    (rows||[]).forEach(r=>{
      const dutyDate=r.dutyDate;
      const unitCode=canonicalUnitCode(r.unitCode);
      if(!dutyDate || !unitCode || !r.fullname) return;
      const key=[dutyDate,unitCode,r.dutyType||'Thứ 7/CN'].join('|');
      if(!map[key]) map[key]={dutyDate, unitCode, unitName:r.unitName||unitName(unitCode), dutyType:r.dutyType||'Thứ 7/CN', entries:[]};
      map[key].entries.push({fullname:r.fullname, position:r.position||'', phone:r.phone||'', note:r.note||'', dutyRole:r.dutyRole||''});
    });
    return Object.values(map).sort((a,b)=>String(a.dutyDate).localeCompare(String(b.dutyDate)) || unitOrder(a.unitCode)-unitOrder(b.unitCode));
  }
  async function saveDutyGroupsViaApi(groups, submit, progressPrefix){
    // V119: cập nhật thẳng, không còn bước nháp/chờ duyệt.
    // Vẫn gửi submit=true để backend ghi trạng thái hoàn tất nếu đang dùng cột STATUS.
    submit = true;
    let total=0;
    for(let i=0;i<groups.length;i++){
      const g=groups[i];
      setMsg(`${progressPrefix||'Đang lưu'} ${i+1}/${groups.length}: ${dateShort(g.dutyDate)} - ${unitName(g.unitCode)}...`, 'info');
      await api('saveDutyEntries',{unitCode:g.unitCode, unitName:g.unitName||unitName(g.unitCode), dutyDate:g.dutyDate, dutyType:g.dutyType||'Thứ 7/CN', entries:g.entries, submit:!!submit});
      total += (g.entries||[]).length;
      await sleep(120);
    }
    return {ok:true, count:total, groupCount:groups.length, msg:`Đã cập nhật ${total} dòng / ${groups.length} nhóm ngày + trụ sở.`};
  }

  function renderDutyEntryTab(){
    const st=dutyState(); const box=$('dutyContent'); if(!box) return;
    const rows=entriesForForm();
    const selectedDates=selectedFormDates();
    box.innerHTML=`
      <div class="duty-entry-grid">
        <div class="card-soft duty-entry-form">
          <h3>Nhập lịch trực ban theo đơn vị</h3>
          <div class="duty-form-row multiday">
            <label>Từ ngày<br><input id="dutyFormDate" class="input" type="date" value="${E(st.formDate)}" onchange="dutyFormChanged(true)"></label>
            <label>Đến ngày<br><input id="dutyFormEndDate" class="input" type="date" value="${E(st.formEndDate||st.formDate)}" onchange="dutyFormChanged(true)"></label>
            <label>Trụ sở/đơn vị<br><select id="dutyFormUnit" class="select-field" onchange="dutyFormChanged(false)">${unitOptions(st.formUnit)}</select></label>
            <label>Loại trực<br><input id="dutyFormType" class="input" value="${E(st.formType)}" onchange="APP.duty.formType=this.value"></label>
          </div>
          <div class="duty-help">Nhập 01 người hoặc nhiều người, sau đó tích chọn nhiều ngày để cập nhật thẳng cùng một danh sách trực. Phù hợp trường hợp Thứ Bảy và Chủ nhật trực giống nhau.</div>
          ${formDateOptionsHtml(st)}
          <div class="duty-actions-line">
            <button class="btn" onclick="dutyAddEntryRow()">+ Thêm người trực</button>
            <button class="btn green" onclick="dutySaveEntries()">✅ Cập nhật lịch trực ban</button>
          </div>
        </div>
        <div class="card-soft duty-side"><h3>Đơn vị đang nhập</h3><p><b>${E(unitName(st.formUnit))}</b></p><p class="muted">Đã chọn <b>${E(selectedDates.length)}</b> ngày. Khi cập nhật, danh sách này sẽ áp dụng cho toàn bộ ngày đã tích chọn.</p></div>
      </div>
      <div class="duty-table-card">
        <table id="dutyEntryTable" class="duty-detail-table"><thead><tr><th>Họ tên</th><th>Chức vụ</th><th>Số điện thoại</th><th>Ghi chú</th><th></th></tr></thead><tbody>
          ${(rows.length?rows:[{}]).map(entryRowHtml).join('')}
        </tbody></table>
      </div>`;
  }
  function entryRowHtml(r){
    return `<tr>
      <td><input class="input duty-fullname" value="${E(r.fullname||'')}" placeholder="Nguyễn Văn A"></td>
      <td><input class="input duty-position" value="${E(r.position||'')}" placeholder="Chức vụ"></td>
      <td><input class="input duty-phone" value="${E(r.phone||'')}" placeholder="Số điện thoại"></td>
      <td><input class="input duty-note" value="${E(r.note||'')}" placeholder="Ghi chú"></td>
      <td><button class="btn sm danger-light" onclick="this.closest('tr').remove()">Xóa</button></td>
    </tr>`;
  }

  function renderDutyImportTab(){
    const st=dutyState(); const box=$('dutyContent'); if(!box) return;
    const rows=st.importRows||[];
    const invalid=st.importInvalid||[];
    box.innerHTML=`
      <div class="duty-entry-grid duty-single">
        <div class="card-soft duty-entry-form">
          <h3>Nhập lịch trực ban từ Excel</h3>
          <div class="duty-help">
            File Excel cần có các cột: <b>NGAY_TRUC, UNIT_CODE hoặc DON_VI/TRU_SO, HO_TEN, CHUC_VU, SO_DIEN_THOAI, GHI_CHU</b>.
            Khi import, dữ liệu cũ cùng <b>ngày + đơn vị</b> sẽ được thay thế và cập nhật thẳng vào lịch trực ban.
          </div>
          <div class="duty-form-row">
            <label>Chọn file Excel<br><input id="dutyExcelFile" class="input" type="file" accept=".xlsx,.xls,.csv" onchange="dutyReadExcelFile()"></label>
          </div>
          <div class="duty-actions-line">
            <button class="btn primary" onclick="dutyReadExcelFile()">📥 Đọc file Excel</button>
            <button class="btn green" onclick="dutySubmitExcelImport()" ${rows.length?'':'disabled'}>✅ Cập nhật vào phần mềm</button>
          </div>
          <div class="duty-help">V122: Văn phòng và Trụ sở Đội KSHQ dùng chung Trụ sở Chi cục HQKV VIII; nếu file cũ còn mã VANPHONG/KSHQ thì hệ thống tự gom về CHICUC.</div>
        </div>
      </div>
      <div class="duty-table-card">
        <h3>Dữ liệu đọc từ Excel (${rows.length} dòng hợp lệ)</h3>
        ${invalid.length?`<div class="duty-msg err">Có ${invalid.length} dòng chưa hợp lệ: ${E(invalid.slice(0,5).map(x=>'dòng '+x.row+': '+x.msg).join('; '))}${invalid.length>5?'...':''}</div>`:''}
        <table class="duty-detail-table"><thead><tr><th>Ngày</th><th>Thứ</th><th>Trụ sở</th><th>Họ tên</th><th>Chức vụ</th><th>SĐT</th><th>Ghi chú</th></tr></thead><tbody>
          ${rows.slice(0,200).map(r=>`<tr><td>${E(dateShort(r.dutyDate))}</td><td>${E(r.dutyWeekday||weekday(r.dutyDate))}</td><td>${E(unitName(r.unitCode)||r.unitName)}</td><td>${E(r.fullname)}</td><td>${E(r.position)}</td><td>${E(r.phone)}</td><td>${E(r.note)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty-cell">Chưa đọc file Excel</td></tr>'}
        </tbody></table>
      </div>`;
  }

  function dutyFileToDataUrl(file){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>resolve(String(r.result||''));
      r.onerror=()=>reject(r.error||new Error('Không đọc được file.'));
      r.readAsDataURL(file);
    });
  }
  function dutyMakeUploadId(prefix='duty_excel'){
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  }

  async function dutyWaitUploadStatus(uploadId, label){
    const deadline = Date.now() + 90000;
    let lastMsg = '';
    let actionInvalidSeen = false;
    while(Date.now() < deadline){
      await sleep(1600);
      try{
        const st = await api('getUploadStatus', {uploadId});
        if(st && !st.pending){
          if(st.jobOk === false || st.error === true || st.ok === false){
            throw new Error(st.msg || ('Server xử lý lỗi: '+(label||uploadId)));
          }
          return st;
        }
        lastMsg = (st && st.msg) || lastMsg;
      }catch(e){
        const msg = (e && e.message) || String(e || '');
        lastMsg = msg;
        if(/Action không hợp lệ|Action khong hop le|getUploadStatus|chưa có getUploadStatus/i.test(msg)){
          actionInvalidSeen = true;
          break;
        }
      }
    }
    if(actionInvalidSeen){
      throw new Error('Web App chưa có action getUploadStatus/duty V115 hoặc chưa Deploy New version. Chi tiết: '+lastMsg);
    }
    throw new Error('Chưa nhận được phản hồi trạng thái từ Apps Script sau 90 giây. '+(lastMsg?'Thông tin cuối: '+lastMsg:''));
  }

  async function dutyPostPayloadHidden(payload){
    if(typeof apiViaHiddenUploadPost==='function') return apiViaHiddenUploadPost(payload);
    if(typeof canUseGoogleScriptRun==='function' && canUseGoogleScriptRun()){
      return new Promise((resolve,reject)=>{
        try{
          google.script.run
            .withSuccessHandler(res=>{ if(!res || res.ok===false) reject(new Error((res&&res.msg)||'Lỗi Apps Script')); else resolve(res); })
            .withFailureHandler(err=>reject(new Error((err&&err.message)||String(err||'Lỗi gọi Apps Script'))))
            .api(payload);
        }catch(e){ reject(e); }
      });
    }
    return api(payload.action, payload);
  }

  async function dutyPostExcelToServer(action, file, extra){
    if(!file) throw new Error('Chưa chọn file Excel.');
    const uploadId=dutyMakeUploadId('duty_excel');
    let uploadTicket='';
    try{
      const ticketRes = await api('createDutyUploadTicket', {purpose: action, fileName: file.name, size: file.size || 0});
      uploadTicket = ticketRes && ticketRes.ticket;
      if(!uploadTicket) throw new Error('Server không trả upload ticket.');
    }catch(e){
      throw new Error('Không tạo được mã upload Excel. Cần cập nhật Code.gs V115 và Deploy New version. Chi tiết: ' + ((e&&e.message)||e));
    }
    const dataUrl=await dutyFileToDataUrl(file);
    const payload=Object.assign({}, extra||{}, {
      action,
      token: (window.APP && APP.token) || '',
      uploadId,
      uploadTicket,
      fileName:file.name,
      mimeType:file.type||'',
      base64:dataUrl
    });
    await dutyPostPayloadHidden(payload);
    const res=await dutyWaitUploadStatus(uploadId, file.name);
    if(res.jobOk === false || res.error) throw new Error(res.msg || 'Lỗi đọc Excel trên server.');
    return res;
  }

  async function dutyPostActionAndWaitStatus(action, payload, label){
    const statusUploadId=dutyMakeUploadId('duty_status');
    const full=Object.assign({}, payload||{}, {
      action,
      token: (window.APP && APP.token) || '',
      statusUploadId
    });
    await dutyPostPayloadHidden(full);
    const res=await dutyWaitUploadStatus(statusUploadId, label || action);
    if(res.jobOk === false || res.error) throw new Error(res.msg || 'Lỗi cập nhật trên server.');
    return res;
  }

  window.dutyReadExcelFile=async function(){
    const input=$('dutyExcelFile');
    const file=input && input.files && input.files[0];
    if(!file){ alert('Vui lòng chọn file Excel.'); return; }
    const st=dutyState();
    st.importRows=[]; st.importInvalid=[]; st.importUploadId=''; st.importFileName=file.name;
    setMsg('Đang gửi file Excel lên Apps Script để đọc...', 'info');
    try{
      const res=await dutyPostExcelToServer('parseDutyExcelFile', file, {});
      st.importRows=Array.isArray(res.rows)?res.rows.map(normalizeDutyEntry):[];
      st.importInvalid=Array.isArray(res.invalid)?res.invalid:[];
      st.importUploadId=res.parseUploadId || res.uploadId || '';
      setMsg(`Đã đọc ${st.importRows.length} dòng hợp lệ từ Excel${st.importInvalid.length?`, ${st.importInvalid.length} dòng chưa hợp lệ`:''}.`, st.importRows.length?'ok':'err');
      renderDutyImportTab();
    }catch(e){
      setMsg('Lỗi đọc Excel: '+(e.message||e), 'err');
    }
  };

  window.dutySubmitExcelImport=async function(){
    const st=dutyState();
    const input=$('dutyExcelFile');
    const file=input && input.files && input.files[0];
    const submit = true; // V119: cập nhật thẳng, không qua Văn phòng duyệt.
    if(!file && (!st.importRows || !st.importRows.length)){ alert('Chưa có dữ liệu hợp lệ để import.'); return; }
    const n=(st.importRows&&st.importRows.length)||'các';
    if(!confirm(`Cập nhật ${n} dòng vào phần mềm? Dữ liệu cũ cùng ngày + đơn vị sẽ được thay thế.`)) return;
    setMsg('Đang cập nhật dữ liệu Excel bằng action saveDutyEntries...', 'info');
    try{
      if((!st.importRows || !st.importRows.length) && file){
        const parsed=await dutyPostExcelToServer('parseDutyExcelFile', file, {});
        st.importRows=Array.isArray(parsed.rows)?parsed.rows.map(normalizeDutyEntry):[];
        st.importInvalid=Array.isArray(parsed.invalid)?parsed.invalid:[];
      }
      if(!st.importRows || !st.importRows.length) throw new Error('Không có dòng hợp lệ để cập nhật.');
      const groups=groupRowsForSave(st.importRows);
      if(!groups.length) throw new Error('Không tạo được nhóm ngày + trụ sở từ dữ liệu Excel.');
      const dates=st.importRows.map(r=>r.dutyDate).filter(Boolean).sort();
      if(dates.length){ st.startDate=dates[0]; st.endDate=dates[dates.length-1]; }
      const res=await saveDutyGroupsViaApi(groups, submit, 'Đang cập nhật Excel');
      st.loaded=false;
      await loadDuty(true);
      setMsg(res.msg || 'Đã cập nhật dữ liệu Excel vào lịch trực ban.', 'ok');
      st.importRows=[]; st.importInvalid=[]; st.importUploadId='';
      st.tab='summary';
      renderDutyModule();
    }catch(e){
      setMsg('Lỗi import Excel: '+(e.message||e), 'err');
    }
  };

  function renderDutyDetailTab(){
    const box=$('dutyContent'); if(!box) return;
    const rows=activeEntries();
    box.innerHTML=`
      <div class="duty-table-card">
        <table class="duty-detail-table"><thead><tr><th>Ngày</th><th>Thứ</th><th>Trụ sở</th><th>Họ tên</th><th>Chức vụ</th><th>SĐT</th><th>Ghi chú</th></tr></thead><tbody>
          ${rows.map(r=>`<tr><td>${E(dateShort(r.dutyDate))}</td><td>${E(r.dutyWeekday||weekday(r.dutyDate))}</td><td>${E(unitName(r.unitCode))}</td><td>${E(r.fullname)}</td><td>${E(r.position)}</td><td>${E(r.phone)}</td><td>${E(r.note)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty-cell">Chưa có dữ liệu</td></tr>'}
        </tbody></table>
      </div>`;
  }

  window.dutyToggleEntryMenu=function(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    const wrap=document.getElementById('dutyEntryMenuWrap');
    if(wrap) wrap.classList.toggle('open');
  };
  window.dutyCloseEntryMenu=function(){
    const wrap=document.getElementById('dutyEntryMenuWrap');
    if(wrap) wrap.classList.remove('open');
  };
  document.addEventListener('click', function(ev){
    const wrap=document.getElementById('dutyEntryMenuWrap');
    if(wrap && !wrap.contains(ev.target)) wrap.classList.remove('open');
  }, true);
  window.dutySetTab=function(tab){ const st=dutyState(); st.tab=tab; renderDutyModule(); };
  window.dutyReload=async function(){ const st=dutyState(); st.loaded=false; await renderDutyModule(); };
  window.dutySetDateRange=function(start,end){ const st=dutyState(); if(start)st.startDate=start; if(end)st.endDate=end; st.loaded=false; renderDutyModule(); };
  window.dutySetUnitFilter=function(unit){ const st=dutyState(); st.unitFilter=unit; renderDutyModule(); };
  window.dutyQuickRange=function(kind){ const st=dutyState(); const t=todayIso(); if(kind==='today'){st.startDate=t;st.endDate=t;} else if(kind==='weekend'){st.startDate=nextSaturday();st.endDate=addDays(st.startDate,1);} else {st.startDate=t;st.endDate=addDays(t,6);} st.loaded=false; renderDutyModule(); };
  window.dutyFormChanged=function(resetChecks){
    const st=dutyState();
    const unit=$('dutyFormUnit'); const d1=$('dutyFormDate'); const d2=$('dutyFormEndDate'); const typ=$('dutyFormType');
    if(unit) st.formUnit=unit.value;
    if(d1 && d1.value) st.formDate=d1.value;
    if(d2 && d2.value) st.formEndDate=d2.value;
    if(st.formEndDate && st.formDate && st.formEndDate < st.formDate) st.formEndDate=st.formDate;
    if(typ) st.formType=typ.value;
    if(resetChecks) st.formDateChecks=null;
    renderDutyEntryTab();
  };
  window.dutyToggleFormDate=function(date, checked){
    const st=dutyState();
    st.formDateChecks=st.formDateChecks||{};
    st.formDateChecks[date]=!!checked;
  };
  window.dutyAddEntryRow=function(){ const tb=document.querySelector('#dutyEntryTable tbody'); if(tb) tb.insertAdjacentHTML('beforeend', entryRowHtml({})); };
  window.dutySaveEntries=async function(){
    const st=dutyState();
    const unitCode=canonicalUnitCode($('dutyFormUnit').value), dutyType=$('dutyFormType').value || st.formType || 'Thứ 7/CN';
    const dates=selectedFormDates();
    const entries=readEntryRows();
    if(!unitCode || !dates.length){ alert('Vui lòng chọn đơn vị và ít nhất 01 ngày trực.'); return; }
    if(!entries.length && !confirm('Danh sách đang trống. Anh/chị có chắc muốn lưu danh sách trống cho các ngày đã chọn?')) return;
    const groups=dates.map(d=>({dutyDate:d, unitCode, unitName:unitName(unitCode), dutyType, entries}));
    setMsg(`Đang lưu ${groups.length} ngày trực ban...`, 'info');
    try{
      const res=await saveDutyGroupsViaApi(groups, true, 'Đang cập nhật lịch trực ban');
      st.loaded=false; st.formUnit=unitCode; st.formDate=dates[0]; st.formEndDate=dates[dates.length-1];
      st.startDate=dates[0]; st.endDate=dates[dates.length-1];
      await loadDuty(true);
      setMsg('Đã cập nhật thẳng lịch trực ban. '+res.msg, 'ok');
      renderDutyModule();
    }catch(e){ setMsg('Lỗi lưu lịch trực ban: '+(e.message||e), 'err'); }
  };
  window.dutyCopyReport=async function(){
    const text=buildDutyReportText(activeEntries());
    try{ await navigator.clipboard.writeText(text); setMsg('Đã copy danh sách trực.', 'ok'); }
    catch(e){ prompt('Copy thủ công nội dung dưới đây:', text); }
  };
  function htmlTableForExcel(rows){
    const st=dutyState();
    const units=matrixUnitColumns(rows);
    let dates=dateRangeList(st.startDate, st.endDate, 62);
    const dataDates=groupByDate(rows).map(x=>x.date);
    dates=dates.filter(d=>dataDates.includes(d));
    if(!dates.length) dates=dataDates;
    const calc=computeCellSpans(rows, dates, units);
    let html='<table border="1"><thead><tr><th>Ngày</th>';
    units.forEach(u=>{ html += `<th>${E(u.name)}</th>`; });
    html+='</tr></thead><tbody>';
    dates.forEach(d=>{
      html += `<tr><td><b>${E(dateShort(d))}</b><br>${E(weekday(d))}</td>`;
      units.forEach(u=>{
        const sp=(calc.spans[u.code]&&calc.spans[u.code][d]) || {rowspan:1,skip:false,merged:false};
        if(sp.skip) return;
        const cell=matrixCellRows(rows,d,u.code);
        const rowAttr=sp.rowspan>1 ? ` rowspan="${sp.rowspan}"` : '';
        html += `<td${rowAttr}>${cell.map(r=>`<b>Đ/c ${E(cleanPersonName(r.fullname))}</b><br>${E(r.position||'')}<br>${E(formatPhoneDisplay(r.phone)||'')}`).join('<hr>')}</td>`;
      });
      html += '</tr>';
    });
    html+='</tbody></table>';
    return html;
  }
  window.dutyExportExcel=function(){
    const rows=activeEntries();
    if(!rows.length){ alert('Chưa có dữ liệu để xuất Excel.'); return; }
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse}th{background:#0f4c81;color:#fff;font-weight:bold;text-align:center}td,th{border:1px solid #999;padding:8px;vertical-align:middle;text-align:center}td:first-child{background:#eef6ff;font-weight:bold}</style></head><body><h3>LỊCH TRỰC BAN HQKV8</h3>${htmlTableForExcel(rows)}</body></html>`;
    const blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='lich-truc-ban-HQKV8.xls';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  };
  window.dutyDownloadCsv=window.dutyExportExcel;
  function csvCell(v){ return '"'+String(v||'').replace(/"/g,'""')+'"'; }
  function buildDutyReportText(rows){
    if(!rows.length) return 'DANH SÁCH LÃNH ĐẠO, CÔNG CHỨC TRỰC\n\nChưa có dữ liệu.';
    const st=dutyState();
    const units=matrixUnitColumns(rows);
    let dates=dateRangeList(st.startDate, st.endDate, 62);
    const dataDates=groupByDate(rows).map(x=>x.date);
    dates=dates.filter(d=>dataDates.includes(d));
    if(!dates.length) dates=dataDates;
    let out='DANH SÁCH LÃNH ĐẠO, CÔNG CHỨC TRỰC\n';
    dates.forEach((d,di)=>{
      out += `\n${roman(di+1)}. Ngày ${dateShort(d)} (${weekday(d)})\n`;
      units.forEach((u,ui)=>{
        const cell=matrixCellRows(rows,d,u.code);
        if(!cell.length) return;
        out += `\n${ui+1}. ${u.name}\n`;
        cell.forEach((r,ri)=>{ out += `${ui+1}.${ri+1}. Đ/c ${cleanPersonName(r.fullname)} - ${r.position}${r.phone?' - '+formatPhoneDisplay(r.phone):''}${r.note?' ('+r.note+')':''}\n`; });
      });
    });
    return out.trim();
  }
  function roman(n){ const r=['','I','II','III','IV','V','VI','VII','VIII','IX','X']; return r[n]||String(n); }
  installDutyV119Styles();
  patchDutyLabels();
})();
