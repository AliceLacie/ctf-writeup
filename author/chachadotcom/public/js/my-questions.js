document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/auth/user', { credentials: 'include' })
    .then(response => {
      if (!response.ok) {
        window.location.href = '/login';
        return Promise.reject();
      }
      return response.json();
    })
    .then(user => {
      main();
    });
});

function main() {
  const askButton = document.getElementById('ask-button');
  const questionFormContainer = document.getElementById('question-form-container');
  const newQuestionForm = document.getElementById('new-question-form');
  const cancelQuestionBtn = document.getElementById('cancel-question-btn');
  const myQuestionsContainer = document.getElementById('my-questions');
  const questionDetailModal = document.getElementById('question-detail-modal');
  const modalClose = document.querySelector('.close');
  const logoutBtn = document.getElementById('logout-btn');

  askButton.addEventListener('click', toggleQuestionForm);
  cancelQuestionBtn.addEventListener('click', toggleQuestionForm);
  newQuestionForm.addEventListener('submit', submitQuestion);
  modalClose.addEventListener('click', closeModal);
  window.addEventListener('click', (e) => {
    if (e.target === questionDetailModal) {
      closeModal();
    }
  });
  logoutBtn.addEventListener('click', logout);

  fetchUserQuestions();

  function toggleQuestionForm() {
    questionFormContainer.classList.toggle('hidden');
  }

  async function fetchUserQuestions() {
    try {
      const response = await fetch('/api/questions/me', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const questions = await response.json();
      displayQuestions(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      myQuestionsContainer.innerHTML = '<p class="error">Failed to load your questions. Please try again later.</p>';
    }
  }

  function displayQuestions(questions) {
    myQuestionsContainer.innerHTML = '';
    if (questions.length === 0) {
      const p = document.createElement('p');
      p.className = 'no-questions';
      p.textContent = "You haven't asked any questions yet.";
      myQuestionsContainer.appendChild(p);
      return;
    }
    questions.forEach(question => {
      const date = new Date(question.createdAt).toLocaleDateString();
      const status = question.isAnswered ? 'Answered' : 'Pending';
      const statusClass = question.isAnswered ? 'answered' : 'pending';
      const item = document.createElement('div');
      item.className = 'question-item';
      item.dataset.id = question._id;

      const content = document.createElement('div');
      content.className = 'question-content';
      const h3 = document.createElement('h3');
      h3.textContent = question.text;
      content.appendChild(h3);
      const meta = document.createElement('div');
      meta.className = 'question-meta';
      const dateSpan = document.createElement('span');
      dateSpan.className = 'question-date';
      dateSpan.textContent = `Asked on ${date}`;
      const catSpan = document.createElement('span');
      catSpan.className = 'question-category';
      catSpan.textContent = question.category;
      const statusSpan = document.createElement('span');
      statusSpan.className = `question-status ${statusClass}`;
      statusSpan.textContent = status;
      meta.appendChild(dateSpan);
      meta.appendChild(catSpan);
      meta.appendChild(statusSpan);
      content.appendChild(meta);
      item.appendChild(content);

      const actions = document.createElement('div');
      actions.className = 'question-actions';
      const btn = document.createElement('button');
      btn.className = 'btn-view';
      btn.dataset.id = question._id;
      btn.textContent = 'View Question';
      btn.addEventListener('click', (e) => {
        const questionId = e.target.getAttribute('data-id');
        viewQuestionDetail(questionId);
      });
      actions.appendChild(btn);
      item.appendChild(actions);
      myQuestionsContainer.appendChild(item);
    });
  }

  async function submitQuestion(e) {
    e.preventDefault();
    const questionText = document.getElementById('question-text').value;
    const category = document.getElementById('category').value;
    if (!questionText.trim()) {
      showErrorMessage('Please enter your question');
      return;
    }
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          text: questionText,
          category
        })
      });
      if (!response.ok) {
        throw new Error('Failed to submit question');
      }
      newQuestionForm.reset();
      toggleQuestionForm();
      fetchUserQuestions();
      showSuccessMessage('Your question has been submitted!');
    } catch (error) {
      console.error('Error submitting question:', error);
      showErrorMessage('Failed to submit your question. Please try again.');
    }
  }

  async function viewQuestionDetail(questionId) {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch question details');
      }
      const question = await response.json();
      document.getElementById('modal-question-text').textContent = question.text;
      document.getElementById('modal-question-user').textContent = question.user.username;
      document.getElementById('modal-question-date').textContent = new Date(question.createdAt).toLocaleDateString();
      document.getElementById('modal-question-category').textContent = question.category;
      document.getElementById('modal-question-status').textContent = question.isAnswered ? 'Answered' : 'Pending';
      document.getElementById('modal-question-status').className = `question-status ${question.isAnswered ? 'answered' : 'pending'}`;
      questionDetailModal.style.display = 'block';
    } catch (error) {
      console.error('Error fetching question details:', error);
      showErrorMessage('Failed to load question details. Please try again.');
    }
  }

  function displayAnswers(answers) {
    const answersListContainer = document.getElementById('answers-list');
    answersListContainer.innerHTML = '';
    if (answers.length === 0) {
      const p = document.createElement('p');
      p.className = 'no-answers';
      p.textContent = 'No answers yet.';
      answersListContainer.appendChild(p);
      return;
    }
    answers.forEach(answer => {
      const date = new Date(answer.createdAt).toLocaleDateString();
      const item = document.createElement('div');
      item.className = 'answer-item';
      const content = document.createElement('div');
      content.className = 'answer-content';
      const p = document.createElement('p');
      p.textContent = answer.text;
      content.appendChild(p);
      item.appendChild(content);
      const meta = document.createElement('div');
      meta.className = 'answer-meta';
      const span = document.createElement('span');
      span.textContent = `Answered by ${answer.guide.username} on ${date}`;
      meta.appendChild(span);
      item.appendChild(meta);
      answersListContainer.appendChild(item);
    });
  }

  function closeModal() {
    questionDetailModal.style.display = 'none';
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
} 