// ========== ТЕМА ==========
function setTheme(theme) {
  if (theme === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  localStorage.setItem('memotekaTheme', theme);
}
const savedTheme = localStorage.getItem('memotekaTheme') || 'system';
setTheme(savedTheme);
const themeSelect = document.getElementById('theme-switch');
if (themeSelect) {
  themeSelect.value = savedTheme;
  themeSelect.addEventListener('change', (e) => setTheme(e.target.value));
}

// ========== ЛАЙТБОКС (ПОЛНОСТЬЮ ПЕРЕПИСАН, БЕЗ ГЛЮКОВ) ==========
const lightbox = document.createElement('div');
lightbox.id = 'lightbox';
lightbox.className = 'lightbox';
document.body.appendChild(lightbox);

let currentMedia = null; // для остановки воспроизведения

function closeLightbox() {
  lightbox.classList.remove('active');
  if (currentMedia) {
    currentMedia.pause();
    currentMedia.src = '';
    currentMedia = null;
  }
  // Очищаем содержимое, но оставляем кнопку закрытия (создадим её заново)
  lightbox.innerHTML = '';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-lightbox';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = closeLightbox;
  lightbox.appendChild(closeBtn);
  // Также вешаем клик на фон
  lightbox.onclick = (e) => {
    if (e.target === lightbox) closeLightbox();
  };
}

function formatTime(sec) {
  if (isNaN(sec)) return '0:00';
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function openLightbox(url, type) {
  // Сначала закрываем, чтобы очистить полностью
  closeLightbox();
  // Открываем заново
  lightbox.classList.add('active');
  const closeBtn = lightbox.querySelector('.close-lightbox');
  
  if (type === 'video' || type === 'audio') {
    const container = document.createElement('div');
    container.className = 'lightbox-player-container';
    if (type === 'audio') container.classList.add('audio-only');
    
    const media = document.createElement(type === 'video' ? 'video' : 'audio');
    media.className = 'lightbox-media';
    media.src = url;
    if (type === 'video') media.setAttribute('playsinline', '');
    media.preload = 'metadata';
    
    const controls = document.createElement('div');
    controls.className = 'lightbox-controls';
    
    const playBtn = document.createElement('button');
    playBtn.innerHTML = '▶';
    const muteBtn = document.createElement('button');
    muteBtn.innerHTML = '🔊';
    const progressBar = document.createElement('div');
    progressBar.className = 'lightbox-progress';
    const progressFilled = document.createElement('div');
    progressFilled.className = 'lightbox-progress-filled';
    progressBar.appendChild(progressFilled);
    const timeSpan = document.createElement('span');
    timeSpan.className = 'lightbox-time';
    timeSpan.textContent = '0:00 / 0:00';
    
    const volumeContainer = document.createElement('div');
    volumeContainer.className = 'lightbox-volume';
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = 0.01;
    volumeSlider.value = 1;
    volumeSlider.className = 'lightbox-volume-slider';
    volumeContainer.appendChild(volumeSlider);
    
    controls.append(playBtn, muteBtn, progressBar, timeSpan, volumeContainer);
    container.append(media, controls);
    lightbox.insertBefore(container, closeBtn);
    
    let isDragging = false;
    
    media.addEventListener('loadedmetadata', () => {
      timeSpan.textContent = `0:00 / ${formatTime(media.duration)}`;
    });
    media.addEventListener('timeupdate', () => {
	  if (!isDragging && media.duration && isFinite(media.duration)) {
		const percent = (media.currentTime / media.duration) * 100;
		progressFilled.style.width = `${percent}%`;
		timeSpan.textContent = `${formatTime(media.currentTime)} / ${formatTime(media.duration)}`;
	  }
	});
    playBtn.addEventListener('click', () => {
      if (media.paused) {
        media.play();
        playBtn.innerHTML = '⏸';
      } else {
        media.pause();
        playBtn.innerHTML = '▶';
      }
    });
    media.addEventListener('play', () => playBtn.innerHTML = '⏸');
    media.addEventListener('pause', () => playBtn.innerHTML = '▶');
    muteBtn.addEventListener('click', () => {
      media.muted = !media.muted;
      muteBtn.innerHTML = media.muted ? '🔇' : '🔊';
    });
    volumeSlider.addEventListener('input', (e) => {
      media.volume = e.target.value;
      if (media.volume === 0) {
        media.muted = true;
        muteBtn.innerHTML = '🔇';
      } else {
        media.muted = false;
        muteBtn.innerHTML = '🔊';
      }
    });
    progressBar.addEventListener('click', (e) => {
	  if (!media.duration || isNaN(media.duration) || !isFinite(media.duration)) return;
	  const rect = progressBar.getBoundingClientRect();
	  let pos = (e.clientX - rect.left) / rect.width;
	  pos = Math.min(Math.max(pos, 0), 1);
	  media.currentTime = pos * media.duration;
	});
    progressBar.addEventListener('mousedown', () => isDragging = true);
    document.addEventListener('mouseup', () => isDragging = false);
    progressBar.addEventListener('mousemove', (e) => {
	  if (isDragging) {
		if (!media.duration || isNaN(media.duration) || !isFinite(media.duration)) return;
		const rect = progressBar.getBoundingClientRect();
		let pos = (e.clientX - rect.left) / rect.width;
		pos = Math.min(Math.max(pos, 0), 1);
		media.currentTime = pos * media.duration;
	  }
	});
    currentMedia = media;
    media.play().catch(e => console.log('autoplay error', e));
  } else {
    // Фото / GIF
    const img = document.createElement('img');
    img.className = 'lightbox-content';
    img.src = url;
    lightbox.insertBefore(img, closeBtn);
    currentMedia = null;
  }
}

// Инициализация лайтбокса (кнопка и обработчик фона один раз)
closeLightbox(); // создаст кнопку и повесит события

// ========== ГАЛЕРЕЯ И ПЛЕЕР ДЛЯ КАРТОЧЕК (без изменений) ==========
function bindMemeClicks() {
  document.querySelectorAll('.meme-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.video-controls')) return;
      const url = card.dataset.url;
      const type = card.dataset.type;
      if (url && type) openLightbox(url, type);
    });
  });
}

