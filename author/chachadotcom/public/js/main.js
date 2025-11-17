document.addEventListener('DOMContentLoaded', function() {
  fetchRecentQuestions();
  setupQuestionForm();
  checkAuthStatus();
});

function fetchRecentQuestions() {
  const questionsContainer = document.getElementById('recent-questions-list');
  
  if (!questionsContainer) return;
  
  questionsContainer.textContent = 'Loading recent questions...';
  
  fetch('/api/questions')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      return response.json();
    })
    .then(questions => {
      questionsContainer.textContent = '';
      
      if (questions.length === 0) {
        const p = document.createElement('p');
        p.className = 'no-results';
        p.textContent = 'No questions found. Be the first to ask!';
        questionsContainer.appendChild(p);
        return;
      }
      
      questions.slice(0, 6).forEach(question => {
        const questionCard = createQuestionCard(question);
        questionsContainer.appendChild(questionCard);
      });
    })
    .catch(error => {
      console.error('Error fetching questions:', error);
      questionsContainer.textContent = 'Error loading questions. Please try again later.';
    });
}

function createQuestionCard(question) {
  const card = document.createElement('div');
  card.className = 'question-card';
  
  const date = new Date(question.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const username = question.user ? question.user.username : 'Anonymous';
  const avatar = question.user && question.user.avatar 
    ? question.user.avatar 
    : 'https://i.pravatar.cc/100?img=' + (Math.floor(Math.random() * 70) + 1);

  const header = document.createElement('div');
  header.className = 'question-header';
  const img = document.createElement('img');
  img.src = avatar;
  img.alt = username;
  header.appendChild(img);
  const headerInfo = document.createElement('div');
  const h4 = document.createElement('h4');
  h4.textContent = username;
  const meta = document.createElement('div');
  meta.className = 'question-meta';
  meta.textContent = formattedDate;
  headerInfo.appendChild(h4);
  headerInfo.appendChild(meta);
  header.appendChild(headerInfo);
  card.appendChild(header);

  const content = document.createElement('div');
  content.className = 'question-content';
  const h3 = document.createElement('h3');
  h3.textContent = question.text;
  content.appendChild(h3);
  card.appendChild(content);

  const footer = document.createElement('div');
  footer.className = 'question-footer';
  const tags = document.createElement('div');
  tags.className = 'tags';
  const span = document.createElement('span');
  span.textContent = question.category || 'General';
  tags.appendChild(span);
  footer.appendChild(tags);
  const a = document.createElement('a');
  a.href = `/question/${question._id}`;
  a.className = 'view-answers';
  a.textContent = getStatusText(question.status);
  footer.appendChild(a);
  card.appendChild(footer);

  return card;
}

function getStatusText(status) {
  switch (status) {
    case 'pending':
      return 'Awaiting Answer';
    case 'assigned':
      return 'Being Answered';
    case 'answered':
      return 'View Answer';
    case 'closed':
      return 'Closed';
    default:
      return 'View Details';
  }
}

function setupQuestionForm() {
  const questionForm = document.getElementById('question-form');
  const questionInput = document.getElementById('question-input');

  if (questionForm) {
    questionForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const questionText = questionInput.value.trim();
      
      if (questionText.length === 0) {
        showMessage('Please enter your question', 'error');
        return;
      }

      const submitButton = questionForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Submitting...';
      submitButton.disabled = true;
      
      fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: questionText,
          category: detectCategory(questionText)
        })
      })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please log in to ask a question');
          }
          return response.json().then(data => {
            throw new Error(data.msg || 'Failed to submit question');
          });
        }
        return response.json();
      })
      .then(data => {
        showMessage('Your question has been submitted!', 'success');
        questionInput.value = '';
        
        fetchRecentQuestions();
      })
      .catch(error => {
        showMessage(error.message, 'error');
      })
      .finally(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      });
    });
  }
}

function checkAuthStatus() {
  fetch('/api/auth/user', {
    credentials: 'include'
  })
  .then(response => {
    if (response.status == 401) {
      return null;
    }
    return response.json();
  })
  .then(user => {
    updateNavForAuthUser(user);
  })
  .catch(error => {
    updateNavForAuthUser(null);
  });
}

