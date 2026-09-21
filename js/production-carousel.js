(function () {
  'use strict';

  const media = document.querySelector('#production .production-media');
  if (!media) return;

  if (window.innerWidth <= 1000) {
    media.remove();
    return;
  }

  const images = [
    { src: 'assets/generated-production/01-logging.webp', alt: 'Лесозаготовительная техника в северном хвойном лесу' },
    { src: 'assets/generated-production/02-production-yard.webp', alt: 'Производственная площадка и склад древесины VOSL' },
    { src: 'assets/generated-production/03-cnc-line.webp', alt: 'Автоматизированная линия обработки деревянных балок' },
    { src: 'assets/generated-production/04-timber-assembly.webp', alt: 'Сборка деревянного каркаса дома из подготовленного бруса' }
  ];

  const wrap = document.createElement('div');
  wrap.className = 'mh3-slider-wrapper';
  wrap.id = 'productionCarousel';
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Фотографии производства VOSL');

  const imageSlider = document.createElement('div');
  imageSlider.className = 'mh3-image-slider';
  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'mh3-slider-container';
  const track = document.createElement('div');
  track.className = 'mh3-slider-track';
  track.id = 'productionCarouselTrack';

  images.forEach((source, index) => {
    const slide = document.createElement('div');
    slide.className = 'mh3-slide';
    const imageContainer = document.createElement('div');
    imageContainer.className = 'mh3-image-container';
    const image = document.createElement('img');
    image.src = source.src;
    image.alt = source.alt;
    image.loading = index === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.draggable = false;
    imageContainer.appendChild(image);
    slide.appendChild(imageContainer);
    track.appendChild(slide);
  });

  const progressIndicator = document.createElement('div');
  progressIndicator.className = 'mh3-progress-indicator';
  progressIndicator.setAttribute('aria-hidden', 'true');
  const progressTrack = document.createElement('div');
  progressTrack.className = 'mh3-progress-track';
  const progressFill = document.createElement('div');
  progressFill.className = 'mh3-progress-fill';
  progressFill.id = 'productionCarouselFill';
  progressTrack.appendChild(progressFill);
  progressIndicator.appendChild(progressTrack);

  sliderContainer.appendChild(track);
  imageSlider.appendChild(sliderContainer);
  wrap.append(imageSlider, progressIndicator);
  media.replaceChildren(wrap);

  const originalSlides = track.querySelectorAll('.mh3-slide');
  const originalCount = originalSlides.length;
  for (let index = 0; index < 2; index += 1) {
    originalSlides.forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }

  const allSlides = track.querySelectorAll('.mh3-slide');
  let isAnimating = true;
  let isDragging = false;
  let position = 0;
  let animationId = null;
  let slideHeight = 0;
  const speed = 0.3;
  let dragY = 0;

  function calculateHeight() {
    if (allSlides.length > 0) {
      slideHeight = allSlides[0].offsetHeight + (parseInt(getComputedStyle(track).gap, 10) || 5);
    }
    return slideHeight;
  }

  function updateProgress() {
    if (!progressFill || !slideHeight) return;
    const progress = (position % (slideHeight * originalCount)) / (slideHeight * originalCount);
    progressFill.style.width = `${progress * 100}%`;
  }

  function animate() {
    if (!isAnimating || isDragging) return;
    position += speed;
    if (position >= slideHeight * originalCount * 2.027) position = 0;
    track.style.transform = `translateY(-${position}px)`;
    updateProgress();
    animationId = requestAnimationFrame(animate);
  }

  function stop() {
    isAnimating = false;
    if (animationId) cancelAnimationFrame(animationId);
  }

  function start() {
    if (!isDragging) {
      isAnimating = true;
      animationId = requestAnimationFrame(animate);
    }
  }

  function startDrag(event) {
    dragY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  }

  function onDrag(event) {
    const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY;
    if (!isDragging) {
      if (Math.abs(dragY - clientY) > 5) {
        isDragging = true;
        stop();
        wrap.style.cursor = 'grabbing';
      } else {
        return;
      }
    }
    event.preventDefault();
    position += dragY - clientY;
    const maximum = slideHeight * originalCount * 2;
    if (position >= maximum) position = 0;
    if (position < 0) position = maximum - 1;
    track.style.transform = `translateY(-${position}px)`;
    updateProgress();
    dragY = clientY;
  }

  function endDrag() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
    if (isDragging) {
      isDragging = false;
      wrap.style.cursor = 'grab';
      setTimeout(start, 300);
    }
  }

  function initialize() {
    calculateHeight();
    animationId = requestAnimationFrame(animate);
    allSlides.forEach((slide) => {
      slide.addEventListener('mouseenter', stop);
      slide.addEventListener('mouseleave', () => {
        if (!isDragging) start();
      });
    });
    wrap.addEventListener('mousedown', startDrag);
    wrap.addEventListener('touchstart', startDrag, { passive: false });
    wrap.addEventListener('dragstart', (event) => event.preventDefault());
  }

  initialize();
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 1000) stop();
    else calculateHeight();
  });
})();