function initVideoPlayers() {
  document.querySelectorAll('.video-wrapper').forEach(wrapper => {
    const video = wrapper.querySelector('video');
    if (!video || video.hasAttribute('data-custom')) return;
    video.setAttribute('data-custom', 'true');
    const controls = document.createElement('div');
    controls.className = 'video-controls';
    const playBtn = document.createElement('button');
    playBtn.textContent = '▶';
    playBtn.onclick = () => video.paused ? video.play() : video.pause();
    const muteBtn = document.createElement('button');
    muteBtn.textContent = '🔊';
    muteBtn.onclick = () => video.muted = !video.muted;
    controls.append(playBtn, muteBtn);
    wrapper.appendChild(controls);
    video.addEventListener('play', () => playBtn.textContent = '⏸');
    video.addEventListener('pause', () => playBtn.textContent = '▶');
  });
}

const toTopBtn = document.getElementById('backToTop');
if (toTopBtn) {
  toTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const memesLibrary = {
  photos: [
    { name: 'Простоквашино', file: '/cdn/assets/photos/1.jpg' },
    { name: 'Кошак', file: '/cdn/assets/photos/2.webp' },
    { name: 'Мем', file: '/cdn/assets/photos/3.png' },
    { name: 'Котик', file: '/cdn/assets/photos/cat.jpg' },
    { name: 'Закат', file: '/cdn/assets/photos/sunset.jpg' },
    { name: 'Пердёж', file: '/cdn/assets/photos/fart.jpg' }
  ],
  videos: [
    { name: 'Реакция обида, боль и разочарование', file: '/cdn/assets/videos/demo.mp4' },
    { name: 'Ну, типа, ура!', file: '/cdn/assets/videos/nature.webm' }
  ],
  gifs: [
    { name: 'Негр', file: '/cdn/assets/gifs/funny.gif' },
    { name: 'Сигма', file: '/cdn/assets/gifs/reaction.gif' }
  ],
  audios: [
    { name: 'С писюном, блядь, поиграй!', file: '/cdn/assets/audios/beat.mp3' },
    { name: 'Какие-то арабы или чё ваще, хз, короче', file: '/cdn/assets/audios/voice.ogg' }
  ]
};

function renderMemes(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const all = [
    ...memesLibrary.photos.map(m => ({ ...m, type: 'photo' })),
    ...memesLibrary.videos.map(m => ({ ...m, type: 'video' })),
    ...memesLibrary.gifs.map(m => ({ ...m, type: 'gif' })),
    ...memesLibrary.audios.map(m => ({ ...m, type: 'audio' }))
  ];
  all.forEach(meme => {
    const card = document.createElement('div');
    card.className = 'meme-card';
    card.dataset.url = meme.file;
    card.dataset.type = meme.type;
    let preview = '';
    if (meme.type === 'video') {
      preview = `<div class="video-wrapper"><video class="meme-preview" src="${meme.file}" muted preload="metadata"></video></div>`;
    } else if (meme.type === 'audio') {
      preview = `<div class="meme-preview" style="background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 3rem;"><img src="/cdn/icons/audio.svg"></div>`;
    } else {
      preview = `<img class="meme-preview" src="${meme.file}" alt="${meme.name}" loading="lazy">`;
    }
    card.innerHTML = `
      ${preview}
      <div class="meme-info">
        <div class="meme-title">${meme.name}</div>
        <div class="meme-type">${meme.type}</div>
      </div>
    `;
    container.appendChild(card);
  });
  bindMemeClicks();
  initVideoPlayers();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('memesContainer')) renderMemes('memesContainer');
  initVideoPlayers();
});

