/* ==========================================================
 * modules/duty.js — V109 Module Tổng hợp danh sách trực HQKV8
 * Chạy trong Portal Lịch công tác, dùng chung api(), APP, token.
 * ========================================================== */
(function(){
  const DUTY_VERSION = 'duty_v112_xlsx_zip_contenttype_fix';
  const DEFAULT_UNITS = [
    {code:'CHICUC', name:'Trụ sở Chi cục HQKV VIII', order:1},
    {code:'VANPHONG', name:'Văn phòng', order:2},
    {code:'HONGAI', name:'Trụ sở HQCK cảng Hòn Gai', order:3},
    {code:'CAMPHA', name:'Trụ sở HQCK cảng Cẩm Phả', order:4},
    {code:'VANGIA', name:'Trụ sở HQCK cảng Vạn Gia', order:5},
    {code:'HOANHMO', name:'Trụ sở HQCK Hoành Mô', order:6},
    {code:'BPS', name:'Trụ sở HQCK Bắc Phong Sinh', order:7},
    {code:'MONGCAI', name:'Trụ sở HQCK quốc tế Móng Cái', order:8},
    {code:'KSHQ', name:'Trụ sở Đội Kiểm soát Hải quan', order:9},
    {code:'KSHQ_HL', name:'Đội Kiểm soát Hải quan - Khu vực Hạ Long', order:10},
    {code:'KSHQ_MC', name:'Đội Kiểm soát Hải quan - Khu vực Móng Cái', order:11}
  ];

  function $(id){ return document.getElementById(id); }
  function E(s){ return (window.esc ? esc(s) : String(s==null?'':s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))); }
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim(); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function parseDate(v){ if(window.parseIsoDate) return parseIsoDate(v); if(!v)return null; const m=String(v).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); return m?new Date(+m[1],+m[2]-1,+m[3]):null; }
  function dateShort(v){ if(window.dateVNShort) return dateVNShort(v); const d=parseDate(v); return d?d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear():String(v||''); }
  function weekday(v){ const d=parseDate(v); return d?['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][d.getDay()]:''; }
  function todayIso(){ const d=new Date(); d.setHours(0,0,0,0); return iso(d); }
  function addDays(v,n){ const d=parseDate(v)||new Date(); d.setDate(d.getDate()+n); return iso(d); }
  function endOfWeekend(){ const d=new Date(); d.setHours(0,0,0,0); const day=d.getDay(); const add = day===0?0:(6-day<0?0:6-day); d.setDate(d.getDate()+add+1); return iso(d); }
  function nextSaturday(){ const d=new Date(); d.setHours(0,0,0,0); const day=d.getDay(); const add=(6-day+7)%7; d.setDate(d.getDate()+add); return iso(d); }
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
    APP.duty = APP.duty || {};
    const st=APP.duty;
    if(!st.inited){
      st.inited=true;
      st.tab='summary';
      st.startDate=nextSaturday();
      st.endDate=addDays(st.startDate,1);
      st.unitFilter='all';
      st.formUnit='CHICUC';
      st.formDate=st.startDate;
      st.formType='Thứ 7/CN';
      st.loaded=false; st.units=DEFAULT_UNITS.slice(); st.entries=[]; st.statuses=[]; st.message=''; st.importRows=[]; st.importInvalid=[];
    }
    return st;
  }
  function unitOrder(code){ const u=(dutyState().units||DEFAULT_UNITS).find(x=>x.code===code); return u?Number(u.order||999):999; }
  function unitName(code){ const u=(dutyState().units||DEFAULT_UNITS).find(x=>x.code===code); return u?u.name:(code||''); }
  function unitOptions(selected){ return (dutyState().units||DEFAULT_UNITS).map(u=>`<option value="${E(u.code)}" ${u.code===selected?'selected':''}>${E(u.name)}</option>`).join(''); }
  function activeEntries(){
    const st=dutyState();
    return (st.entries||[]).filter(e=>{
      if(st.unitFilter && st.unitFilter!=='all' && e.unitCode!==st.unitFilter) return false;
      return true;
    }).sort(sortEntries);
  }
  function entriesForForm(){
    const st=dutyState();
    return (st.entries||[]).filter(e=>e.dutyDate===st.formDate && e.unitCode===st.formUnit).sort(sortEntries);
  }
  function setMsg(msg, type='ok'){
    const st=dutyState(); st.message = msg ? `<div class="duty-msg ${type}">${E(msg)}</div>` : '';
    const box=$('dutyMsg'); if(box) box.innerHTML=st.message;
  }

  async function loadDuty(force){
    const st=dutyState();
    if(st.loaded && !force) return;
    const res = await api('getDutyData', {startDate:st.startDate, endDate:st.endDate});
    st.units = (res.units && res.units.length) ? res.units : DEFAULT_UNITS.slice();
    st.entries = res.entries || [];
    st.statuses = res.statuses || [];
    st.loaded = true;
  }

  window.renderDutyModule = async function(){
    const box=$('screen-duty'); if(!box) return;
    const st=dutyState();
    box.innerHTML='<div class="loading"><div class="spin"></div><span>Đang tải danh sách trực...</span></div>';
    try{ await loadDuty(false); }
    catch(e){ box.innerHTML=`<div class="msg err">Không tải được module Tổng hợp trực: ${E(e.message||e)}</div>`; return; }
    box.innerHTML = renderDutyShell();
    if(st.tab==='entry') renderDutyEntryTab();
    else if(st.tab==='detail') renderDutyDetailTab();
    else if(st.tab==='import') renderDutyImportTab();
    else renderDutySummaryTab();
  };

  function renderDutyShell(){
    const st=dutyState();
    const count=activeEntries().length;
    const unitSubmitted = new Set((st.statuses||[]).filter(x=>String(x.status||'').toUpperCase()==='SUBMITTED').map(x=>`${x.dutyDate}|${x.unitCode}`)).size;
    return `
      <div class="duty-wrap">
        <div class="duty-hero">
          <div>
            <div class="duty-kicker">Module Lịch công tác HQKV8</div>
            <h2>📋 Tổng hợp danh sách trực</h2>
            <p>Các đơn vị cập nhật lãnh đạo, công chức trực thứ 7, Chủ nhật, ngày lễ; Văn phòng tổng hợp thành bảng báo cáo.</p>
          </div>
          <div class="duty-hero-actions">
            <button class="btn primary" onclick="dutySetTab('entry')">+ Nhập lịch trực</button>
            <button class="btn" onclick="dutyReload()">↻ Tải lại</button>
          </div>
        </div>
        <div class="duty-cards">
          <div class="duty-card"><b>${E(count)}</b><span>Người trực trong khoảng</span></div>
          <div class="duty-card"><b>${E((st.units||[]).length)}</b><span>Trụ sở/đơn vị</span></div>
          <div class="duty-card"><b>${E(unitSubmitted)}</b><span>Lượt đơn vị đã gửi</span></div>
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
            <option value="all">Tất cả trụ sở</option>${(st.units||DEFAULT_UNITS).map(u=>`<option value="${E(u.code)}" ${st.unitFilter===u.code?'selected':''}>${E(u.name)}</option>`).join('')}
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
      <div class="duty-table-card">
        ${renderSummaryTable(rows)}
      </div>`;
  }

  function groupByDate(rows){
    const map={}; rows.forEach(r=>{ (map[r.dutyDate]||(map[r.dutyDate]=[])).push(r); });
    return Object.keys(map).sort().map(d=>({date:d, rows:map[d].sort(sortEntries)}));
  }
  function groupByUnit(rows){
    const units=dutyState().units||DEFAULT_UNITS;
    return units.map(u=>({unit:u, rows:rows.filter(r=>r.unitCode===u.code).sort(sortEntries)})).filter(x=>x.rows.length);
  }
  function renderSummaryTable(rows){
    if(!rows.length) return '<div class="empty-state">Chưa có dữ liệu trực trong khoảng thời gian đã chọn.</div>';
    let html='<table class="duty-report-table"><thead><tr><th>STT</th><th>Trụ sở</th><th>Họ tên</th><th>Chức vụ</th><th>Số điện thoại</th><th>Ghi chú</th></tr></thead><tbody>';
    const byDate=groupByDate(rows);
    byDate.forEach((dg,di)=>{
      html += `<tr class="duty-date-row"><td colspan="6">${roman(di+1)}. Ngày ${E(dateShort(dg.date))} (${E(weekday(dg.date))})</td></tr>`;
      groupByUnit(dg.rows).forEach((ug,ui)=>{
        html += `<tr class="duty-unit-row"><td>${ui+1}</td><td colspan="5">${E(ug.unit.name)}</td></tr>`;
        ug.rows.forEach((r,ri)=>{
          html += `<tr><td>${ui+1}.${ri+1}</td><td></td><td>${E(r.fullname)}</td><td>${E(r.position)}</td><td>${E(r.phone)}</td><td>${E(r.note)}</td></tr>`;
        });
      });
    });
    html += '</tbody></table>';
    return html;
  }

  function renderDutyEntryTab(){
    const st=dutyState(); const box=$('dutyContent'); if(!box) return;
    const rows=entriesForForm();
    box.innerHTML=`
      <div class="duty-entry-grid">
        <div class="card-soft duty-entry-form">
          <h3>Nhập lịch trực theo đơn vị</h3>
          <div class="duty-form-row">
            <label>Đơn vị/trụ sở<br><select id="dutyFormUnit" class="select-field" onchange="dutyFormChanged()">${unitOptions(st.formUnit)}</select></label>
            <label>Ngày trực<br><input id="dutyFormDate" class="input" type="date" value="${E(st.formDate)}" onchange="dutyFormChanged()"></label>
            <label>Loại ngày<br><select id="dutyFormType" class="select-field"><option>Thứ 7/CN</option><option>Ngày lễ</option><option>Ngày nghỉ bù</option><option>Khác</option></select></label>
          </div>
          <div class="duty-help">Mỗi dòng là một lãnh đạo/công chức trực. Khi lưu, danh sách cũ của cùng ngày và cùng đơn vị sẽ được thay thế bằng danh sách mới.</div>
          <div class="duty-entry-table-wrap">
            <table class="duty-entry-table" id="dutyEntryTable">
              <thead><tr><th>Họ tên</th><th>Chức vụ</th><th>Số điện thoại</th><th>Ghi chú</th><th></th></tr></thead>
              <tbody>${(rows.length?rows:[{}]).map(entryRowHtml).join('')}</tbody>
            </table>
          </div>
          <div class="duty-actions-line">
            <button class="btn" onclick="dutyAddEntryRow()">+ Thêm người trực</button>
            <button class="btn primary" onclick="dutySaveEntries(false)">💾 Lưu</button>
            <button class="btn green" onclick="dutySaveEntries(true)">📨 Lưu & gửi Văn phòng</button>
          </div>
        </div>
        <div class="card-soft duty-side">
          <h3>Thứ tự tổng hợp</h3>
          <ol>
            <li>Chi cục trưởng</li><li>Phó Chi cục trưởng</li><li>Trưởng phòng/Đội trưởng/Chánh Văn phòng</li><li>Phó Trưởng phòng/Phó Đội trưởng</li><li>Công chức</li>
          </ol>
          <p>Văn phòng có thể lọc theo ngày, xuất bảng tổng hợp hoặc copy báo cáo gửi nhanh.</p>
        </div>
      </div>`;
  }
  function entryRowHtml(r){
    return `<tr>
      <td><input class="input duty-fullname" value="${E(r.fullname||'')}" placeholder="Họ tên"></td>
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
      <div class="duty-entry-grid">
        <div class="card-soft duty-entry-form">
          <h3>Nhập danh sách trực từ Excel</h3>
          <div class="duty-help">
            File Excel cần có các cột: <b>NGAY_TRUC, UNIT_CODE hoặc DON_VI, HO_TEN, CHUC_VU, SO_DIEN_THOAI, GHI_CHU</b>.
            Khi import, dữ liệu cũ cùng <b>ngày + đơn vị</b> sẽ được thay thế bằng dữ liệu trong file.
          </div>
          <div class="duty-form-row">
            <label>Chọn file Excel<br><input id="dutyExcelFile" class="input" type="file" accept=".xlsx,.xls,.csv" onchange="dutyReadExcelFile()"></label>
            <label>Trạng thái sau import<br><select id="dutyImportSubmit" class="select-field"><option value="false">Lưu nháp</option><option value="true">Lưu & gửi Văn phòng</option></select></label>
          </div>
          <div class="duty-actions-line">
            <button class="btn primary" onclick="dutyReadExcelFile()">📥 Đọc file Excel</button>
            <button class="btn green" onclick="dutySubmitExcelImport()" ${rows.length?'':'disabled'}>✅ Cập nhật vào phần mềm</button>
          </div>
          <div class="duty-help">Mẫu chuẩn: tải file Excel đã chuyển từ phụ lục, hoặc giữ đúng tên cột như trên khi tự lập file.</div>
        </div>
        <div class="card-soft duty-side">
          <h3>Gợi ý mã đơn vị</h3>
          <div class="duty-code-list">${(st.units||DEFAULT_UNITS).map(u=>`<div><b>${E(u.code)}</b> — ${E(u.name)}</div>`).join('')}</div>
        </div>
      </div>
      <div class="duty-table-card">
        <h3>Dữ liệu đọc từ Excel (${rows.length} dòng hợp lệ)</h3>
        ${invalid.length?`<div class="duty-msg err">Có ${invalid.length} dòng chưa hợp lệ: ${E(invalid.slice(0,5).map(x=>'dòng '+x.row+': '+x.msg).join('; '))}${invalid.length>5?'...':''}</div>`:''}
        <table class="duty-detail-table"><thead><tr><th>Ngày</th><th>Thứ</th><th>Trụ sở</th><th>Họ tên</th><th>Chức vụ</th><th>SĐT</th><th>Ghi chú</th></tr></thead><tbody>
          ${rows.slice(0,200).map(r=>`<tr><td>${E(dateShort(r.dutyDate))}</td><td>${E(weekday(r.dutyDate))}</td><td>${E(unitName(r.unitCode)||r.unitName)}</td><td>${E(r.fullname)}</td><td>${E(r.position)}</td><td>${E(r.phone)}</td><td>${E(r.note)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty-cell">Chưa đọc file Excel</td></tr>'}
        </tbody></table>
      </div>`;
  }

  function getImportHeader(row, keys){
    for(const k of keys){
      if(Object.prototype.hasOwnProperty.call(row,k)) return row[k];
    }
    const lowerMap={};
    Object.keys(row||{}).forEach(k=>lowerMap[norm(k)]=row[k]);
    for(const k of keys){
      const v=lowerMap[norm(k)];
      if(v!==undefined) return v;
    }
    return '';
  }
  function excelDateToIso(v){
    if(!v) return '';
    if(v instanceof Date && !isNaN(v.getTime())) return iso(v);
    if(typeof v === 'number'){
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      if(!isNaN(d.getTime())) return iso(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }
    const s=String(v).trim();
    let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if(m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
    m=s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if(m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    const d=new Date(s);
    return isNaN(d.getTime())?'':iso(d);
  }
  function unitCodeFromExcel(unitCode, unitName){
    const code=String(unitCode||'').trim().toUpperCase();
    const units=dutyState().units||DEFAULT_UNITS;
    if(units.some(u=>u.code===code)) return code;
    const n=norm(unitName);
    if(!n) return '';
    const aliases=[
      ['CHICUC',['chi cuc hqkv viii','chi cuc hai quan khu vuc viii','tru so chi cuc','hqkv viii']],
      ['VANPHONG',['van phong','vp']],
      ['HONGAI',['hon gai','cang hon gai']],
      ['CAMPHA',['cam pha','cang cam pha']],
      ['VANGIA',['van gia','cang van gia']],
      ['HOANHMO',['hoanh mo']],
      ['BPS',['bac phong sinh']],
      ['MONGCAI',['mong cai','quoc te mong cai']],
      ['KSHQ_HL',['khu vuc ha long']],
      ['KSHQ_MC',['khu vuc mong cai']],
      ['KSHQ',['doi kiem soat hai quan','doi kshq','kshq']]
    ];
    for(const [c,arr] of aliases){ if(arr.some(k=>n.includes(k))) return c; }
    const found=units.find(u=>norm(u.name)===n || norm(u.name).includes(n) || n.includes(norm(u.name)));
    return found?found.code:'';
  }
  function dutyFileToDataUrl(file){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>resolve(String(r.result||''));
      r.onerror=()=>reject(r.error||new Error('Không đọc được file.'));
      r.readAsDataURL(file);
    });
  }
  function dutyMakeUploadId(){
    return 'duty_excel_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  }
  async function dutyWaitUploadStatus(uploadId, fileName){
    const deadline = Date.now() + 90000; // V114: commit import qua POST ẩn + polling status, tránh JSONP GET dài/chặn mạng.
    let lastMsg = '';
    while(Date.now() < deadline){
      await new Promise(r=>setTimeout(r, 1800));
      try{
        const st = await api('getUploadStatus', {uploadId});
        if(st && !st.pending){
          if(st.ok === false) throw new Error(st.msg || ('Upload lỗi: '+(fileName||'')));
          return st;
        }
        lastMsg = (st && st.msg) || lastMsg;
      }catch(e){
        lastMsg = (e && e.message) || String(e || '');
      }
    }
    throw new Error('Chưa nhận được phản hồi đọc Excel từ Web App sau 90 giây. ' + (lastMsg ? 'Thông tin cuối: ' + lastMsg : ''));
  }

  async function dutyPostExcelToServer(action, file, extra){
    if(!file) throw new Error('Chưa chọn file Excel.');
    const uploadId=dutyMakeUploadId();

    // V112: tạo upload ticket bằng JSONP trước khi gửi file qua form POST ẩn.
    // Ticket lưu user đã đăng nhập trên server, tránh lỗi POST không nhận đúng token/session.
    let uploadTicket='';
    try{
      const ticketRes = await api('createDutyUploadTicket', {purpose: action, fileName: file.name, size: file.size || 0});
      uploadTicket = ticketRes && ticketRes.ticket;
      if(!uploadTicket) throw new Error('Server không trả upload ticket.');
    }catch(e){
      throw new Error('Không tạo được mã upload Excel. Cần thay Code.gs V112 và Deploy New version. Chi tiết: ' + ((e&&e.message)||e));
    }

    const dataUrl=await dutyFileToDataUrl(file);
    const payload=Object.assign({}, extra||{}, {
      action, token: (window.APP && APP.token) || '', uploadId, uploadTicket,
      fileName:file.name, mimeType:file.type||'', base64:dataUrl
    });

    if(typeof canUseGoogleScriptRun==='function' && canUseGoogleScriptRun()){
      await new Promise((resolve,reject)=>{
        try{
          google.script.run
            .withSuccessHandler(res=>{ if(!res || res.ok===false) reject(new Error((res&&res.msg)||'Lỗi đọc Excel')); else resolve(res); })
            .withFailureHandler(err=>reject(new Error((err&&err.message)||String(err||'Lỗi gọi Apps Script'))))
            .api(payload);
        }catch(e){ reject(e); }
      });
    } else if(typeof apiViaHiddenUploadPost==='function') {
      await apiViaHiddenUploadPost(payload);
    } else {
      await api(action, {uploadId, uploadTicket, fileName:file.name, mimeType:file.type||'', base64:dataUrl, ...(extra||{})});
    }

    const res=await dutyWaitUploadStatus(uploadId, file.name);
    if(!res || res.ok===false) throw new Error((res&&res.msg)||'Lỗi đọc Excel trên server.');
    return res;
  }

  async function dutyPostActionAndWaitStatus(action, payload, label){
    const statusUploadId=dutyMakeUploadId();
    const full=Object.assign({}, payload||{}, {
      action,
      token: (window.APP && APP.token) || '',
      statusUploadId
    });
    if(typeof apiViaHiddenUploadPost==='function'){
      await apiViaHiddenUploadPost(full);
    } else {
      // fallback trong môi trường Apps Script hoặc khi không có iframe helper
      const res=await api(action, Object.assign({}, payload||{}, {statusUploadId}));
      if(res && res.ok!==false) return res;
      throw new Error((res&&res.msg)||'Không gửi được yêu cầu cập nhật.');
    }
    const res=await dutyWaitUploadStatus(statusUploadId, label || action);
    if(!res || res.ok===false) throw new Error((res&&res.msg)||'Lỗi cập nhật trên server.');
    return res;
  }

  window.dutyReadExcelFile=async function(){
    const input=$('dutyExcelFile');
    const file=input && input.files && input.files[0];
    if(!file){ alert('Vui lòng chọn file Excel.'); return; }
    setMsg('Đang gửi file Excel lên Apps Script để đọc...', 'info');
    try{
      const res=await dutyPostExcelToServer('parseDutyExcelFile', file, {});
      const st=dutyState();
      st.importRows=Array.isArray(res.rows)?res.rows:[];
      st.importInvalid=Array.isArray(res.invalid)?res.invalid:[];
      st.importUploadId=res.uploadId || res.parseUploadId || ''; // V114: dùng uploadId để commit dữ liệu đã đọc, không gửi lại 28 dòng qua JSONP.
      setMsg(`Đã đọc ${st.importRows.length} dòng hợp lệ từ Excel${st.importInvalid.length?`, ${st.importInvalid.length} dòng chưa hợp lệ`:''}.`, st.importRows.length?'ok':'err');
      renderDutyImportTab();
    }catch(e){ setMsg('Lỗi đọc Excel: '+(e.message||e), 'err'); }
  };
  window.dutySubmitExcelImport=async function(){
    const st=dutyState();
    const input=$('dutyExcelFile');
    const file=input && input.files && input.files[0];
    const submit = $('dutyImportSubmit') && $('dutyImportSubmit').value === 'true';
    if(!file && (!st.importRows || !st.importRows.length)){ alert('Chưa có dữ liệu hợp lệ để import.'); return; }
    const n=(st.importRows&&st.importRows.length)||'các';
    if(!confirm(`Cập nhật ${n} dòng vào phần mềm? Dữ liệu cũ cùng ngày + đơn vị sẽ được thay thế.`)) return;
    setMsg('Đang cập nhật dữ liệu từ Excel...', 'info');
    try{
      let res;
      // V114: bước cập nhật KHÔNG dùng JSONP GET nữa.
      // Lý do: payload import có thể dài hoặc thao tác ghi Sheet lâu, trình duyệt sẽ báo script.onerror.
      // Gửi bằng POST ẩn rồi polling trạng thái theo statusUploadId để nhận kết quả ổn định.
      if(st.importUploadId){
        res=await dutyPostActionAndWaitStatus('commitDutyExcelImport', {uploadId:st.importUploadId, submit}, 'commitDutyExcelImport');
      } else if(st.importRows && st.importRows.length){
        res=await dutyPostActionAndWaitStatus('importDutyEntries', {rows:st.importRows, submit}, 'importDutyEntries');
      } else if(file){
        // Chỉ dùng fallback này khi người dùng chưa bấm Đọc file Excel.
        res=await dutyPostExcelToServer('importDutyExcelFile', file, {submit});
      } else {
        throw new Error('Chưa có dữ liệu hợp lệ để import.');
      }
      st.loaded=false; await loadDuty(true);
      setMsg((res && res.msg) || 'Đã import dữ liệu từ Excel.', 'ok');
      st.tab='summary';
      renderDutyModule();
    }catch(e){ setMsg('Lỗi import Excel: '+(e.message||e), 'err'); }
  };


  function renderDutyDetailTab(){
    const box=$('dutyContent'); if(!box) return;
    const rows=activeEntries();
    box.innerHTML=`
      <div class="duty-table-card">
        <table class="duty-detail-table"><thead><tr><th>Ngày</th><th>Thứ</th><th>Trụ sở</th><th>Họ tên</th><th>Chức vụ</th><th>SĐT</th><th>Ghi chú</th><th>Trạng thái</th></tr></thead><tbody>
          ${rows.map(r=>`<tr><td>${E(dateShort(r.dutyDate))}</td><td>${E(weekday(r.dutyDate))}</td><td>${E(unitName(r.unitCode))}</td><td>${E(r.fullname)}</td><td>${E(r.position)}</td><td>${E(r.phone)}</td><td>${E(r.note)}</td><td><span class="duty-badge">${E(r.status||'DRAFT')}</span></td></tr>`).join('') || '<tr><td colspan="8" class="empty-cell">Chưa có dữ liệu</td></tr>'}
        </tbody></table>
      </div>`;
  }

  window.dutySetTab=function(tab){ const st=dutyState(); st.tab=tab; renderDutyModule(); };
  window.dutyReload=async function(){ const st=dutyState(); st.loaded=false; await renderDutyModule(); };
  window.dutySetDateRange=function(start,end){ const st=dutyState(); if(start)st.startDate=start; if(end)st.endDate=end; st.loaded=false; renderDutyModule(); };
  window.dutySetUnitFilter=function(unit){ const st=dutyState(); st.unitFilter=unit; renderDutyModule(); };
  window.dutyQuickRange=function(kind){ const st=dutyState(); const t=todayIso(); if(kind==='today'){st.startDate=t;st.endDate=t;} else if(kind==='weekend'){st.startDate=nextSaturday();st.endDate=addDays(st.startDate,1);} else {st.startDate=t;st.endDate=addDays(t,6);} st.loaded=false; renderDutyModule(); };
  window.dutyFormChanged=function(){ const st=dutyState(); st.formUnit=$('dutyFormUnit').value; st.formDate=$('dutyFormDate').value; renderDutyEntryTab(); };
  window.dutyAddEntryRow=function(){ const tb=document.querySelector('#dutyEntryTable tbody'); if(tb) tb.insertAdjacentHTML('beforeend', entryRowHtml({})); };
  window.dutySaveEntries=async function(submit){
    const st=dutyState();
    const unitCode=$('dutyFormUnit').value, dutyDate=$('dutyFormDate').value, dutyType=$('dutyFormType').value;
    const entries=[];
    document.querySelectorAll('#dutyEntryTable tbody tr').forEach(tr=>{
      const fullname=tr.querySelector('.duty-fullname')?.value.trim()||'';
      const position=tr.querySelector('.duty-position')?.value.trim()||'';
      const phone=tr.querySelector('.duty-phone')?.value.trim()||'';
      const note=tr.querySelector('.duty-note')?.value.trim()||'';
      if(fullname) entries.push({fullname, position, phone, note});
    });
    if(!unitCode || !dutyDate){ alert('Vui lòng chọn đơn vị và ngày trực.'); return; }
    if(!entries.length && !confirm('Danh sách đang trống. Anh/chị có chắc muốn lưu danh sách trống cho ngày/đơn vị này?')) return;
    setMsg('Đang lưu...', 'info');
    try{
      await api('saveDutyEntries',{unitCode, unitName:unitName(unitCode), dutyDate, dutyType, entries, submit:!!submit});
      st.loaded=false; st.formUnit=unitCode; st.formDate=dutyDate;
      await loadDuty(true);
      setMsg(submit?'Đã lưu và gửi Văn phòng.':'Đã lưu danh sách trực.', 'ok');
      renderDutyModule();
    }catch(e){ setMsg('Lỗi lưu danh sách trực: '+(e.message||e), 'err'); }
  };
  window.dutyCopyReport=async function(){
    const text=buildDutyReportText(activeEntries());
    try{ await navigator.clipboard.writeText(text); setMsg('Đã copy danh sách trực.', 'ok'); }
    catch(e){ prompt('Copy thủ công nội dung dưới đây:', text); }
  };
  window.dutyDownloadCsv=function(){
    const rows=activeEntries();
    const csv=['Ngày,Thứ,Trụ sở,Họ tên,Chức vụ,Số điện thoại,Ghi chú'].concat(rows.map(r=>[dateShort(r.dutyDate),weekday(r.dutyDate),unitName(r.unitCode),r.fullname,r.position,r.phone,r.note].map(csvCell).join(','))).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='danh-sach-truc.csv'; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  };
  function csvCell(v){ return '"'+String(v||'').replace(/"/g,'""')+'"'; }
  function buildDutyReportText(rows){
    if(!rows.length) return 'DANH SÁCH LÃNH ĐẠO, CÔNG CHỨC TRỰC\n\nChưa có dữ liệu.';
    let out='DANH SÁCH LÃNH ĐẠO, CÔNG CHỨC TRỰC\n';
    groupByDate(rows).forEach((dg,di)=>{
      out += `\n${roman(di+1)}. Ngày ${dateShort(dg.date)} (${weekday(dg.date)})\n`;
      groupByUnit(dg.rows).forEach((ug,ui)=>{
        out += `\n${ui+1}. ${ug.unit.name}\n`;
        ug.rows.forEach((r,ri)=>{ out += `${ui+1}.${ri+1}. Đ/c ${r.fullname} - ${r.position}${r.phone?' - '+r.phone:''}${r.note?' ('+r.note+')':''}\n`; });
      });
    });
    return out.trim();
  }
  function roman(n){ const r=['','I','II','III','IV','V','VI','VII','VIII','IX','X']; return r[n]||String(n); }
})();