function updateNavForAuthUser(user) {
  const navLinks = document.querySelector('nav ul');
  
  if (!navLinks) return;
  
  navLinks.innerHTML = '';
  
  if (user) {
    const home = document.createElement('li');
    const homeA = document.createElement('a');
    homeA.href = '/';
    homeA.textContent = 'Home';
    home.appendChild(homeA);
    navLinks.appendChild(home);
    const about = document.createElement('li');
    const aboutA = document.createElement('a');
    aboutA.href = '/';
    aboutA.textContent = 'About';
    about.appendChild(aboutA);
    navLinks.appendChild(about);
    if (user.role === 'guide' || user.role === 'admin') {
      const dash = document.createElement('li');
      const dashA = document.createElement('a');
      dashA.textContent = 'Guide Dashboard';
      dash.appendChild(dashA);
      navLinks.appendChild(dash);
    } else {
      const myq = document.createElement('li');
      const myqA = document.createElement('a');
      myqA.href = '/my-questions';
      myqA.textContent = 'My Questions';
      myq.appendChild(myqA);
      navLinks.appendChild(myq);
    }
    const profile = document.createElement('li');
    const profileA = document.createElement('a');
    profileA.href = '/profile';
    profileA.className = 'btn-login';
    profileA.textContent = user.username;
    profile.appendChild(profileA);
    navLinks.appendChild(profile);
    const logout = document.createElement('li');
    const logoutA = document.createElement('a');
    logoutA.href = '#';
    logoutA.id = 'logout-btn';
    logoutA.className = 'btn-register';
    logoutA.textContent = 'Logout';
    logout.appendChild(logoutA);
    navLinks.appendChild(logout);
    document.getElementById('logout-btn').addEventListener('click', function(e) {
      e.preventDefault();
      logoutUser();
    });
  } else {
    const home = document.createElement('li');
    const homeA = document.createElement('a');
    homeA.href = '/';
    homeA.textContent = 'Home';
    home.appendChild(homeA);
    navLinks.appendChild(home);
    const about = document.createElement('li');
    const aboutA = document.createElement('a');
    aboutA.href = '/';
    aboutA.textContent = 'About';
    about.appendChild(aboutA);
    navLinks.appendChild(about);
    const become = document.createElement('li');
    const becomeA = document.createElement('a');
    becomeA.href = '/';
    becomeA.textContent = 'Become a Guide';
    become.appendChild(becomeA);
    navLinks.appendChild(become);
    const login = document.createElement('li');
    const loginA = document.createElement('a');
    loginA.href = '/login';
    loginA.className = 'btn-login';
    loginA.textContent = 'Login';
    login.appendChild(loginA);
    navLinks.appendChild(login);
    const register = document.createElement('li');
    const registerA = document.createElement('a');
    registerA.href = '/register';
    registerA.className = 'btn-register';
    registerA.textContent = 'Register';
    register.appendChild(registerA);
    navLinks.appendChild(register);
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

function detectCategory(text) {
  const lowerText = text.toLowerCase();
  
  const categories = {
    'Technology': ['computer', 'software', 'hardware', 'programming', 'code', 'app', 'website', 'tech', 'smartphone', 'internet', 'wifi'],
    'Sports': ['sport', 'football', 'soccer', 'basketball', 'baseball', 'tennis', 'golf', 'nfl', 'nba', 'mlb', 'athlete'],
    'Movies': ['movie', 'film', 'actor', 'actress', 'director', 'cinema', 'hollywood', 'netflix', 'show', 'tv', 'episode'],
    'Travel': ['travel', 'trip', 'vacation', 'flight', 'hotel', 'beach', 'resort', 'tourism', 'tourist', 'visit', 'country', 'city'],
    'Food': ['food', 'recipe', 'cook', 'restaurant', 'meal', 'diet', 'nutrition', 'eat', 'drink', 'cuisine', 'ingredient'],
    'Health': ['health', 'doctor', 'medical', 'medicine', 'disease', 'symptom', 'hospital', 'treatment', 'cure', 'healthy', 'exercise'],
    'Education': ['school', 'college', 'university', 'student', 'teacher', 'professor', 'learn', 'study', 'education', 'degree', 'course']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  
  return 'General';
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

function toggleMobileNav() {
  const nav = document.querySelector('nav ul');
  nav.classList.toggle('show');
} 