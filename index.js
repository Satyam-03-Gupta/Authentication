function ProfileIcon() {
   const profileimg = document.querySelector('.profile-info');
   if (profileimg) {
       profileimg.addEventListener('click', function() {
           profileimg.style.display = 'block';
       });
   }
}
