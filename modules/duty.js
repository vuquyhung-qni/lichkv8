/* ==========================================================
 * modules/duty.js — V119 Module Lịch trực ban HQKV8
 * Bỏ Trụ sở Đội Kiểm soát Hải quan vì dùng chung Trụ sở Chi cục HQKV VIII.
 * Gộp các ngày trực liên tiếp có danh sách giống nhau để hiển thị gọn hơn.
 * ========================================================== */
(function(){
  const DUTY_VERSION = 'duty_v119_compact_same_days';
  const DEFAULT_UNITS = [
    {code:'CHICUC', name:'Trụ sở Chi cục HQKV VIII', order:1},
    {code:'VANPHONG', name:'Văn phòng', order:2},
    {code:'HONGAI', name:'Trụ sở HQCK cảng Hòn Gai', order:3},
    {code:'CAMPHA', name:'Trụ sở HQCK cảng Cẩm Phả', order:4},
    {code:'VANGIA', name:'Trụ sở HQCK cảng Vạn Gia', order:5},
    {code:'HOANHMO', name:'Trụ sở HQCK Hoành Mô', order:6},
    {code:'BPS', name:'Trụ sở HQCK Bắc Phong Sinh', order:7},
    {code:'MONGCAI', name:'Trụ sở HQCK quốc tế Móng Cái', order:8},
    {code:'KSHQ_HL', name:'Đội Kiểm soát Hải quan - Khu vực Hạ Long', order:9},
    {code:'KSHQ_MC', name:'Đội Kiểm soát Hải quan - Khu vực Móng Cái', order:10}
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
    if(document.getElementById('dutyV119Styles')) return;
    const css = `
      .duty-matrix-scroll{overflow:auto;border:1px solid #dbe4ee;border-radius:14px;background:#fff;max-height:calc(100svh - 250px)}
      .duty-matrix-table{width:100%;min-width:1180px;border-collapse:collapse;table-layout:fixed;font-size:.88rem;background:#fff}
      .duty-matrix-table th,.duty-matrix-table td{border:1px solid #1f2937;padding:8px 7px;vertical-align:top;text-align:center}
      .duty-matrix-table th{background:#f8fafc;color:#0f172a;font-weight:900;line-height:1.25}
      .duty-matrix-table .duty-date-col{width:106px;min-width:106px;background:#f8fafc;font-weight:800;color:#0f172a;vertical-align:middle;position:sticky;left:0;z-index:2}
      .duty-matrix-table .duty-date-col.compact{background:#eef6ff;color:#073b63}
      .duty-date-range{font-weight:900;font-size:.96rem;line-height:1.22}
      .duty-date-weekdays{font-size:.78rem;color:#334155;line-height:1.25;margin-top:4px}
      .duty-date-count{font-size:.72rem;color:#64748b;margin-top:4px}
      .duty-compact-note{font-size:.82rem;color:#475569;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:8px 10px;margin-bottom:8px}
      .duty-matrix-table thead .duty-date-col{z-index:3;background:#f1f5f9}
      .duty-matrix-cell{min-height:76px;display:flex;flex-direction:column;gap:8px;align-items:stretch;justify-content:flex-start}
      .duty-person{padding:3px 2px 6px;border-bottom:1px solid rgba(15,23,42,.12);line-height:1.25}
      .duty-person:last-child{border-bottom:0}
      .duty-person-name{font-weight:900;color:#020617;font-size:.92rem;line-height:1.22}
      .duty-person-pos{font-weight:500;color:#0f172a;margin-top:3px}
      .duty-person-phone{font-weight:700;color:#020617;margin-top:2px;white-space:nowrap}
      .duty-person-note{font-size:.75rem;color:#64748b;margin-top:2px}
      .duty-date-picks{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 2px}
      .duty-date-pick{display:inline-flex;align-items:center;gap:6px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:999px;padding:6px 10px;font-size:.8rem;font-weight:800;color:#334155;cursor:pointer;user-select:none}
      .duty-date-pick input{accent-color:#0b67b2}
      .duty-form-row.multiday{grid-template-columns:repeat(4,minmax(0,1fr))}
      .duty-entry-grid.duty-single{grid-template-columns:1fr!important}
      .duty-progress{font-size:.82rem;color:#475569;margin-top:6px}
      @media(max-width:900px){.duty-matrix-table{min-width:980px;font-size:.8rem}.duty-matrix-table th,.duty-matrix-table td{padding:6px 5px}.duty-person-name{font-size:.84rem}.duty-form-row.multiday{grid-template-columns:1fr}.duty-entry-grid.duty-single{grid-template-columns:1fr!important}.duty-matrix-scroll{max-height:none}}
    `;
    const st=document.createElement('style');
    st.id='dutyV119Styles';
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
    }
    return st;
  }
  function canonicalUnitCode(code){
    const c=String(code||'').trim().toUpperCase();
    // V119: Trụ sở Đội Kiểm soát Hải quan dùng chung Trụ sở Chi cục HQKV VIII.
    // Dữ liệu cũ/import có mã KSHQ được quy về CHICUC để không tạo thêm cột riêng.
    return c==='KSHQ' ? 'CHICUC' : c;
  }
  function cleanUnits(units){
    const source=(units&&units.length?units:DEFAULT_UNITS).map(u=>Object.assign({},u,{code:canonicalUnitCode(u.code)}));
    const map={};
    source.forEach(u=>{
      if(!u.code || u.code==='KSHQ') return;
      if(!map[u.code]) map[u.code]=u;
    });
    const arr=Object.values(map).filter(u=>u.code!=='KSHQ');
    arr.sort((a,b)=>Number(a.order||999)-Number(b.order||999));
    return arr;
  }
  function normalizeDutyEntry(r){
    r=Object.assign({},r||{});
    r.unitCode=canonicalUnitCode(r.unitCode || r.UNIT_CODE || '');
    if(r.unitCode==='CHICUC' && /đội kiểm soát hải quan|doi kiem soat hai quan|kshq/i.test(String(r.unitName||r.UNIT_NAME||''))){
      r.unitName='Trụ sở Chi cục HQKV VIII';
    }
    return r;
  }
  function unitOrder(code){ const c=canonicalUnitCode(code); const u=(dutyState().units||DEFAULT_UNITS).find(x=>x.code===c); return u?Number(u.order||999):999; }
  function unitName(code){ const c=canonicalUnitCode(code); const u=(dutyState().units||DEFAULT_UNITS).find(x=>x.code===c); return u?u.name:(c||''); }
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

  async function loadDuty(force){
    const st=dutyState();
    if(st.loaded && !force) return;
    const res = await api('getDutyData', {startDate:st.startDate, endDate:st.endDate});
    st.units = cleanUnits((res.units && res.units.length) ? res.units : DEFAULT_UNITS.slice());
    if(st.unitFilter==='KSHQ') st.unitFilter='all';
    if(st.formUnit==='KSHQ') st.formUnit='CHICUC';
    st.entries = (res.entries || []).map(normalizeDutyEntry);
    st.statuses = (res.statuses || []).map(x=>Object.assign({},x,{unitCode:canonicalUnitCode(x.unitCode||x.UNIT_CODE||'')}));
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
    const count=activeEntries().length;
    const unitSubmitted = new Set((st.entries||[]).map(x=>`${x.dutyDate}|${canonicalUnitCode(x.unitCode)}`)).size;
    return `
      <div class="duty-wrap" data-duty-version="${E(DUTY_VERSION)}">
        <div class="duty-hero">
          <div>
            <div class="duty-kicker">Module Lịch công tác HQKV8</div>
            <h2>📋 Lịch trực ban</h2>
            <p>Các đơn vị cập nhật trực tiếp lãnh đạo, công chức trực thứ 7, Chủ nhật, ngày lễ; hệ thống tự tổng hợp lịch trực ban theo ngày/trụ sở.</p>
          </div>
          <div class="duty-hero-actions">
            <button class="btn primary" onclick="dutySetTab('entry')">+ Nhập lịch trực</button>
            <button class="btn" onclick="dutyReload()">↻ Tải lại</button>
          </div>
        </div>
        <div class="duty-cards">
          <div class="duty-card"><b>${E(count)}</b><span>Người trực trong khoảng</span></div>
          <div class="duty-card"><b>${E(cleanUnits(st.units||DEFAULT_UNITS).length)}</b><span>Trụ sở/đơn vị</span></div>
          <div class="duty-card"><b>${E(unitSubmitted)}</b><span>Lượt đã cập nhật</span></div>
        </div>
        <div class="duty-toolbar card-soft">
          <button class="btn sm ${st.tab==='summary'?'primary':''}" onclick="dutySetTab('summary')">Bảng tổng hợp</button>
          <button class="btn sm ${st.tab==='entry'?'primary':''}" onclick="dutySetTab('entry')">Nhập lịch trực</button>
          <button class="btn sm ${st.tab==='import'?'primary':''}" onclick="dutySetTab('import')">Nhập từ Excel</button>
          <button class="btn sm ${st.tab==='detail'?'primary':''}" onclick="dutySetTab('detail')">Dữ liệu chi tiết</button>
          <span class="duty-sep"></span>
          <button class="btn sm" onclick="dutyQuickRange('today')">Hôm nay</button>
          <button class="btn sm" onclick="dutyQuickRange('weekend')">Cuối tuần này</button>
          <button class="btn sm" onclick="dutyQuickRange('7days')">7 ngày</button>
          <label>Từ <input class="input mini" type="date" value="${E(st.startDate)}" onchange="dutySetDateRange(this.value,null)"></label>
          <label>Đến <input class="input mini" type="date" value="${E(st.endDate)}" onchange="dutySetDateRange(null,this.value)"></label>
          <select class="select-field mini" onchange="dutySetUnitFilter(this.value)">
            <option value="all">Tất cả trụ sở</option>${cleanUnits(st.units||DEFAULT_UNITS).map(u=>`<option value="${E(u.code)}" ${st.unitFilter===u.code?'selected':''}>${E(u.name)}</option>`).join('')}
          </select>
        </div>
        <div id="dutyMsg">${st.message||''}</div>
        <div id="dutyContent"></div>
      </div>`;
  }

  function renderDutySummaryTab(){
    const box=$('dutyContent'); if(!box) return;
    const rows=activeEntries();
    box.innerHTML=`
      <div class="duty-actions-line">
        <button class="btn primary" onclick="dutyCopyReport()">📋 Copy báo cáo</button>
        <button class="btn" onclick="dutyDownloadCsv()">⬇ Xuất CSV</button>
        <button class="btn" onclick="window.print()">🖨 In</button>
      </div>
      <div class="duty-table-card">${renderSummaryTable(rows)}</div>`;
  }
  function groupByDate(rows){ const map={}; rows.forEach(r=>{ (map[r.dutyDate]||(map[r.dutyDate]=[])).push(r); }); return Object.keys(map).sort().map(d=>({date:d, rows:map[d].sort(sortEntries)})); }
  function groupByUnit(rows){ const units=dutyState().units||DEFAULT_UNITS; return units.map(u=>({unit:u, rows:rows.filter(r=>r.unitCode===u.code).sort(sortEntries)})).filter(x=>x.rows.length); }
  function matrixUnitColumns(rows){
    const st=dutyState();
    let units=cleanUnits(st.units&&st.units.length?st.units:DEFAULT_UNITS);
    if(st.unitFilter && st.unitFilter!=='all') return units.filter(u=>u.code===canonicalUnitCode(st.unitFilter));
    // V119: không hiển thị cột Văn phòng và không hiển thị cột Trụ sở Đội Kiểm soát Hải quan.
    // Văn phòng và KSHQ cùng đưa vào cột Trụ sở Chi cục HQKV VIII.
    return units.filter(u=>u.code!=='VANPHONG' && u.code!=='KSHQ');
  }
  function matrixCellRows(rows, date, unitCode){
    return (rows||[]).filter(r=>{
      if(r.dutyDate!==date) return false;
      if(unitCode==='CHICUC') return r.unitCode==='CHICUC' || r.unitCode==='VANPHONG' || r.unitCode==='KSHQ';
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
  function compactMatrixDateGroups(rows, dates, units){
    const out=[];
    dates.forEach(d=>{
      const sig=matrixSignature(rows,d,units);
      const last=out[out.length-1];
      if(last && last.sig===sig && addDays(last.end,1)===d){
        last.end=d; last.dates.push(d);
      }else{
        out.push({start:d,end:d,dates:[d],sig});
      }
    });
    return out;
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
  function weekdayRangeLabel(group){
    if(!group || !group.dates || !group.dates.length) return '';
    if(group.dates.length===1) return weekday(group.start);
    const first=weekday(group.start), last=weekday(group.end);
    return first===last ? first : (first+' - '+last);
  }
  function renderSummaryTable(rows){
    if(!rows.length) return '<div class="empty-state">Chưa có dữ liệu trực ban trong khoảng thời gian đã chọn.</div>';
    const st=dutyState();
    const units=matrixUnitColumns(rows);
    let dates=dateRangeList(st.startDate, st.endDate, 62);
    const dataDates=groupByDate(rows).map(x=>x.date);
    dates=dates.filter(d=>dataDates.includes(d));
    if(!dates.length) dates=dataDates;
    const groups=compactMatrixDateGroups(rows, dates, units);
    const mergedDays=dates.length-groups.length;
    let html='';
    if(mergedDays>0){
      html += `<div class="duty-compact-note">Đã gộp ${E(mergedDays)} dòng ngày có lịch trực giống nhau. Ví dụ Thứ Bảy và Chủ nhật trực giống nhau sẽ hiển thị chung một dòng.</div>`;
    }
    html += '<div class="duty-matrix-scroll"><table class="duty-matrix-table"><thead><tr><th class="duty-date-col">Ngày</th>';
    units.forEach(u=>{ html += `<th>${E(u.name)}</th>`; });
    html += '</tr></thead><tbody>';
    groups.forEach(g=>{
      const dateClass = g.dates.length>1 ? 'duty-date-col compact' : 'duty-date-col';
      html += `<tr><td class="${dateClass}"><div class="duty-date-range">${E(dateRangeShort(g.start,g.end))}</div><div class="duty-date-weekdays">${E(weekdayRangeLabel(g))}</div>${g.dates.length>1?`<div class="duty-date-count">${E(g.dates.length)} ngày</div>`:''}</td>`;
      units.forEach(u=>{
        const cell=matrixCellRows(rows,g.start,u.code);
        html += '<td>' + (cell.length ? `<div class="duty-matrix-cell">${cell.map(personCellHtml).join('')}</div>` : '') + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }
  function personCellHtml(r){
    return `<div class="duty-person"><div class="duty-person-name">Đ/c ${E(r.fullname)}</div><div class="duty-person-pos">${E(r.position||'')}</div>${r.phone?`<div class="duty-person-phone">${E(r.phone)}</div>`:''}${r.note?`<div class="duty-person-note">${E(r.note)}</div>`:''}</div>`;
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
          <div class="duty-help">V119: Sau khi đọc Excel, nút Cập nhật ghi trực tiếp bằng action saveDutyEntries theo từng ngày + trụ sở; không còn trạng thái nháp/chờ duyệt.</div>
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
  window.dutyDownloadCsv=function(){
    const rows=activeEntries();
    const csv=['Ngày,Thứ,Trụ sở,Họ tên,Chức vụ,Số điện thoại,Ghi chú'].concat(rows.map(r=>[dateShort(r.dutyDate),r.dutyWeekday||weekday(r.dutyDate),unitName(r.unitCode),r.fullname,r.position,r.phone,r.note].map(csvCell).join(','))).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='danh-sach-truc.csv'; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  };
  function csvCell(v){ return '"'+String(v||'').replace(/"/g,'""')+'"'; }
  function buildDutyReportText(rows){
    if(!rows.length) return 'DANH SÁCH LÃNH ĐẠO, CÔNG CHỨC TRỰC\n\nChưa có dữ liệu.';
    const st=dutyState();
    const units=matrixUnitColumns(rows);
    let dates=dateRangeList(st.startDate, st.endDate, 62);
    const dataDates=groupByDate(rows).map(x=>x.date);
    dates=dates.filter(d=>dataDates.includes(d));
    if(!dates.length) dates=dataDates;
    const groups=compactMatrixDateGroups(rows, dates, units);
    let out='DANH SÁCH LÃNH ĐẠO, CÔNG CHỨC TRỰC\n';
    groups.forEach((g,di)=>{
      out += `\n${roman(di+1)}. Ngày ${dateRangeShort(g.start,g.end)} (${weekdayRangeLabel(g)})\n`;
      units.forEach((u,ui)=>{
        const cell=matrixCellRows(rows,g.start,u.code);
        if(!cell.length) return;
        out += `\n${ui+1}. ${u.name}\n`;
        cell.forEach((r,ri)=>{ out += `${ui+1}.${ri+1}. Đ/c ${r.fullname} - ${r.position}${r.phone?' - '+r.phone:''}${r.note?' ('+r.note+')':''}\n`; });
      });
    });
    return out.trim();
  }
  function roman(n){ const r=['','I','II','III','IV','V','VI','VII','VIII','IX','X']; return r[n]||String(n); }
  installDutyV119Styles();
  patchDutyLabels();
})();
