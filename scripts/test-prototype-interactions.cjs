/* DOM/state regression tests; jsdom does not render layout or access external URLs. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {JSDOM, VirtualConsole} = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, '../docs/prototypes/index.html'), 'utf8');
const failures = [];
let passed = 0;
function boot() {
  const errors = [], revoked = [], clipboard = [];
  let serial = 0;
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e));
  const dom = new JSDOM(html, {url:'https://demo.example/prototypes/index.html',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
    const setTimeout = w.setTimeout.bind(w);
    w.setTimeout = (fn,ms,...args) => setTimeout(fn, ms===2200?500:1, ...args);
    w.URL.createObjectURL = () => 'blob:demo-'+(++serial);
    w.URL.revokeObjectURL = url => revoked.push(url);
    Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;},set(v){this.textContent=v;}});
    Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>clipboard.push(text)}});
  }});
  const w = dom.window;
  return {w,dom,errors,revoked,clipboard,eval:s=>w.eval(s),q:s=>w.document.querySelector(s),qa:s=>[...w.document.querySelectorAll(s)],input(s,v){const e=this.q(s);assert.ok(e,s);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));},click(s){const e=this.q(s);assert.ok(e,s);e.click();}};
}
const tick = () => new Promise(r=>setTimeout(r,35));
async function test(name,fn){const t=boot();try{assert.equal(t.errors.length,0,'startup errors');await fn(t);assert.equal(t.errors.length,0,t.errors.map(e=>e.message).join('\n'));passed++;console.log('PASS '+name);}catch(e){failures.push(name+': '+e.stack);console.error('FAIL '+name+': '+e.message);}finally{t.dom.window.close();}}
function wx(t){t.eval("go('wechat');wxLoadMaterialDemo(true)");}
function tool(t,id){t.eval(`go('tool-file',{tool:TOOLS.find(x=>x.id==='${id}')})`);}
(async()=>{
  await test('all 5 tools / 6 assistants retained; routes have unique IDs',t=>{
    assert.equal(t.eval('TOOLS.length'),5);assert.equal(t.eval('ASSIST.length'),6);
    for(const route of ['home','qa','tools','assist','wechat','data-analysis','minutes','kb','kb-docs','kb-upload']){
      if(!t.eval(`!!ROUTES['${route}']`))continue;
      t.eval(`go('${route}')`);const ids=t.qa('[id]').map(e=>e.id);assert.equal(new Set(ids).size,ids.length,route);
    }
    for(const id of ['read','data','ocr','asr'])tool(t,id);
    t.eval("go('kb-doc',{d:DOCS[0]})");
    for(const id of ['zw','research','plan'])t.eval(`go('assist-form',{a:ASSIST.find(x=>x.id==='${id}')})`);
  });
  await test('compact gallery exposes visible delete, move, cover controls',t=>{wx(t);assert.equal(t.qa('.image-delete').length,3);assert.equal(t.qa('.cover-pick').length,3);assert.ok(t.q('[title="前移"]').disabled);});
  await test('delete selected cover and undo restore image order and cover',t=>{wx(t);t.eval("wxCover('wx-d2');wxRemove('wx-d2')");assert.equal(t.eval('wxState.images.length'),2);assert.equal(t.eval('wxState.cover'),'wx-d1');t.eval('wxUndoRemove()');assert.equal(t.eval('wxState.images[1].id'),'wx-d2');assert.equal(t.eval('wxState.cover'),'wx-d2');assert.equal(t.eval('wxState.coverMode'),'photo');});
  await test('delete last photo leaves valid empty state; can re-add',t=>{wx(t);t.eval("wxCover('wx-d1');[...wxState.images].forEach(x=>wxRemove(x.id))");assert.equal(t.eval('wxState.cover'),null);assert.equal(t.eval('wxState.coverMode'),'solid');assert.ok(t.q('.image-empty'));t.eval('wxDemoImages();render()');assert.equal(t.qa('.image-delete').length,3);});
  await test('image order updates preview without changing approved text',t=>{wx(t);const text=t.eval('wxState.approvedText');t.eval('wxMove(0,1)');assert.equal(t.eval('wxState.images[0].id'),'wx-d2');assert.equal(t.q('.phone-inline').alt,'座谈交流实拍图.jpg');assert.equal(t.eval('wxState.approvedText'),text);});
  await test('image type, size, duplicates and cap validation',t=>{t.eval("go('wechat')");t.w.files=[{name:'a.png',type:'image/png',size:100,lastModified:1},{name:'a.png',type:'image/png',size:100,lastModified:1},{name:'bad.svg',type:'image/svg+xml',size:100},{name:'huge.png',type:'image/png',size:21*1024*1024}];t.eval('wxUpload(files)');assert.equal(t.eval('wxState.images.length'),1);t.w.files=Array.from({length:20},(_,i)=>({name:i+'.jpg',type:'image/jpeg',size:100,lastModified:i}));t.eval('wxUpload(files)');assert.equal(t.eval('wxState.images.length'),12);assert.match(t.q('#toast').textContent,/最多 12/);});
  await test('blob URL kept for undo, released when replaced by sample',t=>{t.eval("go('wechat');wxUpload([{name:'a.png',type:'image/png',size:100}]);wxRemove(wxState.images[0].id)");assert.equal(t.revoked.length,0);t.eval('wxUndoRemove();wxLoadMaterialDemo(true)');assert.equal(t.revoked.length,1);assert.equal(t.eval('wxState.cover'),'wx-d1');});
  await test('loading sample requires confirmation; cancelling preserves work',t=>{wx(t);t.input('#wxApprovedText','我的已审稿\n正文内容。');t.eval('wxLoadMaterialDemo()');assert.ok(t.q('#dlg.on'));t.eval('closeAll()');assert.equal(t.eval('wxState.approvedText'),'我的已审稿\n正文内容。');});
  await test('pure text article can proceed without photos',async t=>{t.eval("go('wechat')");t.input('#wxApprovedText','产业协同\n这是已审核的正文，不应修改。');await t.eval('wxGenerateArticle()');assert.equal(t.eval('wxState.step'),2);assert.equal(t.eval('wxState.articleReady'),true);});
  await test('cleared article cannot generate old content',async t=>{wx(t);t.input('#wxApprovedText','');await t.eval('wxGenerateArticle()');assert.equal(t.eval('wxState.articleReady'),false);assert.equal(t.eval('wxState.verifiedDemo'),false);assert.match(t.q('#toast').textContent,/正文/);});
  await test('edited source invalidates old output and prevents step skipping',async t=>{wx(t);await t.eval('wxGenerateArticle()');t.eval('wxGo(1)');t.input('#wxApprovedText','新标题\n新正文内容。');t.eval('wxGo(2)');assert.equal(t.eval('wxState.step'),1);assert.ok(!t.eval('wxState.articleReady'));assert.ok(!t.q('#wxPhonePreview').textContent.includes('杭汉'));});
  await test('heading detection and editable subheading preview stay aligned',async t=>{wx(t);await t.eval('wxGenerateArticle()');assert.equal(t.eval('wxState.sectionTitles.length'),2);t.input('.section-edit .inp','新的小标题');assert.ok(t.q('#wxPhonePreview').textContent.includes('新的小标题'));assert.ok(!t.q('#wxPhonePreview').textContent.includes('聚焦企业需求，探讨AI数字员工应用'));});
  await test('style feedback and expanded material panel survive selection',async t=>{wx(t);await t.eval('wxGenerateArticle()');t.input('#wxVisualBrief','增加留白');t.q('details').open=true;t.eval("wxVisualStyle('gallery')");assert.equal(t.q('#wxVisualBrief').value,'增加留白');assert.equal(t.q('details').open,true);});
  await test('return and continue preserves manually edited title',async t=>{wx(t);await t.eval('wxGenerateArticle()');t.eval("wxEditTitle('人工确认的标题');wxGo(1)");await t.eval('wxGenerateArticle()');assert.equal(t.eval('wxState.articleTitle'),'人工确认的标题');});
  await test('TXT import reads content; unsupported document does not replace source',async t=>{wx(t);t.w.testFile={name:'article.txt',size:20,text:async()=> '文件标题\n已审正文。'};await t.eval('wxApprovedPick([testFile])');assert.equal(t.q('#wxApprovedText').value,'文件标题\n已审正文。');await t.eval("wxApprovedPick([{name:'other.docx',size:100}])");assert.equal(t.q('#wxApprovedText').value,'文件标题\n已审正文。');});
  await test('confirmed sample story displays integrated result; editing invalidates it',async t=>{wx(t);t.eval("wxOutputMode('story')");await t.eval('wxGenerateArticle()');t.eval('wxStoryApprove()');assert.ok(t.q('.story-baked'));t.input('.story-draft-card .inp','调整后的确认标题');assert.equal(t.eval('wxState.storyApproved'),false);assert.ok(!t.q('.story-baked'));t.eval('wxStoryApprove()');assert.ok(!t.q('.story-baked'));assert.match(t.q('#toast').textContent,/画面等待生成/);});
  await test('empty storyboard text blocks confirmation; replacement asks first',async t=>{wx(t);t.eval("wxOutputMode('story')");await t.eval('wxGenerateArticle()');t.eval("wxStoryEdit(0,'beat','');wxStoryApprove()");assert.equal(t.eval('wxState.storyApproved'),false);t.eval('wxStoryRegenerate()');assert.ok(t.q('#dlg.on'));assert.equal(t.eval('wxState.storyRound'),0);});
  await test('leaving WeChat mid-generation does not hijack navigation',async t=>{wx(t);const pending=t.eval('wxGenerateArticle()');t.eval("go('home')");await pending;assert.equal(t.eval('cur'),'home');assert.equal(t.eval('wxState.articleReady'),false);});
  await test('file tool results are isolated and restored per tool',async t=>{tool(t,'read');t.eval("ftChoose([{name:'report.pdf',size:100}])");await t.eval("ftRun('read')");t.eval("ftSwitch(1,'read')");tool(t,'ocr');assert.equal(t.eval('ftLoaded'),false);assert.equal(t.eval('ftDone'),false);tool(t,'read');assert.equal(t.eval('ftDone'),true);assert.equal(t.eval('ftTab'),1);assert.ok(!t.q('#ftOut .empty'));});
  await test('removing file clears result and prevents reopening stale tab',async t=>{tool(t,'read');t.eval("ftChoose([{name:'report.pdf',size:100}])");await t.eval("ftRun('read')");t.eval("ftRemove();ftSwitch(1,'read')");assert.equal(t.eval('ftDone'),false);assert.ok(t.q('#ftOut .empty'));});
  await test('removing file during processing cancels result',async t=>{tool(t,'read');t.eval("ftChoose([{name:'report.pdf',size:100}])");const pending=t.eval("ftRun('read')");t.eval('ftRemove()');await pending;assert.equal(t.eval('ftDone'),false);assert.ok(t.q('#ftOut .empty'));assert.equal(t.q('#ftRun').disabled,false);});
  await test('select local file safely displays filename and resets result',t=>{tool(t,'ocr');t.eval('ftDone=true');t.w.files=[{name:'proof <1>.png',size:100}];t.eval('ftChoose(files)');assert.match(t.q('#ftDrop').textContent,/proof <1>/);assert.equal(t.eval('ftDone'),false);});
  await test('file parameters preserved after replacing file and revisiting',t=>{tool(t,'read');const select=t.q('.wb-l select');select.selectedIndex=1;const val=select.value;t.eval("ftChoose([{name:'report.pdf',size:100}])");assert.equal(t.q('.wb-l select').value,val);t.eval("go('home')");tool(t,'read');assert.equal(t.q('.wb-l select').value,val);});
  await test('text clear while processing cannot resurrect result',async t=>{t.eval("go('tool-text',{tool:TOOLS[0]});fillDemo()");const pending=t.eval("wbRun('text')");t.eval("$('#wbIn').value='';wbReset()");await pending;assert.ok(t.q('#wbOut .empty'));assert.equal(t.q('#wbRun').disabled,false);});
  await test('analysis dimensions interactive; minimum one retained',t=>{t.eval("go('data-analysis');dataDimension('内容趋势');dataDimension('文章对比');dataDimension('选题建议')");assert.equal(t.eval('dataState.dimensions.length'),1);});
  await test('analysis remove and replace invalidate old report; requirements persist',async t=>{t.eval("go('data-analysis');dataSample()");t.input('.wb-l textarea','只看政策解读');await t.eval('dataRun()');t.eval('dataRemove()');assert.equal(t.eval('dataState.done'),false);assert.equal(t.eval('dataState.loaded'),false);assert.equal(t.q('.wb-l textarea').value,'只看政策解读');t.eval('dataSample()');assert.equal(t.eval('dataState.done'),false);});
  await test('analysis navigation mid-run safe; completed follow-up survives render',async t=>{t.eval("go('data-analysis');dataSample()");const p=t.eval('dataRun()');t.eval("go('home')");await p;assert.equal(t.eval('cur'),'home');t.eval("go('data-analysis')");await t.eval('dataRun()');t.input('#dataQ','比较各栏目');t.eval('dataFollow();render()');assert.ok(t.q('#dataOut').textContent.includes('比较各栏目'));});
  await test('minutes form preserved on file load and route navigation',t=>{t.eval("go('minutes')");const name=t.qa('.wb-l input:not([type=file])')[0];name.value='项目会';t.eval("mPick([{name:'meeting.m4a',size:100}]);go('home');go('minutes')");assert.equal(t.qa('.wb-l input:not([type=file])')[0].value,'项目会');});
  await test('minutes generation supports pasted notes; leaving cancels cleanly',async t=>{t.eval("go('minutes')");t.input('.wb-l textarea','会上讨论项目进度');const pending=t.eval('mRun()');t.eval("go('home')");await pending;assert.equal(t.eval('mDone'),false);t.eval("go('minutes')");await t.eval('mRun()');assert.equal(t.eval('mDone'),true);});
  await test('new QA conversation cancels in-flight answer without contaminating next send',async t=>{t.eval("go('qa');$('#qaIn').value='政策问题'");const pending=t.eval('qaSend()');t.eval('qaNew()');await pending;assert.equal(t.eval('qaMsgs.length'),0);assert.equal(t.eval('qaBusy'),false);});
  await test('research generation cancellation preserves route',async t=>{t.eval("go('assist-form',{a:ASSIST.find(x=>x.id==='research')})");const p=t.eval('startResearch()');t.eval("go('home')");await p;assert.equal(t.eval('cur'),'home');});
  await test('plan main direction remains single select and form persists',async t=>{t.eval("go('assist-form',{a:ASSIST.find(x=>x.id==='plan')})");await t.eval('startPlanIdeation()');assert.equal(t.eval('cur'),'plan-studio');t.eval('togglePlanDirection(1);togglePlanDirection(2)');assert.equal(t.eval('planState.selected.length'),1);assert.equal(t.qa('[role=radio][aria-checked=true]').length,1);});
  await test('cancel upload task prevents later knowledge-base commit',async t=>{t.eval("go('kb-upload')");const n=t.eval('DOCS.length'),p=t.eval('qPush(3)');t.eval('qRemove(0)');await p;assert.equal(t.eval('DOCS.length'),n);assert.equal(t.eval('queue.length'),0);});
  await test('upload task survives leaving page without DOM errors',async t=>{t.eval("go('kb-upload')");const p=t.eval('qPush(3)');t.eval("go('home')");await p;assert.equal(t.eval('cur'),'home');assert.equal(t.eval("DOCS.some(d=>d.n===UPSAMPLE[3].n)"),true);});
  await test('copy writes actual clipboard content',async t=>{wx(t);await t.eval('wxGenerateArticle()');t.eval('wxCopyLayout()');await tick();assert.ok(t.clipboard[0].includes('武汉市商务局'));assert.ok(t.clipboard[0].includes('\n'));});
  await test('copy failure offers selectable fallback; Escape closes dialog',async t=>{t.w.navigator.clipboard.writeText=async()=>{throw Error('denied');};await t.eval("copyText('手动复制内容')");assert.equal(t.q('#dlg textarea').value,'手动复制内容');t.w.document.dispatchEvent(new t.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.ok(!t.q('#dlg.on'));});
  await test('dialog width resets instead of leaking previous width',t=>{t.eval("openDlg('wide',700);closeAll();openDlg('default')");assert.equal(t.q('#dlg').style.width,'');});
  await test('all uploaded photos are shown, not truncated to three',t=>{wx(t);t.w.files=Array.from({length:6},(_,i)=>({name:i+'.jpg',type:'image/jpeg',size:100,lastModified:i}));t.eval('wxUpload(files)');assert.equal(t.qa('.phone-inline').length,9);});
  await test('edited main title never silently reuses old baked cover',async t=>{wx(t);await t.eval('wxGenerateArticle()');t.eval("wxEditTitle('新的确认标题');wxVisualStyle('ai-visit')");assert.ok(!t.q('.wx-generated-cover'));assert.ok(t.q('.wx-cover-art').textContent.includes('新的确认标题'));});
  await test('text result survives navigation until input changes',async t=>{t.eval("go('tool-text',{tool:TOOLS[0]});fillDemo()");await t.eval("wbRun('text')");t.eval("go('home');go('tool-text',{tool:TOOLS[0]})");assert.ok(!t.q('#wbOut .empty'));assert.ok(t.q('#wbActs button'));t.input('#wbIn','变更文稿');assert.ok(t.q('#wbOut .empty'));});
  await test('minute optional outputs persist and control result tabs',async t=>{t.eval("go('minutes');mLoaded=true;mToggleExtra(1);go('home');go('minutes')");assert.equal(t.q('[role=checkbox][aria-label="生成待办清单并推算完成时限"]').getAttribute('aria-checked'),'false');await t.eval('mRun()');t.eval('mSwitch(2)');assert.match(t.q('#mOut').textContent,/本次未选择/);});
  await test('completed policy research and activity plan retain editable draft',async t=>{t.eval("go('assist-form',{a:ASSIST.find(x=>x.id==='research')})");await t.eval('startResearch()');assert.equal(t.eval('cur'),'write');assert.ok(t.q('#paper [href]'));t.eval("go('assist-form',{a:ASSIST.find(x=>x.id==='plan')})");await t.eval('startPlanIdeation()');await t.eval('generatePlanDraft()');assert.equal(t.eval('cur'),'write');assert.ok(t.q('#paper .plan-article'));t.q('#paper').innerHTML='<p>人工编辑保留</p>';t.q('#paper').dispatchEvent(new t.w.Event('input',{bubbles:true}));t.eval("go('home');go('write',{a:ASSIST.find(x=>x.id==='plan')})");assert.match(t.q('#paper').textContent,/人工编辑保留/);});
  await test('QA answer and citations still hand off to assistant form',async t=>{t.eval("go('qa');$('#qaIn').value='市级财政专项资金申报需要提交哪些材料？'");await t.eval('qaSend()');assert.ok(t.q('.ans'));t.eval('qaToAssistant(1)');assert.equal(t.eval('cur'),'assist-form');assert.ok(t.eval('flowState.handoff.sources.length')>0);});
  await test('AI office branding uses neutral office wording',t=>{
    assert.match(t.w.document.title,/AI办公助手平台/);
    assert.equal(t.q('.side-brand b').textContent,'AI办公助手平台');
    assert.equal(t.eval("ASSIST.find(x=>x.id==='zw').t"),'办公材料写作助手');
    assert.doesNotMatch(html,/经营管理|企业经营协同|政务/);
  });
  await test('original research, planning and verified article remain intact',t=>{
    assert.equal(t.eval("ASSIST.find(x=>x.id==='research').t"),'产业与政策研究助手');
    assert.equal(t.eval("ASSIST.find(x=>x.id==='plan').t"),'活动与宣传策划助手');
    assert.match(t.eval('RESEARCH_DRAFT'),/十五五/);
    assert.match(t.eval('WX_APPROVED_SAMPLE'),/武汉市商务局服务贸易处/);
    wx(t);assert.equal(t.eval('wxState.verifiedDemo'),true);
  });
  console.log(`\n${passed} passed; ${failures.length} failed`);
  if(failures.length){console.error(failures.join('\n\n'));process.exitCode=1;}
})();
