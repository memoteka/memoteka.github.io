// Кастомный выпадающий список для переключения языка (игнорируем theme-dropdown)
document.addEventListener('DOMContentLoaded', function() {
  const dropdowns = document.querySelectorAll('.custom-dropdown:not(.theme-dropdown)');
  console.log('lang-switcher found dropdowns:', dropdowns.length);
  if (!dropdowns.length) return;

  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');
    const items = dropdown.querySelectorAll('.dropdown-item');
    const currentLang = document.documentElement.lang === 'ru' ? 'ru' : 'en';

    const setTriggerFlag = (lang) => {
      const flagSvg = lang === 'ru' 
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" width="20" height="13"><path fill="#fff" d="M0 0h9v3H0z"/><path fill="#d52b1e" d="M0 3h9v3H0z"/><path fill="#0039a6" d="M0 2h9v2H0z"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="20" height="10"><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>';
      const span = trigger.querySelector('span:first-child');
      if (span) span.innerHTML = flagSvg;
    };
    setTriggerFlag(currentLang);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });

    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = item.getAttribute('data-lang');
        if (lang && lang !== currentLang) {
          localStorage.setItem('memotekaLang', lang);
          let path = window.location.pathname;
          if (path.startsWith('/ru/')) path = path.replace('/ru/', `/${lang}/`);
          else if (path.startsWith('/en/')) path = path.replace('/en/', `/${lang}/`);
          else path = `/${lang}/`;
          window.location.href = path;
        } else {
          menu.classList.remove('show');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) menu.classList.remove('show');
    });
  });
});