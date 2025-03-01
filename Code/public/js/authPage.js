const formContainer = document.getElementById('formContainer');
const signInBtn = document.getElementById('signInBtn');
const signUpBtn = document.getElementById('signUpBtn');

signInBtn.addEventListener('click', () => {
  formContainer.classList.remove('switch');
});

signUpBtn.addEventListener('click', () => {
  formContainer.classList.add('switch');
});