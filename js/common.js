// ТЕМА (как была)
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

// ЛАЙТБОКС (универсальный: картинка, видео или аудио)
const lightbox = document.createElement('div');
lightbox.id = 'lightbox';
lightbox.className = 'lightbox';
lightbox.innerHTML = `
  <button class="close-lightbox">&times;</button>
  <img class="lightbox-content" alt="">
  <video class="lightbox-content" controls></video>
  <audio class="lightbox-content" controls></audio>
`;
document.body.appendChild(lightbox);
const lightboxImg = lightbox.querySelector('img');
const lightboxVideo = lightbox.querySelector('video');
const lightboxAudio = lightbox.querySelector('audio');
const closeBtn = lightbox.querySelector('.close-lightbox');

function openLightbox(url, type) {
  lightbox.classList.add('active');
  // Скрыть все элементы
  lightboxImg.style.display = 'none';
  lightboxVideo.style.display = 'none';
  lightboxAudio.style.display = 'none';
  
  if (type === 'video') {
    lightboxVideo.style.display = 'block';
    lightboxVideo.src = url;
    lightboxVideo.play();
  } else if (type === 'audio') {
    lightboxAudio.style.display = 'block';
    lightboxAudio.src = url;
    lightboxAudio.play();
  } else { // photo или gif
    lightboxImg.style.display = 'block';
    lightboxImg.src = url;
  }
}
closeBtn.onclick = () => {
  lightbox.classList.remove('active');
  lightboxVideo.pause();
  lightboxVideo.src = '';
  lightboxAudio.pause();
  lightboxAudio.src = '';
  lightboxImg.src = '';
};
lightbox.onclick = (e) => { if (e.target === lightbox) closeBtn.click(); };

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

// КАСТОМНЫЙ ВИДЕОПЛЕЕР (остаётся)
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

// ========== ТВОИ ФАЙЛЫ (полный список) ==========
const memesLibrary = {
  photos: [
    { name: 'Простоквашино', file: '/cdn/assets/photos/1.jpg' },
    { name: 'Кошак', file: '/cdn/assets/photos/2.webp' },
    { name: 'Мем', file: '/cdn/assets/photos/3.png' },
    { name: 'Котик', file: '/cdn/assets/photos/cat.jpg' },
    { name: 'Закат', file: '/cdn/assets/photos/sunset.jpg' }
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
      // Для аудио показываем иконку и название
      preview = `<div class="meme-preview" style="background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 3rem;">🎵</div>`;
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
  initVideoPlayers(); // для видео-превью внутри карточек
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('memesContainer')) renderMemes('memesContainer');
  initVideoPlayers();
});