const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom'),root=path.join(__dirname,'../docs/prototypes');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>'<script>'+fs.readFileSync(path.join(root,name),'utf8')+'</script>');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'https://demo.example/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;},set(v){this.textContent=v;}});}});
const w=dom.window,e=s=>w.eval(s),q=s=>w.document.querySelector(s),qa=s=>[...w.document.querySelectorAll(s)];let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name);}
(async()=>{
e("go('wechat')");await e('wsLoadSchool(true,true)');
const result=q('.ws-preview .ws-head-in-article').outerHTML;
check('40 body templates leave confirmed creative head untouched',()=>{for(const t of w.WXLocalLayouts.catalog){e(`wsTemplate('${t.id}')`);assert.equal(q('.ws-preview .ws-head-in-article').outerHTML,result,t.id);}});
check('all 40 layouts default to natural-size photo slots',()=>{for(const t of w.WXLocalLayouts.catalog){e(`wsTemplate('${t.id}')`);const slots=qa('.ws-preview [data-photo]');assert.equal(slots.length,2);for(const slot of slots){assert.equal(slot.dataset.imageSizing,'natural',t.id);assert.equal(slot.style.aspectRatio,'auto');assert.equal(slot.style.height,'auto');assert.equal(slot.style.getPropertyValue('--ratio'),'');}}});
e("wsHeadOpen();wsHeadChoose('photo')");const photo=q('.ws-preview .ws-head-in-article').outerHTML;
check('photo overlay independent of body layout, undo and redo',()=>{e("wsTemplate('01')");assert.equal(q('.ws-preview .ws-head-in-article').outerHTML,photo);e('wsUndo();wsRedo()');assert.equal(q('.ws-preview .ws-head-in-article').outerHTML,photo);});
e("wsSelect('photo-school-plaque')");
check('image inspector offers original ratio rather than follow-template',()=>{assert.equal(q('#wsRatio').value,'');assert.match(q('#wsRatio').textContent,/原图比例/);assert.doesNotMatch(q('#wsRatio').textContent,/跟随模板/);});
e("wsDraft('wsRatio','1');wsApply()");
check('explicit crop persists across templates and can revert to natural',()=>{assert.equal(q('.ws-preview [data-photo="school-plaque"]').dataset.imageSizing,'crop');assert.equal(q('.ws-preview [data-photo="school-plaque"]').style.aspectRatio,'1 / 1');e("wsTemplate('27')");assert.equal(q('.ws-preview [data-photo="school-plaque"]').style.aspectRatio,'1 / 1');e("wsSelect('photo-school-plaque');wsDraft('wsRatio','');wsApply()");assert.equal(q('.ws-preview [data-photo="school-plaque"]').dataset.imageSizing,'natural');});
e("wsParagraph(0);wsImagePicker(2);wsImagePick('school-plaque');wsImagePick('school-signing');wsInsertImages()");
check('paired photographs preserve separate natural ratios',()=>{const pair=q('.ws-preview .ws-photo-pair');assert.equal(pair.querySelectorAll('[data-image-sizing="natural"]').length,2);assert.equal(pair.querySelectorAll('img').length,2);});
check('landscape portrait and square sources use intrinsic layout, not ratio guesses',()=>{const imgs=e('wxState.images');imgs.forEach((x,i)=>{x.src='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${i?300:900}" height="${i?900:300}"></svg>`);});imgs.push({id:'square-test',name:'方图',src:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"></svg>')});e('render()');for(const slot of qa('.ws-preview [data-photo]'))assert.equal(slot.dataset.imageSizing,'natural');const css=fs.readFileSync(path.join(root,'wechat-studio.css'),'utf8');assert.match(css,/natural"\] img.phone-inline\{position:static!important;[^}]*height:auto!important/);assert.match(css,/crop"\] img.phone-inline\{[^}]*object-fit:cover!important/);});
e('wxLoadMaterialDemo(true)');await e('wxGenerateArticle()');e("wsHeadOpen();wsDraft('wsHeadTitle','独立头图配色');wsHeadConfirm();wsHeadChoose('creative');wsHeadRequest()");
check('creative sketch palette and pending generation brief are frozen across template changes',()=>{const head=q('.ws-preview .ws-head-in-article').outerHTML,request=e('JSON.stringify(wxState.studio.head.request)');e("wsTemplate('39')");assert.equal(q('.ws-preview .ws-head-in-article').outerHTML,head);assert.equal(e('JSON.stringify(wxState.studio.head.request)'),request);});
check('runtime clean',()=>assert.deepEqual(errors,[]));console.log(count+' passed; DOM/state/CSS contracts, not visual rendering.');
})().catch(err=>{console.error(err);process.exitCode=1;}).finally(()=>dom.window.close());
