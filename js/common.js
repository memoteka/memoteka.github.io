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

// ========== ПЛАВНЫЙ СКРОЛЛ ТОЛЬКО ДЛЯ ДЕСКТОПА (БЕЗ МОБИЛОК) ==========
(function() {
  // Определяем устройство с тач-экраном
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) return; // на мобилках не трогаем

  let targetScroll = window.scrollY;
  let currentScroll = window.scrollY;
  let animationId = null;
  let isScrolling = false;

  function smoothScrollLoop() {
    currentScroll += (targetScroll - currentScroll) * 0.12;
    if (Math.abs(targetScroll - currentScroll) < 0.5) {
      currentScroll = targetScroll;
      window.scrollTo(0, targetScroll);
      if (animationId) cancelAnimationFrame(animationId);
      animationId = null;
      isScrolling = false;
      return;
    }
    window.scrollTo(0, currentScroll);
    animationId = requestAnimationFrame(smoothScrollLoop);
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY || e.deltaX;
    targetScroll += delta * 0.8;
    targetScroll = Math.min(Math.max(targetScroll, 0), document.body.scrollHeight - window.innerHeight);
    
    if (!isScrolling) {
      isScrolling = true;
      smoothScrollLoop();
    }
  }

  window.addEventListener('wheel', onWheel, { passive: false });
})();

