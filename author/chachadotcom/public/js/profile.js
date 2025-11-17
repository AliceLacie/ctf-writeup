document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/auth/user', { credentials: 'include' })
    .then(response => {
      if (!response.ok) {
        window.location.href = '/login';
        return;
      }
      return response.json();
    })
    .then(userData => {
      if (userData) displayUserData(userData);
    });

  const profileUsername = document.getElementById('profile-username');
  const profileEmail = document.getElementById('profile-email');
  const profileRole = document.getElementById('profile-role');
  const profileJoined = document.getElementById('profile-joined');
  const editProfileBtn = document.getElementById('edit-profile-btn');
  const editProfileForm = document.getElementById('edit-profile-form');
  const profileForm = document.getElementById('profile-form');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const logoutBtn = document.getElementById('logout-btn');

  logoutBtn.addEventListener('click', logout);

  function displayUserData(userData) {
    const usernameElement = profileUsername.querySelector('p');
    usernameElement.textContent = userData.username || 'Not set';
    const emailElement = profileEmail.querySelector('p');
    emailElement.textContent = userData.email || 'Not set';
    const roleElement = profileRole.querySelector('p');
    roleElement.textContent = userData.role || 'Not set';
    const joinedElement = profileJoined.querySelector('p');
    const joinedDate = new Date(userData.createdAt);
    joinedElement.textContent = joinedDate.toLocaleDateString();
  }


  function logout() {
    fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
      .then(() => {
        window.location.href = '/login';
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }

  function showSuccessMessage(message) {
    alert(message);
  }

  function showErrorMessage(message) {
    alert(message);
  }
}); 