/* Reference-led meeting notice formatting. Local prototype, no model call. */
(()=>{
  const isNotice=p=>['通知','会议方案'].includes(p['材料类型']||'通知');
  const value=(p,k)=>String(p[k]||'').trim();
  const text=s=>esc(String(s)).replace(/\n/g,'<br>');
  const pending=k=>`<span class="notice-pending">【待确认：${k}】</span>`;
  const fact=(p,k)=>value(p,k)?text(value(p,k)):pending(k);
  const lines=(p,k)=>value(p,k)?value(p,k).split(/\n+/).filter(Boolean).map((s,i)=>`<p>${i+1}. ${text(s.replace(/^\s*\d+[.．、]\s*/,''))}</p>`).join(''):`<p>${pending(k)}</p>`;
  window.buildOfficeNotice=(p={},handoff=null)=>{
    const plan=p['材料类型']==='会议方案',meeting=plan||p['通知场景']!=='工作通知';
    const subject=value(p,'事由 / 主题')||'【待确认：主题】';
    const meetingSubject=subject.replace(/(?:会议方案|会议通知|会议)$/,'');
    const title=plan?`${meetingSubject}会议方案`:meeting?`关于召开${meetingSubject}会议的通知`:`关于${subject}的通知`;
    let html=`<article class="notice-doc" data-notice-kind="${plan?'plan':meeting?'meeting':'work'}"><div class="ti">${text(title)}</div>`;
    if(value(p,'发文字号'))html+=`<p class="notice-number">${text(p['发文字号'])}</p>`;
    if(!plan)html+=`<p class="notice-recipient">${fact(p,'主送 / 汇报对象').replace(/[：:]$/,'')}：</p><p>${meeting?'现将会议有关事项通知如下。':'现将有关工作事项通知如下。'}</p>`;
    if(meeting){
      html+=`<p><strong>一、时间：</strong>${fact(p,'会议时间')}</p><p><strong>二、地点：</strong>${fact(p,'会议地点')}</p><h5>三、参会范围</h5>`;
      if(value(p,'参会领导'))html+=`<p>（一）参会领导：${text(p['参会领导'])}</p><p>（二）参会单位和人员：${fact(p,'参会范围')}</p>`;
      else html+=`<p>${fact(p,'参会范围')}</p>`;
      html+=`<h5>四、会议议程</h5>${lines(p,'会议议程')}<h5>五、相关要求</h5>${lines(p,'相关要求')}`;
    }else html+=`<h5>一、通知事项</h5>${lines(p,'通知事项')}<h5>二、办理安排</h5>${lines(p,'办理安排')}<h5>三、相关要求</h5>${lines(p,'相关要求')}`;
    if(value(p,'附件'))html+=`<p>附件：${text(p['附件'])}</p>`;
    html+=`<div class="sign"><p>${fact(p,'发文单位')}</p><p>${fact(p,'成文日期')}</p></div>`;
    if(handoff)html+=`<aside class="notice-reference" contenteditable="false"><p>参考素材（非正式正文，请核验后使用）：${text(handoff.answer||'')}</p><p>来源：${text((handoff.sources||[]).map(s=>s.t).join('、')||'未提供')}</p></aside>`;
    return {title,html:html+'</article>'};
  };
  const baseBuild=buildDraft;
  buildDraft=(a,p,h)=>a.id==='zw'&&isNotice(p)?buildOfficeNotice(p,h):baseBuild(a,p,h);
  AFORM.zw.f[0][2]='通知|会议方案|请示|报告|工作总结|情况汇报|讲话稿|主持词';
  AFORM.zw.f[1][2]='各相关单位、各部门';
  AFORM.zw.f[2][2]='智能体赋能高效办公';
  AFORM.zw.f[3][2]='简短（500 字以内）|中等（800—1200 字）|详细（1500 字以上）';
  AFORM.zw.f[4][2]='表述简明，按实际安排填写，不补写未经确认的事实';
  const field=(k,area=false,hint='')=>`<div class="fld"><label for="nf-${k}">${k}</label>${area?`<textarea class="ta" id="nf-${k}" data-notice-field="${k}" rows="3" placeholder="${hint}"></textarea>`:`<input class="inp" id="nf-${k}" data-notice-field="${k}" placeholder="${hint}">`}</div>`;
  const baseForm=ROUTES['assist-form'].html;
  ROUTES['assist-form'].html=c=>{
    const html=baseForm(c);if(c.a.id!=='zw')return html;
    const host=document.createElement('div');host.innerHTML=html;
    host.querySelector('#af2').rows=2;host.querySelector('#af4').rows=2;
    const extra=document.createElement('section');extra.className='notice-fields';extra.id='noticeFields';
    extra.innerHTML=`<p class="notice-help">参考真实会议文件的简式结构，不默认添加红头或文号。以下事实可先留空，初稿会明确标为“待确认”。</p>
      <div class="fld" id="noticeSceneField"><label for="nf-通知场景">通知场景</label><select class="sel" id="nf-通知场景" data-notice-field="通知场景"><option>会议通知</option><option>工作通知</option></select></div>
      <div id="noticeMeeting"><div class="notice-grid">${field('会议时间',false,'填写日期、星期及开始时间')}${field('会议地点',false,'填写具体会场')}</div>${field('参会范围',true,'填写参会单位及岗位范围，不默认套用人员')}${field('会议议程',true,'每行一项，按会议先后顺序填写')}</div>
      <div id="noticeWork" hidden>${field('通知事项',true,'填写本次通知的具体事项')}${field('办理安排',true,'填写责任分工、办理时间和报送方式')}</div>
      ${field('相关要求',true,'每行一项；按实际需要填写参会、纪律或保障要求')}
      <div class="notice-grid">${field('发文单位',false,'正式署名单位')}${field('成文日期',false,'填写实际签发日期')}</div>
      <details><summary>补充信息（选填）</summary><div id="noticeLeaders">${field('参会领导',false,'仅填写已经确认的人员')}</div>${field('发文字号',false,'没有正式文号时留空')}${field('附件',true,'有附件时填写名称；没有则留空')}</details>
      <p class="notice-help">可先生成文稿，再直接编辑全文。</p>`;
    const kb=host.querySelector('#kbSwitch').closest('.fld');kb.before(extra);kb.dataset.noticeKb='true';
    return host.innerHTML;
  };
  function sync(){
    const f=$('#noticeFields');if(!f)return;
    const type=$('#af0').value,on=isNotice({'材料类型':type}),meeting=type==='会议方案'||$('#nf-通知场景').value==='会议通知';
    f.hidden=!on;$('#noticeMeeting').hidden=!meeting;$('#noticeWork').hidden=meeting;$('#noticeLeaders').hidden=!meeting;$('#noticeSceneField').hidden=type==='会议方案';
    $('#af3').closest('.fld').hidden=on;$('#af4').closest('.fld').hidden=on;
    $('#af1').closest('.fld').hidden=on&&type==='会议方案';
    document.querySelector('[data-notice-kb]').hidden=on;
  }
  const baseRestore=restoreForm;
  restoreForm=()=>{baseRestore();sync();};
  document.addEventListener('change',e=>{if(e.target.id==='af0'||e.target.id==='nf-通知场景')sync();});
  const baseStart=startAssistant;
  startAssistant=skip=>{
    if(ctx.a?.id!=='zw'||!isNotice({'材料类型':$('#af0')?.value})||skip)return baseStart(skip);
    const p={};$$('[id^="af"]').forEach(el=>p[el.dataset.label]=el.value.trim());
    if(!p['事由 / 主题'])return toast('请填写本次通知或会议方案的主题','warn');
    $$('[data-notice-field]').forEach(el=>p[el.dataset.noticeField]=el.value.trim());
    const built=buildOfficeNotice(p,flowState.handoff);
    flowState.draft={assistantId:'zw',payload:p,useKb:false,handoff:flowState.handoff,title:built.title,html:built.html,version:1};flowState.handoff=null;
    wMsgs=[{r:'a',t:'文稿已整理。请补充黄色“待确认”项，并核对会议安排。'},{r:'a',t:'右侧全文可直接编辑。完成后可进行输出前检查。'}];
    APP.generated++;go('write',{a:ctx.a});
  };
  const baseCheck=runDraftCheck;
  runDraftCheck=()=>{
    const doc=$('#paper .notice-doc');if(!doc)return baseCheck();
    const missing=[...new Set((doc.textContent.match(/【待确认：[^】]+】/g)||[]))];
    openDlg(`<div class="pnl-h"><h3>通知要素检查</h3><button class="x" onclick="closeAll()">${ic('x')}</button></div><div class="pnl-b"><p>${missing.length?`仍有 ${missing.length} 项待补充：`:'未检出“待确认”占位标记。'}</p>${missing.map(s=>`<p style="margin-top:10px;color:var(--warn)">${esc(s)}</p>`).join('')}<p class="notice-help" style="margin-top:20px">仅检查当前文稿中的占位项，不代表事实准确或审核通过。请人工核对日期与星期、会场、参会范围、议程顺序、署名和附件；删除占位字样不等于完成确认。</p></div><div class="pnl-f"><button class="btn pri" onclick="closeAll()">返回文稿核对</button></div>`,600);
  };
  // Generic mock rewrite must never overwrite meeting facts with unrelated prose.
  const baseSend=wSend,baseRewrite=rewriteDraftParagraph;
  wSend=()=>$('#paper .notice-doc')?toast('请直接编辑右侧文稿，本次未自动修改','warn'):baseSend();
  rewriteDraftParagraph=()=>$('#paper .notice-doc')?toast('请直接选中右侧段落编辑，本次未自动重写','warn'):baseRewrite();
})();