// ========== ВЕРСИЯ ДЛЯ СЛАБОВИДЯЩИХ (улучшенная с reset, i18n, голосом) ==========
(function() {
  const ACCESSIBILITY_KEY = 'accessibilityMode';
  let isAccessibilityMode = localStorage.getItem(ACCESSIBILITY_KEY) === 'true';

  // Тексты интерфейса в зависимости от языка
  const i18n = {
    ru: {
      font: 'Шрифт:',
      sans: 'Без засечек',
      serif: 'С засечками',
      size: 'Размер:',
      small: 'Маленький',
      medium: 'Средний',
      large: 'Большой',
      spacing: 'Интервал:',
      normal_spacing: 'Обычный',
      wide: 'Широкий',
      extra_wide: 'Очень широкий',
      color: 'Цвет:',
      bw: 'Ч/б',
      by: 'Ч/ж',
      bc: 'Б/ч',
      yw: 'Ж/ч',
      wb: 'Б/с',
      speech: 'Диктор:',
      speech_on: '🔊 Диктор (вкл)',
      speech_off: '🔇 Диктор (выкл)',
      voice: 'Голос:',
      female: 'Женский',
      male: 'Мужской',
      reset: 'Сброс'
    },
    en: {
      font: 'Font:',
      sans: 'Sans-serif',
      serif: 'Serif',
      size: 'Size:',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      spacing: 'Spacing:',
      normal_spacing: 'Normal',
      wide: 'Wide',
      extra_wide: 'Extra wide',
      color: 'Color:',
      bw: 'B/W',
      by: 'B/Y',
      bc: 'W/B',
      yw: 'Y/B',
      wb: 'W/Bl',
      speech: 'Speech:',
      speech_on: '🔊 Speech (on)',
      speech_off: '🔇 Speech (off)',
      voice: 'Voice:',
      female: 'Female',
      male: 'Male',
      reset: 'Reset'
    }
  };

  function getCurrentLang() {
    // Определяем язык из URL или атрибута html
    const path = window.location.pathname;
    if (path.startsWith('/en/')) return 'en';
    if (path.startsWith('/ru/')) return 'ru';
    const htmlLang = document.documentElement.lang;
    if (htmlLang === 'en' || htmlLang === 'ru') return htmlLang;
    return 'ru'; // по умолчанию русский
  }

  let currentLang = getCurrentLang();

  // Настройки по умолчанию
  const defaultSettings = {
    fontFamily: 'sans',
    fontSize: 'medium',
    letterSpacing: 'normal',
    colorScheme: 'bw',
    speechEnabled: false,
    voiceGender: 'female'
  };

  let accessibilitySettings = { ...defaultSettings };
  const savedSettings = localStorage.getItem('accessibilitySettings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      accessibilitySettings = { ...defaultSettings, ...parsed };
    } catch(e) {}
  }

  // Голосовые настройки
  let availableVoices = [];
  let selectedVoice = null;

  function loadVoices() {
    if (!window.speechSynthesis) return;
    availableVoices = window.speechSynthesis.getVoices();
    updateSelectedVoice();
  }

  function updateSelectedVoice() {
    if (!availableVoices.length) return;
    const lang = currentLang === 'ru' ? 'ru' : 'en';
    let voice = null;
    if (accessibilitySettings.voiceGender === 'female') {
      voice = availableVoices.find(v => v.lang.startsWith(lang) && /female|woman|girl/i.test(v.name));
      if (!voice) voice = availableVoices.find(v => v.lang.startsWith(lang));
    } else {
      voice = availableVoices.find(v => v.lang.startsWith(lang) && /male|man|boy/i.test(v.name));
      if (!voice) voice = availableVoices.find(v => v.lang.startsWith(lang));
    }
    selectedVoice = voice || availableVoices[0];
  }

  // Диктор при наведении
  let currentSpeechUtterance = null;
  let hoverTimeout = null;

  function speakText(text) {
    if (!accessibilitySettings.speechEnabled || !window.speechSynthesis) return;
    if (currentSpeechUtterance) {
      window.speechSynthesis.cancel();
      currentSpeechUtterance = null;
    }
    if (!text || !text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = currentLang === 'ru' ? 'ru-RU' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onend = () => { currentSpeechUtterance = null; };
    currentSpeechUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function handleMouseEnter(e) {
    if (!accessibilitySettings.speechEnabled) return;
    if (hoverTimeout) clearTimeout(hoverTimeout);
    let target = e.target;
    let text = '';
    if (target.getAttribute('title')) {
      text = target.getAttribute('title');
    } else if (target.getAttribute('alt')) {
      text = target.getAttribute('alt');
    } else if (target.getAttribute('aria-label')) {
      text = target.getAttribute('aria-label');
    } else if (target.innerText || target.textContent) {
      text = (target.innerText || target.textContent).trim();
      if (text.length > 200) text = text.slice(0, 200) + '…';
    }
    if (text) {
      hoverTimeout = setTimeout(() => speakText(text), 100);
    }
  }

  function handleMouseLeave() {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (currentSpeechUtterance) {
      window.speechSynthesis.cancel();
      currentSpeechUtterance = null;
    }
  }

  function bindSpeechEvents() {
    const selectors = 'a, button, .meme-card, .faq-question, .testimonial-card, h1, h2, h3, p, img, .dropdown-trigger, .social-card';
    document.querySelectorAll(selectors).forEach(el => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (accessibilitySettings.speechEnabled) {
        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);
      }
    });
  }

  function toggleSpeech(enabled) {
    accessibilitySettings.speechEnabled = enabled;
    localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
    if (enabled) {
      if (window.speechSynthesis) loadVoices();
      bindSpeechEvents();
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      const selectors = 'a, button, .meme-card, .faq-question, .testimonial-card, h1, h2, h3, p, img, .dropdown-trigger, .social-card';
      document.querySelectorAll(selectors).forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
      if (currentSpeechUtterance) {
        window.speechSynthesis.cancel();
        currentSpeechUtterance = null;
      }
    }
    updatePanelUI();
  }

  // Применение стилей
  function applyAccessibilityStyles() {
    if (!isAccessibilityMode) return;
    document.body.classList.add('accessibility-mode');
    const root = document.documentElement;
    document.body.style.fontFamily = accessibilitySettings.fontFamily === 'serif' ? "'Times New Roman', Times, serif" : "'Inter', system-ui, sans-serif";
    const sizes = { small: '1rem', medium: '1.2rem', large: '1.5rem' };
    document.body.style.fontSize = sizes[accessibilitySettings.fontSize] || '1.2rem';
    const spacing = { normal: 'normal', wide: '0.1em', 'extra-wide': '0.2em' };
    document.body.style.letterSpacing = spacing[accessibilitySettings.letterSpacing] || 'normal';
    const schemes = {
      bw: { bg: '#ffffff', text: '#000000', accent: '#0000ff', border: '#000000' },
      by: { bg: '#ffff00', text: '#000000', accent: '#0000ff', border: '#000000' },
      bc: { bg: '#000000', text: '#ffffff', accent: '#ffff00', border: '#ffffff' },
      yw: { bg: '#000000', text: '#ffff00', accent: '#ffffff', border: '#ffff00' },
      wb: { bg: '#0000aa', text: '#ffffff', accent: '#ffff00', border: '#ffffff' }
    };
    const s = schemes[accessibilitySettings.colorScheme] || schemes.bw;
    root.style.setProperty('--bg-gradient', 'none');
    root.style.setProperty('--surface', s.bg);
    root.style.setProperty('--surface-glass', s.bg);
    root.style.setProperty('--text-primary', s.text);
    root.style.setProperty('--text-secondary', s.text);
    root.style.setProperty('--card-bg', s.bg);
    root.style.setProperty('--border', s.border);
    root.style.setProperty('--accent', s.accent);
    root.style.setProperty('--accent-hover', s.accent);
    let dynStyle = document.getElementById('a11y-dynamic-styles');
    if (!dynStyle) {
      const style = document.createElement('style');
      style.id = 'a11y-dynamic-styles';
      style.textContent = `
        .accessibility-mode * { animation: none !important; transition: none !important; box-shadow: none !important; backdrop-filter: none !important; }
        .accessibility-mode a, .accessibility-mode button { text-decoration: underline !important; }
      `;
      document.head.appendChild(style);
    }
  }

  function resetAccessibilityStyles() {
    document.body.classList.remove('accessibility-mode');
    const root = document.documentElement;
    root.style.removeProperty('--bg-gradient');
    root.style.removeProperty('--surface');
    root.style.removeProperty('--surface-glass');
    root.style.removeProperty('--text-primary');
    root.style.removeProperty('--text-secondary');
    root.style.removeProperty('--card-bg');
    root.style.removeProperty('--border');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-hover');
    document.body.style.fontFamily = '';
    document.body.style.fontSize = '';
    document.body.style.letterSpacing = '';
    const dynStyle = document.getElementById('a11y-dynamic-styles');
    if (dynStyle) dynStyle.remove();
  }

  // Функция сброса всех настроек
  function resetToDefault() {
    accessibilitySettings = { ...defaultSettings };
    localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
    if (isAccessibilityMode) {
      applyAccessibilityStyles();
      if (window.speechSynthesis) loadVoices();
      toggleSpeech(accessibilitySettings.speechEnabled);
    }
    updatePanelUI();
  }

  // Обновление UI панели (значения селектов и кнопок)
  function updatePanelUI() {
    const panel = document.getElementById('accessibility-panel');
    if (!panel) return;
    const fontSelect = document.getElementById('a11y-font-family');
    const sizeSelect = document.getElementById('a11y-font-size');
    const spacingSelect = document.getElementById('a11y-letter-spacing');
    const colorSelect = document.getElementById('a11y-color-scheme');
    const speechBtn = document.getElementById('a11y-speech-btn');
    const genderSelect = document.getElementById('a11y-voice-gender');
    if (fontSelect) fontSelect.value = accessibilitySettings.fontFamily;
    if (sizeSelect) sizeSelect.value = accessibilitySettings.fontSize;
    if (spacingSelect) spacingSelect.value = accessibilitySettings.letterSpacing;
    if (colorSelect) colorSelect.value = accessibilitySettings.colorScheme;
    if (speechBtn) {
      const texts = i18n[currentLang];
      speechBtn.textContent = accessibilitySettings.speechEnabled ? texts.speech_on : texts.speech_off;
    }
    if (genderSelect) {
      genderSelect.value = accessibilitySettings.voiceGender;
      genderSelect.disabled = !accessibilitySettings.speechEnabled;
    }
    // Обновить тексты всех элементов панели согласно текущему языку
    updatePanelLanguage();
  }

  function updatePanelLanguage() {
    const panel = document.getElementById('accessibility-panel');
    if (!panel) return;
    const t = i18n[currentLang];
    // Метки
    const labels = panel.querySelectorAll('label');
    if (labels[0]) labels[0].innerHTML = t.font;
    if (labels[1]) labels[1].innerHTML = t.size;
    if (labels[2]) labels[2].innerHTML = t.spacing;
    if (labels[3]) labels[3].innerHTML = t.color;
    if (labels[4]) labels[4].innerHTML = t.speech;
    if (labels[5]) labels[5].innerHTML = t.voice;
    // Опции селектов
    const fontSelect = document.getElementById('a11y-font-family');
    if (fontSelect) {
      fontSelect.options[0].text = t.sans;
      fontSelect.options[1].text = t.serif;
    }
    const sizeSelect = document.getElementById('a11y-font-size');
    if (sizeSelect) {
      sizeSelect.options[0].text = t.small;
      sizeSelect.options[1].text = t.medium;
      sizeSelect.options[2].text = t.large;
    }
    const spacingSelect = document.getElementById('a11y-letter-spacing');
    if (spacingSelect) {
      spacingSelect.options[0].text = t.normal_spacing;
      spacingSelect.options[1].text = t.wide;
      spacingSelect.options[2].text = t.extra_wide;
    }
    const colorSelect = document.getElementById('a11y-color-scheme');
    if (colorSelect) {
      colorSelect.options[0].text = t.bw;
      colorSelect.options[1].text = t.by;
      colorSelect.options[2].text = t.bc;
      colorSelect.options[3].text = t.yw;
      colorSelect.options[4].text = t.wb;
    }
    const genderSelect = document.getElementById('a11y-voice-gender');
    if (genderSelect) {
      genderSelect.options[0].text = t.female;
      genderSelect.options[1].text = t.male;
    }
    const speechBtn = document.getElementById('a11y-speech-btn');
    if (speechBtn) {
      speechBtn.textContent = accessibilitySettings.speechEnabled ? t.speech_on : t.speech_off;
    }
    const resetBtn = document.getElementById('a11y-reset-btn');
    if (resetBtn) resetBtn.textContent = t.reset;
  }

  // Создание панели управления
  function createAccessibilityPanel() {
    if (document.getElementById('accessibility-panel')) return;
    const t = i18n[currentLang];
    const panel = document.createElement('div');
    panel.id = 'accessibility-panel';
    panel.style.cssText = `
      width: 100%;
      background: #f0f0f0;
      border-bottom: 2px solid #000;
      font-family: sans-serif;
      padding: 10px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 15px;
      color: #000;
      position: relative;
      z-index: 1000;
      box-sizing: border-box;
    `;
    panel.innerHTML = `
      <div><label>${t.font}</label>
        <select id="a11y-font-family">
          <option value="sans">${t.sans}</option>
          <option value="serif">${t.serif}</option>
        </select>
      </div>
      <div><label>${t.size}</label>
        <select id="a11y-font-size">
          <option value="small">${t.small}</option>
          <option value="medium">${t.medium}</option>
          <option value="large">${t.large}</option>
        </select>
      </div>
      <div><label>${t.spacing}</label>
        <select id="a11y-letter-spacing">
          <option value="normal">${t.normal_spacing}</option>
          <option value="wide">${t.wide}</option>
          <option value="extra-wide">${t.extra_wide}</option>
        </select>
      </div>
      <div><label>${t.color}</label>
        <select id="a11y-color-scheme">
          <option value="bw">${t.bw}</option>
          <option value="by">${t.by}</option>
          <option value="bc">${t.bc}</option>
          <option value="yw">${t.yw}</option>
          <option value="wb">${t.wb}</option>
        </select>
      </div>
      <div><label>${t.speech}</label>
        <button id="a11y-speech-btn" style="background:#000; color:#fff; border:none; padding:4px 10px; border-radius:20px; cursor:pointer;">${accessibilitySettings.speechEnabled ? t.speech_on : t.speech_off}</button>
      </div>
      <div><label>${t.voice}</label>
        <select id="a11y-voice-gender" ${!accessibilitySettings.speechEnabled ? 'disabled' : ''}>
          <option value="female">${t.female}</option>
          <option value="male">${t.male}</option>
        </select>
      </div>
      <div><button id="a11y-reset-btn" style="background:#000; color:#fff; border:none; padding:4px 10px; border-radius:20px; cursor:pointer;">${t.reset}</button></div>
    `;
    document.body.insertBefore(panel, document.body.firstChild);

    // Привязка обработчиков
    document.getElementById('a11y-font-family').addEventListener('change', (e) => {
      accessibilitySettings.fontFamily = e.target.value;
      localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
      applyAccessibilityStyles();
    });
    document.getElementById('a11y-font-size').addEventListener('change', (e) => {
      accessibilitySettings.fontSize = e.target.value;
      localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
      applyAccessibilityStyles();
    });
    document.getElementById('a11y-letter-spacing').addEventListener('change', (e) => {
      accessibilitySettings.letterSpacing = e.target.value;
      localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
      applyAccessibilityStyles();
    });
    document.getElementById('a11y-color-scheme').addEventListener('change', (e) => {
      accessibilitySettings.colorScheme = e.target.value;
      localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
      applyAccessibilityStyles();
    });
    const speechBtn = document.getElementById('a11y-speech-btn');
    speechBtn.addEventListener('click', () => {
      toggleSpeech(!accessibilitySettings.speechEnabled);
    });
    const genderSelect = document.getElementById('a11y-voice-gender');
    genderSelect.addEventListener('change', (e) => {
      accessibilitySettings.voiceGender = e.target.value;
      localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
      if (window.speechSynthesis) loadVoices();
      // если диктор включён, привязка остаётся, голос изменится при следующем чтении
    });
    const resetBtn = document.getElementById('a11y-reset-btn');
    resetBtn.addEventListener('click', () => {
      resetToDefault();
    });
  }

  function showAccessibilityPanel() {
    const panel = document.getElementById('accessibility-panel');
    if (!panel) createAccessibilityPanel();
    else updatePanelLanguage();
  }

  function hideAccessibilityPanel() {
    const panel = document.getElementById('accessibility-panel');
    if (panel) panel.remove();
  }

  function setAccessibilityMode(enabled) {
    isAccessibilityMode = enabled;
    if (enabled) {
      createAccessibilityPanel();
      applyAccessibilityStyles();
      if (window.speechSynthesis) loadVoices();
      toggleSpeech(accessibilitySettings.speechEnabled);
    } else {
      resetAccessibilityStyles();
      hideAccessibilityPanel();
      toggleSpeech(false);
    }
    localStorage.setItem(ACCESSIBILITY_KEY, enabled);
  }

  // Кнопка в навигации
  function addAccessibilityButton() {
    const selectGroup = document.querySelector('.glass-nav .select-group');
    if (!selectGroup) return;
    if (selectGroup.querySelector('.accessibility-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'accessibility-btn';
    btn.setAttribute('aria-label', 'Версия для слабовидящих');
    btn.setAttribute('data-tooltip', 'Версия для слабовидящих');
    btn.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.4rem;
      margin-right: 0.5rem;
      border-radius: 2rem;
      transition: background 0.2s;
    `;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 41 41" width="24" height="24"><circle cx="31.5" cy="19.5" r="7.5" stroke="currentColor" stroke-width="2"/><circle cx="9.5" cy="19.5" r="7.5" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" d="M15 15c3.333-4 6.667-4 10 0"/></svg>`;
    
    const updateBtnColor = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      btn.style.color = (theme === 'dark') ? '#fff' : '#E2241C';
    };
    updateBtnColor();
    const observer = new MutationObserver(updateBtnColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    btn.addEventListener('click', () => {
      const newState = !isAccessibilityMode;
      setAccessibilityMode(newState);
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => btn.style.transform = '', 150);
    });

    const themeDropdown = selectGroup.querySelector('.theme-dropdown');
    if (themeDropdown) selectGroup.insertBefore(btn, themeDropdown);
    else selectGroup.prepend(btn);
  }

  // Смена языка на лету (если переключают язык через дропдаун)
  function observeLangChange() {
    const observer = new MutationObserver(() => {
      const newLang = getCurrentLang();
      if (newLang !== currentLang) {
        currentLang = newLang;
        updatePanelLanguage();
        if (window.speechSynthesis) loadVoices();
        bindSpeechEvents(); // перепривяжем с новым языком
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    // также слушаем изменения URL (для history.pushState)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        const newLang = getCurrentLang();
        if (newLang !== currentLang) {
          currentLang = newLang;
          updatePanelLanguage();
          if (window.speechSynthesis) loadVoices();
          bindSpeechEvents();
        }
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Загрузка голосов
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => { loadVoices(); };
    loadVoices();
  }

  // Инициализация
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (isAccessibilityMode) setAccessibilityMode(true);
      addAccessibilityButton();
      observeLangChange();
    });
  } else {
    if (isAccessibilityMode) setAccessibilityMode(true);
    addAccessibilityButton();
    observeLangChange();
  }
})();

