const contactButton = document.getElementById('contactButton');
const shapes = document.querySelectorAll('.bg-shape');

function updateBackground(event) {
  const x = event.clientX / window.innerWidth - 0.5;
  const y = event.clientY / window.innerHeight - 0.5;

  shapes.forEach((shape, index) => {
    const speed = (index + 1) * 16;
    shape.style.transform = `translate3d(${x * speed}px, ${y * speed}px, 0)`;
  });
}

document.addEventListener('pointermove', updateBackground);

if (contactButton) {
  contactButton.addEventListener('click', () => {
    alert('Thanks for visiting! Ill reply soon.');
  });
}

const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.pageYOffset > 24);
});
