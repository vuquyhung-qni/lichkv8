/* V97 - Module Họp không giấy: tạo lịch 1 chiều từ HKG sang Lịch công tác; chỉ hiển thị hồ sơ đã tạo/liên kết
   File này chạy trong cùng trang Portal Lịch công tác, dùng chung APP/api/modal/helper. */
// ===== Module Họp không giấy =====
function hkgCanManage(){ return hasRole(ROLE_EDIT); }
function hkgStatusLabel(s){ const m={DONE:'Hoàn thành',WAIT_DOCS:'Chờ tài liệu',WAIT_ATTEND:'Chờ điểm danh',WAIT_MINUTES:'Chờ biên bản',WAIT_CONCLUSION:'Chờ kết luận'}; return m[s]||s||'Đang xử lý'; }
function hkgStatusClass(s){ return s==='DONE'?'done':(s==='OVERDUE'?'late':'wait'); }
async function renderHkgModule(){
  const box=$('screen-hkg'); if(!box) return;
  if(APP.currentScreen!=='hkg' && APP.hkg.loaded) return;
  if(!APP.hkg.loaded || APP.hkg.view==='list') return await renderHkgList();
  if(APP.hkg.view==='detail') return await renderHkgDetail();
  if(APP.hkg.view==='groups') return await renderHkgGroups();
}
async function renderHkgList(){
  const box=$('screen-hkg'); if(!box) return;
  box.innerHTML='<div class="loading"><div class="spin"></div><span>Đang tải module Họp không giấy...</span></div>';
  try{
    const res=await api('getHkgMeetings',{showPast:true,limit:300});
    APP.hkg.dashboard=res.dashboard||{}; APP.hkg.meetings=res.meetings||[]; APP.hkg.loaded=true; APP.hkg.view='list';
    const d=APP.hkg.dashboard;
    box.innerHTML=`<div class="hkg-shell">
      <div class="hkg-hero"><div><h2>📋 Họp không giấy</h2><p>Chỉ hiển thị các cuộc họp đã được tạo hồ sơ Họp không giấy. Có thể tạo mới tại đây; lịch sẽ tự liên thông 1 chiều sang Lịch công tác.</p></div><div class="hkg-toolbar"><button class="btn primary sm" onclick="openHkgCreateMeetingModal()">＋ Tạo lịch họp</button><button class="btn ghost sm" onclick="renderHkgGroups()">👥 Nhóm dự họp</button><button class="btn sm" onclick="hkgReload()">↻ Tải lại</button></div></div>
      <div class="hkg-stat-grid">
        ${hkgStat('Tổng hồ sơ',d.total||0)}${hkgStat('Chờ tài liệu',d.waitingDocs||0)}${hkgStat('Chờ điểm danh',d.waitingAttendance||0)}${hkgStat('Chờ biên bản',d.waitingMinutes||0)}${hkgStat('Chờ kết luận',d.waitingConclusion||0)}${hkgStat('Hoàn thành',d.completed||0)}
      </div>
      <div class="panel"><div class="panel-h"><h3>Danh sách hồ sơ họp</h3></div><div class="panel-b">
        <div class="hkg-toolbar" style="margin-bottom:12px"><input id="hkgKw" placeholder="Tìm mã lịch, nội dung, chủ trì..." oninput="hkgFilterList()"><select id="hkgFilterStatus" onchange="hkgFilterList()"><option value="all">Tất cả trạng thái</option><option value="WAIT_DOCS">Chờ tài liệu</option><option value="WAIT_ATTEND">Chờ điểm danh</option><option value="WAIT_MINUTES">Chờ biên bản</option><option value="WAIT_CONCLUSION">Chờ kết luận</option><option value="DONE">Hoàn thành</option></select></div>
        <div id="hkgMeetingList">${hkgMeetingListHtml(APP.hkg.meetings)}</div>
      </div></div>
    </div>`;
  }catch(e){box.innerHTML=`<div class="msg err">${esc(e.message)}</div>`;}
}
function hkgStat(label,val){return `<div class="hkg-stat"><b>${esc(val)}</b><span>${esc(label)}</span></div>`;}
function hkgMeetingListHtml(arr){
  if(!arr||!arr.length)return '<div class="empty"><b>Chưa có hồ sơ Họp không giấy.</b><br>Module này chỉ hiển thị các cuộc họp đã được tạo/liên kết. Hãy vào Lịch công tác, mở lịch cần xử lý và bấm <b>📋 Hồ sơ họp</b>.</div>';
  return `<div class="table-wrap hkg-table-mobile"><table class="tbl"><thead><tr><th>Mã</th><th>Ngày họp</th><th>Nội dung</th><th>Chủ trì</th><th>Tài liệu</th><th>Điểm danh</th><th>Biên bản</th><th>Kết luận</th><th>Trạng thái</th><th></th></tr></thead><tbody>${arr.map(x=>`<tr>
    <td data-label="Mã"><b class="mono">${esc(x.meetingId)}</b></td><td data-label="Ngày">${esc(dateVNShort(x.ngayHienThi||x.ngayBatDau))}<br><span class="muted">${esc(timeRange(x))}</span></td><td data-label="Nội dung"><b>${esc(x.noiDung)}</b><br><span class="muted">${esc(x.diaDiem||'')}</span></td><td data-label="Chủ trì">${esc(x.chuTri||'')}</td><td data-label="Tài liệu">${esc(x.fileCount||0)}</td><td data-label="Điểm danh">${esc(x.attendanceDone||0)}/${esc(x.participantCount||0)}</td><td data-label="Biên bản">${x.hasMinutes?'Có':'Chưa'}</td><td data-label="Kết luận">${esc(x.conclusionCount||0)}</td><td data-label="Trạng thái"><span class="hkg-status ${hkgStatusClass(x.hkgStatus)}">${esc(hkgStatusLabel(x.hkgStatus))}</span></td><td data-label="Thao tác"><button class="btn primary xs" onclick="openHkgDetail('${esc(x.meetingId)}')">Mở hồ sơ</button></td>
  </tr>`).join('')}</tbody></table></div>`;
}
function hkgFilterList(){const kw=normalizeText(($('hkgKw')?.value||''));const st=$('hkgFilterStatus')?.value||'all';let arr=(APP.hkg.meetings||[]).filter(x=>(st==='all'||x.hkgStatus===st));if(kw)arr=arr.filter(x=>normalizeText([x.meetingId,x.noiDung,x.chuTri,x.diaDiem].join(' ')).includes(kw));$('hkgMeetingList').innerHTML=hkgMeetingListHtml(arr);}
async function hkgReload(){APP.hkg.loaded=false;APP.hkg.view='list';await renderHkgList();}
async function openHkgDetail(meetingId){
  try{
    // V96: mở từ Lịch công tác thì tạo/liên kết hồ sơ Họp không giấy trước.
    await api('createHkgProfile',{meetingId:meetingId});
    APP.hkg.loaded=false;
    APP.hkg.view='detail';APP.hkg.meetingId=meetingId;APP.hkg.detail=null;APP.hkg.tab='info';
    await go('hkg');
  }catch(e){alert(e.message||'Không tạo/mở được hồ sơ Họp không giấy.');}
}
async function renderHkgDetail(){
  const box=$('screen-hkg'); if(!box) return; const id=APP.hkg.meetingId; if(!id){APP.hkg.view='list';return renderHkgList();}
  box.innerHTML='<div class="loading"><div class="spin"></div><span>Đang tải hồ sơ họp...</span></div>';
  try{const res=await api('getHkgDetail',{meetingId:id,autoCreate:true}); APP.hkg.detail=res; const m=res.meeting||{}; box.innerHTML=`<div class="hkg-shell">
    <div class="hkg-detail-head"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><div class="hkg-detail-title">${esc(m.meetingId)} · ${esc(m.noiDung||'Hồ sơ họp')}</div><div class="muted">${esc(dateVNShort(m.ngayHienThi||m.ngayBatDau))} · ${esc(timeRange(m))} · ${esc(m.diaDiem||'')}</div></div><div class="hkg-toolbar"><button class="btn ghost sm" onclick="APP.hkg.view='list';renderHkgList()">← Danh sách</button><button class="btn sm" onclick="openDetail('${esc(id)}')">👁 Lịch gốc</button></div></div></div>
    <div class="hkg-tabs">${['info|Thông tin','docs|Tài liệu','att|Điểm danh','op|Ý kiến','vote|Biểu quyết','min|Biên bản','con|Kết luận','his|Lịch sử'].map(s=>{const [k,l]=s.split('|');return `<button class="hkg-tab ${APP.hkg.tab===k?'active':''}" onclick="hkgSetTab('${k}')">${l}</button>`}).join('')}</div>
    <div id="hkgTabBody">${hkgTabHtml()}</div>
  </div>`; hkgMaybeStartVoteTimer();}catch(e){box.innerHTML=`<div class="msg err">${esc(e.message)}</div>`;}
}
function hkgSetTab(t){APP.hkg.tab=t; const b=$('hkgTabBody'); if(b)b.innerHTML=hkgTabHtml(); document.querySelectorAll('.hkg-tab').forEach(x=>x.classList.remove('active')); hkgMaybeStartVoteTimer();}
function hkgTabHtml(){const r=APP.hkg.detail||{}, m=r.meeting||{}; const t=APP.hkg.tab||'info';
  if(t==='info')return `<div class="hkg-grid2"><div class="hkg-card"><h4>Thông tin cuộc họp</h4>${hkgInfoRow('Mã lịch',m.meetingId)}${hkgInfoRow('Nội dung',m.noiDung)}${hkgInfoRow('Thời gian',dateVNShort(m.ngayHienThi||m.ngayBatDau)+' · '+timeRange(m))}${hkgInfoRow('Địa điểm',m.diaDiem)}${hkgInfoRow('Chủ trì',m.chuTri)}${hkgInfoRow('Thành phần',m.thanhPhan)}</div><div class="hkg-card"><h4>Thao tác nhanh</h4><div class="hkg-mini-list"><button class="btn primary" onclick="hkgSetTab('att')">✅ Điểm danh</button><button class="btn" onclick="hkgSetTab('vote')">🗳 Biểu quyết</button><button class="btn" onclick="hkgSetTab('min')">📝 Biên bản</button><button class="btn" onclick="hkgSetTab('con')">📌 Kết luận</button></div></div></div>`;
  if(t==='docs')return `<div class="hkg-card"><h4>Tài liệu họp</h4>${(r.files||[]).length?`<div class="hkg-mini-list">${r.files.map(f=>`<div class="hkg-mini-item"><b>${esc(f.fileName||f.name||'Tài liệu')}</b><br><span class="muted">${esc(f.fileType||'')}</span><div style="margin-top:6px"><a class="btn xs primary" target="_blank" href="${esc(f.fileUrl||f.url||'#')}">Mở file</a></div></div>`).join('')}</div>`:'<div class="empty">Chưa có tài liệu họp.</div>'}<div style="margin-top:12px"><button class="btn" onclick="openDetail('${esc(m.meetingId)}')">Upload/xem tài liệu trong lịch gốc</button></div></div>`;
  if(t==='att')return hkgAttendanceHtml(r);
  if(t==='op')return hkgOpinionHtml(r);
  if(t==='vote')return hkgVoteHtml(r);
  if(t==='min')return hkgMinutesHtml(r);
  if(t==='con')return hkgConclusionHtml(r);
  if(t==='his')return `<div class="hkg-card"><h4>Lịch sử xử lý</h4>${(r.history||[]).length?`<div class="hkg-mini-list">${r.history.map(h=>`<div class="hkg-mini-item"><b>${esc(h.action)}</b> · <span class="muted">${esc(h.createdAt)}</span><br>${esc(h.fullname||h.username||'')} ${h.newValue?`<br><span>${esc(h.newValue)}</span>`:''}</div>`).join('')}</div>`:'<div class="empty">Chưa có lịch sử.</div>'}</div>`;
  return '';
}
function hkgInfoRow(k,v){return `<div class="m-meta-row"><span class="label">${esc(k)}</span><span>${esc(v||'')}</span></div>`;}
function hkgAttendanceHtml(r){const arr=r.attendance||[];return `<div class="hkg-card"><h4>Thành phần / Điểm danh</h4>${arr.length?`<div class="table-wrap hkg-table-mobile"><table class="tbl"><thead><tr><th>Họ tên</th><th>Đơn vị</th><th>Nguồn</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>${arr.map(a=>`<tr><td data-label="Họ tên"><b>${esc(a.fullname||a.username)}</b></td><td data-label="Đơn vị">${esc(a.donVi||'')}</td><td data-label="Nguồn">${esc(a.sourceName||a.roleInMeeting||'')}</td><td data-label="Trạng thái"><select onchange="saveHkgAttendance('${esc(a.username)}',this.value)">${['Chưa xác nhận','Có mặt','Vắng có lý do','Vắng không lý do','Dự thay','Đến muộn'].map(s=>`<option ${a.status===s?'selected':''}>${s}</option>`).join('')}</select></td><td data-label="Ghi chú"><input value="${esc(a.note||'')}" onchange="saveHkgAttendance('${esc(a.username)}',null,this.value)" placeholder="Ghi chú"></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Chưa có thành phần. Có thể dùng nhóm dự họp để thêm thành phần.</div>'}<div style="margin-top:12px"><button class="btn" onclick="openHkgInviteModal()">👥 Chọn nhóm/gọi thêm</button></div></div>`;}
async function saveHkgAttendance(username,status,note){try{await api('saveHkgAttendance',{meetingId:APP.hkg.meetingId,username,status,note});}catch(e){alert(e.message)}}
function hkgOpinionHtml(r){return `<div class="hkg-grid2"><div class="hkg-card"><h4>Gửi ý kiến</h4><div class="hkg-form-row"><label>Loại ý kiến</label><select id="hkgOpType"><option>Trước họp</option><option>Trong họp</option><option>Sau họp</option></select></div><div class="hkg-form-row"><label>Nội dung</label><textarea id="hkgOpContent" placeholder="Nhập ý kiến..."></textarea></div><button class="btn primary" onclick="saveHkgOpinion()">Gửi ý kiến</button></div><div class="hkg-card"><h4>Danh sách ý kiến</h4>${(r.opinions||[]).length?`<div class="hkg-mini-list">${r.opinions.map(o=>`<div class="hkg-mini-item"><b>${esc(o.fullname||o.username)}</b> · <span class="muted">${esc(o.opinionType)} · ${esc(o.createdAt)}</span><br>${esc(o.content)}</div>`).join('')}</div>`:'<div class="empty">Chưa có ý kiến.</div>'}</div></div>`;}
async function saveHkgOpinion(){const content=($('hkgOpContent')?.value||'').trim(); if(!content)return alert('Nhập nội dung ý kiến.'); try{await api('saveHkgOpinion',{meetingId:APP.hkg.meetingId,opinionType:$('hkgOpType').value,content}); await hkgReloadDetail('op');}catch(e){alert(e.message)}}
function hkgVoteHtml(r){const votes=r.votes||[];return `<div class="hkg-grid2"><div class="hkg-card"><h4>Tạo biểu quyết</h4><div class="hkg-form-row"><label>Nội dung biểu quyết</label><input id="hkgVoteTitle" placeholder="Ví dụ: Thông qua dự thảo báo cáo..."></div><div class="hkg-form-row"><label>Lựa chọn</label><input id="hkgVoteOptions" value="Đồng ý;Không đồng ý;Không có ý kiến"></div><button class="btn primary" onclick="createHkgVote()">＋ Tạo biểu quyết</button></div><div class="hkg-card"><h4>Phiên biểu quyết</h4>${votes.length?`<div class="hkg-mini-list">${votes.map(v=>hkgVoteItem(v)).join('')}</div>`:'<div class="empty">Chưa có biểu quyết.</div>'}</div></div>`;}
function hkgVoteItem(v){const total=(v.total||0)||1;return `<div class="hkg-mini-item"><b>${esc(v.title)}</b><br><span class="hkg-status ${v.status==='OPEN'?'wait':'done'}">${v.status==='OPEN'?'Đang mở':'Đã đóng'}</span><div style="margin-top:8px">${(v.results||[]).map(x=>`<div style="display:flex;justify-content:space-between"><span>${esc(x.choice)}</span><b>${esc(x.count)}</b></div><div class="hkg-bar"><span style="width:${Math.round((x.count||0)*100/total)}%"></span></div>`).join('')}</div><div class="hkg-toolbar" style="margin-top:8px">${v.status==='OPEN'?`<button class="btn xs" onclick="submitHkgVote('${esc(v.voteId)}','Đồng ý')">Đồng ý</button><button class="btn xs" onclick="submitHkgVote('${esc(v.voteId)}','Không đồng ý')">Không đồng ý</button><button class="btn xs" onclick="submitHkgVote('${esc(v.voteId)}','Không có ý kiến')">Không ý kiến</button><button class="btn danger xs" onclick="closeHkgVote('${esc(v.voteId)}')">Đóng</button>`:`<button class="btn xs" onclick="openHkgVote('${esc(v.voteId)}')">Mở lại</button>`}</div></div>`;}
async function createHkgVote(){const title=($('hkgVoteTitle')?.value||'').trim(); if(!title)return alert('Nhập nội dung biểu quyết.'); try{await api('createHkgVote',{meetingId:APP.hkg.meetingId,title,options:($('hkgVoteOptions')?.value||'')}); await hkgReloadDetail('vote');}catch(e){alert(e.message)}}
async function submitHkgVote(voteId,choice){try{await api('submitHkgVote',{meetingId:APP.hkg.meetingId,voteId,choice}); await hkgReloadDetail('vote');}catch(e){alert(e.message)}}
async function closeHkgVote(voteId){try{await api('closeHkgVote',{voteId}); await hkgReloadDetail('vote');}catch(e){alert(e.message)}}
async function openHkgVote(voteId){try{await api('openHkgVote',{voteId}); await hkgReloadDetail('vote');}catch(e){alert(e.message)}}
function hkgMaybeStartVoteTimer(){ if(APP.hkg.voteTimer){clearInterval(APP.hkg.voteTimer);APP.hkg.voteTimer=null;} if(APP.currentScreen==='hkg'&&APP.hkg.view==='detail'&&APP.hkg.tab==='vote')APP.hkg.voteTimer=setInterval(()=>hkgReloadDetail('vote',true),5000); }
function hkgMinutesHtml(r){const min=r.minutes||{};return `<div class="hkg-card"><h4>Biên bản cuộc họp</h4><div class="hkg-form-row"><label>Tiêu đề</label><input id="hkgMinTitle" value="${esc(min.title||('Biên bản '+(r.meeting?.meetingId||'')))}"></div><div class="hkg-form-row"><label>Nội dung biên bản</label><textarea id="hkgMinContent" style="min-height:280px">${esc(min.contentText||hkgMinutesTemplate(r))}</textarea></div><div class="hkg-toolbar"><button class="btn primary" onclick="saveHkgMinutes()">Lưu biên bản</button><button class="btn" onclick="autoFillHkgMinutes()">Tự tổng hợp</button><button class="btn ok" onclick="exportHkgMinutes('pdf')">Xuất PDF</button><button class="btn" onclick="exportHkgMinutes('docx')">Xuất Word</button>${min.pdfFileUrl?`<a class="btn xs primary" target="_blank" href="${esc(min.pdfFileUrl)}">Mở PDF</a>`:''}${min.docxFileUrl?`<a class="btn xs" target="_blank" href="${esc(min.docxFileUrl)}">Mở Word</a>`:''}</div></div>`;}
function hkgMinutesTemplate(r){const m=r.meeting||{};return `BIÊN BẢN CUỘC HỌP\n\n1. Thông tin cuộc họp\n- Nội dung: ${m.noiDung||''}\n- Thời gian: ${dateVNShort(m.ngayHienThi||m.ngayBatDau)} ${timeRange(m)}\n- Địa điểm: ${m.diaDiem||''}\n- Chủ trì: ${m.chuTri||''}\n\n2. Thành phần tham dự\n- Tổng số được mời: ${(r.attendance||[]).length}\n- Có mặt: ${(r.attendance||[]).filter(x=>x.status==='Có mặt').length}\n\n3. Nội dung cuộc họp\n\n4. Ý kiến tham gia\n${(r.opinions||[]).map(o=>'- '+(o.content||'')).join('\n')}\n\n5. Kết quả biểu quyết\n${(r.votes||[]).map(v=>'- '+v.title).join('\n')}\n\n6. Kết luận cuộc họp\n${(r.conclusions||[]).map(c=>'- '+(c.content||'')).join('\n')}\n`;}
function autoFillHkgMinutes(){const t=$('hkgMinContent'); if(t)t.value=hkgMinutesTemplate(APP.hkg.detail||{});}
async function saveHkgMinutes(){try{await api('saveHkgMinutes',{meetingId:APP.hkg.meetingId,title:$('hkgMinTitle').value,contentText:$('hkgMinContent').value}); await hkgReloadDetail('min');}catch(e){alert(e.message)}}
async function exportHkgMinutes(type){try{await saveHkgMinutes(); const res=await api(type==='pdf'?'exportHkgMinutesPdf':'exportHkgMinutesDocx',{meetingId:APP.hkg.meetingId}); alert('Đã xuất '+(type==='pdf'?'PDF':'Word')); await hkgReloadDetail('min'); if(res.url)window.open(res.url,'_blank');}catch(e){alert(e.message)}}
function hkgConclusionHtml(r){return `<div class="hkg-grid2"><div class="hkg-card"><h4>Thêm kết luận</h4><div class="hkg-form-row"><label>Nội dung</label><textarea id="hkgConContent"></textarea></div><div class="hkg-form-row"><label>Người phụ trách</label><input id="hkgConAssignee" placeholder="Tên người phụ trách"></div><div class="hkg-form-row"><label>Hạn hoàn thành</label><input id="hkgConDue" type="date"></div><button class="btn primary" onclick="saveHkgConclusion()">Lưu kết luận</button></div><div class="hkg-card"><h4>Danh sách kết luận</h4>${(r.conclusions||[]).length?`<div class="hkg-mini-list">${r.conclusions.map(c=>`<div class="hkg-mini-item"><b>${esc(c.content)}</b><br><span class="muted">Phụ trách: ${esc(c.assigneeFullname||c.assigneeUsername||'')} · Hạn: ${esc(c.dueDate||'')}</span><br><span class="hkg-status ${c.status==='Hoàn thành'?'done':'wait'}">${esc(c.status||'Chưa thực hiện')}</span><div class="hkg-toolbar" style="margin-top:7px"><button class="btn xs" onclick="updateHkgConclusion('${esc(c.conclusionId)}','Đang thực hiện')">Đang làm</button><button class="btn xs ok" onclick="updateHkgConclusion('${esc(c.conclusionId)}','Hoàn thành')">Hoàn thành</button></div></div>`).join('')}</div>`:'<div class="empty">Chưa có kết luận.</div>'}</div></div>`;}
async function saveHkgConclusion(){const content=($('hkgConContent')?.value||'').trim(); if(!content)return alert('Nhập nội dung kết luận.'); try{await api('saveHkgConclusion',{meetingId:APP.hkg.meetingId,content,assigneeFullname:$('hkgConAssignee').value,dueDate:$('hkgConDue').value}); await hkgReloadDetail('con');}catch(e){alert(e.message)}}
async function updateHkgConclusion(id,status){try{await api('updateHkgConclusion',{meetingId:APP.hkg.meetingId,conclusionId:id,status}); await hkgReloadDetail('con');}catch(e){alert(e.message)}}
async function hkgReloadDetail(tab,silent){try{APP.hkg.tab=tab||APP.hkg.tab; const res=await api('getHkgDetail',{meetingId:APP.hkg.meetingId}); APP.hkg.detail=res; const b=$('hkgTabBody'); if(b)b.innerHTML=hkgTabHtml();}catch(e){if(!silent)alert(e.message)}}

function openHkgCreateMeetingModal(){
  const today = new Date().toISOString().slice(0,10);
  $('modal').classList.remove('hide');
  $('modal').innerHTML=`<div class="modal-card"><div class="modal-h"><h3>＋ Tạo lịch họp không giấy</h3><button class="modal-close" onclick="closeModal()">✕</button></div><div class="modal-b">
    <div class="msg" style="margin-top:0">Lịch tạo tại đây sẽ tự sinh bản ghi trong <b>Lịch công tác</b> và đồng thời tạo <b>Hồ sơ Họp không giấy</b>. Chiều ngược lại không tự động: lịch tạo thông thường chỉ vào Họp không giấy khi bấm “📋 Hồ sơ họp”.</div>
    <div class="form-grid" style="margin-top:14px">
      <div class="field full"><label>Nội dung cuộc họp</label><textarea id="hkgNewNoiDung" placeholder="Nhập nội dung cuộc họp"></textarea></div>
      <div class="field"><label>Ngày họp</label><input id="hkgNewNgay" type="date" value="${today}"></div>
      <div class="field"><label>Giờ bắt đầu</label><input id="hkgNewGioBD" type="time" value="08:00"></div>
      <div class="field"><label>Giờ kết thúc</label><input id="hkgNewGioKT" type="time" value="11:30"></div>
      <div class="field"><label>Địa điểm</label><input id="hkgNewDiaDiem" placeholder="Ví dụ: P701, Hội trường..."></div>
      <div class="field"><label>Chủ trì</label><input id="hkgNewChuTri" placeholder="Đ/c ..."></div>
      <div class="field"><label>Đơn vị chuẩn bị</label><input id="hkgNewDonVi" placeholder="Đơn vị chuẩn bị tài liệu"></div>
      <div class="field full"><label>Thành phần dự họp</label><textarea id="hkgNewThanhPhan" placeholder="Nhập thành phần dự họp hoặc để trống, sau khi tạo có thể chọn Nhóm dự họp trong hồ sơ"></textarea></div>
      <div class="field full"><label>Ghi chú</label><textarea id="hkgNewGhiChu" placeholder="Ghi chú nếu có"></textarea></div>
    </div>
    <div class="toolbar" style="margin-top:14px"><button class="btn primary" onclick="saveHkgNewMeeting()">Tạo lịch và mở hồ sơ</button><button class="btn ghost" onclick="closeModal()">Đóng</button></div>
  </div></div>`;
}

async function saveHkgNewMeeting(){
  const noiDung=($('hkgNewNoiDung')?.value||'').trim();
  const ngay=($('hkgNewNgay')?.value||'').trim();
  if(!noiDung) return alert('Vui lòng nhập nội dung cuộc họp.');
  if(!ngay) return alert('Vui lòng chọn ngày họp.');
  const form={
    noiDung: noiDung,
    ngayBatDau: ngay,
    ngayKetThuc: ngay,
    gioBatDau: $('hkgNewGioBD')?.value||'',
    gioKetThuc: $('hkgNewGioKT')?.value||'',
    diaDiem: $('hkgNewDiaDiem')?.value||'',
    chuTri: $('hkgNewChuTri')?.value||'',
    donViChuanBi: $('hkgNewDonVi')?.value||'',
    thanhPhan: $('hkgNewThanhPhan')?.value||'',
    ghiChu: $('hkgNewGhiChu')?.value||'',
    loaiLich: 'HOP',
    trangThai: 'PUBLISHED'
  };
  try{
    const res=await api('createHkgMeeting',{form});
    closeModal();
    APP.hkg.loaded=false;
    await openHkgDetail(res.meetingId);
  }catch(e){alert(e.message||'Không tạo được lịch họp không giấy.');}
}

async function renderHkgGroups(){const box=$('screen-hkg'); if(!box)return; APP.hkg.view='groups'; box.innerHTML='<div class="loading"><div class="spin"></div><span>Đang tải nhóm dự họp...</span></div>'; try{const res=await api('getMeetingGroups',{}); APP.hkg.groups=res.groups||[]; box.innerHTML=`<div class="hkg-shell"><div class="hkg-hero"><div><h2>👥 Nhóm người dự họp</h2><p>Tạo nhóm thành viên thường xuyên để mời họp nhanh.</p></div><div class="hkg-toolbar"><button class="btn ghost sm" onclick="APP.hkg.view='list';renderHkgList()">← Họp không giấy</button><button class="btn primary sm" onclick="openHkgGroupModal()">＋ Tạo nhóm</button></div></div><div class="panel"><div class="panel-b">${APP.hkg.groups.length?`<div class="table-wrap hkg-table-mobile"><table class="tbl"><thead><tr><th>Tên nhóm</th><th>Loại</th><th>Số TV</th><th>Trạng thái</th><th></th></tr></thead><tbody>${APP.hkg.groups.map(g=>`<tr><td data-label="Tên nhóm"><b>${esc(g.groupName)}</b><br><span class="muted">${esc(g.description||'')}</span></td><td data-label="Loại">${esc(g.groupType||'')}</td><td data-label="Số TV">${esc(g.memberCount||0)}</td><td data-label="Trạng thái">${esc(g.status||'Active')}</td><td><button class="btn xs primary" onclick="openHkgGroupModal('${esc(g.groupId)}')">Sửa</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Chưa có nhóm dự họp.</div>'}</div></div></div>`;}catch(e){box.innerHTML=`<div class="msg err">${esc(e.message)}</div>`;}}
async function openHkgGroupModal(groupId){let g={members:[]}; if(groupId){g=await api('getMeetingGroupDetail',{groupId});} const group=g.group||{}; APP.hkg.groupDraft={groupId:group.groupId||'',members:g.members||[]}; $('modal').classList.remove('hide'); $('modal').innerHTML=`<div class="modal-card"><div class="modal-h"><h3>${groupId?'Sửa':'Tạo'} nhóm dự họp</h3><button class="modal-close" onclick="closeModal()">✕</button></div><div class="modal-b"><div class="hkg-form-row"><label>Tên nhóm</label><input id="hkgGroupName" value="${esc(group.groupName||'')}"></div><div class="hkg-form-row"><label>Loại nhóm</label><select id="hkgGroupType"><option>Lãnh đạo</option><option>Phòng ban</option><option>Tổ công tác</option><option>Hội đồng</option><option>Khác</option></select></div><div class="hkg-form-row"><label>Mô tả</label><textarea id="hkgGroupDesc">${esc(group.description||'')}</textarea></div><div class="hkg-form-row"><label>Thêm thành viên</label><input id="hkgGroupUserSearch" placeholder="Gõ tên đăng nhập hoặc họ tên..." oninput="hkgSearchGroupUser(this.value)"><div id="hkgGroupUserSuggest"></div></div><div id="hkgGroupMembers">${hkgGroupMembersHtml()}</div><div class="toolbar" style="margin-top:15px"><button class="btn primary" onclick="saveHkgGroup()">Lưu nhóm</button><button class="btn ghost" onclick="closeModal()">Đóng</button></div></div></div>`; if(group.groupType)setTimeout(()=>$('hkgGroupType').value=group.groupType,0);}
function hkgGroupMembersHtml(){const arr=(APP.hkg.groupDraft&&APP.hkg.groupDraft.members)||[];return `<div>${arr.map(u=>`<span class="hkg-member-chip">${esc(u.fullname||u.username)} <button onclick="hkgRemoveGroupMember('${esc(u.username)}')">×</button></span>`).join('')||'<div class="empty">Chưa có thành viên.</div>'}</div>`;}
async function hkgSearchGroupUser(q){q=(q||'').trim(); if(q.length<2){$('hkgGroupUserSuggest').innerHTML='';return;} const res=await api('searchUsersForGroup',{keyword:q}); $('hkgGroupUserSuggest').innerHTML=(res.users||[]).slice(0,8).map(u=>`<div class="note-recipient-item" onclick='hkgAddGroupMember(${jss(u)})'><div class="note-recipient-main"><b>${esc(u.fullname)}</b><span>${esc(u.username)} · ${esc(u.donVi||'')}</span></div></div>`).join('');}
function hkgAddGroupMember(u){APP.hkg.groupDraft.members=APP.hkg.groupDraft.members||[]; if(!APP.hkg.groupDraft.members.some(x=>x.username===u.username))APP.hkg.groupDraft.members.push(u); $('hkgGroupMembers').innerHTML=hkgGroupMembersHtml(); $('hkgGroupUserSuggest').innerHTML=''; $('hkgGroupUserSearch').value='';}
function hkgRemoveGroupMember(username){APP.hkg.groupDraft.members=(APP.hkg.groupDraft.members||[]).filter(x=>x.username!==username); $('hkgGroupMembers').innerHTML=hkgGroupMembersHtml();}
async function saveHkgGroup(){const name=($('hkgGroupName')?.value||'').trim(); if(!name)return alert('Nhập tên nhóm.'); try{await api('saveMeetingGroup',{groupId:APP.hkg.groupDraft.groupId,groupName:name,groupType:$('hkgGroupType').value,description:$('hkgGroupDesc').value,members:APP.hkg.groupDraft.members||[]}); closeModal(); await renderHkgGroups();}catch(e){alert(e.message)}}
async function openHkgInviteModal(){const res=await api('getMeetingGroups',{}); APP.hkg.inviteDraft={groups:[],extras:[],excludes:[]}; $('modal').classList.remove('hide'); $('modal').innerHTML=`<div class="modal-card"><div class="modal-h"><h3>Chọn nhóm / gọi thêm / loại trừ</h3><button class="modal-close" onclick="closeModal()">✕</button></div><div class="modal-b"><div class="hkg-form-row"><label>Chọn nhóm</label><div>${(res.groups||[]).map(g=>`<label style="display:block;margin:6px 0"><input type="checkbox" value="${esc(g.groupId)}" onchange="hkgPreviewInvite()"> ${esc(g.groupName)} <span class="muted">(${esc(g.memberCount||0)} người)</span></label>`).join('')||'Chưa có nhóm.'}</div></div><div class="hkg-form-row"><label>Gọi thêm người</label><input id="hkgInviteSearch" placeholder="Gõ tên đăng nhập hoặc họ tên..." oninput="hkgSearchInviteUser(this.value)"><div id="hkgInviteSuggest"></div><div id="hkgInviteExtra"></div></div><div class="hkg-form-row"><label>Danh sách dự họp sau khi gộp</label><div id="hkgInvitePreview" class="hkg-mini-list"><div class="empty">Chọn nhóm để xem danh sách.</div></div></div><button class="btn primary" onclick="saveHkgInviteConfig()">Áp dụng vào thành phần dự họp</button></div></div>`;}
async function hkgPreviewInvite(){const groups=[...document.querySelectorAll('input[type="checkbox"]')].filter(x=>x.checked).map(x=>x.value); APP.hkg.inviteDraft.groups=groups; const res=await api('previewMeetingGroupMembers',{groupIds:groups,extras:APP.hkg.inviteDraft.extras||[],excludes:APP.hkg.inviteDraft.excludes||[]}); APP.hkg.inviteDraft.preview=res.members||[]; $('hkgInvitePreview').innerHTML=(res.members||[]).map(u=>`<div class="hkg-mini-item"><b>${esc(u.fullname||u.username)}</b><br><span class="muted">${esc(u.donVi||'')} · ${esc(u.sourceName||'')}</span> <button class="btn danger xs" onclick="hkgExcludeInvite('${esc(u.username)}')">Loại trừ</button></div>`).join('')||'<div class="empty">Chưa có thành viên.</div>';}
async function hkgSearchInviteUser(q){q=(q||'').trim(); if(q.length<2){$('hkgInviteSuggest').innerHTML='';return;} const res=await api('searchUsersForGroup',{keyword:q}); $('hkgInviteSuggest').innerHTML=(res.users||[]).slice(0,8).map(u=>`<div class="note-recipient-item" onclick='hkgAddInviteExtra(${jss(u)})'><div class="note-recipient-main"><b>${esc(u.fullname)}</b><span>${esc(u.username)} · ${esc(u.donVi||'')}</span></div></div>`).join('');}
function hkgAddInviteExtra(u){APP.hkg.inviteDraft.extras=APP.hkg.inviteDraft.extras||[]; if(!APP.hkg.inviteDraft.extras.some(x=>x.username===u.username))APP.hkg.inviteDraft.extras.push(u); $('hkgInviteExtra').innerHTML=(APP.hkg.inviteDraft.extras||[]).map(x=>`<span class="hkg-member-chip">${esc(x.fullname)}<button onclick="hkgRemoveInviteExtra('${esc(x.username)}')">×</button></span>`).join(''); $('hkgInviteSuggest').innerHTML=''; $('hkgInviteSearch').value=''; hkgPreviewInvite();}
function hkgRemoveInviteExtra(username){APP.hkg.inviteDraft.extras=(APP.hkg.inviteDraft.extras||[]).filter(x=>x.username!==username); hkgPreviewInvite();}
function hkgExcludeInvite(username){APP.hkg.inviteDraft.excludes=APP.hkg.inviteDraft.excludes||[]; if(!APP.hkg.inviteDraft.excludes.includes(username))APP.hkg.inviteDraft.excludes.push(username); hkgPreviewInvite();}
async function saveHkgInviteConfig(){try{await api('saveMeetingInviteConfig',{meetingId:APP.hkg.meetingId,groupIds:APP.hkg.inviteDraft.groups||[],extras:APP.hkg.inviteDraft.extras||[],excludes:APP.hkg.inviteDraft.excludes||[]}); closeModal(); await hkgReloadDetail('att');}catch(e){alert(e.message)}}

/* ============================================================
 * V98 - Hoàn thiện giao diện chi tiết Họp không giấy
 * Bổ sung: tổng quan hành động nhanh, tài liệu phân quyền, điểm danh thống kê,
 * biên bản editor/auto-save, kết luận/nhiệm vụ đầy đủ, lọc khối/trạng thái.
 * ============================================================ */
const HKG_V98_VERSION = 'hkg_v98_detail_ui';
function hkgMeetingBlock(m){
  const raw = (m && (m.meetingBlock || m.MEETING_BLOCK || m.hkgBlock || m.khoi || m.loaiKhoi)) || '';
  const s = String(raw || '').trim();
  if (s) return s;
  const txt = normalizeText([(m&&m.noiDung),(m&&m.donViChuanBi),(m&&m.ghiChu)].join(' '));
  if (/chi bo|dang uy|dang vien|cap uy|dang/.test(txt)) return 'Đảng';
  if (/giao ban|nghiep vu|chuyen de|kiem tra|kiem soat|thu ngan sach|xnk/.test(txt)) return 'Chuyên môn';
  if (/hanh chinh|van phong|noi vu|thi dua|khen thuong|tai vu|quan tri/.test(txt)) return 'Hành chính';
  if (/to cong tac|hoi dong|ban chi dao|ban |nhom/.test(txt)) return 'Ban / Nhóm';
  return 'Chuyên môn';
}
function hkgStatusLabel(s){
  const m={
    DRAFT:'Dự thảo', PLANNED:'Lên kế hoạch', NOTIFIED:'Đã thông báo', ONGOING:'Đang diễn ra',
    WAITING_DOSSIER:'Chờ hoàn thiện hồ sơ', COMPLETED:'Hoàn thành', CANCELLED:'Hủy',
    DONE:'Hoàn thành', WAIT_DOCS:'Chờ tài liệu', WAIT_ATTEND:'Chờ điểm danh', WAIT_ATTENDANCE:'Chờ điểm danh',
    WAIT_MINUTES:'Chờ biên bản', WAIT_CONCLUSION:'Chờ kết luận', OVERDUE:'Quá hạn'
  };
  return m[s]||s||'Đang xử lý';
}
function hkgStatusClass(s){
  s=String(s||'').toUpperCase();
  if(['DONE','COMPLETED'].includes(s)) return 'done';
  if(['CANCELLED','HUY','OVERDUE'].includes(s)) return 'late';
  if(['ONGOING','NOTIFIED'].includes(s)) return 'run';
  return 'wait';
}
function hkgDossierStatus(r){
  const files=(r.files||[]).length;
  const att=hkgAttendanceStats(r.attendance||[]);
  const hasMinutes=!!(r.minutes && (r.minutes.contentText || r.minutes.contentHtml || r.minutes.title));
  const cons=(r.conclusions||[]).length;
  if(!files) return 'WAIT_DOCS';
  if(att.total && att.unchecked>0) return 'WAIT_ATTENDANCE';
  if(!hasMinutes) return 'WAIT_MINUTES';
  if(!cons) return 'WAIT_CONCLUSION';
  return 'DONE';
}
function hkgAttendanceStats(arr){
  arr=arr||[];
  const norm=x=>String(x||'').toLowerCase();
  const st={total:arr.length,present:0,late:0,excused:0,absent:0,substitute:0,unchecked:0};
  arr.forEach(a=>{
    const s=norm(a.status || a.attendStatus || a.ATTEND_STATUS);
    if(s.includes('có mặt')||s.includes('co mat')) st.present++;
    else if(s.includes('muộn')||s.includes('muon')) st.late++;
    else if(s.includes('có lý do')||s.includes('co ly do')||s.includes('vắng phép')||s.includes('vang phep')) st.excused++;
    else if(s.includes('không lý do')||s.includes('khong ly do')||s.includes('không phép')||s.includes('khong phep')) st.absent++;
    else if(s.includes('dự thay')||s.includes('du thay')) st.substitute++;
    else st.unchecked++;
  });
  return st;
}
function hkgVisibilityLabel(v){
  v=String(v||'PUBLIC').toUpperCase();
  if(v==='LEADER_CHICUC') return 'Chỉ lãnh đạo Chi cục';
  if(v==='LEADER_PHONGDOI_UP') return 'LĐ Phòng/Đội trở lên';
  if(v==='PARTICIPANT') return 'Chỉ thành phần dự họp';
  if(v==='SECRETARY_CHAIR') return 'Chỉ Chủ trì/Thư ký';
  return 'Công khai';
}
function hkgFileType(f){
  const name=String(f.fileName||f.name||'').toLowerCase();
  const mime=String(f.mimeType||'').toLowerCase();
  if(name.endsWith('.pdf')||mime.includes('pdf')) return 'PDF';
  if(/\.docx?$/.test(name)||mime.includes('document')) return 'DOCX';
  if(/\.xlsx?$/.test(name)||mime.includes('spreadsheet')) return 'XLSX';
  if(/\.pptx?$/.test(name)||mime.includes('presentation')) return 'PPTX';
  if(/\.(jpg|jpeg|png|gif|webp)$/.test(name)||mime.includes('image')) return 'Ảnh';
  return (f.fileType||f.type||'Tài liệu');
}
function hkgFormatSize(bytes){
  const n=Number(bytes||0); if(!n) return '';
  if(n<1024) return n+' B';
  if(n<1024*1024) return (n/1024).toFixed(1)+' KB';
  return (n/1024/1024).toFixed(1)+' MB';
}
function hkgStat(label,val,ico){return `<div class="hkg-stat"><div class="hkg-stat-ico">${ico||'•'}</div><b>${esc(val)}</b><span>${esc(label)}</span></div>`;}

async function renderHkgList(){
  const box=$('screen-hkg'); if(!box) return;
  box.innerHTML='<div class="loading"><div class="spin"></div><span>Đang tải module Họp không giấy...</span></div>';
  try{
    const res=await api('getHkgMeetings',{showPast:true,limit:300});
    APP.hkg.dashboard=res.dashboard||{}; APP.hkg.meetings=res.meetings||[]; APP.hkg.loaded=true; APP.hkg.view='list';
    const d=APP.hkg.dashboard;
    box.innerHTML=`<div class="hkg-shell hkg-v98">
      <div class="hkg-hero">
        <div><h2>📋 Họp không giấy</h2><p>Hồ sơ họp điện tử: tài liệu, thành phần, điểm danh, ý kiến, biểu quyết, biên bản và kết luận.</p></div>
        <div class="hkg-toolbar"><button class="btn primary sm" onclick="openHkgCreateMeetingModal()">＋ Tạo cuộc họp</button><button class="btn ghost sm" onclick="renderHkgGroups()">👥 Nhóm thành phần</button><button class="btn sm" onclick="hkgReload()">↻ Tải lại</button></div>
      </div>
      <div class="hkg-stat-grid">
        ${hkgStat('Tổng hồ sơ',d.total||0,'📂')}${hkgStat('Chờ tài liệu',d.waitingDocs||0,'📎')}${hkgStat('Chờ điểm danh',d.waitingAttendance||0,'✅')}${hkgStat('Chờ biên bản',d.waitingMinutes||0,'📝')}${hkgStat('Chờ kết luận',d.waitingConclusion||0,'📌')}${hkgStat('Hoàn thành',d.completed||0,'🏁')}
      </div>
      <div class="panel"><div class="panel-h"><h3>Danh sách hồ sơ họp</h3></div><div class="panel-b">
        <div class="hkg-toolbar hkg-list-filters"><input id="hkgKw" placeholder="Tìm mã lịch, nội dung, chủ trì..." oninput="hkgFilterList()"><select id="hkgFilterBlock" onchange="hkgFilterList()"><option value="all">Mọi khối</option><option>Đảng</option><option>Chuyên môn</option><option>Hành chính</option><option>Ban / Nhóm</option><option>Khác</option></select><select id="hkgFilterStatus" onchange="hkgFilterList()"><option value="all">Tất cả trạng thái</option><option value="WAIT_DOCS">Chờ tài liệu</option><option value="WAIT_ATTEND">Chờ điểm danh</option><option value="WAIT_MINUTES">Chờ biên bản</option><option value="WAIT_CONCLUSION">Chờ kết luận</option><option value="DONE">Hoàn thành</option></select></div>
        <div id="hkgMeetingList">${hkgMeetingListHtml(APP.hkg.meetings)}</div>
      </div></div>
    </div>`;
  }catch(e){box.innerHTML=`<div class="msg err">${esc(e.message)}</div>`;}
}
function hkgMeetingListHtml(arr){
  if(!arr||!arr.length)return '<div class="empty"><b>Chưa có hồ sơ Họp không giấy.</b><br>Chỉ những lịch đã tạo/liên kết hồ sơ mới hiển thị tại đây. Có thể tạo trực tiếp bằng nút <b>＋ Tạo cuộc họp</b> hoặc vào Lịch công tác bấm <b>📋 Hồ sơ họp</b>.</div>';
  return `<div class="table-wrap hkg-table-mobile"><table class="tbl hkg-list-table"><thead><tr><th>Mã</th><th>Ngày họp</th><th>Nội dung</th><th>Khối</th><th>Chủ trì</th><th>TP</th><th>TL</th><th>ĐD</th><th>BB</th><th>KL</th><th>Trạng thái</th><th></th></tr></thead><tbody>${arr.map(x=>`<tr>
    <td data-label="Mã"><b class="mono">${esc(x.meetingId)}</b></td><td data-label="Ngày">${esc(dateVNShort(x.ngayHienThi||x.ngayBatDau))}<br><span class="muted">${esc(timeRange(x))}</span></td><td data-label="Nội dung"><b>${esc(x.noiDung)}</b><br><span class="muted">${esc(x.diaDiem||'')}</span></td><td data-label="Khối"><span class="hkg-chip">${esc(hkgMeetingBlock(x))}</span></td><td data-label="Chủ trì">${esc(x.chuTri||'')}</td><td data-label="TP">${esc(x.participantCount||0)}</td><td data-label="TL">${esc(x.fileCount||0)}</td><td data-label="ĐD">${esc(x.attendanceDone||0)}/${esc(x.participantCount||0)}</td><td data-label="BB">${x.hasMinutes?'Có':'Chưa'}</td><td data-label="KL">${esc(x.conclusionCount||0)}</td><td data-label="Trạng thái"><span class="hkg-status ${hkgStatusClass(x.hkgStatus)}">${esc(hkgStatusLabel(x.hkgStatus))}</span></td><td data-label="Thao tác"><button class="btn primary xs" onclick="openHkgDetail('${esc(x.meetingId)}')">Mở hồ sơ</button></td>
  </tr>`).join('')}</tbody></table></div>`;
}
function hkgFilterList(){
  const kw=normalizeText(($('hkgKw')?.value||'')); const st=$('hkgFilterStatus')?.value||'all'; const block=$('hkgFilterBlock')?.value||'all';
  let arr=(APP.hkg.meetings||[]).filter(x=>(st==='all'||x.hkgStatus===st));
  if(block!=='all') arr=arr.filter(x=>hkgMeetingBlock(x)===block);
  if(kw)arr=arr.filter(x=>normalizeText([x.meetingId,x.noiDung,x.chuTri,x.diaDiem,hkgMeetingBlock(x)].join(' ')).includes(kw));
  const el=$('hkgMeetingList'); if(el) el.innerHTML=hkgMeetingListHtml(arr);
}

async function renderHkgDetail(){
  const box=$('screen-hkg'); if(!box) return; const id=APP.hkg.meetingId; if(!id){APP.hkg.view='list';return renderHkgList();}
  box.innerHTML='<div class="loading"><div class="spin"></div><span>Đang tải hồ sơ họp...</span></div>';
  try{
    const res=await api('getHkgDetail',{meetingId:id,autoCreate:true}); APP.hkg.detail=res; const m=res.meeting||{}; const st=hkgAttendanceStats(res.attendance||[]);
    const dossier=hkgDossierStatus(res);
    box.innerHTML=`<div class="hkg-shell hkg-v98">
      <div class="hkg-detail-head v98">
        <div class="hkg-detail-main"><div><button class="hkg-back" onclick="APP.hkg.view='list';renderHkgList()">← Danh sách</button><div class="hkg-detail-title">${esc(m.noiDung||'Hồ sơ họp')}</div><div class="hkg-detail-meta"><span><b>${esc(m.meetingId)}</b></span><span>Ngày: ${esc(dateVNShort(m.ngayHienThi||m.ngayBatDau))}</span><span>Giờ: ${esc(timeRange(m))}</span><span>Khối: ${esc(hkgMeetingBlock(m))}</span><span class="hkg-status ${hkgStatusClass(dossier)}">${esc(hkgStatusLabel(dossier))}</span></div></div><div class="hkg-toolbar"><button class="btn sm" onclick="openDetail('${esc(id)}')">👁 Lịch gốc</button><button class="btn sm" onclick="hkgReloadDetail(APP.hkg.tab)">↻ Tải lại</button></div></div>
        <div class="hkg-detail-kpis"><div><b>${st.total}</b><span>Thành phần</span></div><div><b>${(res.files||[]).length}</b><span>Tài liệu</span></div><div><b>${st.present+st.late+st.substitute}</b><span>Đã điểm danh</span></div><div><b>${(res.conclusions||[]).length}</b><span>Kết luận</span></div></div>
      </div>
      <div class="hkg-tabs">${['info|Tổng quan','docs|Tài liệu','att|Điểm danh','op|Ý kiến','vote|Biểu quyết','min|Biên bản','con|Kết luận','his|Lịch sử'].map(s=>{const [k,l]=s.split('|');return `<button class="hkg-tab ${APP.hkg.tab===k?'active':''}" onclick="hkgSetTab('${k}')">${l}</button>`}).join('')}</div>
      <div id="hkgTabBody">${hkgTabHtml()}</div>
    </div>`; hkgMaybeStartVoteTimer();
  }catch(e){box.innerHTML=`<div class="msg err">${esc(e.message)}</div>`;}
}
function hkgSetTab(t){APP.hkg.tab=t; const b=$('hkgTabBody'); if(b)b.innerHTML=hkgTabHtml(); document.querySelectorAll('.hkg-tab').forEach(x=>{x.classList.toggle('active', x.getAttribute('onclick')&&x.getAttribute('onclick').includes("'"+t+"'"));}); hkgMaybeStartVoteTimer(); if(t==='min') hkgInitMinutesAutosave();}
function hkgTabHtml(){const r=APP.hkg.detail||{}, m=r.meeting||{}; const t=APP.hkg.tab||'info';
  if(t==='info')return hkgOverviewHtml(r);
  if(t==='docs')return hkgDocsHtml(r);
  if(t==='att')return hkgAttendanceHtml(r);
  if(t==='op')return hkgOpinionHtml(r);
  if(t==='vote')return hkgVoteHtml(r);
  if(t==='min')return hkgMinutesHtml(r);
  if(t==='con')return hkgConclusionHtml(r);
  if(t==='his')return hkgHistoryHtml(r);
  return '';
}
function hkgOverviewHtml(r){const m=r.meeting||{}; const st=hkgAttendanceStats(r.attendance||[]); return `<div class="hkg-grid2">
  <div class="hkg-card hkg-overview-card"><h4>Thông tin cuộc họp</h4>${hkgInfoRow('Mã lịch',m.meetingId)}${hkgInfoRow('Nội dung',m.noiDung)}${hkgInfoRow('Thời gian',dateVNShort(m.ngayHienThi||m.ngayBatDau)+' · '+timeRange(m))}${hkgInfoRow('Địa điểm',m.diaDiem)}${hkgInfoRow('Khối họp',hkgMeetingBlock(m))}${hkgInfoRow('Chủ trì',m.chuTri)}${hkgInfoRow('Thành phần',m.thanhPhan)}</div>
  <div class="hkg-card"><h4>Hành động nhanh</h4><div class="hkg-action-grid"><button class="btn ok" onclick="hkgConfirmMyAttendance()">✅ Xác nhận tham dự</button><button class="btn primary" onclick="hkgSendInvitation()">📨 Gửi giấy mời</button><button class="btn" onclick="openHkgInviteModal()">👥 Sửa thành phần</button><button class="btn danger" onclick="hkgCancelMeeting()">✕ Hủy cuộc họp</button></div><div class="hkg-summary-line"><b>${st.total}</b> thành phần · <b>${st.present+st.late+st.substitute}</b> đã điểm danh · <b>${(r.files||[]).length}</b> tài liệu · <b>${(r.conclusions||[]).length}</b> kết luận</div></div>
  <div class="hkg-card hkg-span2"><h4>Tình trạng hồ sơ</h4><div class="hkg-progress-grid">${hkgStep('Tài liệu',(r.files||[]).length>0)}${hkgStep('Điểm danh',st.total>0&&st.unchecked===0)}${hkgStep('Biên bản',!!(r.minutes&&(r.minutes.contentText||r.minutes.title)))}${hkgStep('Kết luận',(r.conclusions||[]).length>0)}</div></div>
</div>`;}
function hkgStep(label,done){return `<div class="hkg-step ${done?'done':'wait'}"><span>${done?'✓':'…'}</span><b>${esc(label)}</b><em>${done?'Đã có':'Chưa hoàn tất'}</em></div>`;}
function hkgInfoRow(k,v){return `<div class="hkg-info-row"><span>${esc(k)}</span><b>${esc(v||'—')}</b></div>`;}
function hkgDocsHtml(r){const m=r.meeting||{}; const files=r.files||[];return `<div class="hkg-card"><div class="hkg-card-head"><h4>Tài liệu cuộc họp</h4><div class="hkg-toolbar"><button class="btn primary sm" onclick="openDetail('${esc(m.meetingId)}')">⬆ Upload tài liệu</button></div></div>${files.length?`<div class="table-wrap hkg-table-mobile"><table class="tbl"><thead><tr><th>Tên file</th><th>Loại</th><th>Kích thước</th><th>Phân quyền</th><th>Hành động</th></tr></thead><tbody>${files.map(f=>{const url=f.fileUrl||f.url||'#';return `<tr><td data-label="Tên file"><b>${esc(f.fileName||f.name||'Tài liệu')}</b><br><span class="muted">${esc(f.note||f.uploadedAt||'')}</span></td><td data-label="Loại">${esc(hkgFileType(f))}</td><td data-label="Kích thước">${esc(hkgFormatSize(f.sizeBytes))}</td><td data-label="Phân quyền"><span class="hkg-perm">${esc(hkgVisibilityLabel(f.fileVisibility||f.FILE_VISIBILITY||f.accessLevel))}</span></td><td data-label="Hành động"><a class="btn xs primary" target="_blank" href="${esc(url)}">👁 Xem</a> <a class="btn xs" target="_blank" href="${esc(url)}">⬇ Tải</a></td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Chưa có tài liệu họp. Tài liệu có thể upload tại lịch gốc; tài liệu phân quyền sẽ chỉ hiển thị với người có quyền.</div>'}</div>`;}
function hkgAttendanceHtml(r){const arr=r.attendance||[]; const st=hkgAttendanceStats(arr);return `<div class="hkg-card"><div class="hkg-card-head"><div><h4>Điểm danh</h4><p class="muted">Điểm danh bằng tích/bấm nút trực tiếp trên phần mềm. Có thể chọn nhóm/gọi thêm/loại trừ thành viên.</p></div><div class="hkg-toolbar"><button class="btn sm" onclick="hkgQrTodo()">▦ Sinh QR điểm danh</button><button class="btn sm" onclick="openHkgInviteModal()">👥 Sửa thành phần</button></div></div><div class="hkg-att-grid">${hkgAttBox('Tổng',st.total,'')}${hkgAttBox('Có mặt',st.present,'ok')}${hkgAttBox('Đến muộn',st.late,'warn')}${hkgAttBox('Vắng phép',st.excused,'info')}${hkgAttBox('Vắng KP',st.absent,'danger')}${hkgAttBox('Chưa ĐD',st.unchecked,'muted')}</div>${arr.length?`<div class="table-wrap hkg-table-mobile"><table class="tbl"><thead><tr><th>Họ tên</th><th>Đơn vị</th><th>Nguồn</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>${arr.map(a=>`<tr><td data-label="Họ tên"><b>${esc(a.fullname||a.username)}</b><br><span class="muted mono">${esc(a.username||'')}</span></td><td data-label="Đơn vị">${esc(a.donVi||'')}</td><td data-label="Nguồn">${esc(a.sourceName||a.roleInMeeting||'')}</td><td data-label="Trạng thái"><select onchange="saveHkgAttendance('${esc(a.username)}',this.value)">${['Chưa xác nhận','Có mặt','Đến muộn','Vắng có lý do','Vắng không lý do','Dự thay'].map(s=>`<option ${a.status===s?'selected':''}>${s}</option>`).join('')}</select></td><td data-label="Ghi chú"><input value="${esc(a.note||'')}" onchange="saveHkgAttendance('${esc(a.username)}',null,this.value)" placeholder="Ghi chú"></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Chưa có thành phần. Hãy bấm <b>Sửa thành phần</b> để chọn nhóm/gọi thêm người dự họp.</div>'}</div>`;}
function hkgAttBox(label,val,cls){return `<div class="hkg-att-box ${cls||''}"><b>${esc(val)}</b><span>${esc(label)}</span></div>`;}
function hkgOpinionHtml(r){return `<div class="hkg-grid2"><div class="hkg-card"><h4>Gửi ý kiến</h4><div class="hkg-form-row"><label>Loại ý kiến</label><select id="hkgOpType"><option>Trước họp</option><option>Trong họp</option><option>Sau họp</option></select></div><div class="hkg-form-row"><label>Nội dung</label><textarea id="hkgOpContent" placeholder="Nhập ý kiến, đề xuất, nội dung cần đưa vào biên bản..."></textarea></div><button class="btn primary" onclick="saveHkgOpinion()">📨 Gửi ý kiến</button></div><div class="hkg-card"><h4>Danh sách ý kiến</h4>${(r.opinions||[]).length?`<div class="hkg-mini-list">${r.opinions.map(o=>`<div class="hkg-mini-item"><b>${esc(o.fullname||o.username)}</b> · <span class="muted">${esc(o.opinionType)} · ${esc(o.createdAt)}</span><br>${esc(o.content)}</div>`).join('')}</div>`:'<div class="empty">Chưa có ý kiến.</div>'}</div></div>`;}
function hkgMinutesHtml(r){const min=r.minutes||{}; const content=min.contentText||hkgMinutesTemplate(r); setTimeout(hkgInitMinutesAutosave,50); return `<div class="hkg-card"><div class="hkg-card-head"><div><h4>Biên bản cuộc họp <span class="hkg-status ${min.status==='Đã duyệt'?'done':'wait'}">${esc(min.status||'Đang soạn')}</span></h4><p class="muted">Auto-save mỗi 30 giây khi có thay đổi. Có thể tự tổng hợp dữ liệu họp trước khi chỉnh sửa.</p></div><div class="hkg-toolbar"><button class="btn sm" onclick="saveHkgMinutes()">💾 Lưu</button><button class="btn primary sm" onclick="hkgSubmitMinutes()">✈ Trình duyệt</button><button class="btn sm" onclick="exportHkgMinutes('docx')">DOCX</button><button class="btn sm" onclick="exportHkgMinutes('pdf')">PDF</button></div></div><div class="hkg-form-row"><label>Tiêu đề</label><input id="hkgMinTitle" value="${esc(min.title||('Biên bản '+(r.meeting?.meetingId||'')))}"></div><div class="hkg-editor-toolbar"><button onclick="hkgInsertMin('**','**')">B</button><button onclick="hkgInsertMin('*','*')">I</button><button onclick="hkgInsertLine('## ')">H2</button><button onclick="hkgInsertLine('### ')">H3</button><button onclick="hkgInsertLine('- ')">•</button><button onclick="autoFillHkgMinutes()">Tự tổng hợp</button><span id="hkgAutoSaveNote" class="muted">Chưa lưu thay đổi mới</span></div><textarea id="hkgMinContent" class="hkg-minutes-text" oninput="hkgScheduleMinutesAutosave()">${esc(content)}</textarea><div class="hkg-toolbar" style="margin-top:10px">${min.pdfFileUrl?`<a class="btn xs primary" target="_blank" href="${esc(min.pdfFileUrl)}">Mở PDF</a>`:''}${min.docxFileUrl?`<a class="btn xs" target="_blank" href="${esc(min.docxFileUrl)}">Mở Word</a>`:''}</div></div>`;}
function hkgConclusionHtml(r){return `<div class="hkg-grid2"><div class="hkg-card"><h4>Thêm kết luận / nhiệm vụ</h4><div class="hkg-form-row"><label>Nội dung nhiệm vụ</label><textarea id="hkgConContent" placeholder="Nhập nội dung nhiệm vụ/kết luận..."></textarea></div><div class="hkg-form-row"><label>Người phụ trách</label><input id="hkgConAssignee" placeholder="Tên hoặc mã CBCC phụ trách"></div><div class="hkg-grid2-inner"><div class="hkg-form-row"><label>Hạn hoàn thành</label><input id="hkgConDue" type="date"></div><div class="hkg-form-row"><label>Mức ưu tiên</label><select id="hkgConPriority"><option>Trung bình</option><option>Cao</option><option>Rất cao</option><option>Thấp</option></select></div></div><button class="btn primary" onclick="saveHkgConclusion()">＋ Tạo nhiệm vụ</button></div><div class="hkg-card"><h4>Danh sách kết luận / nhiệm vụ</h4>${(r.conclusions||[]).length?`<div class="hkg-mini-list">${r.conclusions.map(c=>`<div class="hkg-mini-item hkg-task"><b>${esc(c.content)}</b><br><span class="muted">Phụ trách: ${esc(c.assigneeFullname||c.assigneeUsername||'')} · Hạn: ${esc(c.dueDate||'')} · Ưu tiên: ${esc(c.priority||'Trung bình')}</span><br><span class="hkg-status ${c.status==='Hoàn thành'?'done':'wait'}">${esc(c.status||'Chưa thực hiện')}</span><div class="hkg-toolbar" style="margin-top:7px"><button class="btn xs" onclick="updateHkgConclusion('${esc(c.conclusionId)}','Đang thực hiện')">Đang làm</button><button class="btn xs ok" onclick="updateHkgConclusion('${esc(c.conclusionId)}','Hoàn thành')">Hoàn thành</button><button class="btn xs danger" onclick="updateHkgConclusion('${esc(c.conclusionId)}','Tạm dừng')">Tạm dừng</button></div></div>`).join('')}</div>`:'<div class="empty">Chưa có kết luận/nhiệm vụ.</div>'}</div></div>`;}
function hkgHistoryHtml(r){return `<div class="hkg-card"><h4>Lịch sử xử lý</h4>${(r.history||[]).length?`<div class="hkg-mini-list">${r.history.map(h=>`<div class="hkg-mini-item"><b>${esc(h.action)}</b> · <span class="muted">${esc(h.createdAt)}</span><br>${esc(h.fullname||h.username||'')} ${h.newValue?`<br><span>${esc(h.newValue)}</span>`:''}</div>`).join('')}</div>`:'<div class="empty">Chưa có lịch sử.</div>'}</div>`;}
function hkgConfirmMyAttendance(){const u=(APP.user&&APP.user.username)||''; if(!u) return alert('Không xác định được tài khoản đăng nhập.'); saveHkgAttendance(u,'Có mặt'); setTimeout(()=>hkgReloadDetail('att'),400);}
function hkgSendInvitation(){alert('Đã bổ sung nút gửi giấy mời vào quy trình. Bản hiện tại ghi nhận ở giao diện; nếu cần gửi thông báo nội bộ/email, sẽ nối API gửi thông báo ở bản tiếp theo.');}
async function hkgCancelMeeting(){const reason=prompt('Nhập lý do hủy cuộc họp:'); if(reason===null) return; if(!reason.trim()) return alert('Cần nhập lý do hủy.'); try{await api('cancelMeeting',{meetingId:APP.hkg.meetingId,reason}); alert('Đã hủy cuộc họp.'); APP.hkg.loaded=false; APP.hkg.view='list'; await renderHkgList();}catch(e){alert(e.message||'Không hủy được cuộc họp.');}}
function hkgQrTodo(){alert('Đã đưa QR điểm danh vào khung giao diện. Bản này vẫn ưu tiên điểm danh bằng nút/tích chọn; QR sẽ nối API ở bước sau nếu cần.');}
function hkgSubmitMinutes(){alert('Đã ghi nhận thao tác Trình duyệt. Bản hiện tại lưu biên bản trước; luồng duyệt chính thức sẽ nối quyền Chủ trì/Thư ký ở bước sau.'); saveHkgMinutes(true);}
function hkgInsertMin(before,after){const t=$('hkgMinContent'); if(!t)return; const s=t.selectionStart,e=t.selectionEnd,val=t.value; t.value=val.slice(0,s)+before+val.slice(s,e)+(after||'')+val.slice(e); t.focus(); t.selectionStart=s+before.length; t.selectionEnd=e+before.length; hkgScheduleMinutesAutosave();}
function hkgInsertLine(prefix){const t=$('hkgMinContent'); if(!t)return; const s=t.selectionStart,val=t.value; const start=val.lastIndexOf('\n',Math.max(0,s-1))+1; t.value=val.slice(0,start)+prefix+val.slice(start); t.focus(); t.selectionStart=t.selectionEnd=s+prefix.length; hkgScheduleMinutesAutosave();}
function hkgInitMinutesAutosave(){const t=$('hkgMinContent'); if(t && !t.dataset.autosave){t.dataset.autosave='1';}}
function hkgScheduleMinutesAutosave(){const note=$('hkgAutoSaveNote'); if(note) note.textContent='Đang chờ auto-save...'; if(APP.hkg.minSaveTimer) clearTimeout(APP.hkg.minSaveTimer); APP.hkg.minSaveTimer=setTimeout(()=>saveHkgMinutes(true),30000);}
async function saveHkgMinutes(silent){try{await api('saveHkgMinutes',{meetingId:APP.hkg.meetingId,title:($('hkgMinTitle')||{}).value||'',contentText:($('hkgMinContent')||{}).value||''}); const note=$('hkgAutoSaveNote'); if(note) note.textContent='Đã lưu lúc '+new Date().toLocaleTimeString('vi-VN'); if(!silent) await hkgReloadDetail('min');}catch(e){if(!silent)alert(e.message); else {const note=$('hkgAutoSaveNote'); if(note)note.textContent='Auto-save lỗi: '+(e.message||'');}}}
async function saveHkgConclusion(){const content=($('hkgConContent')?.value||'').trim(); if(!content)return alert('Nhập nội dung kết luận/nhiệm vụ.'); try{await api('saveHkgConclusion',{meetingId:APP.hkg.meetingId,content,assigneeFullname:$('hkgConAssignee').value,dueDate:$('hkgConDue').value,priority:($('hkgConPriority')?.value||'Trung bình')}); await hkgReloadDetail('con');}catch(e){alert(e.message)}}