// ========== МОБИЛЬНЫЕ УЛУЧШЕНИЯ (свайпы, жесты, тач-события) ==========
(function() {
  // Определяем мобильное устройство по touch-событиям
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent) || 
                   ('ontouchstart' in window) || 
                   (navigator.maxTouchPoints > 0);

  if (!isMobile) return;

  // 1. Добавляем закрытие лайтбокса свайпом вниз
  const lightboxEl = document.getElementById('lightbox');
  if (lightboxEl) {
    let touchStartY = 0;
    let touchEndY = 0;

    lightboxEl.addEventListener('touchstart', (e) => {
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    lightboxEl.addEventListener('touchend', (e) => {
      touchEndY = e.changedTouches[0].screenY;
      const deltaY = touchEndY - touchStartY;
      // Если свайп вниз больше 70 пикселей – закрываем лайтбокс
      if (deltaY > 70 && lightboxEl.classList.contains('active')) {
        if (typeof closeLightbox === 'function') closeLightbox();
        else {
          // fallback
          lightboxEl.classList.remove('active');
          if (currentMedia) {
            currentMedia.pause();
            currentMedia.src = '';
            currentMedia = null;
          }
          lightboxEl.innerHTML = '';
          const closeBtn = document.createElement('button');
          closeBtn.className = 'close-lightbox';
          closeBtn.innerHTML = '&times;';
          closeBtn.onclick = closeLightbox;
          lightboxEl.appendChild(closeBtn);
          lightboxEl.onclick = (e) => {
            if (e.target === lightboxEl) closeLightbox();
          };
        }
        e.preventDefault();
      }
    });
  }

  // 2. Горизонтальный свайп для слайдера трендов (если есть стрелки – их скрыли CSS, но оставим логику для тех, кто не отключил)
  const sliderTrack = document.getElementById('sliderTrack');
  if (sliderTrack) {
    let startX = 0;
    let scrollLeft = 0;
    let isDragging = false;

    sliderTrack.addEventListener('touchstart', (e) => {
      startX = e.touches[0].pageX - sliderTrack.offsetLeft;
      scrollLeft = sliderTrack.scrollLeft;
      isDragging = true;
    }, { passive: true });

    sliderTrack.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const x = e.touches[0].pageX - sliderTrack.offsetLeft;
      const walk = (x - startX) * 1.5; // скорость скролла
      sliderTrack.scrollLeft = scrollLeft - walk;
      e.preventDefault();
    }, { passive: false });

    sliderTrack.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  // 3. Предотвращаем случайное увеличение при двойном тапе на карточках мемов, но оставляем открытие лайтбокса
  const memeCards = document.querySelectorAll('.meme-card');
  memeCards.forEach(card => {
    card.addEventListener('touchstart', (e) => {
      // Просто чтобы не было задержки 300ms (современные браузеры уже решили, но на всякий случай)
    }, { passive: true });
  });

  // 4. Улучшаем кастомные выпадающие списки для мобил: они должны закрываться при выборе и не перекрываться
  const dropdowns = document.querySelectorAll('.custom-dropdown');
  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');
    if (!trigger || !menu) return;

    // При клике на триггер – закрываем другие открытые дропдауны
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdowns.forEach(d => {
        const otherMenu = d.querySelector('.dropdown-menu');
        if (otherMenu && otherMenu !== menu && otherMenu.classList.contains('show')) {
          otherMenu.classList.remove('show');
        }
      });
      menu.classList.toggle('show');
    });

    // Закрытие при клике вне – уже есть в lang-switcher, но продублируем для надёжности
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        menu.classList.remove('show');
      }
    });
  });

  // 5. Фикс для видео в лайтбоксе на iOS (чтобы не уходило в полноэкранный режим)
  if (typeof openLightbox === 'function') {
    const originalOpen = openLightbox;
    window.openLightbox = function(url, type) {
      originalOpen(url, type);
      if (type === 'video') {
        setTimeout(() => {
          const video = document.querySelector('#lightbox video');
          if (video) video.setAttribute('playsinline', 'true');
        }, 50);
      }
    };
  }

  // 6. Добавляем обработку свайпа вверх/вниз для закрытия модальных окон при длинной прокрутке – не нужно, так как лайтбокс уже закрывается свайпом.

  console.log('Мобильные улучшения активированы');
})();