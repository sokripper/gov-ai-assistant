/* Local prototype only: no authentication, uploads, model calls or publication. */
(() => {
  const clone = x => JSON.parse(JSON.stringify(x));
  const localLayouts=window.WXLocalLayouts;
  const localCatalog=localLayouts?.catalog||[];
  const school=window.SCHOOL_ARTICLE,schoolText=school?.blocks.map(b=>b.text).join('\n\n');
  const originalBlocks=wxBlocks;
  wxBlocks=function(text){return school&&text.trim()===schoolText?clone(school.blocks):originalBlocks(text);};
  const isSchool=()=>!!school&&wxState.approvedText.trim()===schoolText&&wxState.outputMode!=='story';
  function resultKey(){const h=headState();return JSON.stringify([wxState.approvedText,wxState.articleTitle,h.title,h.brief,h.photoId,h.round,wxState.images.map(p=>[p.id,p.src])]);}
  function headResult(kind){const h=headState();return isSchool()&&h.resultBinding===resultKey()&&headReady()&&kind==='creative'?'assets/school-collab-20260918/creative-header.png':null;}
  function schoolTypeReady(){const h=headState();return isSchool()&&wxState.articleTitle===school.title&&h.title==='校企协同创新\n共育AI+未来设计人才'&&!h.brief&&headReady();}
  function seedSchool(){
    wxState.sectionTitles=clone(school.sections);wxState.studio.template='27';
    wxState.studio.photos={'school-plaque':{after:2},'school-signing':{after:9}};
    const h=headState();Object.assign(h,{title:'校企协同创新\n共育AI+未来设计人才',photoId:'school-signing',brief:'',round:0,selected:'creative',designColors:clone(colors()),designTemplate:wxState.studio.template,treatment:'gradient',placement:'bottom',request:null});h.confirmed=headKey();h.resultBinding=resultKey();
  }
  async function loadSchool(confirmed=false,enter=false){
    if(!school)return toast('校企案例素材未加载，请刷新页面','warn');
    if(!confirmed&&(wxState.approvedText.trim()||wxState.images.length))return openDlg('<div class="pnl-h"><h3>载入校企协同创新案例？</h3></div><div class="pnl-b">将替换当前文稿、图片及本次会话的修改。原始文件不受影响。</div><div class="pnl-f"><button class="btn" onclick="closeAll()">取消</button><button class="btn pri" onclick="closeAll();wsLoadSchool(true,'+enter+')">确认载入</button></div>',480);
    wxLoadMaterialDemo(true);wxReleaseRemoved();
    Object.assign(wxState,{approvedText:schoolText,documentName:school.source,images:clone(school.images),cover:'school-signing',outputMode:'article',verifiedDemo:false,articleReady:false,layoutReady:false,articleTitle:'',sectionTitles:[],step:1});
    ui.source='';render();if(enter)await wxGenerateArticle();else toast('已载入示例文章和图片','ok');
  }
  window.wsLoadSchool=loadSchool;
  if(localCatalog.length){const style=document.createElement('style');style.id='ws-local-layout-styles';style.textContent=localLayouts.scopedCSS();document.head.append(style);}
  const fields = ['articleTitle','titleIndex','sectionTitles','visualStyle','styleCandidates','visualBrief','visualRound','cover','coverMode','coverVariant','modules','storyStyle','storyRound','storyEdits','storyApproved','storySnapshot','studio'];
  const ui = {source:'',selected:'overall',drafts:{},undo:[],redo:[],versions:[],next:1,done:false,panel:'styles',requests:[],paragraph:0,range:null,category:'全部',paletteGroup:'全部',insertCount:1};
  // Independently authored layouts, not vendor source/template assets.
  const templates=[['journal','留白刊物','轻字级 / 宽留白 / 无框照片','报道'],['chapter','章节线索','侧边线 / 段落序号 / 清晰节奏','研究'],['brief','信息简报','色块标题 / 紧凑阅读 / 重点引用','研究'],['documentary','图像纪事','实拍首图 / 居中标题 / 影像叙事','人文'],['serial','数字专刊','大编号 / 宋体标题 / 细线图注','报道'],['timeline','时间纪行','纵向线索 / 节点标题 / 图文交替','报道'],['report','观察报告','双线标题 / 深色侧签 / 数据感','研究'],['margin','页边手记','页边标注 / 柔和纸色 / 边框照片','人文'],['interview','人物访谈','引号标题 / 人物照片 / 引语强调','人文'],['field','田野记录','角标 / 手记字形 / 实拍优先','人文'],['ribbon','主题快讯','横幅标题 / 明快字级 / 短段落','活动'],['frame','展陈画册','框线标题 / 画册图框 / 独立图注','活动'],['badge','圆点章节','数字圆签 / 居中节奏 / 圆角图片','活动'],['serif','东方札记','宋楷层级 / 双细线 / 留白','人文'],['editorial','深度评论','厚线标题 / 宋体正文 / 引述卡','研究'],['tech','科技坐标','几何标题 / 方形图框 / 冷静秩序','科技'],['grid','创新图谱','模块标题 / 网格节奏 / 对比配色','科技'],['poster','活力海报','斜切标题 / 海报字形 / 强对比','活动']];
  const palettes=[['ink','墨蓝','#24466B','#EFF3F8'],['pine','松绿','#326652','#EFF5F1'],['clay','陶土','#975640','#F8F0EA'],['plum','灰紫','#665875','#F3EFF7'],['wine','酒红','#8A3746','#F9F0F1'],['mono','黑白','#333C44','#F1F2F3']];
  const mix=(hex,white)=>'#'+hex.slice(1).match(/../g).map(s=>Math.round(parseInt(s,16)*(1-white)+255*white).toString(16).padStart(2,'0')).join('');
  const colorBases=[['ocean','远海','#205C83'],['jade','青玉','#24695B'],['moss','苔原','#536A36'],['amber','琥珀','#855B21'],['copper','赤铜','#9D503B'],['berry','莓果','#953C62'],['iris','鸢尾','#665092'],['night','星夜','#3F5298'],['teal','湖岸','#24717B'],['olive','青橄','#626638'],['cocoa','可可','#765442'],['rose','蔷薇','#935B6C'],['slate','山岩','#536576'],['sunset','日落','#A4522B']];
  colorBases.forEach(([id,name,color])=>[['plain','素净',.94],['soft','柔和',.87],['contrast','鲜明',.78]].forEach(([tone,label,light])=>palettes.push([id+'-'+tone,name+'·'+label,color,mix(color,light),label])));
  function colors(){const local=localCatalog.find(t=>t.id===wxState.studio.template);if(local)return {accent:local.color,tint:local.soft,bold:local.color,underline:local.color,highlight:local.soft,quote:local.color};const p=palettes.find(x=>x[0]===wxState.studio.palette)||palettes[0];return {accent:p[2],tint:p[3],bold:p[2],underline:mix(p[2],.25),highlight:mix(p[2],.78),quote:p[2],...(wxState.studio.customColors||{})};}
  function sourceKey(){return JSON.stringify([wxState.approvedText,wxState.outputMode]);}
  function init(){
    if(ui.source!==sourceKey()){
      ui.source=sourceKey();ui.selected='overall';ui.drafts={};ui.undo=[];ui.redo=[];ui.versions=[];ui.next=1;ui.done=false;ui.panel='styles';ui.requests=[];ui.paragraph=0;ui.range=null;ui.category='全部';ui.paletteGroup='全部';ui.layoutBatch=0;
      wxState.studio={font:15,leading:1.95,gap:18,photos:{},sceneNotes:{},changedScenes:[]};
    }
    wxState.studio ||= {font:15,leading:1.95,gap:18,photos:{},sceneNotes:{},changedScenes:[]};
    wxState.studio.formats ||= {};wxState.studio.template ||= localCatalog[0]?.id||'journal';wxState.studio.palette ||= 'ink';
    wxState.studio.marks ||= {};wxState.studio.photoGroups ||= [];wxState.studio.typeface ||= 'editorial';
    wxState.coverMotion='subtle';
    if(wxState.articleReady&&!ui.versions.length)saveVersion('初始方案',false);
  }
  function snapshot(){const s={};fields.forEach(k=>{if(wxState[k]!==undefined)s[k]=clone(wxState[k]);});s.requests=clone(ui.requests);s.imageOrder=wxState.images.map(x=>x.id);return s;}
  function restore(s){fields.forEach(k=>{if(s[k]!==undefined)wxState[k]=clone(s[k]);else delete wxState[k];});wxState.images.sort((a,b)=>s.imageOrder.indexOf(a.id)-s.imageOrder.indexOf(b.id));if(!wxState.images.some(x=>x.id===wxState.cover))wxState.cover=wxState.images[0]?.id||null;ui.requests=clone(s.requests||[]);wxState.coverMotion='subtle';ui.drafts={};ui.done=false;}
  function redraw(){const pos=['.ws-preview','.ws-editor-scroll','.ws-inspector-body'].map(s=>[s,$(s)?.scrollTop||0]);render();pos.forEach(([s,y])=>{if($(s))$(s).scrollTop=y;});}
  function change(label,fn){ui.undo.push({label,state:snapshot()});if(ui.undo.length>30)ui.undo.shift();ui.redo=[];fn();ui.done=false;redraw();}
  function saveVersion(label='手动保存',refresh=true){
    if(Object.keys(ui.drafts).length)return toast('请先应用或放弃右侧尚未应用的修改','warn');
    ui.versions.push({id:ui.next++,label,time:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),state:snapshot()});
    if(refresh){render();toast('版本已保存（本次会话）','ok');}
  }
  function undo(){const item=ui.undo.pop();if(!item)return;ui.redo.push({label:item.label,state:snapshot()});restore(item.state);redraw();toast('已撤销：'+item.label,'ok');}
  function redo(){const item=ui.redo.pop();if(!item)return;ui.undo.push({label:item.label,state:snapshot()});restore(item.state);redraw();}
  function recover(id){const v=ui.versions.find(x=>x.id===id);if(!v)return;change('恢复 V'+id,()=>restore(v.state));toast('已恢复 V'+id+'，恢复前内容仍可撤销找回','ok');}
  function draft(field,value){(ui.drafts[ui.selected] ||= {})[field]=value;}
  function val(field,fallback){return ui.drafts[ui.selected]?.[field]??fallback;}
  function discard(){delete ui.drafts[ui.selected];render();}
  function select(key,scroll=false){ui.selected=key;ui.panel=key==='head'?'head':'edit';ui.done=false;redraw();if(scroll){const target=$(`[data-ws="${key}"]`);target?.scrollIntoView?.({block:'nearest',behavior:'smooth'});}}
  function active(){return ui.selected;}
  function pending(){return Object.keys(ui.drafts).length>0;}
  function attrs(key,label){return `data-ws="${key}" data-label="${label}" tabindex="0" role="button" aria-label="修改${label}" class="${ui.selected===key?'ws-selected':''}"`;}
  function bind(el,key,label){if(!el)return;el.dataset.ws=key;el.dataset.label=label;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','修改'+label);el.classList.toggle('ws-selected',key===ui.selected);}
  function localArticle(id){return localLayouts.render(id,{title:wxState.articleTitle,blocks:wxBlocks(wxState.approvedText),sections:wxState.sectionTitles,images:wxState.images,studio:wxState.studio,markedText,decorate,selected:ui.selected});}
  function headState(){const h=wxState.studio.head ||= {title:'',photoId:wxState.images[0]?.id||'',brief:'',round:0,confirmed:'',selected:'',request:null};h.treatment ||= 'direct';h.placement ||= 'bottom';h.designColors ||= clone(colors());h.designTemplate ||= wxState.studio.template;return h;}
  function headKey(){const h=headState(),p=wxState.images.find(x=>x.id===h.photoId);return JSON.stringify([wxState.approvedText,wxState.articleTitle,h.title,h.brief,h.photoId,p?.src||'',h.treatment,h.placement,h.designColors]);}
  function headReady(){return !!headState().confirmed&&headState().confirmed===headKey();}
  function headOpen(){select('head');}
  function headArt(kind){
    const asset=headResult(kind);if(asset)return `<div class="ws-head-real"><img src="${asset}" alt="${kind==='photo'?'实拍艺术字头图':'主题创意头图'}"></div>`;
    const h=headState(),p=wxState.images.find(x=>x.id===h.photoId),c=h.designColors;
    if(kind==='photo'&&p)return `<div class="ws-photo-overlay ws-photo-${h.treatment} ws-photo-at-${h.placement}"><img class="ws-photo-base" src="${esc(p.src)}" alt="${esc(p.name)}"><div class="ws-photo-lettering">${schoolTypeReady()?schoolLettering():`<strong>${esc(h.title)}</strong>`}</div></div>`;
    return `<div class="ws-head-art ws-head-${kind} ws-head-v${h.round%3}" style="--head-accent:${c.accent};--head-tint:${c.tint}"><div class="ws-head-shape" aria-hidden="true"></div><div class="ws-head-copy"><small>创意头图</small><strong>${esc(h.title)}</strong></div></div>`;
  }
  // Recompose the existing generated letterforms as a browser preview, not a new raster result.
  function schoolLettering(){
    const src='assets/school-collab-20260918/photo-type-panel.png';
    const crop=(box,cls)=>`<svg class="${cls}" viewBox="${box}" aria-hidden="true"><image href="${src}" width="1536" height="2048"/></svg>`;
    return `<div class="ws-seed-lettering" role="img" aria-label="校企协同创新，共育AI+未来设计人才"><div class="ws-seed-main">${crop('150 325 1250 330','ws-seed-cooperate')}${crop('120 650 1280 700','ws-seed-innovation')}</div><div class="ws-seed-sub">${crop('175 1330 740 185','ws-seed-ai')}${crop('160 1540 1210 190','ws-seed-future')}</div></div>`;
  }
  function photoControls(){const h=headState();return `<div class="ws-photo-controls"><b>照片内叠字</b><p class="ws-help">留白干净时直接放字；背景复杂时，只处理文字所在区域。避开人脸、牌匾和重要现场信息。</p>${dropdown('wsHeadTreatment','文字衬底',h.treatment,[['direct','直接叠字 · 保留留白'],['gradient','局部渐变 · 增强对比'],['glass','局部毛玻璃 · 弱化杂乱背景']])}${dropdown('wsHeadPlacement','文字位置',h.placement,[['bottom','画面下方'],['top','画面上方'],['left','画面左侧'],['right','画面右侧']])}<p class="ws-help">新照片默认直接叠字，可按画面留白调整位置和衬底。</p></div>`;}
  function headBlock(){
    const h=headState(),valid=headReady(),selected=valid&&h.selected;
    if(!selected)return `<button class="ws-head-empty" onclick="wsHeadOpen()"><b>${h.confirmed&&!valid?'头图输入已变化，请重新确认':'为这篇文章设计头图'}</b><span>实拍设计版 / AI 创意版 · 共用当前排版风格</span><em>进入头图设计 →</em></button>`;
    return `<section class="ws-head-in-article" data-ws="head" data-label="头图设计" role="button" tabindex="0" aria-label="修改头图">${headArt(selected)}<div class="ws-head-status">${headResult(selected)?'头图预览 · 点击修改':selected==='photo'&&schoolTypeReady()?'实拍头图 · 点击修改':'头图方案 · 点击修改'}</div></section>`;
  }
  function localPreview(){const doc=document.createElement('div');doc.innerHTML=localArticle(wxState.studio.template);doc.querySelector('header').insertAdjacentHTML('afterend',headBlock());return `<div class="phone ws-local-phone" data-template="${wxState.studio.template}" style="${Object.entries(colors()).map(([k,v])=>'--ws-'+k+':'+v).join(';')}"><div class="ws-layout-content">${doc.innerHTML}</div></div>`;}
  function headPanel(){
    if(headResult('creative'))return realHeadPanel();
    const h=headState(),valid=headReady(),photo=wxState.images.find(x=>x.id===h.photoId),template=localCatalog.find(x=>x.id===wxState.studio.template);
    return `<div class="ws-inspector-head"><h3>头图设计</h3><span class="tag">${valid?'02 比较方向':'01 确认文字'}</span></div><div class="ws-inspector-body"><div class="ws-notice">正文排版：${esc(template?.name||'当前模板')}。头图独立保存，切换正文模板不改变已选头图及其配色。</div>${input('wsHeadTitle','头图标题（与文章长标题分开）',h.title,2)}<p class="ws-help">建议提炼为易读短句，可手动换行；必须忠于原文。</p><details><summary>参考原文标题和小标题</summary><p class="ws-help">${esc(wxBlocks(wxState.approvedText)[0]?.text||'')}</p>${wxBuildSections(wxState.approvedText).map(x=>`<p class="ws-help">${esc(x)}</p>`).join('')}</details>${dropdown('wsHeadPhoto','实拍底图 / 创意参考图',h.photoId,[['','暂不使用图片'],...wxState.images.map(x=>[x.id,x.name])])}${photoControls()}${input('wsHeadBrief','想调整的地方（可选）',h.brief,2)}<div class="ws-head-controls"><button class="btn" onclick="wsDiscard()">放弃未应用修改</button><button class="btn pri" onclick="wsHeadConfirm()">确认文字，看两种构图</button></div>${h.confirmed&&!valid?'<p class="ws-head-warning">文章标题或参考图已变化，旧方案不再用于当前稿件，请重新确认。</p>':''}${valid?`<div class="ws-head-options">${['photo','creative'].map(kind=>`<section class="ws-head-option ${h.selected===kind?'on':''}">${kind==='photo'&&!photo?'<div class="ws-head-no-photo">添加一张已确认照片，启用实拍设计版</div>':headArt(kind)}<p>${kind==='photo'?'照片完整打底，文字放在画面内；只在需要时增加局部衬底。':'根据文章内容设计主题画面，与实拍头图区分使用。'}</p><button class="btn ws-wide" ${kind==='photo'&&!photo?'disabled':''} onclick="wsHeadChoose('${kind}')">${h.selected===kind?'已放入整篇草图':'选择此方向，放入整篇草图'}</button></section>`).join('')}</div><button class="btn ws-wide" onclick="wsHeadNext()">换一种构图</button><p class="ws-help">选好构图后，可继续调整标题与参考图片。</p>${h.selected?`<button class="btn pri ws-wide" onclick="wsHeadRequest()">保存设计要求</button>${h.request&&h.request.key===headKey()&&h.request.round===h.round&&h.request.kind===h.selected?'<div class="ws-notice">设计要求已保存，画面尚未更新。</div>':''}<button class="btn gho ws-wide" onclick="wsHeadRemove()">移除头图，保留正文排版</button>`:''}`:''}<p class="ws-help"></p></div>`;
  }
  function headConfirm(){
    const read=(id,fallback)=>ui.drafts.head?.[id]??$('#'+id)?.value??fallback,h=headState(),title=read('wsHeadTitle',h.title).trim(),photoId=read('wsHeadPhoto',h.photoId),brief=read('wsHeadBrief',h.brief).trim(),treatment=read('wsHeadTreatment',h.treatment),placement=read('wsHeadPlacement',h.placement);
    if(!title)return toast('请先确认头图上的标题文字','warn');
    if(!['direct','gradient','glass'].includes(treatment)||!['top','bottom','left','right'].includes(placement))return toast('请选择有效的照片构图','warn');
    if(photoId&&!wxState.images.some(x=>x.id===photoId))return toast('参考图片已移除，请重新选择','warn');
    if(Object.keys(ui.drafts).some(k=>k!=='head'))return toast('请先应用其他区域未应用的修改','warn');
    change('确认头图文字与参考图',()=>{Object.assign(h,{title,photoId,brief,treatment,placement,selected:'',request:null});h.confirmed=headKey();delete ui.drafts.head;});
  }
  function headChoose(kind){if(pending())return toast('请先确认未应用的修改','warn');if(!headReady()||!['photo','creative'].includes(kind))return;if(kind==='photo'&&!wxState.images.some(x=>x.id===headState().photoId))return;change('选择头图构图',()=>{headState().selected=kind;headState().request=null;});}
  function headNext(){if(pending())return toast('请先确认未应用的修改','warn');if(!headReady())return;change('更换头图构图示意',()=>{headState().round++;headState().placement=['bottom','top','right'][headState().round%3];headState().confirmed=headKey();headState().selected='';headState().request=null;});}
  function headRemove(){if(pending())return toast('请先确认未应用的修改','warn');change('移除头图草图',()=>{headState().selected='';headState().request=null;});}
  function headRequest(){
    if(pending())return toast('请先确认未应用的修改','warn');if(!headReady()||!headState().selected)return;
    change('保存头图生成要求',()=>{const h=headState();h.request={key:headKey(),kind:h.selected,round:h.round,status:'awaiting_connection',title:h.title,photoId:h.photoId,brief:h.brief,photoComposition:{treatment:h.treatment,placement:h.placement,policy:'照片为底图；优先使用留白，必要时仅在文字区加局部渐变或毛玻璃；避开人脸、牌匾和重要现场信息；禁止图文左右分栏',analysis:'manual_preview_not_model_analysis'},template:h.designTemplate,color:h.designColors.accent,model:'Seedream',createdAt:new Date().toISOString()};});
    toast('设计要求已保存，画面尚未更新','warn');
  }
  function realHeadPanel(){
    const h=headState();return `<div class="ws-inspector-head"><h3>头图设计与二次修改</h3><span class="tag g">头图预览</span></div><div class="ws-inspector-body"><div class="ws-notice">选择实拍或创意头图。切换正文排版不会改变头图；需要调整时可在下方修改。</div>${['photo','creative'].map(kind=>`<section class="ws-head-option ${h.selected===kind?'on':''}">${headArt(kind)}<p>${kind==='photo'?'实拍照片打底，艺术字融入画面。':'以文章主题为灵感的创意头图。'}</p><button class="btn ws-wide" onclick="wsHeadChoose('${kind}')">${h.selected===kind?'当前已选':'使用这版头图'}</button></section>`).join('')}<p class="ws-help">确认前请核对头图文字。</p>${input('wsHeadTitle','头图文字',h.title,2)}${dropdown('wsHeadPhoto','参考照片',h.photoId,wxState.images.map(x=>[x.id,x.name]))}${photoControls()}${input('wsHeadBrief','希望怎么改',h.brief,3)}<button class="btn pri ws-wide" onclick="wsHeadConfirm()">应用修改，重新确认生成要求</button><button class="btn ws-wide" onclick="wsDiscard()">放弃未应用修改</button><button class="btn gho ws-wide" onclick="wsHeadRemove()">移除头图</button><p class="ws-help">修改后请重新确认头图方案。</p></div>`;
  }
  Object.assign(window,{wsHeadOpen:headOpen,wsHeadConfirm:headConfirm,wsHeadChoose:headChoose,wsHeadNext:headNext,wsHeadRemove:headRemove,wsHeadRequest:headRequest});
  function localLibrary(){
    const list=localCatalog.filter(t=>ui.category==='全部'||t.family===ui.category),batch=Math.min(ui.layoutBatch||0,Math.max(0,Math.ceil(list.length/5)-1)),shown=list.slice(batch*5,batch*5+5);
    return `<div class="ws-inspector-head"><h3>纯排版 · ${localCatalog.length} 套</h3><span class="tag">${batch+1} / ${Math.max(1,Math.ceil(list.length/5))}</span></div><div class="ws-inspector-body"><div class="ws-notice">选择喜欢的排版，可继续微调标题、图片和正文样式。</div><div class="ws-filters">${['全部','图文','信息','条目','叙事'].map(x=>`<button class="${ui.category===x?'on':''}" onclick="wsFilter('category','${x}')">${x}</button>`).join('')}</div><div class="ws-template-grid ws-local-grid">${shown.map(t=>{
      const h=document.createElement('div');h.innerHTML=localArticle(t.id);h.querySelectorAll('[data-ws]').forEach(e=>{e.removeAttribute('data-ws');e.removeAttribute('role');e.removeAttribute('tabindex');e.removeAttribute('aria-label');e.classList.remove('ws-selected');});
      return `<button class="ws-template ${wxState.studio.template===t.id?'on':''}" aria-pressed="${wxState.studio.template===t.id}" onclick="wsTemplate('${t.id}')"><div class="ws-local-thumb" aria-hidden="true"><div class="ws-layout-content">${h.innerHTML}</div></div><strong>${t.id} ${esc(t.name)}</strong><small>${esc(t.description)}</small></button>`;
    }).join('')}</div><button class="btn ws-wide" onclick="wsLayoutBatch()" ${list.length<=5?'disabled':''}>换一批排版 · 每批 5 套</button><button class="btn pri ws-wide" onclick="wsHeadOpen()">下一步：设计头图 →</button><button class="btn ws-wide" onclick="wsPanel('ai')">AI 定制 / 提出修改要求</button><p class="ws-help">配色跟随原模板。点击即适配当前正文和图片，不重新生成正文；无对应信息的占位内容不输出。</p></div>`;
  }
  function layoutBatch(){ui.layoutBatch=(ui.layoutBatch||0)+1;const count=localCatalog.filter(t=>ui.category==='全部'||t.family===ui.category).length;if(ui.layoutBatch>=Math.ceil(count/5)){ui.layoutBatch=0;toast('当前分类已浏览完，回到第一批','ok');}redraw();}
  const originalPhone=wxPhone;
  const originalMix=wxMixApprovedHtml;
  // Photos can be explicitly anchored to a body paragraph, not only evenly inserted.
  wxMixApprovedHtml=function(html,images,caption){
    if(!wxState.studio)return originalMix(html,images,caption);
    const blocks=html.match(/<(?:h3|p)>[\s\S]*?<\/(?:h3|p)>/g)||[html];
    const rows=photoRows(wxState.images),photoHtml=x=>{const p=wxState.studio.photos[x.id]||{};return `<div class="wx-inline-wrap" data-photo="${esc(x.id)}"><img class="phone-inline" src="${x.src}" alt="${esc(x.name)}"></div>${p.caption?`<span class="wx-caption">${esc(p.caption)} · 人工填写，发布前核对</span>`:caption(x)}`;};let para=-1;
    return blocks.map((block,i)=>{
      if(block.startsWith('<p>'))para++;
      return block+rows.filter(row=>block.startsWith('<p>')?row.after===para:!blocks.some(b=>b.startsWith('<p>'))&&i===blocks.length-1).map(row=>row.items.length>1?`<div class="ws-photo-pair">${row.items.map(x=>'<div>'+photoHtml(x)+'</div>').join('')}</div>`:row.items.map(photoHtml).join('')).join('');
    }).join('');
  };
  function photoRows(images){const used=new Set(),rows=[],count=Math.max(1,wxBlocks(wxState.approvedText).filter(x=>!x.heading).length);images.forEach((x,i)=>{if(used.has(x.id))return;const group=wxState.studio.photoGroups.find(g=>g.ids.includes(x.id)),items=group?group.ids.map(id=>images.find(p=>p.id===id)).filter(Boolean):[x];items.forEach(p=>used.add(p.id));const after=group?group.after:wxState.studio.photos[x.id]?.after;rows.push({after:after!==undefined&&after!==''?Math.min(count-1,Math.max(0,Number(after))):Math.min(count-1,Math.floor((i+1)*count/(images.length+1))),items});});return rows;}
  function imagePicker(count){ui.insertCount=count;ui.insertIds=[];ui.panel='insert';ui.done=false;redraw();}
  function imagePick(id){ui.insertIds ||= [];if(ui.insertIds.includes(id))ui.insertIds=ui.insertIds.filter(x=>x!==id);else if(ui.insertIds.length<ui.insertCount)ui.insertIds.push(id);else return toast('本次选择 '+ui.insertCount+' 张图片','warn');redraw();}
  function insertImages(){if(ui.insertIds?.length!==ui.insertCount)return toast('请先选择 '+ui.insertCount+' 张已确认图片','warn');const ids=[...ui.insertIds];change('在正文中编排图片',()=>{wxState.studio.photoGroups=wxState.studio.photoGroups.filter(g=>!g.ids.some(id=>ids.includes(id)));ids.forEach(id=>{wxState.studio.photos[id]={...(wxState.studio.photos[id]||{}),after:ui.paragraph};});if(ids.length===2)wxState.studio.photoGroups.push({ids,after:ui.paragraph});ui.selected='photo-'+ids[0];ui.panel='edit';});toast('已放到第 '+(ui.paragraph+1)+' 段后；正文未改动','ok');}
  function preview(){
    if(wxState.outputMode!=='story'&&localCatalog.some(t=>t.id===wxState.studio.template))return localPreview();
    const holder=document.createElement('div');holder.innerHTML=originalPhone();
    const story=wxState.outputMode==='story';
    bind(holder.querySelector('.wx-main-title'),'title','文章标题');
    if(story){
      const baked=holder.querySelector('.story-baked');
      if(baked){
        const map=document.createElement('div');map.className='ws-scene-map';
        map.innerHTML=wxStoryScenes().map((_,i)=>`<button data-ws="scene-${i}" aria-label="修改第 ${i+1} 幕"><span>编辑第 ${i+1} 幕</span></button>`).join('');baked.append(map);
      }
      holder.querySelectorAll('.story-scene').forEach((el,i)=>{
        bind(el,'scene-'+i,'第 '+(i+1)+' 幕');
        if(wxState.studio.changedScenes.includes(i)){
          const note=document.createElement('div');note.className='ws-scene-status';note.textContent=wxState.storyApproved?'文字已确认 · 待重新生成本幕':'本幕已修改 · 待确认文字';el.append(note);
        }
      });
      const note=holder.querySelector('.draft-phone-note');if(note)note.textContent='连续草图预览 · 点击任一幕修改文字与画面要求，整体确认后再生成图字一体成稿。轻动效默认随成稿编排。';
    }else{
      // Isolate the editor themes from legacy !important style rules.
      const surface=holder.querySelector('.phone-body');if(surface)surface.className='phone-body ws-article-surface';
      bind(holder.querySelector('.wx-generated-cover,.wx-cover-art'),'cover','首图');
      const coverLabel=holder.querySelector('.wx-cover-art small');if(coverLabel)coverLabel.textContent='EDITORIAL / 图文专题';
      let section=0;
      holder.querySelectorAll('.wx-content h3').forEach(el=>{if(section<wxState.sectionTitles.length)bind(el,'section-'+section++,'小标题');});
      holder.querySelectorAll('.wx-content p').forEach((el,i)=>{el.innerHTML=markedText(el.textContent,i);bind(el,'body','正文版式');el.dataset.paragraph=i;decorate(el,i);});
      holder.querySelectorAll('.wx-inline-wrap').forEach((el,i)=>{
        const photo=wxState.images.find(x=>x.id===el.dataset.photo)||wxState.images[i];if(!photo)return;
        bind(el,'photo-'+photo.id,'实拍图');const p=wxState.studio.photos[photo.id]||{};
        const img=el.querySelector('img');img.style.setProperty('--ws-ratio',p.ratio||'auto');img.style.setProperty('--ws-position',p.position||'center');
      });
      const content=holder.querySelector('.wx-content');if(content){content.style.setProperty('--ws-size',wxState.studio.font+'px');content.style.setProperty('--ws-leading',wxState.studio.leading);content.style.setProperty('--ws-gap',wxState.studio.gap+'px');}
      const phone=holder.querySelector('.phone');
      if(phone){phone.dataset.template=wxState.studio.template;phone.dataset.typeface=wxState.studio.typeface;Object.entries(colors()).forEach(([k,v])=>phone.style.setProperty('--ws-'+k,v));}
    }
    return holder.innerHTML;
  }
  function decorate(el,i){
    const f=wxState.studio.formats[i]||{};
    ['bold','italic','underline','highlight','quote','bullet','number','divider','heading'].forEach(k=>el.classList.toggle('ws-f-'+k,!!f[k]));
    if(f.number)el.dataset.number=String(i+1).padStart(2,'0');
  }
  function format(kind){
    const i=ui.paragraph;if(!wxBlocks(wxState.approvedText).filter(x=>!x.heading)[i])return;
    if(ui.range&&['bold','italic','underline','highlight','clear'].includes(kind)){
      const {start,end}=ui.range;change('调整选中文字格式',()=>{const list=wxState.studio.marks[i] ||= [];const kinds=kind==='clear'?['bold','italic','underline','highlight']:[kind];kinds.forEach(k=>{const on=kind==='clear'?false:!Array.from({length:end-start},(_,j)=>markAt(i,start+j,k)).every(Boolean);list.push({start,end,kind:k,on});});});return;
    }
    change('调整第 '+(i+1)+' 段格式',()=>{const f=wxState.studio.formats[i] ||= {};if(kind==='clear'){wxState.studio.formats[i]={};wxState.studio.marks[i]=[];}else {f[kind]=!f[kind];if(kind==='bullet')f.number=false;if(kind==='number')f.bullet=false;}});
  }
  function markAt(i,offset,kind){let on=!!wxState.studio.formats[i]?.[kind];(wxState.studio.marks[i]||[]).forEach(m=>{if(m.kind===kind&&offset>=m.start&&offset<m.end)on=m.on;});return on;}
  function markedText(text,i){if(!wxState.studio.marks[i]?.length)return esc(text);const styles={bold:'font-weight:700',italic:'font-style:italic',underline:'text-decoration:underline;text-decoration-color:var(--ws-underline)',highlight:'background:var(--ws-highlight)'};let out='',start=0,prev='';for(let n=0;n<=text.length;n++){const key=n===text.length?'END':Object.keys(styles).filter(k=>markAt(i,n,k)).join(' ');if(n&&key!==prev){out+=`<span style="font-weight:400;font-style:normal;text-decoration:none;background:transparent;${prev.split(' ').filter(Boolean).map(k=>styles[k]).join(';')}">${esc(text.slice(start,n))}</span>`;start=n;}prev=key;}return out;}
  function capture(i){ui.paragraph=i;ui.range=null;const sel=window.getSelection(),block=document.querySelector(`[data-block="${i}"]`);if(sel?.rangeCount&&!sel.isCollapsed&&block){const r=sel.getRangeAt(0);if(block.contains(r.startContainer)&&block.contains(r.endContainer)){const lead=r.cloneRange();lead.selectNodeContents(block);lead.setEnd(r.startContainer,r.startOffset);ui.range={start:lead.toString().length,end:lead.toString().length+r.toString().length};}}document.querySelectorAll('[data-block]').forEach(el=>el.classList.toggle('active',Number(el.dataset.block)===i));const hint=$('.ws-edit-hint');if(hint)hint.textContent=ui.range?'已选 '+(ui.range.end-ui.range.start)+' 字 · 可设置加粗、斜体、下划线、高亮':'已选第 '+(i+1)+' 段 · 格式作用于本段';}
  function focusParagraph(i){ui.paragraph=i;ui.range=null;ui.selected='body';ui.panel='edit';redraw();}
  function editor(){
    if(wxState.outputMode==='story')return `<div class="ws-editor-head"><b>故事内容</b><span>先定文字，再成图</span></div><div class="ws-editor-scroll">${outline()}<div class="ws-notice">对白与画面说明可二次修改。修改成稿后返回草图，确认后重新生成对应画面。</div></div>`;
    let p=0,h=-1;
    const body=wxBlocks(wxState.approvedText).map(x=>{
      if(x.heading){h++;return `<button class="ws-edit-heading" onclick="wsSelect('${h?'section-'+(h-1):'title'}')">${esc(h?wxState.sectionTitles[h-1]||x.text:wxState.articleTitle)}<small>编辑${h?'小标题':'标题'}</small></button>`;}
      const n=p++,el=document.createElement('p');el.innerHTML=markedText(x.text,n);el.dataset.block=n;el.className='ws-edit-paragraph'+(ui.paragraph===n?' active':'');el.tabIndex=0;el.setAttribute('aria-label','选择第 '+(n+1)+' 段');el.setAttribute('onmouseup',`wsCapture(${n})`);el.setAttribute('onkeydown',`if(event.key==='Enter'){wsParagraph(${n})}`);decorate(el,n);return el.outerHTML+photoRows(wxState.images).filter(row=>row.after===n).map(row=>`<div class="ws-inline-editor-images ${row.items.length>1?'paired':''}">${row.items.map(photo=>`<button onclick="wsSelect('photo-${esc(photo.id)}')" title="调整图片位置、裁切与图注"><img src="${photo.src}" alt="${esc(photo.name)}"><span>${esc(photo.name)}</span></button>`).join('')}</div>`).join('');
    }).join('');
    const options=[['heading','标题样式'],['bold','加粗'],['italic','斜体'],['underline','下划线'],['highlight','高亮'],['quote','引用'],['bullet','项目列表'],['number','编号列表'],['divider','分隔线'],['clear','清除格式']];
    return `<div class="ws-editor-head"><b>内容编辑</b><span>原文锁定 · 格式可改</span></div><div class="ws-toolbar" role="toolbar" aria-label="段落格式工具">${options.map(([k,label])=>`<button title="${label}" aria-label="${label}" aria-pressed="${!!wxState.studio.formats[ui.paragraph]?.[k]}" onmousedown="event.preventDefault()" onclick="wsFormat('${k}')">${label}</button>`).join('')}<button aria-label="正文全局字号与间距" onclick="wsSelect('body')">字号 / 间距</button><button onclick="wsImagePicker(1)">插入单图</button><button onclick="wsImagePicker(2)">插入双图</button><button aria-label="管理实拍图片" onclick="wsPanel('photos')">素材管理</button></div><div class="ws-edit-hint">${ui.range?'已选 '+(ui.range.end-ui.range.start)+' 字 · 格式作用于选中文字':'选中文字设强调；点击段落设引用、列表或插图'}</div><div class="ws-editor-scroll">${body}<div class="ws-editor-photos"><b>已确认图片 · ${wxState.images.length}</b><button class="btn sm" onclick="wsPanel('photos')">管理 / 添加图片</button></div></div><div class="ws-editor-bottom">需要修改原稿？<button onclick="wxGo(1)">返回素材重新确认</button></div>`;
  }
  function panel(name){ui.panel=name;ui.done=false;if(name==='head')ui.selected='head';if(name==='ai'||name==='edit')ui.selected=name==='edit'?'targets':'overall';redraw();}
  function template(id){if(localCatalog.some(t=>t.id===id)){change('切换纯排版模板',()=>{wxState.studio.template=id;});return;}if(!templates.some(x=>x[0]===id))return;change('切换排版风格',()=>{wxState.studio.template=id;wxState.coverVariant=1;wxState.modules=['column','section','photo','caption'];wxState.studio.gap=id==='journal'?28:id==='brief'?14:20;if(id==='documentary'&&wxState.images.length)wxState.coverMode='photo';});}
  function palette(id){if(!palettes.some(x=>x[0]===id))return;change('切换整体配色',()=>{wxState.studio.palette=id;wxState.studio.customColors={};wxState.coverVariant=1;});}
  function customColor(key,value){if(!['accent','bold','underline','highlight','quote'].includes(key)||!/^#[0-9a-f]{6}$/i.test(value))return;change('自定义局部配色',()=>{(wxState.studio.customColors ||= {})[key]=value;wxState.coverVariant=1;});}
  function filter(kind,value){ui[kind]=value;if(kind==='category')ui.layoutBatch=0;redraw();}
  function tabs(){return `<div class="ws-tabs" role="tablist">${[['styles','排版模板'],...(localCatalog.length?[['head','头图设计']]:[]),...(!localCatalog.length?[['colors','配色']]:[]),['ai','AI 定制'],['edit','局部修改']].map(([id,t])=>`<button role="tab" aria-selected="${ui.panel===id}" onclick="wsPanel('${id}')">${t}${id==='edit'&&pending()?'<i></i>':''}</button>`).join('')}</div>`;}
  function library(){
    if(ui.panel==='styles'&&localCatalog.length)return localLibrary();
    if(ui.panel==='styles')return `<div class="ws-inspector-head"><h3>排版风格 · ${templates.length} 种</h3></div><div class="ws-inspector-body"><div class="ws-notice">选择喜欢的风格，预览整篇效果。</div><div class="ws-filters">${['全部','报道','研究','人文','活动','科技'].map(x=>`<button class="${ui.category===x?'on':''}" onclick="wsFilter('category','${x}')">${x}</button>`).join('')}</div><div class="ws-template-grid">${templates.filter(x=>ui.category==='全部'||x[3]===ui.category).map(([id,name,desc],i)=>`<button class="ws-template ${wxState.studio.template===id?'on':''}" aria-pressed="${wxState.studio.template===id}" onclick="wsTemplate('${id}')"><div class="ws-swatch" data-template="${id}" style="--ws-accent:${colors().accent};--ws-tint:${colors().tint}"><h4 class="ws-mini-title">${esc(wxState.sectionTitles[0]||wxState.articleTitle.slice(0,18))}</h4><p>${esc(wxBlocks(wxState.approvedText).find(x=>!x.heading)?.text.slice(0,55)||'')}</p>${wxState.images[0]?`<img src="${wxState.images[0].src}" alt="">`:'<div class="ws-mini-line"></div>'}<blockquote>${esc(wxState.sectionTitles[1]||'正文与配图一起编排')}</blockquote></div><strong>${name}</strong><small>${desc}</small></button>`).join('')}</div><button class="btn ws-wide" onclick="wsPanel('ai')">都不合适？告诉 AI 修改方向</button><p class="ws-help">自有组件库，非第三方模板原包。网页标题字形不是 Seedream 艺术字成图。</p></div>`;
    if(ui.panel==='colors')return `<div class="ws-inspector-head"><h3>配色方案 · ${palettes.length} 组</h3></div><div class="ws-inspector-body"><p class="ws-help">标题、强调、下划线、高亮与引用分别设色。可叠加到任一模板。</p><details><summary>自定义元素配色</summary><div class="ws-custom-colors">${[['accent','标题'],['bold','加粗'],['underline','下划线'],['highlight','高亮'],['quote','引用']].map(([k,t])=>`<label>${t}<input type="color" aria-label="${t}颜色" value="${colors()[k]}" onchange="wsCustomColor('${k}',this.value)"></label>`).join('')}</div></details><div class="ws-filters">${['全部','基础','素净','柔和','鲜明'].map(x=>`<button class="${ui.paletteGroup===x?'on':''}" onclick="wsFilter('paletteGroup','${x}')">${x}</button>`).join('')}</div><div class="ws-palette-grid">${palettes.filter(x=>ui.paletteGroup==='全部'||(x[4]||'基础')===ui.paletteGroup).map(([id,name,a,b])=>`<button class="ws-palette ${wxState.studio.palette===id?'on':''}" aria-pressed="${wxState.studio.palette===id}" onclick="wsPalette('${id}')"><span class="ws-color-dots"><i style="background:${a}"></i><i style="background:${mix(a,.25)}"></i><i style="background:${mix(a,.78)}"></i><i style="background:${b}"></i></span><span>${name}</span></button>`).join('')}</div></div>`;
    if(ui.panel==='insert')return `<div class="ws-inspector-head"><h3>在第 ${ui.paragraph+1} 段后插入${ui.insertCount===2?'双图':'单图'}</h3></div><div class="ws-inspector-body"><p class="ws-help">选择已确认照片，不改写或替换选中的原文。已有照片会移动到这里，不重复插入。</p><div class="ws-image-picker">${wxState.images.map(x=>`<button aria-pressed="${ui.insertIds?.includes(x.id)||false}" onclick="wsImagePick('${x.id}')"><img src="${x.src}" alt="${esc(x.name)}"><span>${esc(x.name)}</span><b>${ui.insertIds?.includes(x.id)?'已选择':'选择'}</b></button>`).join('')}</div>${wxState.images.length<ui.insertCount?'<p class="ws-help">素材不足，请先添加图片。</p>':''}<button class="btn" onclick="wsPanel('photos')">添加 / 管理图片</button></div><div class="ws-inspector-foot"><button class="btn pri" onclick="wsInsertImages()" ${ui.insertIds?.length===ui.insertCount?'':'disabled'}>确认图文位置</button></div>`;
    if(ui.panel==='photos')return `<div class="ws-inspector-head"><h3>实拍素材</h3></div><div class="ws-inspector-body"><p class="ws-help">添加、删除、排序或指定首图。删除后可用素材区的撤销入口恢复。</p><input type="file" id="wsPhotos" accept="image/png,image/jpeg,image/webp" multiple hidden onchange="wxUpload(this.files);this.value=''"> <button class="btn ws-wide" onclick="document.getElementById('wsPhotos').click()">添加已确认图片</button>${wxCompactImages()}</div>`;
    return inspector();
  }
  function input(id,label,value,rows=0){return `<div class="fld"><label for="${id}">${label}</label>${rows?`<textarea id="${id}" class="ta" rows="${rows}" oninput="wsDraft('${id}',this.value)">${esc(val(id,value))}</textarea>`:`<input id="${id}" class="inp" value="${esc(val(id,value))}" oninput="wsDraft('${id}',this.value)">`}</div>`;}
  function dropdown(id,label,value,opts){return `<div class="fld"><label for="${id}">${label}</label><select class="inp" id="${id}" onchange="wsDraft('${id}',this.value)">${opts.map(([v,t])=>`<option value="${v}" ${String(val(id,value))===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select></div>`;}
  function inspector(){
    const k=ui.selected,story=wxState.outputMode==='story';
    if(k==='head'&&!story&&!ui.done&&ui.panel!=='versions')return headPanel();
    let title='整体效果',body='',apply=true;
    if(ui.panel==='versions'){
      title='版本记录';apply=false;
      body='<p class="ws-help">当前浏览器会话内保留。恢复版本不会覆盖原始正文；恢复动作也可以撤销。</p>'+[...ui.versions].reverse().map(v=>`<div class="ws-version"><b>V${v.id} · ${esc(v.label)}</b><p>${v.time} · ${esc(v.state.articleTitle)}</p><button class="btn sm" onclick="wsRecover(${v.id})">恢复此版本</button></div>`).join('');
    }else if(ui.done){
      title=story?(wxCanShowStory()?'成稿预览':'草图已保存 · 待生成'):'方案预览';apply=false;
      body=`<div class="ws-review"><h3>本版已保存</h3><p>还想调整？可以继续修改，不需要重新上传或从头生成。</p><button class="btn pri" onclick="wsSelect('overall')">继续修改</button></div><p class="ws-help">${story?'修改后的草图已保存，画面待更新。':(headResult(headState().selected)?'文章与头图已保存，请核对内容后再发布。':'排版与头图方案已保存，最终画面待确认。')}</p><button class="btn" onclick="${story?"toast('演示环境暂不支持导出长图','warn')":"wxCopyLayout()"}">${story?'导出长图':'复制文章文字'}</button><p class="ws-help"></p>`;
    }else if(k==='targets'||k==='overall'&&ui.panel==='edit'&&!story){
      title='选择要修改的内容';apply=false;
      const items=[['title','文章标题',wxState.articleTitle],...(localCatalog.length?[['head','头图设计与二次修改','实拍设计 / AI 创意 · 改标题、换图、换构图']]:[['cover','首图与标题字形','背景、照片底图、构图与字体处理']]),['body','正文阅读样式','字号、行距和段落留白'],...wxState.sectionTitles.map((s,i)=>['section-'+i,'小标题 '+(i+1),s]),...wxState.images.map((x,i)=>['photo-'+x.id,'配图 '+(i+1),x.name])];
      body='<p class="ws-help">点下面的具体对象，或直接点击中间预览。修改后点击“应用到预览”。</p>'+items.map(([id,t,d])=>`<button class="ws-target" onclick="wsSelect('${id}',true)"><b>${t}${ui.drafts[id]?' · 待应用':''}</b><span>${esc(d)}</span><i>修改 ›</i></button>`).join('');
    }else if(k==='title'){
      title='文章标题';body=input('wsTitle','标题文字',wxState.articleTitle,3)+`<div class="ws-notice">基于原文提炼，修改后请核对原意。正文不会随标题一起改写。</div><details><summary>查看其他标题与原文依据</summary>${wxState.titleCandidates.map((x,i)=>`<button class="ws-option" onclick="wsPickTitle(${i})">${esc(x.t)}</button><p class="ws-help">${esc(x.src)}</p>`).join('')}</details>`;
    }else if(k.startsWith('section-')){
      const i=Number(k.slice(8));title='小标题 '+(i+1);body=`<div class="section-edit">${input('wsSection','小标题文字',wxState.sectionTitles[i]||'',3)}</div><div class="ws-notice">原文依据：${esc(wxBuildSections(wxState.approvedText)[i]||'请核对对应正文')}</div><p class="ws-help">只改变标题表达与视觉层级，不改动下面的正文。</p>`;
    }else if(k==='cover'){
      title='首图与标题字形';body=dropdown('wsCoverMode','首图形式',wxState.coverMode,[['solid','素色 / 图形背景 + 标题'],['photo','确认实拍照片 + 标题']])+dropdown('wsCover','照片底图',wxState.cover,wxState.images.map(x=>[x.id,x.name]))+dropdown('wsVariant','构图',wxState.coverVariant,[[0,'居中留白'],[1,'大字突出'],[2,'错位层次']])+dropdown('wsTypeface','标题字体',wxState.studio.typeface,[['editorial','宋体刊物'],['geometric','几何描边'],['poster','倾斜海报'],['hand','手记楷体']])+`<div class="ws-notice">选择适合文章气质的标题字体。</div><button class="btn sm" onclick="wsSelect('title')">修改首图使用的标题</button>`;
    }else if(k==='body'){
      title='正文版式';body=dropdown('wsFont','正文字号',wxState.studio.font,[[14,'14 · 紧凑'],[15,'15 · 标准'],[16,'16 · 易读'],[18,'18 · 大字号']])+dropdown('wsLeading','行距',wxState.studio.leading,[[1.7,'紧凑'],[1.95,'舒适'],[2.2,'宽松']])+dropdown('wsGap','段落留白',wxState.studio.gap,[[12,'少'],[18,'标准'],[28,'多']])+`<div class="ws-notice">审定正文只读。这里只调整阅读节奏，不润色、不删减正文。</div>`;
    }else if(k.startsWith('photo-')){
      const id=k.slice(6),p=wxState.studio.photos[id]||{},photo=wxState.images.find(x=>x.id===id);title='实拍图片';
      body=photo?`<img src="${photo.src}" alt="${esc(photo.name)}" style="width:100%;max-height:150px;object-fit:contain;margin-bottom:16px">`+dropdown('wsAfter','放在这段正文之后',p.after??'',[['','自动安排'],...wxBlocks(wxState.approvedText).filter(x=>!x.heading).map((x,i)=>[i,`${i+1}. ${x.text.slice(0,20)}…`])])+dropdown('wsRatio','图片比例（默认不裁切）',p.ratio||'',[['','原图比例 · 完整显示'],['16/9','裁切为横幅 16:9'],['4/3','裁切为 4:3'],['1','裁切为方形 1:1']])+dropdown('wsPosition','画面位置',p.position||'center',[['center','居中'],['top','上部'],['bottom','下部']])+input('wsCaption','图注（可选，人工核对）',p.caption||'',2):'<p>图片已移除，请选择其他区域。</p>';
    }else if(k.startsWith('scene-')){
      const i=Number(k.slice(6)),scene=wxStoryScenes()[i];title='第 '+(i+1)+' 幕';
      body=`<div class="story-draft-card">${input('wsSceneTitle','画面标题',scene.title,2)}${input('wsSceneBeat','对白 / 说明',scene.beat,3)}${input('wsSceneNote','画面修改要求（可选）',wxState.studio.sceneNotes[i]||'',3)}</div><div class="ws-notice">依据：${esc(scene.src)}<br>应用修改后，本幕返回待确认状态。请先确认草图文字。</div>`;
    }else{
      body=`<p class="ws-help" style="margin-top:0">点击左侧目录或预览中的内容，修改首图、标题、照片${story?'与具体分镜':'和排版'}。不必逐项填写设计参数。</p>`;
      if(!story&&ui.panel!=='ai'){
        const colors=['linear-gradient(110deg,#173454 65%,#E9914E 65%)','linear-gradient(110deg,#1473CF 65%,#BDD9E5 65%)','linear-gradient(110deg,#DDD7CB 65%,#373C43 65%)'];
        body+=`<label>想换一种整体效果？</label><div class="ws-style-row">${wxState.styleCandidates.map((x,i)=>`<button class="ws-style-chip ${wxState.visualStyle===x.id?'on':''}" onclick="wsStyle('${x.id}')"><i style="background:${colors[i%3]}"></i><b>${esc(x.t)}</b></button>`).join('')}</div><button class="btn sm gho" onclick="wsNewDirections()">换一批方向</button>`;
      }else if(story) body+=`<div class="ws-notice">${wxState.storyApproved?'草图文字已确认。可继续选中某一幕修改。':'先看连续故事草图；确认全部文字后，再生成图字一体成稿。'}<br>完整轻动效默认随成稿编排，不单独输出。</div>`;
      if(ui.panel==='ai'){title='基于这篇文章定制';body='<div class="ws-notice">描述你希望调整的地方，也可直接选择预览中的内容进行修改。</div>'+body;}
      body+=input('wsFeedback','告诉我哪里需要调整',wxState.visualBrief||'',3)+`<p class="ws-help">${story?'例如：第二幕增加人物互动，整体色调更柔和。':'例如：增加留白、减少装饰。头图可进入“头图设计”单独调整。'}</p>`;
      body+=`<details><summary>查看原文与已确认素材</summary><div class="source-fold-body"><p>${esc(wxState.approvedText)}</p>${wxCompactImages()}</div></details>`;
      if(ui.requests.length)body+=`<details><summary>待处理的修改意见 · ${ui.requests.length}</summary>${ui.requests.map(x=>`<p class="ws-help">${esc(x)}</p>`).join('')}</details>`;
    }
    return `<div class="ws-inspector-head"><h3>${title}</h3><span class="tag b">${story?'长图':'图文'}</span></div><div class="ws-inspector-body">${body}</div>${apply?`<div class="ws-inspector-foot"><button class="btn" onclick="wsDiscard()">放弃修改</button><button class="btn pri" onclick="wsApply()">${k==='overall'?'应用调整':'应用到预览'}</button></div>`:''}`;
  }
  function apply(){
    const k=ui.selected,read=(id,fallback)=>ui.drafts[k]?.[id]??$('#'+id)?.value??fallback;
    const nonempty=k==='title'?read('wsTitle',''):k.startsWith('section-')?read('wsSection',''):k.startsWith('scene-')?read('wsSceneTitle','')&&read('wsSceneBeat',''):'ok';
    if(!nonempty.trim())return toast('标题与对白不能为空','warn');
    let message='已更新选中区域，原文和实拍内容未改动',mock=false;
    change('修改'+k,()=>{
      if(k==='title'){wxState.articleTitle=read('wsTitle','').trim();wxState.titleIndex=-1;wxState.coverVariant=1;if(wxState.outputMode==='story'){wxState.storyApproved=false;wxState.storySnapshot='';wxState.studio.changedScenes=wxStoryScenes().map((_,i)=>i);}}
      else if(k.startsWith('section-'))wxState.sectionTitles[Number(k.slice(8))]=read('wsSection','').trim();
      else if(k==='cover'){
        const mode=read('wsCoverMode','solid');wxState.coverMode=mode==='photo'&&!wxState.images.length?'solid':mode;
        wxState.cover=read('wsCover',wxState.cover);wxState.coverVariant=Number(read('wsVariant',1));wxState.studio.typeface=read('wsTypeface','editorial');
      }else if(k==='body'){wxState.studio.bodyOverride=true;wxState.studio.font=Number(read('wsFont',15));wxState.studio.leading=Number(read('wsLeading',1.95));wxState.studio.gap=Number(read('wsGap',18));}
      else if(k.startsWith('photo-')){const id=k.slice(6),after=read('wsAfter',''),group=wxState.studio.photoGroups.find(g=>g.ids.includes(id));if(group&&after!=='')group.after=Number(after);wxState.studio.photos[id]={after,ratio:read('wsRatio',''),position:read('wsPosition','center'),caption:read('wsCaption','').trim()};}
      else if(k.startsWith('scene-')){
        const i=Number(k.slice(6));wxState.storyEdits[i]={...(wxState.storyEdits[i]||{}),title:read('wsSceneTitle','').trim(),beat:read('wsSceneBeat','').trim()};
        wxState.studio.sceneNotes[i]=read('wsSceneNote','');wxState.studio.changedScenes=[...new Set([...wxState.studio.changedScenes,i])];wxState.storyApproved=false;wxState.storySnapshot='';message='本幕草图已更新，请重新确认文字';mock=true;
      }else{
        const feedback=read('wsFeedback','').trim();wxState.visualBrief=feedback;
        if(!feedback){delete ui.drafts[k];message='可以点击预览中的区域直接修改';return;}
        if(wxState.outputMode==='story'){ui.requests.push(feedback);wxState.studio.changedScenes=wxStoryScenes().map((_,i)=>i);wxState.storyApproved=false;wxState.storySnapshot='';message='整体修改要求已记录，请重新确认草图';mock=true;}
        else{
          let matched=false;
          if(/留白|宽松/.test(feedback)){wxState.studio.bodyOverride=true;wxState.studio.gap=28;wxState.studio.leading=2.2;matched=true;}
          if(/简洁|减少装饰/.test(feedback)){wxState.modules=['column','section','photo','caption'];wxState.studio.template=localCatalog.length?'02':'journal';wxState.coverVariant=1;matched=true;}
          if(!localCatalog.length&&/照片首图/.test(feedback)&&wxState.images.length){wxState.coverMode='photo';matched=true;}
          if(!localCatalog.length&&/标题突出|大字/.test(feedback)){wxState.coverVariant=1;matched=true;}
          ui.requests.push(feedback);message=matched?'已应用版式调整，其他修改意见已记录':'修改意见已记录，画面尚未更新';mock=!matched;
        }
      }
      delete ui.drafts[k];
    });toast(message,mock?'warn':'ok');
  }
  function outline(){
    const items=[['overall','整体效果'],['title','文章标题']];
    if(wxState.outputMode==='story')wxStoryScenes().forEach((x,i)=>items.push(['scene-'+i,`${String(i+1).padStart(2,'0')} ${x.title}`]));
    else{items.push([localCatalog.length?'head':'cover','头图设计'],['body','正文版式']);wxState.sectionTitles.forEach((x,i)=>items.push(['section-'+i,`${i+1}. ${x}`]));wxState.images.forEach((x,i)=>items.push(['photo-'+x.id,'配图 '+(i+1)]));}
    return `<div class="ws-eyebrow">内容目录</div>${items.map(([key,name])=>`<button class="ws-item ${key===ui.selected&&!ui.done?'on':''}" onclick="wsSelect('${key}',true)" title="${esc(name)}"><span>${esc(name)}</span></button>`).join('')}<p class="ws-help" style="padding:12px 10px">正文已锁定<br>${wxState.outputMode==='story'?'轻动效默认包含':'正文排版 + 头图草图'}</p>`;
  }
  const originalStage=wxStage;
  function setup(){
    // Reuse validated file inputs and gallery; remove mandatory design decisions.
    const h=document.createElement('div');h.innerHTML=originalStage();
    const blocks=h.querySelectorAll('.wx-setup-block');
    if(blocks[1]){const detail=document.createElement('details');detail.innerHTML='<summary>风格偏好（选填，默认由文章决定）</summary>'+blocks[1].innerHTML;blocks[1].replaceWith(detail);}
    const heading=h.querySelector('.card-h h3');if(heading)heading.textContent='提供已确认的内容';
    const ta=h.querySelector('#wxApprovedText');if(ta)ta.rows=4;
    const label=h.querySelectorAll('.wx-work-title b');label.forEach(el=>el.textContent=el.textContent.replace(/^\d\. /,''));
    const example=h.querySelector('[onclick="wxLoadMaterialDemo()"]');if(example&&school){example.setAttribute('onclick','wsLoadSchool()');example.textContent='载入最新校企原文与实拍';}
    const generate=h.querySelector('#wxGenerate');if(generate)generate.textContent=wxState.articleReady?'继续编辑当前方案':wxState.outputMode==='story'?'查看连续草图示例':'查看 5 套排版效果';
    // Keep the material step focused on input rather than implementation notes.
    return `<div class="ws"><header class="ws-bar"><div><h2>公众号创作</h2><div class="ws-sub">把已确认的内容，变成可以发布的视觉表达</div></div><div class="ws-progress"><b>01 提供素材</b><span>02 看效果与修改</span><span>03 确认成稿</span></div></header><div class="ws-start"><div class="ws-start-intro"><h2>内容已定，接下来交给设计。</h2><p>不必再填写主题、挑选组件。先查看当前素材的排版效果，不满意的地方直接改。</p></div><div class="ws-start-grid"><div>${h.innerHTML}</div><aside class="ws-start-side"><h3>看看成稿效果</h3><p>先浏览示例，再开始你的创作。</p>${school?'<img class="ws-start-example" src="assets/school-collab-20260918/creative-header.png" alt="校企协同创新图文示例"><button class="btn pri" onclick="wsLoadSchool(false,true)">查看图文示例</button>':'<button class="btn" onclick="wxOpenVerifiedDemo()">查看图文示例</button>'}<button class="btn" onclick="wsStoryExample()">查看长图示例</button></aside></div></div></div>`;
  }
  function page(){
    init();if(wxState.step===1)return setup();
    const story=wxState.outputMode==='story';
    return `<div class="ws"><header class="ws-bar"><div><h2>${story?'故事长图':'公众号图文'} · ${ui.done?(story?(wxCanShowStory()?'成稿预览':'草图待生成'):'方案预览'):'编辑工作台'}</h2><div class="ws-sub">${story?'先确认文字，再图字一体生成 · 轻动效默认包含':'01 选排版 · 02 设计头图 · 03 整篇确认'}</div></div><div class="ws-actions"><button class="btn sm gho" onclick="wxGo(1)">返回素材</button><button class="btn sm" onclick="wsUndo()" ${ui.undo.length?'':'disabled'}>撤销</button><button class="btn sm" onclick="wsRedo()" ${ui.redo.length?'':'disabled'}>重做</button><button class="btn sm" onclick="wsVersions()">版本 · ${ui.versions.length}</button></div></header><div class="ws-grid"><section class="ws-editor" aria-label="内容编辑">${editor()}</section><main class="ws-preview"><div class="ws-preview-note"><span>${story?(wxCanShowStory()?'已有图字一体效果稿':'故事草图'):(headResult(headState().selected)?'整篇预览':'整篇预览')}</span><span>点击区域即可修改</span></div><div id="wxPhonePreview">${preview()}</div></main><aside class="ws-inspector">${story?'':tabs()}${ui.done||story?inspector():library()}</aside></div><footer class="ws-workflow-foot"><div class="ws-workflow-status">${story?(pending()?'有未应用的修改，请先应用或放弃':wxState.storyApproved?(wxCanShowStory()?'示例成图可预览 · 支持返回草图修改':'草图文字已确认 · 画面待更新'):'编辑各幕文字后，在这里确认草图'):(headResult(headState().selected)?'请核对头图与正文后确认':'排版与头图设计 · 修改后可保存版本')}</div><div class="ws-actions"><button class="btn" onclick="wsSave()">保存版本</button><button class="btn pri" onclick="wsFinish()">${ui.done?'继续修改':story?(!wxState.storyApproved?'确认草图文字':wxCanShowStory()?'确认本版':'保存已确认草图'):'确认本版'}</button></div></footer></div>`;
  }
  function mount(){
    const p=$('#wxPhonePreview');if(!p)return;
    p.onclick=e=>{const el=e.target.closest('[data-ws]');if(el){if(el.dataset.paragraph!==undefined)ui.paragraph=Number(el.dataset.paragraph);select(el.dataset.ws);}};
    p.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){const el=e.target.closest('[data-ws]');if(el){e.preventDefault();select(el.dataset.ws);}}};
  }
  function finish(){
    if(ui.done){select('overall');return;}
    if(pending())return toast('还有未应用的修改，请先应用或放弃','warn');
    if(wxState.outputMode==='story'&&!wxState.storyApproved){wxStoryApprove();if(!wxState.storyApproved)return;saveVersion('确认草图',false);render();return;}
    saveVersion(wxState.outputMode==='story'?(wxCanShowStory()?'长图示例确认版':'已确认草图（待生成）'):(headResult(headState().selected)?'图文排版确认版':'排版方案（头图待生成）'),false);ui.done=true;ui.panel='edit';render();
  }
  function versions(){ui.panel='versions';render();}
  function style(id){change('切换整体方向',()=>{wxState.visualStyle=id;wxState.coverVariant=id==='ai-visit'?0:1;});}
  function directions(){change('更换视觉方向',()=>{wxState.visualRound++;wxState.styleCandidates=wxBuildVisualStyles(wxState.approvedText,wxState.visualBrief,wxState.visualRound);wxState.visualStyle=wxState.styleCandidates[0].id;wxState.coverVariant=1;});}
  function pickTitle(i){change('选择候选标题',()=>{wxState.articleTitle=wxState.titleCandidates[i].t;wxState.titleIndex=i;wxState.coverVariant=1;delete ui.drafts.title;});}
  async function storyExample(confirmed=false){
    if(!confirmed&&(wxState.approvedText||wxState.images.length))return openDlg('<div class="pnl-h"><h3>查看长图示例？</h3></div><div class="pnl-b">将替换当前素材与会话内修改。原始文件不会删除。</div><div class="pnl-f"><button class="btn" onclick="closeAll()">取消</button><button class="btn pri" onclick="closeAll();wsStoryExample(true)">确认查看</button></div>',460);
    wxState.outputMode='story';wxLoadMaterialDemo(true);await wxGenerateArticle();
    if(cur==='wechat'&&wxState.articleReady){wxStoryApprove();ui.selected='overall';render();}
  }
  // Keep existing state entry points compatible; motion is a default, not a toggle.
  wxRefreshPhone=function(){if(wxState.step!==1){const p=$('#wxPhonePreview');if(p){p.innerHTML=preview();mount();}}};
  wxMotion=function(){wxState.coverMotion='subtle';render();};
  const priorStorySignature=wxStorySignature;
  wxStorySignature=function(){return JSON.stringify([priorStorySignature(),wxState.articleTitle,wxState.studio?.sceneNotes||{},ui.requests]);};
  const priorCanShowStory=wxCanShowStory;
  wxCanShowStory=function(){return priorCanShowStory()&&!(wxState.studio?.changedScenes||[]).length&&!ui.requests.length;};
  const priorGenerate=wxGenerateArticle;
  wxGenerateArticle=async function(refresh=false){
    if(wxState.outputMode==='story'){await priorGenerate(refresh);if(cur==='wechat'&&wxState.articleReady){init();render();}return;}
    const text=($('#wxApprovedText')?.value??wxState.approvedText).trim();if(!text)return toast('请先提供已审定正文','warn');
    const fresh=!wxState.articleReady||refresh;
    if(fresh){wxState.approvedText=text;wxState.articleHtml=wxParseApproved(text);wxState.titleCandidates=wxBuildTitles(text);wxState.articleTitle=wxBlocks(text)[0]?.text||'';wxState.titleIndex=-1;wxState.sectionTitles=wxBuildSections(text);wxState.verifiedDemo=text===WX_APPROVED_SAMPLE.trim();wxState.articleReady=true;wxState.layoutReady=true;wxState.styleCandidates=wxBuildVisualStyles(text,'',0);wxState.coverVariant=1;wxState.modules=['column','section','photo','caption'];}
    wxState.step=2;init();if(fresh){if(isSchool())seedSchool();ui.versions=[];ui.next=1;saveVersion(isSchool()?'校企图文初稿':'排版初稿',false);}render();toast(isSchool()?'已打开图文示例，可继续修改':'已载入原稿，请选择排版','warn');
  };
  const priorLoad=wxLoadMaterialDemo;wxLoadMaterialDemo=function(confirmed=false){if(confirmed||!wxState.approvedText&&!wxState.images.length)ui.source='';return priorLoad(confirmed);};
  Object.assign(window,{wsLayoutBatch:layoutBatch,wsSelect:select,wsActive:active,wsDraft:draft,wsDiscard:discard,wsApply:apply,wsUndo:undo,wsRedo:redo,wsSave:saveVersion,wsRecover:recover,wsVersions:versions,wsFinish:finish,wsStyle:style,wsNewDirections:directions,wsPickTitle:pickTitle,wsStoryExample:storyExample,wsPanel:panel,wsTemplate:template,wsPalette:palette,wsFormat:format,wsParagraph:focusParagraph,wsCapture:capture,wsFilter:filter,wsCustomColor:customColor,wsImagePicker:imagePicker,wsImagePick:imagePick,wsInsertImages:insertImages});
  ROUTES.wechat.html=page;ROUTES.wechat.init=mount;
})();