// ========== ПЛАВАЮЩАЯ ПАНЕЛЬ ШАРИНГА ==========
(function() {
  // Создаём контейнер
  const fab = document.createElement('div');
  fab.className = 'share-fab';
  
  // Кнопка-триггер
  const btn = document.createElement('button');
  btn.className = 'share-button';
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.05 4.11c-.05.23-.09.46-.09.7 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/></svg>';
  
  // Панель с иконками
  const panel = document.createElement('div');
  panel.className = 'share-panel';
  
  // Иконки соцсетей (пути к вашим файлам)
  const networks = [
    { name: 'telegram', file: '/cdn/icons/share/TG.svg', url: (u,t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
    { name: 'whatsapp', file: '/cdn/icons/share/WA.svg', url: (u,t) => `https://api.whatsapp.com/send?text=${encodeURIComponent(t+' '+u)}` },
    { name: 'vk', file: '/cdn/icons/share/VK.svg', url: (u,t) => `https://vk.com/share.php?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}` },
    { name: 'x', file: '/cdn/icons/share/X.svg', url: (u,t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
    { name: 'facebook', file: '/cdn/icons/share/FB.svg', url: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
    { name: 'viber', file: '/cdn/icons/share/Viber.svg', url: (u,t) => `viber://forward?text=${encodeURIComponent(t+' '+u)}` },
    { name: 'ok', file: '/cdn/icons/share/OK.svg', url: (u,t) => `https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&st.shareUrl=${encodeURIComponent(u)}&st.comments=${encodeURIComponent(t)}` }
  ];
  
  networks.forEach(net => {
    const iconDiv = document.createElement('div');
    iconDiv.className = 'share-icon';
    const img = document.createElement('img');
    img.src = net.file;
    img.alt = net.name;
    iconDiv.appendChild(img);
    iconDiv.addEventListener('click', () => {
      const url = window.location.href;
      const title = document.title;
      let shareUrl;
      if (net.name === 'viber') {
        shareUrl = net.url(url, title);
        window.open(shareUrl, '_blank');
      } else {
        shareUrl = net.url(url, title);
        window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
      }
    });
    panel.appendChild(iconDiv);
  });
  
  // Добавляем кнопку копирования ссылки (дополнительно)
  const copyDiv = document.createElement('div');
  copyDiv.className = 'share-icon';
  const copyImg = document.createElement('img');
  copyImg.src = '/cdn/icons/share/copy.svg'; // если нет такой иконки, пропустим или создадим временно
  copyImg.alt = 'copy';
  // Если нет иконки copy.svg — можем использовать текстовую иконку или спросить
  // Но для надёжности сделаем SVG прямо тут
  if (!copyImg.complete || copyImg.naturalWidth === 0) {
    copyDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  } else {
    copyDiv.appendChild(copyImg);
  }
  copyDiv.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      // временное уведомление (можно всплывашку)
      const oldTitle = btn.title;
      btn.title = 'Ссылка скопирована!';
      setTimeout(() => { btn.title = oldTitle; }, 1500);
    });
  });
  panel.appendChild(copyDiv);
  
  fab.appendChild(btn);
  fab.appendChild(panel);
  document.body.appendChild(fab);
  
  // Toggle panel
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('show');
  });
  // Закрыть при клике вне
  document.addEventListener('click', (e) => {
    if (!fab.contains(e.target)) {
      panel.classList.remove('show');
    }
  });
})();

