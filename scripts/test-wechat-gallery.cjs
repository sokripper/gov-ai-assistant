/* Template specimens and in-place switching; DOM contracts, not pixel verification. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom'),root=path.join(__dirname,'../docs/prototypes');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>'<script>'+fs.readFileSync(path.join(root,name),'utf8')+'</script>');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'https://demo.example/',runScripts:'dangerously',virtualConsole:vc});
const w=dom.window,e=s=>w.eval(s),q=s=>w.document.querySelector(s),qa=s=>[...w.document.querySelectorAll(s)];let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
(async()=>{
 e("go('wechat')");await e('wsLoadSchool(true,true)');
 const source=e('wxState.approvedText'),head=q('.ws-preview .ws-head-in-article').outerHTML,photos=Array.from(e('wxState.images.map(x=>x.id)'));
 check('original three-column workspace with ten sidebar specimens',()=>{assert.equal(q('.ws-browsing'),null);assert.ok(q('.ws-editor'));assert.equal(qa('.ws-inspector .ws-template').length,10);assert.equal(qa('.ws-specimen').length,10);});
 check('specimens use short illustrative content, not the manuscript',()=>{for(const s of qa('.ws-specimen')){assert.ok(s.textContent.length<200);assert.doesNotMatch(s.textContent,/校企协同|武汉|全文结束/);assert.equal(s.querySelectorAll('[data-source-paragraph],[data-ws]').length,0);assert.ok(s.querySelector('img[src^="data:image/svg+xml"]'));}});
 check('forty specimens retain distinct native structural classes',()=>{const structures=new Set();for(let i=0;i<4;i++){for(const s of qa('.ws-specimen')){structures.add([...s.querySelectorAll('[class]')].map(n=>n.className).join('|'));assert.ok(s.querySelector('.chapter,.nx-heading'));assert.ok(s.textContent.length<200);}e('wsLayoutBatch()');}assert.ok(structures.size>=30);});
 check('browsing does not change selection or head',()=>{e('wsLayoutBatch()');assert.equal(e('wxState.studio.template'),'27');assert.equal(q('.ws-preview .ws-head-in-article').outerHTML,head);assert.ok(q('.ws-gallery-pages').textContent.includes('2 / 4'));});
 check('backward paging wraps',()=>{e('wsLayoutBatch(-1);wsLayoutBatch(-1)');assert.ok(q('.ws-gallery-pages').textContent.includes('4 / 4'));});
 check('category filter derives pages from latest catalog',()=>{e("wsFilter('category','叙事')");const pages=Math.ceil(w.WXLocalLayouts.catalog.filter(t=>t.family==='叙事').length/10);assert.ok(q('.ws-gallery-pages').textContent.includes('1 / '+pages));assert.ok([...q('.ws-gallery-pages').querySelectorAll('button')].every(b=>b.disabled===(pages<=1)));});
 check('click applies actual layout immediately in the existing preview',()=>{q('.ws-template').click();assert.equal(q('.ws-preview .phone').dataset.template,e('wxState.studio.template'));assert.equal(qa('.ws-preview [data-source-paragraph]').length,10);});
 check('approved body, original photos and head survive switching',()=>{assert.equal(e('wxState.approvedText'),source);assert.deepEqual(Array.from(e('wxState.images.map(x=>x.id)')),photos);assert.equal(q('.ws-preview .ws-head-in-article').outerHTML,head);assert.ok(!q('.ws-preview img[src^="data:image/svg+xml"]'));});
 check('undo restores previous template',()=>{e('wsUndo()');assert.equal(e('wxState.studio.template'),'27');});
 check('local editing and return to templates retain the same workspace',()=>{e("wsSelect('section-0');wsPanel('styles')");assert.equal(q('.ws-browsing'),null);assert.ok(q('.ws-editor'));assert.ok(q('.ws-specimen'));});
 check('no expanded gallery CSS or full-article end marker',()=>{const css=fs.readFileSync(path.join(root,'wechat-studio.css'),'utf8');assert.doesNotMatch(css,/ws-browsing|ws-thumb-end/);assert.match(q('.ws-gallery-foot').textContent,/卡片展示版式特点/);});
 check('runtime clean',()=>assert.deepEqual(errors,[]));console.log(passed+' specimen gallery checks passed; DOM only.');
})().catch(err=>{console.error(err);process.exitCode=1;}).finally(()=>dom.window.close());
