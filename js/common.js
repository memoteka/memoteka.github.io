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

/*!
 * ScrollSmoother 3.12.5
 * https://gsap.com
 *
 * @license Copyright 2023, GreenSock. All rights reserved.
 * This plugin is a membership benefit of Club GreenSock and is only authorized for use in sites/apps/products developed by individuals/companies with an active Club GreenSock membership. See https://greensock.com/club
 * @author: Jack Doyle, jack@greensock.com
 */

!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e=e||self).window=e.window||{})}(this,function(e){"use strict";function _defineProperties(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function s(){return"undefined"!=typeof window}function t(){return B||s()&&(B=window.gsap)&&B.registerPlugin&&B}function w(){return String.fromCharCode.apply(null,arguments)}function D(e){return Z.maxScroll(e||L)}var B,F,L,I,j,q,W,Y,Z,K,$,G,J,Q,X,i="ScrollSmoother",a=w(103,114,101,101,110,115,111,99,107,46,99,111,109),l=w(103,115,97,112,46,99,111,109),c=/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}:?\d*$/,r=(function(e){var t=false&&"undefined"!=typeof window,r=0===(t?window.location.href:"").indexOf(w(102,105,108,101,58,47,47))||-1!==e.indexOf(w(108,111,99,97,108,104,111,115,116))||c.test(e)||(t?window.location.hostname:"").split(".").pop()===w(108,111,99,97,108),n=[a,l,w(99,111,100,101,112,101,110,46,105,111),w(99,111,100,101,112,101,110,46,112,108,117,109,98,105,110,103),w(99,111,100,101,112,101,110,46,100,101,118),w(99,111,100,101,112,101,110,46,97,112,112),w(99,111,100,101,112,101,110,46,119,101,98,115,105,116,101),w(112,101,110,115,46,99,108,111,117,100),w(99,115,115,45,116,114,105,99,107,115,46,99,111,109),w(99,100,112,110,46,105,111),w(112,101,110,115,46,105,111),w(103,97,110,110,111,110,46,116,118),w(99,111,100,101,99,97,110,121,111,110,46,110,101,116),w(116,104,101,109,101,102,111,114,101,115,116,46,110,101,116),w(99,101,114,101,98,114,97,120,46,99,111,46,117,107),w(116,121,109,112,97,110,117,115,46,110,101,116),w(116,119,101,101,110,109,97,120,46,99,111,109),w(112,108,110,107,114,46,99,111),w(104,111,116,106,97,114,46,99,111,109),w(119,101,98,112,97,99,107,98,105,110,46,99,111,109),w(97,114,99,104,105,118,101,46,111,114,103),w(99,111,100,101,115,97,110,100,98,111,120,46,105,111),w(99,115,98,46,97,112,112),w(115,116,97,99,107,98,108,105,116,122,46,99,111,109),w(115,116,97,99,107,98,108,105,116,122,46,105,111),w(99,111,100,105,101,114,46,105,111),w(109,111,116,105,111,110,116,114,105,99,107,115,46,99,111,109),w(115,116,97,99,107,111,118,101,114,102,108,111,119,46,99,111,109),w(115,116,97,99,107,101,120,99,104,97,110,103,101,46,99,111,109),w(115,116,117,100,105,111,102,114,101,105,103,104,116,46,99,111,109),w(119,101,98,99,111,110,116,97,105,110,101,114,46,105,111),w(106,115,102,105,100,100,108,101,46,110,101,116)],o=n.length;for(setTimeout(function checkWarn(){if(t)if("loading"===document.readyState||"interactive"===document.readyState)document.addEventListener("readystatechange",checkWarn);else{document.removeEventListener("readystatechange",checkWarn);var e="object"==typeof B?B:t&&window.gsap;t&&window.console&&!window._gsapWarned&&"object"==typeof e&&!1!==e.config().trialWarn&&(console.log(w(37,99,87,97,114,110,105,110,103),w(102,111,110,116,45,115,105,122,101,58,51,48,112,120,59,99,111,108,111,114,58,114,101,100,59)),console.log(w(65,32,116,114,105,97,108,32,118,101,114,115,105,111,110,32,111,102,32)+i+w(32,105,115,32,108,111,97,100,101,100,32,116,104,97,116,32,111,110,108,121,32,119,111,114,107,115,32,108,111,99,97,108,108,121,32,97,110,100,32,111,110,32,100,111,109,97,105,110,115,32,108,105,107,101,32,99,111,100,101,112,101,110,46,105,111,32,97,110,100,32,99,111,100,101,115,97,110,100,98,111,120,46,105,111,46,32,42,42,42,32,68,79,32,78,79,84,32,68,69,80,76,79,89,32,84,72,73,83,32,70,73,76,69,32,42,42,42,32,76,111,97,100,105,110,103,32,105,116,32,111,110,32,97,110,32,117,110,97,117,116,104,111,114,105,122,101,100,32,115,105,116,101,32,118,105,111,108,97,116,101,115,32,116,104,101,32,108,105,99,101,110,115,101,32,97,110,100,32,119,105,108,108,32,99,97,117,115,101,32,97,32,114,101,100,105,114,101,99,116,46,32,80,108,101,97,115,101,32,106,111,105,110,32,67,108,117,98,32,71,114,101,101,110,83,111,99,107,32,116,111,32,103,101,116,32,102,117,108,108,32,97,99,99,101,115,115,32,116,111,32,116,104,101,32,98,111,110,117,115,32,112,108,117,103,105,110,115,32,116,104,97,116,32,98,111,111,115,116,32,121,111,117,114,32,97,110,105,109,97,116,105,111,110,32,115,117,112,101,114,112,111,119,101,114,115,46,32,68,105,115,97,98,108,101,32,116,104,105,115,32,119,97,114,110,105,110,103,32,119,105,116,104,32,103,115,97,112,46,99,111,110,102,105,103,40,123,116,114,105,97,108,87,97,114,110,58,32,102,97,108,115,101,125,41,59)),console.log(w(37,99,71,101,116,32,117,110,114,101,115,116,114,105,99,116,101,100,32,102,105,108,101,115,32,97,116,32,104,116,116,112,115,58,47,47,103,114,101,101,110,115,111,99,107,46,99,111,109,47,99,108,117,98),w(102,111,110,116,45,115,105,122,101,58,49,54,112,120,59,99,111,108,111,114,58,35,52,101,57,56,49,53)),window._gsapWarned=1)}},50);-1<--o;)if(-1!==e.indexOf(n[o]))return;r||setTimeout(function(){t&&(window.location.href=w(104,116,116,112,115,58,47,47)+a+w(47,114,101,113,117,105,114,101,115,45,109,101,109,98,101,114,115,104,105,112,47)+"?plugin="+i+"&source=trial")},4e3)}("undefined"!=typeof window?window.location.host:""),ScrollSmoother.register=function register(e){return F||(B=e||t(),s()&&window.document&&(L=window,I=document,j=I.documentElement,q=I.body),B&&(W=B.utils.toArray,Y=B.utils.clamp,$=B.parseEase("expo"),Q=B.core.context||function(){},Z=B.core.globals().ScrollTrigger,B.core.globals("ScrollSmoother",ScrollSmoother),q&&Z&&(X=B.delayedCall(.2,function(){return Z.isRefreshing||K&&K.refresh()}).pause(),G=Z.core._getVelocityProp,J=Z.core._inputObserver,ScrollSmoother.refresh=Z.refresh,F=1))),F},function _createClass(e,t,r){return t&&_defineProperties(e.prototype,t),r&&_defineProperties(e,r),e}(ScrollSmoother,[{key:"progress",get:function get(){return this.scrollTrigger?this.scrollTrigger.animation._time/100:0}}]),ScrollSmoother);function ScrollSmoother(t){var o=this;F||ScrollSmoother.register(B)||console.warn("Please gsap.registerPlugin(ScrollSmoother)"),t=this.vars=t||{},K&&K.kill(),Q(K=this);function Pa(){return U.update(-H)}function Ra(){return n.style.overflow="visible"}function Ta(e){e.update();var t=e.getTween();t&&(t.pause(),t._time=t._dur,t._tTime=t._tDur),g=!1,e.animation.progress(e.progress,!0)}function Ua(e,t){(e!==H&&!f||t)&&(x&&(e=Math.round(e)),k&&(n.style.transform="matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, "+e+", 0, 1)",n._gsap.y=e+"px"),M=e-H,H=e,Z.isUpdating||ScrollSmoother.isRefreshing||Z.update())}function Va(e){return arguments.length?(e<0&&(e=0),z.y=-e,g=!0,f?H=-e:Ua(-e),Z.isRefreshing?i.update():E(e/A),this):-H}function Ya(e){w.scrollTop=0,e.target.contains&&e.target.contains(w)||_&&!1===_(o,e)||(Z.isInViewport(e.target)||e.target===p||o.scrollTo(e.target,!1,"center center"),p=e.target)}function Za(t,e){if(t<e.start)return t;var r=isNaN(e.ratio)?1:e.ratio,n=e.end-e.start,o=t-e.start,i=e.offset||0,s=e.pins||[],a=s.offset||0,l=e._startClamp&&e.start<=0||e.pins&&e.pins.offset?0:e._endClamp&&e.end===D()?1:.5;return s.forEach(function(e){n-=e.distance,e.nativeStart<=t&&(o-=e.distance)}),a&&(o*=(n-a/r)/n),t+(o-i*l)/r-o}function _a(t,r){b.forEach(function(e){return function adjustEffectRelatedTriggers(e,t,r){r||(e.pins.length=e.pins.offset=0);var n,o,i,s,a,l,c,f,u=e.pins,d=e.markers;for(c=0;c<t.length;c++)if(f=t[c],e.trigger&&f.trigger&&e!==f&&(f.trigger===e.trigger||f.pinnedContainer===e.trigger||e.trigger.contains(f.trigger))&&(a=f._startNative||f._startClamp||f.start,l=f._endNative||f._endClamp||f.end,i=Za(a,e),s=f.pin&&0<l?i+(l-a):Za(l,e),f.setPositions(i,s,!0,(f._startClamp?Math.max(0,i):i)-a),f.markerStart&&d.push(B.quickSetter([f.markerStart,f.markerEnd],"y","px")),f.pin&&0<f.end&&!r)){if(n=f.end-f.start,o=e._startClamp&&f.start<0){if(0<e.start)return e.setPositions(0,e.end+(e._startNative-e.start),!0),void adjustEffectRelatedTriggers(e,t);n+=f.start,u.offset=-f.start}u.push({start:f.start,nativeStart:a,end:f.end,distance:n,trig:f}),e.setPositions(e.start,e.end+(o?-f.start:n),!0)}}(e,t,r)})}function ab(){Ra(),requestAnimationFrame(Ra),b&&(Z.getAll().forEach(function(e){e._startNative=e.start,e._endNative=e.end}),b.forEach(function(e){var t=e._startClamp||e.start,r=e.autoSpeed?Math.min(D(),e.end):t+Math.abs((e.end-t)/e.ratio),n=r-e.end;if((r-=n/2)<(t-=n/2)){var o=t;t=r,r=o}e._startClamp&&t<0?(n=(r=e.ratio<0?D():e.end/e.ratio)-e.end,t=0):(e.ratio<0||e._endClamp&&r>=D())&&(n=((r=D())-(t=e.ratio<0||1<e.ratio?0:r-(r-e.start)/e.ratio))*e.ratio-(e.end-e.start)),e.offset=n||1e-4,e.pins.length=e.pins.offset=0,e.setPositions(t,r,!0)}),_a(Z.sort())),U.reset()}function bb(){return Z.addEventListener("refresh",ab)}function cb(){return b&&b.forEach(function(e){return e.vars.onRefresh(e)})}function db(){return b&&b.forEach(function(e){return e.vars.onRefreshInit(e)}),cb}function eb(r,n,o,i){return function(){var e="function"==typeof n?n(o,i):n;e||0===e||(e=i.getAttribute("data-"+R+r)||("speed"===r?1:0)),i.setAttribute("data-"+R+r,e);var t="clamp("===(e+"").substr(0,6);return{clamp:t,value:t?e.substr(6,e.length-7):e}}}function fb(r,e,t,n,o){function qc(){e=u(),t=parseFloat(d().value),i=parseFloat(e.value)||1,a="auto"===e.value,c=a||s&&s._startClamp&&s.start<=0||p.offset?0:s&&s._endClamp&&s.end===D()?1:.5,l&&l.kill(),l=t&&B.to(r,{ease:$,overwrite:!1,y:"+=0",duration:t}),s&&(s.ratio=i,s.autoSpeed=a)}function rc(){g.y=h+"px",g.renderTransform(1),qc()}function uc(e){if(a){rc();var t=function _autoDistance(e,t){var r,n,o=e.parentNode||j,i=e.getBoundingClientRect(),s=o.getBoundingClientRect(),a=s.top-i.top,l=s.bottom-i.bottom,c=(Math.abs(a)>Math.abs(l)?a:l)/(1-t),f=-c*t;return 0<c&&(n=.5==(r=s.height/(L.innerHeight+s.height))?2*s.height:2*Math.min(s.height,Math.abs(-c*r/(2*r-1)))*(t||1),f+=t?-n*t:-n/2,c+=n),{change:c,offset:f}}(r,Y(0,1,-e.start/(e.end-e.start)));v=t.change,f=t.offset}else f=p.offset||0,v=(e.end-e.start-f)*(1-i);p.forEach(function(e){return v-=e.distance*(1-i)}),e.offset=v||.001,e.vars.onUpdate(e),l&&l.progress(1)}o=("function"==typeof o?o(n,r):o)||0;var i,s,a,l,c,f,u=eb("speed",e,n,r),d=eb("lag",t,n,r),h=B.getProperty(r,"y"),g=r._gsap,p=[],m=[],v=0;return qc(),(1!==i||a||l)&&(uc(s=Z.create({trigger:a?r.parentNode:r,start:function start(){return e.clamp?"clamp(top bottom+="+o+")":"top bottom+="+o},end:function end(){return e.value<0?"max":e.clamp?"clamp(bottom top-="+o+")":"bottom top-="+o},scroller:w,scrub:!0,refreshPriority:-999,onRefreshInit:rc,onRefresh:uc,onKill:function onKill(e){var t=b.indexOf(e);0<=t&&b.splice(t,1),rc()},onUpdate:function onUpdate(e){var t,r,n,o=h+v*(e.progress-c),i=p.length,s=0;if(e.offset){if(i){for(r=-H,n=e.end;i--;){if((t=p[i]).trig.isActive||r>=t.start&&r<=t.end)return void(l&&(t.trig.progress+=t.trig.direction<0?.001:-.001,t.trig.update(0,0,1),l.resetTo("y",parseFloat(g.y),-M,!0),N&&l.progress(1)));r>t.end&&(s+=t.distance),n-=t.distance}o=h+s+v*((B.utils.clamp(e.start,e.end,r)-e.start-s)/(n-e.start)-c)}m.length&&!a&&m.forEach(function(e){return e(o-s)}),o=function _round(e){return Math.round(1e5*e)/1e5||0}(o+f),l?(l.resetTo("y",o,-M,!0),N&&l.progress(1)):(g.y=o+"px",g.renderTransform(1))}}})),B.core.getCache(s.trigger).stRevert=db,s.startY=h,s.pins=p,s.markers=m,s.ratio=i,s.autoSpeed=a,r.style.willChange="transform"),s}var n,w,e,i,b,s,a,l,c,f,r,u,d,h,g,p,m=t.smoothTouch,v=t.onUpdate,S=t.onStop,T=t.smooth,_=t.onFocusIn,C=t.normalizeScroll,x=t.wholePixels,P=this,R=t.effectsPrefix||"",E=Z.getScrollFunc(L),k=1===Z.isTouch?!0===m?.8:parseFloat(m)||0:0===T||!1===T?0:parseFloat(T)||.8,A=k&&+t.speed||1,H=0,M=0,N=1,U=G(0),z={y:0},O="undefined"!=typeof ResizeObserver&&!1!==t.autoResize&&new ResizeObserver(function(){if(!Z.isRefreshing){var e=D(w)*A;e<-H&&Va(e),X.restart(!0)}});function refreshHeight(){return e=n.clientHeight,n.style.overflow="visible",q.style.height=L.innerHeight+(e-L.innerHeight)/A+"px",e-L.innerHeight}bb(),Z.addEventListener("killAll",bb),B.delayedCall(.5,function(){return N=0}),this.scrollTop=Va,this.scrollTo=function(e,t,r){var n=B.utils.clamp(0,D(),isNaN(e)?o.offset(e,r,!!t&&!f):+e);t?f?B.to(o,{duration:k,scrollTop:n,overwrite:"auto",ease:$}):E(n):Va(n)},this.offset=function(e,t,r){var n,o=(e=W(e)[0]).style.cssText,i=Z.create({trigger:e,start:t||"top top"});return b&&(N?Z.refresh():_a([i],!0)),n=i.start/(r?A:1),i.kill(!1),e.style.cssText=o,B.core.getCache(e).uncache=1,n},this.content=function(e){if(arguments.length){var t=W(e||"#smooth-content")[0]||console.warn("ScrollSmoother needs a valid content element.")||q.children[0];return t!==n&&(c=(n=t).getAttribute("style")||"",O&&O.observe(n),B.set(n,{overflow:"visible",width:"100%",boxSizing:"border-box",y:"+=0"}),k||B.set(n,{clearProps:"transform"})),this}return n},this.wrapper=function(e){return arguments.length?(w=W(e||"#smooth-wrapper")[0]||function _wrap(e){var t=I.querySelector(".ScrollSmoother-wrapper");return t||((t=I.createElement("div")).classList.add("ScrollSmoother-wrapper"),e.parentNode.insertBefore(t,e),t.appendChild(e)),t}(n),l=w.getAttribute("style")||"",refreshHeight(),B.set(w,k?{overflow:"hidden",position:"fixed",height:"100%",width:"100%",top:0,left:0,right:0,bottom:0}:{overflow:"visible",position:"relative",width:"100%",height:"auto",top:"auto",bottom:"auto",left:"auto",right:"auto"}),this):w},this.effects=function(e,t){if(b=b||[],!e)return b.slice(0);(e=W(e)).forEach(function(e){for(var t=b.length;t--;)b[t].trigger===e&&b[t].kill()});t=t||{};var r,n,o=t.speed,i=t.lag,s=t.effectsPadding,a=[];for(r=0;r<e.length;r++)(n=fb(e[r],o,i,r,s))&&a.push(n);return b.push.apply(b,a),!1!==t.refresh&&Z.refresh(),a},this.sections=function(e,t){if(s=s||[],!e)return s.slice(0);var r=W(e).map(function(t){return Z.create({trigger:t,start:"top 120%",end:"bottom -20%",onToggle:function onToggle(e){t.style.opacity=e.isActive?"1":"0",t.style.pointerEvents=e.isActive?"all":"none"}})});return t&&t.add?s.push.apply(s,r):s=r.slice(0),r},this.content(t.content),this.wrapper(t.wrapper),this.render=function(e){return Ua(e||0===e?e:H)},this.getVelocity=function(){return U.getVelocity(-H)},Z.scrollerProxy(w,{scrollTop:Va,scrollHeight:function scrollHeight(){return refreshHeight()&&q.scrollHeight},fixedMarkers:!1!==t.fixedMarkers&&!!k,content:n,getBoundingClientRect:function getBoundingClientRect(){return{top:0,left:0,width:L.innerWidth,height:L.innerHeight}}}),Z.defaults({scroller:w});var V=Z.getAll().filter(function(e){return e.scroller===L||e.scroller===w});V.forEach(function(e){return e.revert(!0,!0)}),i=Z.create({animation:B.fromTo(z,{y:function y(){return h=0}},{y:function y(){return h=1,-refreshHeight()},immediateRender:!1,ease:"none",data:"ScrollSmoother",duration:100,onUpdate:function onUpdate(){if(h){var e=g;e&&(Ta(i),z.y=H),Ua(z.y,e),Pa(),v&&!f&&v(P)}}}),onRefreshInit:function onRefreshInit(e){if(!ScrollSmoother.isRefreshing){if(ScrollSmoother.isRefreshing=!0,b){var t=Z.getAll().filter(function(e){return!!e.pin});b.forEach(function(r){r.vars.pinnedContainer||t.forEach(function(e){if(e.pin.contains(r.trigger)){var t=r.vars;t.pinnedContainer=e.pin,r.vars=null,r.init(t,r.animation)}})})}var r=e.getTween();d=r&&r._end>r._dp._time,u=H,z.y=0,k&&(1===Z.isTouch&&(w.style.position="absolute"),w.scrollTop=0,1===Z.isTouch&&(w.style.position="fixed"))}},onRefresh:function onRefresh(e){e.animation.invalidate(),e.setPositions(e.start,refreshHeight()/A),d||Ta(e),z.y=-E()*A,Ua(z.y),N||(d&&(g=!1),e.animation.progress(B.utils.clamp(0,1,u/A/-e.end))),d&&(e.progress-=.001,e.update()),ScrollSmoother.isRefreshing=!1},id:"ScrollSmoother",scroller:L,invalidateOnRefresh:!0,start:0,refreshPriority:-9999,end:function end(){return refreshHeight()/A},onScrubComplete:function onScrubComplete(){U.reset(),S&&S(o)},scrub:k||!0}),this.smooth=function(e){return arguments.length&&(A=(k=e||0)&&+t.speed||1,i.scrubDuration(e)),i.getTween()?i.getTween().duration():0},i.getTween()&&(i.getTween().vars.ease=t.ease||$),this.scrollTrigger=i,t.effects&&this.effects(!0===t.effects?"[data-"+R+"speed], [data-"+R+"lag]":t.effects,{effectsPadding:t.effectsPadding,refresh:!1}),t.sections&&this.sections(!0===t.sections?"[data-section]":t.sections),V.forEach(function(e){e.vars.scroller=w,e.revert(!1,!0),e.init(e.vars,e.animation)}),this.paused=function(e,t){return arguments.length?(!!f!==e&&(e?(i.getTween()&&i.getTween().pause(),E(-H/A),U.reset(),(r=Z.normalizeScroll())&&r.disable(),(f=Z.observe({preventDefault:!0,type:"wheel,touch,scroll",debounce:!1,allowClicks:!0,onChangeY:function onChangeY(){return Va(-H)}})).nested=J(j,"wheel,touch,scroll",!0,!1!==t)):(f.nested.kill(),f.kill(),f=0,r&&r.enable(),i.progress=(-H/A-i.start)/(i.end-i.start),Ta(i))),this):!!f},this.kill=this.revert=function(){o.paused(!1),Ta(i),i.kill();for(var e=(b||[]).concat(s||[]),t=e.length;t--;)e[t].kill();Z.scrollerProxy(w),Z.removeEventListener("killAll",bb),Z.removeEventListener("refresh",ab),w.style.cssText=l,n.style.cssText=c;var r=Z.defaults({});r&&r.scroller===w&&Z.defaults({scroller:L}),o.normalizer&&Z.normalizeScroll(!1),clearInterval(a),K=null,O&&O.disconnect(),q.style.removeProperty("height"),L.removeEventListener("focusin",Ya)},this.refresh=function(e,t){return i.refresh(e,t)},C&&(this.normalizer=Z.normalizeScroll(!0===C?{debounce:!0,content:!k&&n}:C)),Z.config(t),"overscrollBehavior"in L.getComputedStyle(q)&&B.set([q,j],{overscrollBehavior:"none"}),"scrollBehavior"in L.getComputedStyle(q)&&B.set([q,j],{scrollBehavior:"auto"}),L.addEventListener("focusin",Ya),a=setInterval(Pa,250),"loading"===I.readyState||requestAnimationFrame(function(){return Z.refresh()})}r.version="3.12.5",r.create=function(e){return K&&e&&K.content()===W(e.content)[0]?K:new r(e)},r.get=function(){return K},t()&&B.registerPlugin(r),e.ScrollSmoother=r,e.default=r;if (typeof(window)==="undefined"||window!==e){Object.defineProperty(e,"__esModule",{value:!0})} else {delete e.default}});