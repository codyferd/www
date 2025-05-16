const buttons = document.querySelectorAll('.tab-button');
const sections = document.querySelectorAll('main section');

buttons.forEach(button => {
  button.addEventListener('click', () => {
    buttons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    sections.forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
      section.style.animation = 'none';
      section.offsetHeight; // trigger reflow to restart animation
    });

    const selected = document.getElementById(button.dataset.tab);
    selected.style.display = 'flex';
    selected.classList.add('active');
    selected.style.animation = null;
  });
});
