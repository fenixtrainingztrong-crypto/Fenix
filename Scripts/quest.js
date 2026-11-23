document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('questionnaire-form');
  const backButton = document.getElementById('back-button');
  const body = document.body;

  if (!form) {
    return;
  }

  const currentPage = window.location.pathname.toLowerCase();

  const navigateWithTransition = (targetUrl, useTransition = false) => {
    if (!useTransition || !body.classList.contains('quest-page')) {
      window.location.href = targetUrl;
      return;
    }

    body.classList.add('page-leaving');
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 180);
  };

  if (backButton) {
    backButton.addEventListener('click', () => {
      if (currentPage.includes('quest2.html')) {
        navigateWithTransition('Quest.html', true);
        return;
      }

      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      window.location.href = 'index.html';
    });
  }

  // Primeiro questionario avanca para a segunda etapa.
  if (currentPage.includes('quest.html') && !currentPage.includes('quest2.html')) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      navigateWithTransition('Quest2.html', true);
    });
    return;
  }

  // Segundo questionario envia para a tela de loading.
  if (currentPage.includes('quest2.html')) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      window.location.href = 'Loading.html';
    });
  }
});
