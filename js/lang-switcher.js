const langSelect = document.getElementById('lang-switch');
if (langSelect) {
  langSelect.addEventListener('change', (e) => {
    const newLang = e.target.value;
    localStorage.setItem('memotekaLang', newLang);
    let path = window.location.pathname;
    if (path.startsWith('/ru/')) path = path.replace('/ru/', `/${newLang}/`);
    else if (path.startsWith('/en/')) path = path.replace('/en/', `/${newLang}/`);
    else path = `/${newLang}/`;
    window.location.href = path;
  });
}
// Установить выбранное значение в селекте при загрузке
if (langSelect) {
  const currentLang = window.location.pathname.split('/')[1];
  if (currentLang === 'ru' || currentLang === 'en') langSelect.value = currentLang;
}