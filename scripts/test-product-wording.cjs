const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom'),root=path.join(__dirname,'../docs/prototypes');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,name)=>'<script>'+fs.readFileSync(path.join(root,name),'utf8')+'</script>');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'https://demo.example/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;},set(v){this.textContent=v;}});}});
const w=dom.window,e=s=>w.eval(s),q=s=>w.document.querySelector(s);let passed=0;
function check(name){const t=q('#view').textContent;assert.doesNotMatch(t,/Seedream|Seedance|OCR|真实成图|真实头图|实测|接口尚未|模型接入|未调用|本地构图|静态交互原型|已接入你提供/i,name);passed++;console.log('PASS '+name);}
(async()=>{
e("go('wechat')");check('material entry');assert.equal(q('.ws-start-side').querySelectorAll('button').length,2);assert.equal(q('[onclick="wsLoadSchool(false,true)"]').textContent,'查看图文示例');
await e('wsLoadSchool(true,true)');check('article layout');e('wsHeadOpen()');check('existing cover choices');e("wsHeadChoose('photo')");check('photo composition');e("wsSelect('head');wsDraft('wsHeadTitle','新的头图文字');wsHeadConfirm();wsHeadChoose('creative');wsHeadRequest()");check('new cover requirements');assert.match(q('#view').textContent,/画面尚未更新/);e('wsFinish()');check('saved composition');
await e('wsStoryExample(true)');check('finished story example');assert.ok(q('.story-baked'));assert.ok(q('.story-full-motion video'));e("wsSelect('scene-1');wsDraft('wsSceneTitle','修改后的草图');wsApply()");check('edited story draft');assert.equal(q('.story-baked'),null);e('wsFinish()');check('confirmed draft without fabricated result');assert.equal(q('.story-baked'),null);
e("go('assist-form',{a:ASSIST.find(x=>x.id==='zw')});startAssistant(false)");check('office notice');assert.match(q('#paper').textContent,/待确认/);
assert.deepEqual(errors,[]);console.log(passed+' product wording checks passed; DOM/state only.');
})().catch(err=>{console.error(err);process.exitCode=1;}).finally(()=>dom.window.close());
