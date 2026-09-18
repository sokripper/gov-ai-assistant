/* Full-article gallery contracts. Mocked dimensions test fitting math, not pixel rendering. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom'),root=path.join(__dirname,'../docs/prototypes');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>'<script>'+fs.readFileSync(path.join(root,name),'utf8')+'</script>');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));let height=5000,observer;
const dom=new JSDOM(html,{url:'https://demo.example/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
 Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;},set(v){this.textContent=v;}});
 for(const [key,value] of Object.entries({offsetWidth:430,clientWidth:180,clientHeight:250}))Object.defineProperty(w.HTMLElement.prototype,key,{get(){return value;}});
 Object.defineProperty(w.HTMLElement.prototype,'scrollHeight',{get(){return height;}});
 w.ResizeObserver=class {constructor(cb){this.cb=cb;observer=this;}observe(){}disconnect(){this.disconnected=true;}};
}});
const w=dom.window,e=s=>w.eval(s),q=s=>w.document.querySelector(s),qa=s=>[...w.document.querySelectorAll(s)];let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
(async()=>{
 e("go('wechat')");await e('wsLoadSchool(true,true)');
 const source=e('wxState.approvedText'),head=q('.ws-preview .ws-head-in-article').outerHTML,photos=Array.from(e('wxState.images.map(x=>x.id)'));
 check('wide gallery shows 10 complete current-article previews',()=>{assert.ok(q('.ws-browsing'));assert.equal(qa('.ws-template').length,10);for(const card of qa('.ws-template')){assert.equal(card.querySelectorAll('[data-source-paragraph]').length,10);assert.deepEqual([...card.querySelectorAll('[data-photo]')].map(n=>n.dataset.photo).sort(),photos.slice().sort());assert.ok(card.querySelector('.ws-thumb-end'));assert.equal(card.querySelectorAll('[data-ws]').length,0);}});
 check('thumbnail fits full height instead of cropping its top',()=>{const t=q('.ws-local-thumb'),c=t.firstElementChild;assert.equal(t.dataset.fitted,'true');assert.equal(c.style.transform,'scale(0.0468)');assert.ok(parseFloat(c.style.left)>0);});
 check('late image load recalculates full article scale',()=>{height=9000;const img=q('.ws-local-thumb img');img.dispatchEvent(new w.Event('load'));assert.equal(img.closest('.ws-layout-content').style.transform,`scale(${234/9000})`);});
 check('responsive resize refits the article',()=>{height=6000;const t=q('.ws-local-thumb');observer.cb([{target:t}]);assert.equal(t.firstElementChild.style.transform,'scale(0.039)');});
 check('batch browsing leaves selected design and head untouched',()=>{e('wsLayoutBatch()');assert.equal(e('wxState.studio.template'),'27');assert.equal(q('.ws-preview .ws-head-in-article').outerHTML,head);assert.match(q('.ws-gallery-pages').textContent,/2 \/ 4/);assert.equal(q('.ws-gallery-body').scrollTop,0);});
 check('previous batch wraps and all four batches cover the library',()=>{e('wsLayoutBatch(-1);wsLayoutBatch(-1)');assert.match(q('.ws-gallery-pages').textContent,/4 \/ 4/);const ids=[];for(let i=0;i<4;i++){ids.push(...qa('.ws-template').map(x=>x.getAttribute('onclick')));e('wsLayoutBatch()');}assert.equal(new Set(ids).size,40);});
 check('filters reset batch; single-page category disables pagination',()=>{e("wsFilter('category','叙事')");assert.match(q('.ws-gallery-pages').textContent,/1 \/ 1/);assert.ok([...q('.ws-gallery-pages').querySelectorAll('button')].every(b=>b.disabled));assert.ok(qa('.ws-card-top').every(n=>n.textContent.includes('叙事')));});
 check('selection and undo preserve body, photo order and independent head',()=>{e("wsTemplate('21')");assert.equal(e('wxState.approvedText'),source);assert.deepEqual(Array.from(e('wxState.images.map(x=>x.id)')),photos);assert.equal(q('.ws-preview .ws-head-in-article').outerHTML,head);assert.equal(qa('.ws-template.on').length,1);e('wsUndo()');assert.equal(e('wxState.studio.template'),'27');});
 check('local editing restores editor and returns to wide browsing',()=>{e("wsSelect('section-0')");assert.equal(q('.ws-browsing'),null);assert.ok(q('.ws-editor'));e("wsPanel('styles')");assert.ok(q('.ws-browsing'));});
 check('head editing leaves gallery mode without changing source',()=>{e('wsHeadOpen()');assert.equal(q('.ws-browsing'),null);assert.equal(e('wxState.approvedText'),source);});
 check('mobile and desktop grid rules exist with no fixed thumbnail crop',()=>{const css=fs.readFileSync(path.join(root,'wechat-studio.css'),'utf8');assert.match(css,/repeat\(5,minmax\(0,1fr\)\)/);assert.match(css,/@media\(max-width:900px\)/);assert.doesNotMatch(css,/transform:scale\(\.29\)/);});
 check('no runtime errors',()=>assert.deepEqual(errors,[]));console.log(passed+' gallery checks passed (mock dimensions, not pixel QA).');
})().catch(err=>{console.error(err);process.exitCode=1;}).finally(()=>dom.window.close());
