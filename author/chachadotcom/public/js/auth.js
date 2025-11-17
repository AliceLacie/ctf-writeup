document.addEventListener('DOMContentLoaded', function() {
  setupLoginForm();
  setupRegisterForm();
});

function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      const remember = document.getElementById('remember').checked;
      
      if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
      }
      
      const submitButton = loginForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Logging in...';
      submitButton.disabled = true;
      
      fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.msg || 'Login failed');
          });
        }
        return response.json();
      })
      .then(data => {
        showMessage('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      })
      .catch(error => {
        showMessage(error.message, 'error');
        
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      });
    });
  }
}

function setupRegisterForm() {
  const registerForm = document.getElementById('register-form');
  
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      const confirmPassword = document.getElementById('confirm-password').value.trim();
      const termsAccepted = document.getElementById('terms').checked;
      
      if (!username || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
      }
      
      if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
      }
      
      if (!termsAccepted) {
        showMessage('You must accept the Terms of Service and Privacy Policy', 'error');
        return;
      }
      
      const submitButton = registerForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Creating account...';
      submitButton.disabled = true;
      
      fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.msg || 'Registration failed');
          });
        }
        return response.json();
      })
      .then(data => {
        showMessage('Registration successful! Redirecting...', 'success');
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      })
      .catch(error => {
        showMessage(error.message, 'error');
        
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      });
    });
  }
}

function updateNavForAuthUser(user) {
  const navLinks = document.querySelector('nav ul');
  if (!navLinks) return;
  navLinks.innerHTML = '';
  if (user) {
    navLinks.innerHTML = `
      <li><a href="/">Home</a></li>
      <li><a href="/">About</a></li>
      ${user.role === 'guide' || user.role === 'admin' ? '<li><a href="/">Guide Dashboard</a></li>' : '<li><a href="/my-questions">My Questions</a></li>'}
      <li><a href="/profile" class="btn-login">`;
    
    document.getElementById('logout-btn').addEventListener('click', function(e) {
      e.preventDefault();
      logoutUser();
    });
  } else {
    navLinks.innerHTML = `
      <li><a href="/">Home</a></li>
      <li><a href="/">About</a></li>
      <li><a href="/">Become a Guide</a></li>
      <li><a href="/login" class="btn-login">Login</a></li>
      <li><a href="/register" class="btn-register">Register</a></li>
    `;
  }
}

function logoutUser() {
  fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    .then(() => {
      showMessage('You have been logged out', 'info');
      updateNavForAuthUser(null);
      setTimeout(() => { window.location.reload(); }, 1500);
    })
    .catch(() => {
      showMessage('You have been logged out', 'info');
      updateNavForAuthUser(null);
      setTimeout(() => { window.location.reload(); }, 1500);
    });
}

function showMessage(message, type = 'info') {
  let messageContainer = document.querySelector('.message-container');
  
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    
    const form = document.querySelector('form');
    if (form) {
      form.parentNode.insertBefore(messageContainer, form.nextSibling);
    } else {
      const content = document.querySelector('section');
      if (content) {
        content.insertBefore(messageContainer, content.firstChild);
      } else {
        document.body.insertBefore(messageContainer, document.body.firstChild);
      }
    }
  }
  
  const messageElement = document.createElement('div');
  messageElement.className = `message message-${type}`;
  messageElement.textContent = message;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'message-close';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', function() {
    messageElement.remove();
  });
  
  messageElement.appendChild(closeButton);
  messageContainer.appendChild(messageElement);
  
  setTimeout(() => {
    if (messageElement.parentNode) {
      messageElement.remove();
    }
  }, 5000);
}

(function addMessageStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .message-container {
      margin: 20px 0;
    }
    
    .message {
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 10px;
      position: relative;
    }
    
    .message-info {
      background-color: #d1ecf1;
      color: #0c5460;
    }
    
    .message-success {
      background-color: #d4edda;
      color: #155724;
    }
    
    .message-error {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .message-close {
      position: absolute;
      top: 5px;
      right: 10px;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.5;
    }
    
    .message-close:hover {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
})(); 