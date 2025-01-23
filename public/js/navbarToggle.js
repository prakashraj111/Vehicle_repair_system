const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

const toggle = document.getElementById('toggle');
const toggleState = document.getElementById('toggleState');

toggle.addEventListener('change', () => {
    toggleState.textContent = toggle.checked ? 'On' : 'Off';
});