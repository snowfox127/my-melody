//controlling burger menu
const toggleBurger = () => {
    let burgerIcon = document.getElementById('burger');
    let dropMenu = document.getElementById('start');
    burgerIcon.classList.toggle('is-active');
    dropMenu.classList.toggle('is-active');
  };