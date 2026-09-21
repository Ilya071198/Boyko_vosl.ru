/* VOSL homepage. Progressive enhancement; no framework and no build step.
   Public content is in index.html. Config and structured content are separate.
   Forms never simulate successful submission; demo mode does not transmit data. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const config = window.VOSL_CONFIG || { mode: 'demo', maxFileBytes: 10485760 };
  const data = window.VOSL_DATA || { projects: [], cases: [], materials: [] };
  const projectById = new Map(data.projects.map(p => [p.id, p]));
  const caseById = new Map(data.cases.map(c => [c.id, c]));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 700px)');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    out: '<path d="M7 17 17 7M7 7h10v10"/>',
    heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    play: '<path d="m9 5 11 7-11 7Z"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
  const external = (url, text, cls = 'text-link') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}${icon('out')}</a>`;
  const asset = name => window.VOSL_ASSETS?.[String(name).replace(/^assets\//,'')] || (/^(https?:|data:)/.test(name) || name.startsWith('assets/') ? name : `assets/${name}`);
  const area = n => Number(n).toLocaleString('ru-RU', {maximumFractionDigits:2});
  const storage = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(`vosl.v14.${key}`)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(`vosl.v14.${key}`, JSON.stringify(value)); } catch { /* Private browsing / storage disabled. State still works in memory. */ } },
    clear() { ['favorites','region','analytics'].forEach(k => { try { localStorage.removeItem(`vosl.v14.${k}`); } catch {} }); }
  };
  let saved = new Set((Array.isArray(storage.get('favorites', [])) ? storage.get('favorites', []) : []).filter(id => projectById.has(id)));
  const allowedRegions = ['Москва и область', 'Вологда и область', 'Другой регион'];
  let region = storage.get('region', allowedRegions[0]);
  if (!allowedRegions.includes(region)) region = allowedRegions[0];
  let analyticsConsent = storage.get('analytics', false) === true;
  let toastTimer;
  function toast(message) {
    const el = $('.toast'); if (!el) return;
    clearTimeout(toastTimer); el.textContent = message; el.classList.add('visible');
    toastTimer = setTimeout(() => el.classList.remove('visible'), 3400);
  }
  // Only non-personal, allowlisted interaction parameters leave this function.
  function track(event, detail = {}) {
    const safe = {};
    ['project_id','case_id','material_id','form_type','region_group','filter','scope'].forEach(k => {
      if (typeof detail[k] === 'string') safe[k] = detail[k].slice(0,80);
    });
    document.dispatchEvent(new CustomEvent('vosl:interaction', { detail: {event, ...safe} }));
    if (!analyticsConsent || !config.analytics?.enabled) return;
    if (typeof window.ym === 'function' && config.analytics.metrikaId) window.ym(config.analytics.metrikaId, 'reachGoal', event, safe);
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({event: `vosl_${event}`, ...safe});
  }
  window.VOSL = Object.freeze({ version: config.version, setAnalyticsConsent(value) {
    analyticsConsent = value === true; storage.set('analytics', analyticsConsent);
  } });

  // Native dialogs provide focus trapping and Escape handling. Do not stack them.
  let lastTrigger = null;
  $$('[data-dialog]').forEach(b=>{b.setAttribute('aria-controls',b.dataset.dialog);b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');});
  function openDialog(id, trigger) {
    const dialog = document.getElementById(id); if (!dialog) return;
    const previousTrigger = lastTrigger;
    $$('dialog[open]').forEach(d => d.close());
    lastTrigger = (trigger?.closest('dialog') ? previousTrigger : trigger) || previousTrigger || document.activeElement;
    document.body.classList.add('dialog-open');
    $$('[data-dialog]').forEach(b=>{if(b.dataset.dialog===id)b.setAttribute('aria-expanded','true');});
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
    dialog.scrollTop = 0;
    requestAnimationFrame(() => { ($('[data-close]',dialog) || dialog).focus({preventScroll:true}); });
  }
  function closeDialog(dialog, restore = true) {
    if (!dialog) return;
    if (!restore) lastTrigger = null;
    if (typeof dialog.close === 'function') dialog.close(); else { dialog.removeAttribute('open'); document.body.classList.remove('dialog-open'); }
  }
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('click', e => { if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) closeDialog(dialog);
    } });
    dialog.addEventListener('close', () => {
      $$('[data-dialog]').forEach(b=>{if(b.dataset.dialog===dialog.id)b.setAttribute('aria-expanded','false');});
      if (dialog.id === 'video-dialog') $('#video-frame').replaceChildren();
      if (!document.querySelector('dialog[open]')) {
        document.body.classList.remove('dialog-open');
        const trigger = lastTrigger; lastTrigger = null;
        if (trigger?.isConnected && trigger.getClientRects().length) trigger.focus({preventScroll:true});
      }
      updateBar();
    });
  });
  function fallbackImage(img) {
    if (img.dataset.fallbackUsed) return;
    const frame=img.closest('.case-image');
    if(frame){frame.dataset.photoState='failed';const placeholder=frame.querySelector('.case-photo-fallback');if(placeholder){placeholder.hidden=false;img.style.opacity='0';}}
    img.dataset.fallbackUsed = 'true'; img.src = asset('photo-unavailable.svg');
    const label=img.closest('.case-image,.quick-image')?.querySelector('.image-label');if(label)label.textContent='Фото в исходном отчете';
    img.removeAttribute('srcset'); img.alt = 'Фото не загрузилось. Оригинал доступен в фотоотчете объекта.';
  }
  document.addEventListener('error', e => { if (e.target.tagName === 'IMG' && (e.target.dataset.fallback || /vosl\.ru/.test(e.target.src))) fallbackImage(e.target); }, true);
  $$('img[data-remote=true]').forEach(img => {
    const ready=()=>{if(!img.dataset.fallbackUsed){const frame=img.closest('.case-image');if(frame){frame.dataset.photoState='ready';const placeholder=frame.querySelector('.case-photo-fallback');if(placeholder)placeholder.hidden=true;}}};
    img.addEventListener('load',ready,{once:true});
    if (!config.remotePhotos || (img.complete && !img.naturalWidth)) fallbackImage(img);
    else if(img.complete&&img.naturalWidth) ready();
    // No indefinite blank card when a host is unreachable or an image request hangs.
    if ('IntersectionObserver' in window) {
      const watcher=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){watcher.disconnect();setTimeout(()=>{if(!img.complete||!img.naturalWidth)fallbackImage(img);},6000);}});
      watcher.observe(img);
    } else { setTimeout(()=>{if(!img.complete||!img.naturalWidth)fallbackImage(img);},6000); }
  });

  // Catalog: material is an explicit quote preference, not invented availability.
  const cards = $$('.project-card', $('#projects-grid'));
  let category = 'house', expanded = false;
  function projectWord(n) { return n === 1 ? 'проект' : n > 1 && n < 5 ? 'проекта' : 'проектов'; }
  function filterCatalog() {
    const a = $('#area-filter').value, sort = $('#sort-filter').value;
    let results = cards.filter(c => {
      const n = Number(c.dataset.area);
      return c.dataset.type.split(',').includes(category) &&
        (a === 'all' || a === 'small' && n <= 120 || a === 'medium' && n > 120 && n <= 180 || a === 'large' && n > 180);
    });
    if (sort !== 'default') results.sort((a,b) => (Number(a.dataset.area) - Number(b.dataset.area)) * (sort === 'asc' ? 1 : -1));
    const limit = narrow.matches && !expanded ? 3 : Infinity;
    cards.forEach(c => { c.hidden = true; });
    results.forEach((c, i) => { $('#projects-grid').append(c); c.hidden = i >= limit; c.classList.remove('is-waiting'); c.classList.add('is-visible'); });
    $('#catalog-empty').hidden = results.length !== 0;
    $('#show-more').hidden = results.length <= limit;
    $('#show-more').textContent = `Показать еще ${Math.max(0, results.length - 3)} ${projectWord(results.length-3)}`;
    $('#catalog-status').innerHTML = `${results.length} ${projectWord(results.length)} в подборке <span>· Стоимость рассчитывается по комплектации</span>`;
    $$('[data-type-filter]').forEach(b => { const selected=b.dataset.typeFilter===category; b.classList.toggle('active',selected); b.setAttribute('aria-pressed',String(selected)); });
  }
  function setCategory(type) { category = ['house','bath','gazebo'].includes(type) ? type : 'house'; expanded=false; filterCatalog(); track('catalog_type',{filter:category}); }
  function resetCatalog() { $('#area-filter').value='all'; $('#material-filter').value=''; $('#sort-filter').value='default'; setCategory('house'); }
  ['area-filter','sort-filter'].forEach(id => $('#'+id).addEventListener('change', () => { expanded=false;filterCatalog();track('catalog_filter',{filter:id}); }));
  $('#material-filter').addEventListener('change', () => { if ($('#material-filter').value) toast('Материал будет передан как пожелание для расчета.'); });
  $('#show-more').addEventListener('click', () => { expanded=true; filterCatalog(); });
  $('.filter-toggle').addEventListener('click', e => { const b=e.currentTarget; const on=b.getAttribute('aria-expanded')!=='true'; b.setAttribute('aria-expanded',String(on)); $('#catalog-filters').classList.toggle('open',on); });
  narrow.addEventListener('change',filterCatalog);
  $('#filter-reset').addEventListener('click',resetCatalog);

  function updateSaved() {
    storage.set('favorites',[...saved]);
    $$('.favorite-count,[data-saved-count]').forEach(el => { el.textContent=String(saved.size); });
    $$('[data-favorite]').forEach(b => {
      const on=saved.has(b.dataset.favorite), p=projectById.get(b.dataset.favorite);
      b.setAttribute('aria-pressed',String(on));
      b.setAttribute('aria-label',`${on?'Убрать из избранного:':'Сохранить проект:'} ${p?.name || ''}`);
    });
    const list = $('#favorites-list');
    list.innerHTML = saved.size ? [...saved].map(id => {
      const p=projectById.get(id);
      return `<article class="saved-item"><img src="${esc(asset(p.image))}" alt="Визуализация ${esc(p.name)}" width="105" height="75"><div><h3>${esc(p.name)}</h3><p>${area(p.area)} м² · ${esc(p.dimensions)}</p><button class="text-link" data-quick="${id}">Посмотреть${icon('out')}</button></div><button class="icon-btn" data-remove-saved="${id}" aria-label="Убрать ${esc(p.name)}">${icon('close')}</button></article>`;
    }).join('') : `<div class="saved-empty">${icon('heart')}<h3>Соберите свою подборку</h3><p>Нажмите на сердечко в карточке проекта. Здесь останутся варианты для сравнения.</p><button class="text-link" data-close>Перейти к выбору${icon('arrow')}</button></div>`;
    $('.favorites-actions').hidden = !saved.size;
  }
  function toggleSaved(id) {
    if (!projectById.has(id)) return;
    const focusedId = document.activeElement?.dataset.removeSaved;
    const had=saved.has(id); had?saved.delete(id):saved.add(id);
    updateSaved();toast(had?'Проект убран из избранного':'Проект сохранен в вашу подборку');
    if (focusedId) ($('#favorites-list [data-remove-saved]') || $('#favorites-dialog [data-close]')).focus();
    track('favorite_toggle',{project_id:id});
  }
  function openProject(id, trigger) {
    const p=projectById.get(id); if(!p)return;
    $('#quick-content').innerHTML=`<div class="quick-layout"><div class="quick-image"><img src="${esc(asset(p.image))}" alt="Визуализация проекта ${esc(p.name)}"><span class="image-label">Визуализация проекта</span></div><div class="quick-copy"><p class="eyebrow">${p.type==='gazebo'?'ПРОЕКТ БЕСЕДКИ':p.type.includes('bath')?'ПРОЕКТ ДОМА-БАНИ':'ПРОЕКТ ДЕРЕВЯННОГО ДОМА'}</p><h2 id="quick-title">${esc(p.name)}</h2><div class="quick-facts"><div><small>Площадь</small><strong>${area(p.area)} м²</strong></div><div><small>Габариты</small><strong>${esc(p.dimensions)}</strong></div></div><p>${esc(p.description)}</p><p class="quick-price">Стоимость: <strong>по индивидуальному расчету</strong></p><div class="quick-actions"><button class="btn" data-quote="Проект: ${esc(p.name)}">Обсудить этот проект${icon('arrow')}</button><button class="icon-btn" data-favorite="${p.id}" aria-pressed="${saved.has(p.id)}" aria-label="Сохранить ${esc(p.name)}">${icon('heart')}</button></div><div class="quick-links">${external(p.url,'Проект и планировки')}${p.plan?external(p.plan,'Открыть оригинал планировки'):''}${p.related?external(p.related,'Посмотреть реализованный объект'):''}</div><p class="fine-print">Материал, состав работ и актуальную стоимость согласуем отдельно. Параметры – из каталога компании.</p></div></div>`;
    openDialog('quick-dialog',trigger);track('project_quick_view',{project_id:id});
  }
  function openCase(id,trigger) {
    const c=caseById.get(id);if(!c)return;
    $('#case-content').innerHTML=`<div class="quick-layout"><div class="quick-image"><img src="${esc(asset(c.image))}" data-fallback="assets/photo-unavailable.svg" alt="${esc(c.name)}: фотография из портфолио"><span class="image-label">Фото объекта компании</span></div><div class="quick-copy"><p class="eyebrow">${esc(c.region)}</p><h2 id="case-dialog-title">${esc(c.name)}</h2><div class="quick-facts"><div><small>Объект</small><strong>${esc(c.area)}</strong></div></div><p>${esc(c.scope)}</p><ol class="quick-photo-list">${c.steps.map(t=>`<li>${icon('check')}${esc(t)}</li>`).join('')}</ol><div class="quick-actions">${external(c.url,'Открыть полный фотоотчет')}<button class="btn" data-quote="Похожий дом: ${esc(c.name)}">Рассчитать похожий дом${icon('arrow')}</button></div></div></div>`;
    openDialog('case-dialog',trigger);track('case_view',{case_id:id});
  }
  function setQuote(text) {
    $$('dialog[open]').forEach(d=>closeDialog(d,false));
    const form=$('form[data-form="project-request"]');
    const preference=$('#material-filter').value;
    const context=text+(preference&&!text.includes(preference)?` · Пожелание по материалу: ${preference}`:'');
    form.elements.context.value=context; if(formState.has(form)) formState.get(form).id=uuid();
    $('.form-context',form).hidden=false; $('.form-context>span',form).textContent=context;
    $('#inquiry').scrollIntoView({behavior:reducedMotion.matches?'auto':'smooth',block:'start'});
    $('.form-card', $('#inquiry')).classList.add('highlight-card');
    setTimeout(()=>$('.form-card', $('#inquiry')).classList.remove('highlight-card'),1500);
    setTimeout(()=>form.elements.phone.focus({preventScroll:true}),reducedMotion.matches?0:450);
  }
  $('#quote-favorites').addEventListener('click',()=>setQuote('Подборка проектов: '+[...saved].map(id=>projectById.get(id).name).join(', ')));
  $('#download-favorites').addEventListener('click',()=>{
    const text='Вологодский Северный Лес\nИзбранные проекты\n\n'+[...saved].map(id=>{const p=projectById.get(id);return `${p.name}\n${area(p.area)} м² · ${p.dimensions}\n${p.url}\nСтоимость рассчитывается по комплектации.`;}).join('\n\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='VOSL-моя-подборка.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    track('favorite_download');
  });
  window.addEventListener('storage',e=>{if(e.key==='vosl.v14.favorites'){const v=storage.get('favorites',[]);saved=new Set((Array.isArray(v)?v:[]).filter(id=>projectById.has(id)));updateSaved();}});

  function selectMaterial(id,focus=false) {
    if(!data.materials.some(m=>m.id===id))return;
    $$('[data-material]').forEach(b=>{const on=b.dataset.material===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
    $$('.material-panel').forEach(p=>{p.hidden=p.id!==`panel-${id}`;});
    if($('#material-mobile-select'))$('#material-mobile-select').value=id;
    if(focus)$(`#tab-${id}`).focus();
    track('material_view',{material_id:id});
  }
  $('#material-mobile-select')?.addEventListener('change',e=>selectMaterial(e.target.value));
  $('.material-tabs').addEventListener('keydown',e=>{
    if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    const list=$$('[data-material]'), i=list.indexOf(e.target);if(i<0)return;
    e.preventDefault();const idx=e.key==='Home'?0:e.key==='End'?list.length-1:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+list.length)%list.length;
    selectMaterial(list[idx].dataset.material,true);
  });
  const scopes=[
    ['Домокомплект','Изготовление деревянной части дома по проекту. Подходит, когда строительство организуете отдельно.'],
    ['Домокомплект со сборкой','Обсудим изготовление деталей, доставку, сборку и кровлю. Основание и подготовка участка отражаются в отдельном расчете.'],
    ['Строительство с отделкой','Спланируем последующие работы с учетом материала и проекта. Отделка и инженерия согласуются отдельно, а не включаются в цену автоматически.']
  ];
  function selectScope(i) {
    if(!scopes[i])return;
    $$('[data-scope]').forEach(b=>{const on=Number(b.dataset.scope)===i;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    $('#scope-title').textContent=scopes[i][0];$('#scope-description').textContent=scopes[i][1];$('.scope-count').textContent=`0${i+1} / 03`;
    $('#scope-quote').dataset.quote='Комплектация: '+scopes[i][0];
    $('.scope-table').classList.remove('scope-1','scope-2');if(i>0)$('.scope-table').classList.add(`scope-${i}`);
    $('.scope-table').dataset.active=String(i);
    track('scope_select',{scope:String(i)});
  }
  function updateRegion() {
    $$('[data-region-label]').forEach(el=>el.textContent=region);
    $$('.region-option').forEach(b=>{const on=b.dataset.region===region;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  }

  // Offline scheme + a true geographical tile layer. No requests to map provider until explicit click.
  let mapGroup='moscow', selectedCase='klin', liveMap=null;
  function selectCaseOnMap(id) {
    const c=caseById.get(id);if(!c)return;selectedCase=id;
    $$('[data-map-case]').forEach(el=>{const on=el.dataset.mapCase===id;el.classList.toggle('active',on);el.setAttribute('aria-pressed',String(on));});
    $('#map-detail').innerHTML=`<p class="eyebrow">ВЫБРАННЫЙ ОБЪЕКТ</p><h3>${esc(c.name)}</h3><p>${esc(c.material)} · ${esc(c.area)}</p><button class="text-link" data-case="${c.id}">Посмотреть объект${icon('out')}</button>`;
    if(liveMap)liveMap.draw();
    track('map_case_select',{case_id:id});
  }
  function filterMap(group) {
    mapGroup=group;
    $$('[data-map-filter]').forEach(b=>{const on=b.dataset.mapFilter===group;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    $$('.map-list-item').forEach(b=>b.hidden=group!=='all'&&caseById.get(b.dataset.mapCase).group!==group);
    $$('.map-pin').forEach(b=>{const on=group==='all'||caseById.get(b.dataset.mapCase).group===group;b.classList.toggle('dim',!on);});
    const candidate=data.cases.find(c=>group==='all'||c.group===group);
    if(candidate&&(group!=='all'&&caseById.get(selectedCase).group!==group))selectCaseOnMap(candidate.id);
    if(liveMap)liveMap.reset(group);
    track('map_region',{region_group:group});
  }
  // Lightweight Web Mercator viewer, normal browser caching, no offline tile downloads.
  function createLiveMap() {
    const canvas=$('#map-canvas');const panel=document.createElement('div');panel.className='online-map';
    panel.innerHTML=`<div class="map-viewport" tabindex="0" role="region" aria-label="Географическая карта. Стрелки перемещают карту, плюс и минус меняют масштаб."><div class="map-tiles"></div><div class="map-markers"></div></div><div class="online-map-controls"><button class="icon-btn" data-map-zoom="1" aria-label="Приблизить карту">+</button><button class="icon-btn" data-map-zoom="-1" aria-label="Отдалить карту">−</button><button class="map-close" type="button">Вернуться к схеме</button></div><a class="map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a><p class="map-offline" hidden>Карта недоступна. Список объектов и схема работают без подключения.</p><span class="map-accuracy">Точки на уровне населенных пунктов, не адреса домов</span>`;
    canvas.append(panel);
    const viewport=$('.map-viewport',panel), tiles=$('.map-tiles',panel), markers=$('.map-markers',panel);
    let lat=56.1,lon=37.45,z=7, raf=0,fail=0,ok=0,disposed=false;
    const point=(lt,ln,zoom)=>{const s=256*2**zoom, rad=Math.min(85,Math.max(-85,lt))*Math.PI/180;return [(ln+180)/360*s,(1-Math.log(Math.tan(rad)+1/Math.cos(rad))/Math.PI)/2*s];};
    const inverse=(x,y,zoom)=>{const s=256*2**zoom;return [Math.atan(Math.sinh(Math.PI*(1-2*y/s)))*180/Math.PI,x/s*360-180];};
    const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);};
    function draw() {
      if(disposed)return; const w=viewport.clientWidth,h=viewport.clientHeight,center=point(lat,lon,z),left=center[0]-w/2,top=center[1]-h/2;
      tiles.replaceChildren();markers.replaceChildren();fail=0;ok=0;
      const startX=Math.floor(left/256),endX=Math.floor((left+w)/256),startY=Math.floor(top/256),endY=Math.floor((top+h)/256);
      for(let y=startY;y<=endY;y++)for(let x=startX;x<=endX;x++){
        if(y<0||y>=2**z)continue;const xx=((x%2**z)+2**z)%2**z;
        const img=new Image();img.width=256;img.height=256;img.alt='';img.draggable=false;img.style.left=`${x*256-left}px`;img.style.top=`${y*256-top}px`;
        img.onload=()=>{ok++;$('.map-offline',panel).hidden=true;};img.onerror=()=>{fail++;if(!ok&&fail>=2)$('.map-offline',panel).hidden=false;};
        img.src=(config.mapTiles||'https://tile.openstreetmap.org/{z}/{x}/{y}.png').replace('{z}',z).replace('{x}',xx).replace('{y}',y);tiles.append(img);
      }
      data.cases.filter(c=>mapGroup==='all'||c.group===mapGroup).forEach(c=>{
        const xy=point(c.point[0],c.point[1],z);const b=document.createElement('button');b.className='geo-marker'+(c.id===selectedCase?' active':'');b.dataset.mapCase=c.id;b.setAttribute('aria-label',`${c.name}, приблизительное расположение`);b.setAttribute('aria-pressed',String(c.id===selectedCase));b.style.left=`${xy[0]-left}px`;b.style.top=`${xy[1]-top}px`;b.innerHTML=`<span>${data.cases.indexOf(c)+1}</span><small>${esc(c.name.replace('Дом в ',''))}</small>`;markers.append(b);
      });
    }
    function reset(group) { if(group==='vologda'){lat=59.7;lon=40.65;z=7;}else if(group==='all'){lat=58.1;lon=39;z=6;}else{lat=56.15;lon=37.2;z=8;}schedule(); }
    let drag=null;
    viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.pointerType!=='mouse'||e.button!==0)return;const p=point(lat,lon,z);drag={x:e.clientX,y:e.clientY,px:p[0],py:p[1]};viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');});
    viewport.addEventListener('pointerup',e=>{if(!drag)return;const p=inverse(drag.px-(e.clientX-drag.x),drag.py-(e.clientY-drag.y),z);lat=p[0];lon=p[1];drag=null;viewport.classList.remove('dragging');schedule();});
    viewport.addEventListener('pointercancel',()=>{drag=null;viewport.classList.remove('dragging');});
    viewport.addEventListener('keydown',e=>{
      if(e.target.closest('button'))return;
      if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','-','='].includes(e.key))return;e.preventDefault();
      if(['+','-','='].includes(e.key))z=Math.max(4,Math.min(11,z+(e.key==='-'?-1:1)));
      else{const p=point(lat,lon,z);if(e.key==='ArrowLeft')p[0]-=128;if(e.key==='ArrowRight')p[0]+=128;if(e.key==='ArrowUp')p[1]-=128;if(e.key==='ArrowDown')p[1]+=128;[lat,lon]=inverse(...p,z);}schedule();
    });
    $$('[data-map-zoom]',panel).forEach(b=>b.onclick=()=>{z=Math.max(4,Math.min(11,z+Number(b.dataset.mapZoom)));schedule();});
    $('.map-close',panel).onclick=()=>{disposed=true;ro.disconnect();cancelAnimationFrame(raf);panel.remove();liveMap=null;$('#load-map').focus();};
    const ro=new ResizeObserver(schedule);ro.observe(viewport);reset(mapGroup);
    return {draw:schedule,reset};
  }
  function createEmbeddedMap() {
    // file:// has no HTTP Referer. Let OSM's own embedded viewer request its tiles.
    const panel=document.createElement('div');panel.className='online-map';
    panel.innerHTML='<iframe title="Карта региона OpenStreetMap" class="osm-frame" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe><div class="online-map-controls"><button class="map-close" type="button">Вернуться к схеме</button></div><span class="map-accuracy">Маркер показывает населенный пункт, не адрес частного дома</span>';
    $('#map-canvas').append(panel);
    function draw(){const c=caseById.get(selectedCase);const lat=mapGroup==='all'?58.1:c.point[0],lon=mapGroup==='all'?39.2:c.point[1];const range=mapGroup==='all'?4.8:mapGroup==='vologda'?1.4:.7;const bbox=[lon-range,lat-range*.6,lon+range,lat+range*.6].join(',');$('iframe',panel).src='https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(bbox)+'&layer=mapnik&marker='+c.point[0]+','+c.point[1];}
    $('.map-close',panel).onclick=()=>{panel.remove();liveMap=null;$('#load-map').focus();};draw();return {draw,reset:draw};
  }
  $('#load-map').addEventListener('click',()=>{if(!liveMap)liveMap=/^https?:$/.test(location.protocol)?createLiveMap():createEmbeddedMap();track('map_load');});
  $('#map-reset').addEventListener('click',()=>filterMap('all'));
  $$('.map-pin').forEach(p=>p.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();selectCaseOnMap(p.dataset.mapCase);}}));

  function openVideo(button) {
    const id=button.dataset.video;if(!/^[a-zA-Z0-9_-]{11}$/.test(id))return;
    const title=button.dataset.videoTitle||'Видео компании';$('#video-title').textContent=title;$('#video-external').href=`https://www.youtube.com/watch?v=${id}`;
    $('#video-frame').innerHTML=`<div class="video-consent"><span class="video-consent-icon">${icon('play')}</span><h3>Посмотреть видео компании</h3><p>Нажатие загрузит плеер YouTube. Сервис получит данные подключения. Можно открыть оригинал по ссылке ниже.</p><button class="btn btn--light" id="video-consent-button">Загрузить видео${icon('play')}</button></div>`;
    $('#video-consent-button').onclick=()=>{const iframe=document.createElement('iframe');iframe.src=`https://www.youtube-nocookie.com/embed/${id}?rel=0`;iframe.title=title;iframe.allow='encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';$('#video-frame').replaceChildren(iframe);track('video_load');};
    openDialog('video-dialog',button);
  }
  // Forms. All feedback is inline and preserved when a network request fails.
  const live = config.mode==='live' && /^https?:$/.test(location.protocol) && !!config.privacyUrl && !!config.consentUrl && !!config.consentVersion;
  function uuid() { return globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);}); }
  const phoneValue=value=>{let n=value.replace(/\D/g,'');if(n.length===11&&n[0]==='8')n='7'+n.slice(1);if(n.length===10)n='7'+n;return n.length>=11&&n.length<=15&&!/^([0-9])\1+$/.test(n)?'+'+n:null;};
  const formState=new WeakMap();
  function validateFile(file, form) {
    const error=$('.file-error',form);if(!error)return true;
    let msg='';
    if(file&&!/\.(pdf|jpe?g|png)$/i.test(file.name))msg='Подойдет файл PDF, JPG или PNG.';
    else if(file&&file.size>(config.maxFileBytes||10485760))msg='Размер файла не должен превышать 10 МБ.';
    else if(file&&file.size===0)msg='Файл пуст. Выберите другой.';
    error.textContent=msg;return !msg;
  }
  function renderFile(form) {
    const input=form.elements.attachment;if(!input)return;const file=input.files[0];
    const box=$('.file-chosen',form);box.hidden=!file;
    $('span',box).textContent=file?`${file.name} · ${(file.size/1024/1024).toFixed(2)} МБ`:'';
    validateFile(file,form);
  }
  function setFieldError(input,error,message) { if(error)error.textContent=message;input.setAttribute('aria-invalid',message?'true':'false'); }
  $$('.lead-form').forEach(form=>{
    formState.set(form,{id:uuid(),submitting:false});
    const submit=$('[type=submit]',form), status=$('.form-status',form);
    if(!live){submit.innerHTML=`Проверить заявку${icon('arrow')}`;$('.demo-note',form).textContent='Демо: проверка формы без отправки. Используйте тестовые данные.';}
    else{
      $('.demo-note',form).textContent='Заявка отправляется в компанию по защищенному соединению.';
      const consentButton=$('[data-privacy]',form);const link=document.createElement('a');link.href=config.consentUrl;link.target='_blank';link.rel='noopener';link.className='inline-button';link.textContent='условиями обработки данных';consentButton.replaceWith(link);
    }
    form.addEventListener('input',()=>{const state=formState.get(form);if(!state.submitting){state.id=uuid();status.textContent='';status.className='form-status';}});
    form.elements.phone.addEventListener('blur',()=>{const input=form.elements.phone;if(!input.value)return;const value=phoneValue(input.value);setFieldError(input,$('.field-error',input.parentElement),value?'':'Введите полный номер телефона с кодом страны.');if(value&&value.length===12&&value.startsWith('+7'))input.value=`+7 (${value.slice(2,5)}) ${value.slice(5,8)}-${value.slice(8,10)}-${value.slice(10,12)}`;});
    if(form.elements.attachment){
      const input=form.elements.attachment;input.addEventListener('change',()=>renderFile(form));
      const drop=$('.file-drop',form);
      ['dragenter','dragover'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('is-dragging');}));
      ['dragleave','drop'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove('is-dragging');}));
      drop.addEventListener('drop',e=>{const file=e.dataTransfer?.files?.[0];if(!file)return;if(e.dataTransfer.files.length>1){$('.file-error',form).textContent='Приложите один файл. Несколько страниц можно объединить в PDF.';return;}if(!validateFile(file,form))return;try{const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;formState.get(form).id=uuid();renderFile(form);}catch{toast('Используйте кнопку выбора файла.');}});
    }
    form.addEventListener('submit',async e=>{
      e.preventDefault();const state=formState.get(form);if(state.submitting)return;
      status.textContent='';const phone=phoneValue(form.elements.phone.value);
      setFieldError(form.elements.phone,$('.field-error',form.elements.phone.parentElement),phone?'':'Введите полный номер телефона с кодом страны.');
      const consent=form.elements.consent.checked;$('.consent-error',form).textContent=consent?'':'Для продолжения отметьте согласие.';form.elements.consent.setAttribute('aria-invalid',String(!consent));
      const file=form.elements.attachment?.files[0],fileOk=validateFile(file,form);
      if(!phone||!consent||!fileOk){(!phone?form.elements.phone:!fileOk?form.elements.attachment:form.elements.consent).focus();return;}
      if(form.elements.website.value){status.textContent='Не удалось проверить заявку. Обновите страницу.';return;}
      if(!live){status.className='form-status demo-valid';status.textContent='Проверка пройдена. Это демонстрация: заявка и файл НЕ отправлены. В рабочей версии здесь появится подтверждение приема сервером.';track('form_demo_valid',{form_type:form.dataset.form});return;}
      const endpoint=new URL(config.leadEndpoint,location.href),tokenUrl=new URL(config.tokenEndpoint,location.href);
      if(endpoint.origin!==location.origin||tokenUrl.origin!==location.origin){status.textContent='Адрес приема заявок настроен неверно. Свяжитесь с компанией по телефону.';return;}
      state.submitting=true;submit.disabled=true;form.setAttribute('aria-busy','true');
      const label=submit.innerHTML;submit.innerHTML='Отправляем…';
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),config.requestTimeoutMs||25000);
      try{
        const tokenResponse=await fetch(tokenUrl.href,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
        const t=await tokenResponse.json();if(!tokenResponse.ok||!t.token)throw new Error('Прием заявок пока не настроен. Позвоните в компанию или напишите на почту.');
        const payload=new FormData(form);payload.set('phone',phone);payload.set('form_type',form.dataset.form);payload.set('region',region);payload.set('request_id',state.id);payload.set('csrf_token',t.token);payload.set('consent_version',config.consentVersion);payload.set('page',location.origin+location.pathname);payload.set('material_preference',$('#material-filter').value);
        const response=await fetch(endpoint.href,{method:'POST',body:payload,credentials:'same-origin',signal:controller.signal,headers:{'Accept':'application/json'}});
        let result;try{result=await response.json();}catch{throw new Error('Сервер не подтвердил прием. Данные сохранены в полях, попробуйте еще раз.');}
        if(!response.ok||result.accepted!==true||!result.request_id)throw new Error(result.message||'Не удалось отправить заявку. Попробуйте еще раз или позвоните.');
        status.className='form-status success';status.textContent=`Заявка принята. Номер ${result.request_id.slice(0,8)}. Компания получила ваши исходные данные для обращения.`;
        form.reset();renderFile(form);$('.form-context',form).hidden=true;state.id=uuid();track('lead_accepted',{form_type:form.dataset.form});
      }catch(error){status.className='form-status error';status.textContent=error.name==='AbortError'?'Ответ задержался. Введенное осталось в форме. Повторите отправку: номер запроса сохранен для защиты от дублей.':error.message;}
      finally{clearTimeout(timeout);state.submitting=false;submit.disabled=false;submit.innerHTML=label;form.removeAttribute('aria-busy');}
    });
  });
  // One delegated listener covers both static controls and dynamically rendered dialogs.
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a,[role=button]');if(!b)return;
    if(b.hasAttribute('data-close')){e.preventDefault();closeDialog(b.closest('dialog'));}
    else if(b.dataset.dialog){e.preventDefault();if(b.dataset.dialog==='favorites-dialog')updateSaved();openDialog(b.dataset.dialog,b);}
    else if(b.dataset.typeFilter){setCategory(b.dataset.typeFilter);}
    else if(b.dataset.typeLink){setCategory(b.dataset.typeLink);}
    else if(b.hasAttribute('data-reset-catalog'))resetCatalog();
    else if(b.dataset.favorite||b.dataset.removeSaved)toggleSaved(b.dataset.favorite||b.dataset.removeSaved);
    else if(b.dataset.quick)openProject(b.dataset.quick,b);
    else if(b.dataset.case)openCase(b.dataset.case,b);
    else if(b.dataset.quote){e.preventDefault();setQuote(b.dataset.quote);}
    else if(b.dataset.material)selectMaterial(b.dataset.material);
    else if(b.dataset.scope!==undefined)selectScope(Number(b.dataset.scope));
    else if(b.classList.contains('region-option')){region=b.dataset.region;storage.set('region',region);updateRegion();closeDialog(b.closest('dialog'));toast('Регион обращения: '+region);}
    else if(b.dataset.mapFilter)filterMap(b.dataset.mapFilter);
    else if(b.dataset.mapCase)selectCaseOnMap(b.dataset.mapCase);
    else if(b.dataset.video)openVideo(b);
    else if(b.hasAttribute('data-privacy')){if(live)window.open(config.privacyUrl,'_blank','noopener');else openDialog('privacy-dialog',b);}
    else if(b.hasAttribute('data-remove-file')){const f=b.closest('form');f.elements.attachment.value='';renderFile(f);formState.get(f).id=uuid();}
    else if(b.hasAttribute('data-clear-context')){const f=b.closest('form');f.elements.context.value='Консультация по строительству';$('.form-context',f).hidden=true;formState.get(f).id=uuid();}
    if(b.closest('#menu-dialog')&&b.matches('a[href^="#"]'))closeDialog($('#menu-dialog'),false);
    if(b.matches('a[href^="tel:"]'))track('phone_click');
    if(b.matches('a[href^="mailto:"]'))track('email_click');
  });
  $('#clear-storage').addEventListener('click',()=>{storage.clear();saved.clear();region=allowedRegions[0];analyticsConsent=false;updateSaved();updateRegion();toast('Избранное и настройки региона очищены.');});
  // Smooth, small motion; native scrolling is never replaced.
  let formVisible=false;
  const mobileBar=$('.mobile-bar');
  function updateBar(){if(!mobileBar)return;mobileBar.classList.toggle('is-hidden',formVisible||window.scrollY<Math.max(120,$('.hero-stage').offsetHeight-160)||!!document.querySelector('dialog[open]')||!!document.activeElement?.closest('.lead-form'));}
  const visibility=new Map();
  if('IntersectionObserver'in window){
    const formObserver=new IntersectionObserver(entries=>{entries.forEach(e=>visibility.set(e.target,e.isIntersecting));formVisible=[...visibility.values()].some(Boolean);updateBar();},{threshold:.08});
    $$('.lead-form').forEach(f=>formObserver.observe(f));
    if(!reducedMotion.matches){document.documentElement.classList.add('motion-ready');const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('is-waiting');e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{rootMargin:'0px 0px 40px 0px',threshold:.06});
      $$('.reveal').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight)el.classList.add('is-waiting');observer.observe(el);});
    }
  }
  document.addEventListener('focusin',updateBar);document.addEventListener('focusout',()=>setTimeout(updateBar,0));
  let scrolling=false;
  const headerResize=new ResizeObserver(()=>document.documentElement.style.setProperty('--header-offset',Math.ceil($('#header').getBoundingClientRect().height+16)+'px'));headerResize.observe($('#header'));
  function onScroll(){scrolling=false;const y=window.scrollY,max=document.documentElement.scrollHeight-innerHeight;$('.reading-progress').style.transform=`scaleX(${max?y/max:0})`;$('#header').classList.toggle('scrolled',y>24);updateBar();
    if(!reducedMotion.matches&&!matchMedia('(max-width:767px)').matches){const image=$('.hero-image img');image.style.transform=y<900?`translateY(${Math.min(y*.04,22)}px) scale(1.035)`:'scale(1.035)';}else{$('.hero-image img').style.transform='none';}
    // The unified site menu links to real pages, not anchor sections.
  }
  addEventListener('scroll',()=>{if(!scrolling){scrolling=true;requestAnimationFrame(onScroll);}},{passive:true});
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){$$('.is-waiting').forEach(e=>e.classList.remove('is-waiting'));$('.hero-image img').style.transform='none';}});
  $$('.faq-item').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)track('faq_open');}));
  // Initialize last so an exception during enhancement cannot blank the public page.
  document.documentElement.classList.replace('no-js','js');
  narrow.addEventListener('change',()=>{onScroll();updateBar();});
  filterCatalog();updateSaved();updateRegion();selectScope(0);filterMap('moscow');selectCaseOnMap('klin');onScroll();
})();
