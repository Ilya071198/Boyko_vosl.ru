(function () {
  'use strict';

  function mountSourceHero() {
    var hero = document.getElementById('intro');
    var proof = hero && hero.querySelector('.home-proof');
    if (!hero) return;

    hero.className = 'hero hero--source';
    hero.innerHTML = [
      '<div class="hero-stage">',
      '<figure class="hero-visual hero-image"><picture><source media="(max-width:767px)" srcset="assets/hero-mobile-v13.webp"><img class="hero-house" alt="Архитектурная визуализация деревянного дома из бревна в окружении леса" fetchpriority="high" width="1904" height="826" src="assets/hero.webp"></picture></figure>',
      '<div class="hero-overlay"></div>',
      '<div class="container hero-inner"><div class="hero-copy">',
      '<p class="hero-region"><svg aria-hidden="true" class="icon" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.1 7 13 7 13s7-7.9 7-13a7 7 0 0 0-7-7Zm0 4.3a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4Z" fill-rule="evenodd"></path></svg><span>Вологда и область <i>·</i> Москва и Подмосковье</span></p>',
      '<h1 id="hero-title">Строительство<br> деревянных домов<br> <span>под ключ</span></h1>',
      '<p class="hero-lead">Проектируем, производим домокомплекты<br class="desktop-break"> и строим дома из бруса и бревна.</p>',
      '<div class="hero-actions"><a class="btn" data-quote="Расчет строительства" href="#inquiry">Рассчитать стоимость <svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"></path></svg></a><a class="btn btn--outline" href="#projects">Смотреть проекты</a></div>',
      '<p class="hero-caption">От заготовки древесины до работы на вашем участке.</p>',
      '</div></div></div>'
    ].join('');

    if (proof) hero.insertAdjacentElement('afterend', proof);
  }

  function mountHeaderDropdown() {
    var nav = document.querySelector('#header .client-nav');
    var buildLink = nav && Array.prototype.find.call(nav.querySelectorAll(':scope > a'), function (link) {
      return link.textContent.trim() === 'Как строим';
    });
    if (!nav || !buildLink) return;

    var group = document.createElement('details');
    group.className = 'nav-group';
    group.innerHTML = '<summary>Как строим<span aria-hidden="true">⌄</span></summary><div class="nav-sub"><a href="https://vosl.ru/lesozagotovka">Лесозаготовка</a><a href="https://vosl.ru/dogovor">Договор</a><a href="https://vosl.ru/proektirovanie">Проектирование</a><a href="https://vosl.ru/proizvodstvo">Производство</a><a href="https://vosl.ru/fundament">Фундамент</a><a href="https://vosl.ru/dostavka">Доставка</a><a href="https://vosl.ru/sborka-sooruzheniya">Сборка сооружения</a><a href="https://vosl.ru/montazh-krovli">Монтаж кровли</a><a href="https://vosl.ru/otdelka">Отделка</a></div>';
    buildLink.replaceWith(group);
    group.addEventListener('mouseenter', function () { group.open = true; });
    group.addEventListener('mouseleave', function () { group.open = false; });
    group.addEventListener('focusout', function (event) {
      if (!group.contains(event.relatedTarget)) group.open = false;
    });
  }

  function mountTransparentLogo() {
    var logo = document.querySelector('#header .brand img');
    if (!logo) return;
    logo.src = 'assets/logo-transparent.png';
  }

  function mountCatalogFilters() {
    var button = document.querySelector('#projects .filter-toggle');
    var panel = document.getElementById('catalog-filters');
    if (!button || !panel) return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () {
      var willOpen = panel.hidden;
      panel.hidden = !willOpen;
      button.setAttribute('aria-expanded', String(willOpen));
      button.classList.toggle('is-open', willOpen);
    });
  }

  function mountBlueprint() {
    var card = document.querySelector('#inquiry .sketch-card');
    if (!card) return;

    card.classList.remove('sketch-card');
    card.classList.add('house-drawing-media', 'house-drawing-media--white');
    card.setAttribute('aria-label', 'Одноразовая анимация рисования деревянного дома');
    card.innerHTML = '<div class="house-drawing-viewport"><img alt="Рисующийся чертеж деревянного дома" data-once-animation data-src="assets/house-drawing-animation-1-once.webp" width="1448" height="1086"></div>';
    var note = document.querySelector('#inquiry .inquiry-note');
    if (note) note.remove();
  }

  function armOnceAnimations() {
    var images = Array.prototype.slice.call(document.querySelectorAll('[data-once-animation]'));
    if (!images.length) return;
    function start(image) {
      if (image.src) return;
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
    }
    if (!('IntersectionObserver' in window)) {
      images.forEach(start);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        start(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '140px 0px', threshold: .12 });
    images.forEach(function (image) { observer.observe(image); });
  }

  function splitSectionHeads() {
    ['#materials', '#estimate'].forEach(function (selector) {
      var head = document.querySelector(selector + ' .section-head');
      var lead = head && head.querySelector('.section-lead');
      if (!head || !lead || head.querySelector(':scope > .section-head__side')) return;
      var side = document.createElement('div');
      side.className = 'section-head__side';
      side.appendChild(lead);
      head.appendChild(side);
    });
  }

  function moveProductionLink() {
    var link = document.querySelector('#production .production-actions a[href*="/proizvodstvo"]');
    var sites = document.querySelector('#production-details .production-sites');
    var visit = sites && sites.querySelector('button.text-link');
    if (!link || !sites) return;
    link.classList.add('production-about-link');
    if (visit) sites.insertBefore(link, visit);
    else sites.appendChild(link);
  }

  function stabilizeEstimate() {
    var table = document.querySelector('#estimate .scope-table');
    var buttons = Array.prototype.slice.call(document.querySelectorAll('#estimate [data-scope]'));
    if (!table || !buttons.length) return;

    function sync() {
      var active = buttons.findIndex(function (button) {
        return button.classList.contains('active') || button.getAttribute('aria-pressed') === 'true';
      });
      table.dataset.active = String(Math.max(0, active));
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () { window.requestAnimationFrame(sync); });
    });
    sync();
  }

  function mountFaqAccordion() {
    var items = Array.prototype.slice.call(document.querySelectorAll('#questions .faq-item'));
    if (!items.length) return;

    function closeItem(item) {
      if (!item.open) return Promise.resolve();
      var answer = item.querySelector('.faq-answer');
      if (!answer) { item.open = false; return Promise.resolve(); }
      if (item._faqAnimation) item._faqAnimation.cancel();
      return new Promise(function (resolve) {
        item._faqAnimation = answer.animate([
          { height: answer.getBoundingClientRect().height + 'px', opacity: 1 },
          { height: '0px', opacity: 0 }
        ], { duration: 260, easing: 'cubic-bezier(.25,1,.5,1)' });
        item._faqAnimation.onfinish = function () {
          item.open = false;
          item._faqAnimation = null;
          resolve();
        };
        item._faqAnimation.oncancel = resolve;
      });
    }

    function openItem(item) {
      if (item.open) return;
      var closing = items.filter(function (other) { return other !== item && other.open; }).map(closeItem);
      Promise.all(closing).then(function () {
      var answer = item.querySelector('.faq-answer');
      item.open = true;
      if (!answer) return;
      var targetHeight = answer.scrollHeight;
      item._faqAnimation = answer.animate([
        { height: '0px', opacity: 0 },
        { height: targetHeight + 'px', opacity: 1 }
      ], { duration: 300, easing: 'cubic-bezier(.25,1,.5,1)' });
      item._faqAnimation.onfinish = function () {
        item._faqAnimation = null;
      };
      });
    }

    items.forEach(function (item) {
      var summary = item.querySelector('summary');
      if (!summary) return;
      summary.addEventListener('click', function (event) {
        event.preventDefault();
        if (item.open) closeItem(item);
        else openItem(item);
      });
    });

    var lead = document.querySelector('#questions .faq-layout > .reveal');
    if (lead && !lead.querySelector('.faq-house-animation')) {
      lead.insertAdjacentHTML('beforeend', '<div class="faq-house-animation" aria-hidden="true"><img data-once-animation data-src="assets/house-drawing-animation-3-once.webp" width="1448" height="1086" alt=""></div>');
    }
  }

  function mountContactHeading() {
    var card = document.querySelector('#contacts .contact-form-card');
    var icon = card && card.querySelector(':scope > .form-icon');
    var title = card && card.querySelector(':scope > h3');
    if (!card || !icon || !title || card.querySelector(':scope > .contact-card-heading')) return;
    var heading = document.createElement('div');
    heading.className = 'contact-card-heading';
    card.insertBefore(heading, icon);
    heading.appendChild(icon);
    heading.appendChild(title);
  }

  function mountProcessScroll() {
    var section = document.getElementById('process');
    if (!section) return;
    var sticky = section.querySelector(':scope > .container');
    var track = section.querySelector('.steps-grid');
    var cards = track ? Array.prototype.slice.call(track.querySelectorAll('.step')) : [];
    if (!sticky || !track || cards.length < 4) return;

    section.classList.add('process-scroll-shell');
    sticky.classList.add('process-sticky');
    track.classList.add('process-track');

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var ticking = false;

    function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

    function update() {
      ticking = false;
      if (window.innerWidth <= 1000 || reduced.matches) {
        track.style.removeProperty('transform');
        cards.forEach(function (card) {
          card.style.removeProperty('--step-opacity');
          card.style.removeProperty('--step-shift');
          card.style.removeProperty('opacity');
          card.style.removeProperty('transform');
        });
        return;
      }

      var rect = section.getBoundingClientRect();
      var topOffset = 86;
      var travel = Math.max(1, section.offsetHeight - sticky.offsetHeight - topOffset);
      var progress = clamp((topOffset - rect.top) / travel, 0, 1);
      var entry = clamp((window.innerHeight - rect.top) / Math.min(300, window.innerHeight * .34), 0, 1);
      var shift = Math.max(0, track.scrollWidth - sticky.clientWidth);

      track.style.transform = 'translate3d(' + (-shift * progress).toFixed(2) + 'px,0,0)';
      cards.forEach(function (card, index) {
        var opacity;
        if (index < 3) {
          opacity = entry * (1 - clamp((progress - .06) / .52, 0, 1));
        } else {
          opacity = clamp((progress - .18) / .54, 0, 1);
        }
        opacity = clamp(opacity, .06, 1);
        card.style.setProperty('--step-opacity', String(opacity));
        card.style.setProperty('--step-shift', ((1 - opacity) * 18).toFixed(1) + 'px');
        card.style.opacity = String(opacity);
        card.style.transform = 'translate3d(0,' + ((1 - opacity) * 18).toFixed(1) + 'px,0)';
      });
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    document.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    if (typeof reduced.addEventListener === 'function') reduced.addEventListener('change', requestUpdate);
    update();
  }

  function init() {
    mountSourceHero();
    mountTransparentLogo();
    mountHeaderDropdown();
    mountCatalogFilters();
    mountBlueprint();
    splitSectionHeads();
    moveProductionLink();
    stabilizeEstimate();
    mountProcessScroll();
    mountFaqAccordion();
    mountContactHeading();
    armOnceAnimations();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