// ========== МЕГАПЛАВНЫЙ СКРОЛЛ (всё, кроме полосы прокрутки) ==========
(function() {
  // ---- Настройки (подкрути под себя) ----
  const SMOOTH_FACTOR = 0.09;    // плавность (0.05 = очень плавно, 0.2 = резче)
  const WHEEL_MULT = 0.8;        // чувствительность колёсика/тачпада
  const TOUCH_MULT = 1.2;        // чувствительность пальца (на телефоне)
  const KEY_STEP = 120;          // шаг для стрелок (пикселей)
  
  // ---- Переменные ----
  let targetY = window.scrollY;
  let currentY = window.scrollY;
  let animFrame = null;
  let isAnimating = false;
  
  // Для тач-инерции
  let touchStartY = 0, touchStartScroll = 0;
  let touchVelocity = 0, lastTouchY = 0, lastTouchTime = 0;
  let inertiaFrame = null;
  
  // Флаг, что сейчас идёт наша анимация – чтобы не конфликтовать с внешними событиями
  let ourAnimation = false;
  
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  
  function getMaxScroll() {
    return document.body.scrollHeight - window.innerHeight;
  }
  
  function setTarget(value, animated = true) {
    targetY = clamp(value, 0, getMaxScroll());
    if (animated && !isAnimating) startAnimation();
    else if (!animated) {
      currentY = targetY;
      window.scrollTo(0, targetY);
      if (animFrame) cancelAnimationFrame(animFrame);
      isAnimating = false;
    }
  }
  
  function startAnimation() {
    if (animFrame) return;
    isAnimating = true;
    function step() {
      const diff = targetY - currentY;
      if (Math.abs(diff) < 0.5) {
        currentY = targetY;
        window.scrollTo(0, currentY);
        cancelAnimationFrame(animFrame);
        animFrame = null;
        isAnimating = false;
        ourAnimation = false;
        return;
      }
      currentY += diff * SMOOTH_FACTOR;
      window.scrollTo(0, currentY);
      animFrame = requestAnimationFrame(step);
    }
    ourAnimation = true;
    animFrame = requestAnimationFrame(step);
  }
  
  // ---- Колёсико / тачпад ----
  function onWheel(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.classList.contains('active')) return;
    
    e.preventDefault();
    const delta = e.deltaY || e.deltaX;
    targetY = clamp(targetY + delta * WHEEL_MULT, 0, getMaxScroll());
    startAnimation();
  }
  
  // ---- Палец на сенсорном экране (с инерцией) ----
  function onTouchStart(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.classList.contains('active')) return;
    
    // Останавливаем инерцию от предыдущего касания
    if (inertiaFrame) cancelAnimationFrame(inertiaFrame);
    touchVelocity = 0;
    touchStartY = e.touches[0].clientY;
    touchStartScroll = targetY;
    lastTouchY = touchStartY;
    lastTouchTime = Date.now();
  }
  
  function onTouchMove(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.classList.contains('active')) return;
    
    e.preventDefault();
    const now = Date.now();
    const deltaY = e.touches[0].clientY - touchStartY;
    let newTarget = touchStartScroll - deltaY * TOUCH_MULT;
    targetY = clamp(newTarget, 0, getMaxScroll());
    startAnimation();
    
    // Вычисляем скорость для инерции
    const moveDelta = e.touches[0].clientY - lastTouchY;
    const timeDelta = now - lastTouchTime;
    if (timeDelta > 0 && Math.abs(moveDelta) > 1) {
      touchVelocity = (moveDelta / timeDelta) * 16; // скорость (пикселей/кадр)
      // ограничиваем
      touchVelocity = clamp(touchVelocity, -30, 30);
    }
    lastTouchY = e.touches[0].clientY;
    lastTouchTime = now;
  }
  
  function onTouchEnd(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.classList.contains('active')) return;
    
    if (Math.abs(touchVelocity) < 0.5) return;
    
    // Инерция после отпускания пальца
    let speed = touchVelocity * 15;
    function inertiaStep() {
      if (Math.abs(speed) < 0.3) {
        cancelAnimationFrame(inertiaFrame);
        inertiaFrame = null;
        return;
      }
      targetY = clamp(targetY - speed, 0, getMaxScroll());
      startAnimation();
      speed *= 0.96; // затухание
      inertiaFrame = requestAnimationFrame(inertiaStep);
    }
    if (inertiaFrame) cancelAnimationFrame(inertiaFrame);
    inertiaFrame = requestAnimationFrame(inertiaStep);
  }
  
  // ---- Клавиатура (стрелки, PgUp, PgDown, Home, End) ----
  function onKeyDown(e) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.classList.contains('active')) return;
    
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    
    let delta = 0;
    switch (e.key) {
      case 'ArrowUp': delta = -KEY_STEP; break;
      case 'ArrowDown': delta = KEY_STEP; break;
      case 'PageUp': delta = -window.innerHeight; break;
      case 'PageDown': delta = window.innerHeight; break;
      case 'Home': targetY = 0; startAnimation(); e.preventDefault(); return;
      case 'End': targetY = getMaxScroll(); startAnimation(); e.preventDefault(); return;
      default: return;
    }
    e.preventDefault();
    targetY = clamp(targetY + delta, 0, getMaxScroll());
    startAnimation();
  }
  
  // ---- Синхронизация с внешними изменениями (например, кнопка "наверх" с smooth) ----
  // Слушаем событие scroll, но только если оно пришло не от нашей анимации
  let scrollFromExternal = false;
  window.addEventListener('scroll', () => {
    if (!ourAnimation) {
      // Внешний скролл (скролл-бар, якорь, чужая анимация)
      const newScroll = window.scrollY;
      if (Math.abs(newScroll - targetY) > 2) {
        targetY = newScroll;
        currentY = newScroll;
        if (animFrame) cancelAnimationFrame(animFrame);
        isAnimating = false;
        ourAnimation = false;
        // можно было бы запустить плавное догоняние, но часто приводит к рывкам – лучше просто синхронизировать
      }
    }
  });
  
  // ---- Регистрация событий ----
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('keydown', onKeyDown);
  
  // Инициализация целевого значения
  targetY = window.scrollY;
  currentY = window.scrollY;
})();