/* Pure local layout adaptation. No model call; approved text is never rewritten. */
(() => {
  const cache=new Map();
  const catalog=window.WX_LAYOUT_LIBRARY?.templates||[];
  function parse(id){
    if(cache.has(id))return cache.get(id);
    const meta=catalog.find(t=>t.id===id)||catalog[0];
    if(!meta)return null;
    const doc=new DOMParser().parseFromString(meta.html,'text/html');
    const article=doc.querySelector('article');
    const parts=[...article.querySelectorAll('[data-component]')].filter(e=>!e.parentElement.closest('[data-component]'));
    const pre=[],groups=[];
    parts.forEach(el=>{
      if(el.matches('header,footer,.toc,.lead'))return;
      if(el.matches('.chapter,.nx-heading'))groups.push({heading:el,parts:[]});
      else (groups.length?groups[groups.length-1].parts:pre).push(el);
    });
    const value={meta,doc,article,pre,groups,parts,css:doc.querySelector('style').textContent};
    cache.set(id,value);return value;
  }
  function element(tag,cls,text){const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;}
  function attach(el,key,label){el.dataset.ws=key;el.dataset.label=label;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','修改'+label);}
  function render(id,{title,blocks,sections,images,studio,markedText,decorate,selected}){
    const t=parse(id);if(!t)return '';
    const article=t.article.cloneNode(false);article.removeAttribute('id');
    const wrapper=t.article.querySelector('.paper');const target=wrapper?article.appendChild(wrapper.cloneNode(false)):article;
    const used=new Set();let paragraphIndex=0;
    const groups=[{heading:null,paragraphs:[]}];
    blocks.slice(1).forEach(b=>{if(b.heading)groups.push({heading:b.text,paragraphs:[]});else groups[groups.length-1].paragraphs.push({text:b.text,index:paragraphIndex++});});
    const header=t.doc.querySelector('header').cloneNode(true);
    header.querySelectorAll('.eyebrow,.subtitle,.meta,.issue').forEach(e=>e.remove());
    if(header.classList.contains('header-split'))header.style.display='block';
    const heading=header.querySelector('h1');heading.textContent=title;attach(heading,'title','文章标题');
    target.append(header);
    const tocSample=t.doc.querySelector('.toc');
    if(tocSample&&groups.length>1){const toc=tocSample.cloneNode(false);toc.append(element('span','','本篇内容'));groups.slice(1).forEach((g,i)=>{const row=element('p');row.append(element('b','',String(i+1).padStart(2,'0')),element('span','',sections[i]||g.heading));toc.append(row);});target.append(toc);}
    const makeP=(b,cls='body')=>{
      const p=element('p',cls);p.innerHTML=markedText(b.text,b.index);p.dataset.paragraph=b.index;
      p.dataset.sourceParagraph=b.index;attach(p,'body','正文版式');decorate(p,b.index);
      // Defaults preserve the supplied layout; only explicit user choices override it.
      if(studio.bodyOverride){p.style.fontSize=studio.font+'px';p.style.lineHeight=studio.leading;p.style.marginTop=studio.gap+'px';p.style.marginBottom=studio.gap+'px';}
      return p;
    };
    function photo(shell,list){
      if(!list.length)return null;
      const el=shell?shell.cloneNode(true):element('figure','figure media');
      if(!shell)el.append(element('div','ph'));
      // Template labels are examples, never real captions or facts.
      el.querySelectorAll('[data-edit],figcaption').forEach(e=>e.remove());
      const slots=[...el.querySelectorAll('.ph')];
      slots.forEach((slot,i)=>{
        const x=list[i];if(!x){slot.parentElement===el?slot.remove():slot.parentElement.remove();return;}
        used.add(x.id);slot.replaceChildren();slot.removeAttribute('role');slot.removeAttribute('aria-label');slot.removeAttribute('data-slot');
        slot.classList.add('wx-inline-wrap');slot.dataset.photo=x.id;attach(slot,'photo-'+x.id,'实拍图');
        const img=element('img','phone-inline');img.src=x.src;img.alt=x.name||'确认图片';
        const spec=studio.photos[x.id]||{};
        // Source aspect ratio is the default, not the imported placeholder geometry.
        const crop=['16/9','4/3','1'].includes(spec.ratio);
        slot.dataset.imageSizing=crop?'crop':'natural';
        slot.style.removeProperty('--ratio');slot.style.setProperty('aspect-ratio',crop?spec.ratio:'auto');
        slot.style.setProperty('height','auto');slot.style.setProperty('min-height','0');
        slot.style.setProperty('align-self','start');
        img.style.objectPosition=spec.position||'center';slot.append(img);
        if(spec.caption){const caption=element('figcaption','',spec.caption);slot.insertAdjacentElement('afterend',caption);}
      });
      if(list.length===1&&slots.length>1){el.className='figure media frame';el.style.display='block';const p=el.querySelector('.wx-inline-wrap');el.replaceChildren(p);const caption=studio.photos[list[0].id]?.caption;if(caption)el.append(element('figcaption','',caption));}
      return el;
    }
    const media=t.parts.filter(p=>p.querySelector('.ph'));let mediaCursor=0;
    const explicitIds=new Set(images.filter(x=>studio.photos[x.id]?.after!==undefined&&studio.photos[x.id]?.after!=='').map(x=>x.id));
    (studio.photoGroups||[]).forEach(g=>g.ids.forEach(id=>explicitIds.add(id)));
    const automatic=images.filter(x=>!explicitIds.has(x.id));let imageCursor=0;
    function automaticPhoto(shell){const n=shell.querySelectorAll('.ph').length;const list=automatic.slice(imageCursor,imageCursor+n);imageCursor+=list.length;return photo(shell,list);}
    function modernPart(sample,paragraphs){
      const box=sample.cloneNode(true);
      if(box.hasAttribute('data-edit'))box.replaceChildren();
      const slots=[...box.querySelectorAll('p[data-edit],dd[data-edit],.nx-stack-card>span[data-edit],.nx-flowline>div>span[data-edit]')];
      let cursor=0;
      slots.forEach((slot,i)=>{const count=Math.ceil((paragraphs.length-cursor)/(slots.length-i));const items=paragraphs.slice(cursor,cursor+count);cursor+=items.length;items.forEach(b=>slot.before(makeP(b,slot.className)));slot.remove();});
      // Labels are not facts: keep only structural numbers, never sample headings or metadata.
      box.querySelectorAll('[data-edit]').forEach(e=>{if(/^\d{2}$/.test(e.textContent.trim()))e.removeAttribute('data-edit');else e.remove();});
      if(!slots.length)paragraphs.forEach(b=>box.append(makeP(b,'')));
      box.querySelectorAll('.item,.nx-stack-card,.nx-cut-card,.nx-list-row,.nx-definition-item,.nx-scene-row,.step,.fact').forEach(e=>{if(!e.querySelector('[data-source-paragraph]'))e.remove();});
      box.querySelectorAll('.fact').forEach(e=>e.style.gridTemplateColumns='minmax(0,1fr)');
      const n=box.querySelectorAll('.ph').length;
      if(n){const list=automatic.slice(imageCursor,imageCursor+n);imageCursor+=list.length;if(list.length)return photo(box,list);box.querySelectorAll('.ph').forEach(e=>e.remove());}
      if(box.matches('.nx-sidephoto,.nx-sidebar'))box.style.gridTemplateColumns='minmax(0,1fr)';
      box.querySelectorAll('.nx-scene-row').forEach(e=>e.style.gridTemplateColumns='minmax(0,1fr)');
      return box.querySelector('[data-source-paragraph],img')?box:null;
    }
    function fillParts(recipes,paragraphs,host){
      const modern=e=>+t.meta.id>20&&e.tagName!=='FIGURE'&&!e.matches('.duo,.body,.quote,.note,.steps,.fact-list');
      const textParts=recipes.filter(e=>!e.querySelector('.ph')||e.matches('.compare')||modern(e));
      let cursor=0,partIndex=0;
      recipes.forEach(sample=>{
        if(sample.querySelector('.ph')&&!sample.matches('.compare')&&!modern(sample)){const p=automaticPhoto(sample);if(p)host.append(p);return;}
        const count=Math.ceil((paragraphs.length-cursor)/Math.max(1,textParts.length-partIndex++));
        const slice=paragraphs.slice(cursor,cursor+count);cursor+=slice.length;
        if(modern(sample)){const box=modernPart(sample,slice);if(box)host.append(box);return;}
        if(sample.matches('.compare')){
          const box=sample.cloneNode(false),columns=[...sample.children];let at=0;
          columns.forEach((column,i)=>{const item=column.cloneNode(false),slot=column.querySelector('.ph');
            if(slot&&imageCursor<automatic.length){const shell=element('figure','');shell.append(slot.cloneNode(true));item.append(photo(shell,[automatic[imageCursor++]]));}
            const n=Math.ceil((slice.length-at)/(columns.length-i));slice.slice(at,at+n).forEach(b=>item.append(makeP(b)));at+=n;
            if(item.children.length)box.append(item);
          });
          if(box.children.length===1)box.style.gridTemplateColumns='minmax(0,1fr)';if(box.children.length)host.append(box);return;
        }
        if(!slice.length)return;
        if(sample.matches('.body')){slice.forEach(b=>host.append(makeP(b)));return;}
        // Reuse the actual container geometry, without inventing Q/A, dates, labels or quotations.
        const box=sample.cloneNode(false);box.removeAttribute('id');
        if(sample.matches('.quote')){
          const plain=element('section','quote');slice.forEach(b=>plain.append(makeP(b)));host.append(plain);return;
        }
        if(sample.matches('.fact-list')){
          slice.forEach(b=>{const fact=element('div','fact');fact.style.gridTemplateColumns='minmax(0,1fr)';const dd=element('dd');dd.append(makeP(b));fact.append(dd);box.append(fact);});
        }else if(sample.matches('.timeline')){
          slice.forEach(b=>{const item=element('div','event');item.append(makeP(b));box.append(item);});
        }else if(sample.matches('.steps')){
          slice.forEach((b,i)=>{const item=element('div','step');const label=element('div','step-title');label.append(element('b','',String(i+1).padStart(2,'0')));item.append(label,makeP(b));box.append(item);});
        }else if(sample.matches('.compare')){
          slice.forEach(b=>{const item=element('div');item.append(makeP(b));box.append(item);});if(slice.length===1)box.style.gridTemplateColumns='minmax(0,1fr)';
        }else{slice.forEach(b=>box.append(makeP(b,sample.matches('.qa')?'answer':'')));}
        host.append(box);
      });
      // No template slot limit may drop approved paragraphs.
      paragraphs.slice(cursor).forEach(b=>host.append(makeP(b)));
    }
    const intro=groups.shift();
    if(intro.paragraphs.length){const lead=t.doc.querySelector('.lead');target.append(makeP(intro.paragraphs[0],lead?.className||'lead'));}
    fillParts(groups.length?t.pre:(t.groups[0]?.parts||t.pre),intro.paragraphs.slice(1),target);
    groups.forEach((group,i)=>{
      const recipe=t.groups[i%Math.max(1,t.groups.length)];
      const chapter=recipe?.heading.cloneNode(true)||element('section','chapter minimal');
      chapter.removeAttribute('id');const h=chapter.querySelector('h2')||chapter.appendChild(element('h2'));
      h.textContent=sections[i]||group.heading;attach(h,'section-'+i,'小标题');
      chapter.querySelectorAll('.num,.nx-no').forEach(n=>n.textContent=String(i+1).padStart(2,'0'));chapter.querySelectorAll('.nx-sub').forEach(n=>n.remove());target.append(chapter);
      fillParts(recipe?.parts||[],group.paragraphs,target);
    });
    // No subheadings: still apply the template's first body recipe to remaining paragraphs.
    // Intro has already consumed every source paragraph above, preserving original order.
    while(imageCursor<automatic.length){const shell=media[mediaCursor++%Math.max(1,media.length)];const n=shell?.querySelectorAll('.ph').length||1;const list=automatic.slice(imageCursor,imageCursor+n);imageCursor+=list.length;const image=photo(shell,list);const ps=[...target.querySelectorAll('[data-source-paragraph]')];const anchor=ps[Math.min(ps.length-1,Math.floor(imageCursor*ps.length/(automatic.length+1)))];(anchor||target).insertAdjacentElement(anchor?'afterend':'beforeend',image);}
    const explicitRows=[],done=new Set();
    images.filter(x=>explicitIds.has(x.id)).forEach(x=>{if(done.has(x.id))return;const g=studio.photoGroups.find(g=>g.ids.includes(x.id));const list=g?g.ids.map(id=>images.find(x=>x.id===id)).filter(Boolean):[x];list.forEach(x=>done.add(x.id));explicitRows.push({list,after:g?.after??studio.photos[x.id]?.after??0});});
    const anchors=new Map();
    explicitRows.forEach(({list,after})=>{
      const shell=media.find(e=>e.querySelectorAll('.ph').length===list.length);
      const el=photo(shell,list.length>1&&!shell?[list[0]]:list);
      if(list.length>1&&!shell){list.slice(1).forEach(x=>el.append(photo(null,[x])));el.classList.add('ws-photo-pair');}else if(list.length>1)el.classList.add('ws-photo-pair');
      const ps=[...target.querySelectorAll('[data-source-paragraph]')];const index=Math.max(0,Math.min(ps.length-1,Number(after)||0));const anchor=anchors.get(index)||ps[index];
      if(anchor)anchor.insertAdjacentElement('afterend',el);else target.append(el);anchors.set(index,el);
    });
    article.querySelectorAll('[data-edit],[id]').forEach(e=>{e.removeAttribute('data-edit');e.removeAttribute('id');});
    article.querySelectorAll('[data-ws]').forEach(e=>e.classList.toggle('ws-selected',e.dataset.ws===selected));
    return article.outerHTML;
  }
  // Scope every supplied CSS selector. No imported body/html/global rule can affect the app.
  function scopedCSS(){
    if(!catalog.length)return '';
    // New imports can extend CSS; keep every unique rule, not only template 01's stylesheet.
    const cssTexts=[...new Set(catalog.map(t=>parse(t.id).css))];
    const probe=document.createElement('style');probe.media='not all';probe.textContent=cssTexts.join('\n');document.head.append(probe);const sheet=probe.sheet;
    const scope='.ws .ws-layout-content';
    const walk=rules=>[...rules].map(r=>{
      if(r.selectorText){const sels=r.selectorText.split(',').map(s=>{s=s.trim();if(s==='html'||s==='body')return scope;return scope+' '+s;});return sels.join(',')+'{'+r.style.cssText+'}';}
      if(r.cssRules)return r.cssText.slice(0,r.cssText.indexOf('{')+1)+walk(r.cssRules)+'}';return '';
    }).join('\n');
    const css=walk(sheet.cssRules);probe.remove();return css;
  }
  window.WXLocalLayouts={catalog,parse,render,scopedCSS};
})();
