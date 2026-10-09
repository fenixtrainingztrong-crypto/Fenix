document.addEventListener('DOMContentLoaded', function() {
  // Assunto buttons
  const assuntoBtns = document.querySelectorAll('.assunto-btn');
  const assuntoInput = document.getElementById('assunto');
  
  assuntoBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove active class from all buttons
      assuntoBtns.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Update hidden input
      assuntoInput.value = this.dataset.value;
    });
  });
  
  // Character counter for textarea
  const mensagemTextarea = document.getElementById('mensagem');
  const charCount = document.querySelector('.char-count');
  
  if (mensagemTextarea && charCount) {
    mensagemTextarea.addEventListener('input', function() {
      const currentLength = this.value.length;
      charCount.textContent = `${currentLength}/1000 caracteres`;
      
      // Limit characters
      if (currentLength > 1000) {
        this.value = this.value.substring(0, 1000);
        charCount.textContent = '1000/1000 caracteres';
        charCount.style.color = '#ff4757';
      }
    });
  }
  
  // FAQ toggle
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', function() {
      const faqItem = this.closest('.faq-item');
      const isActive = faqItem.classList.contains('active');
      
      // Close all FAQ items
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Toggle current item if it wasn't active
      if (!isActive) {
        faqItem.classList.add('active');
      }
    });
  });
  
  // Method buttons
  const methodBtns = document.querySelectorAll('.method-btn');
  
  methodBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (this.classList.contains('whatsapp')) {
        // Open WhatsApp
        window.open('https://wa.me/5511957984521?text=Olá, Tudo bem? Preciso de ajuda com a FENIX', '_blank');
      } else {
        // Simulate chat opening
        const chatBox = document.createElement('div');
        chatBox.className = 'chat-simulator';
        chatBox.innerHTML = `
          <div class="chat-header">
            <h4>Chat de Suporte</h4>
            <button class="close-chat">×</button>
          </div>
          <div class="chat-messages">
            <div class="message bot">
              <p>Olá! Como posso te ajudar hoje?</p>
            </div>
          </div>
          <div class="chat-input">
            <input type="text" placeholder="Digite sua mensagem...">
            <button>Enviar</button>
          </div>
        `;
        
        document.body.appendChild(chatBox);
        
        // Close chat functionality
        chatBox.querySelector('.close-chat').addEventListener('click', function() {
          chatBox.remove();
        });
      }
    });
  });
  
  // Form submission
  const contactForm = document.querySelector('.contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      // Validate required fields
      let isValid = true;
      const requiredFields = this.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = '#ff4757';
          
          // Add error message
          if (!field.nextElementSibling?.classList.contains('error-message')) {
            const error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = 'Este campo é obrigatório';
            error.style.color = '#ff4757';
            error.style.fontSize = '0.85rem';
            error.style.marginTop = '0.25rem';
            field.parentNode.appendChild(error);
          }
        } else {
          field.style.borderColor = '';
          const error = field.parentNode.querySelector('.error-message');
          if (error) error.remove();
        }
      });
      
      if (isValid) {
        // Show loading
        const submitBtn = this.querySelector('.submit-btn');
        const originalHTML = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
          // Reset button
          submitBtn.innerHTML = originalHTML;
          submitBtn.disabled = false;
          
          // Show success message
          const successMessage = document.createElement('div');
          successMessage.className = 'success-message';
          successMessage.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
              <i class="fas fa-check-circle" style="font-size: 3rem; color: #2ed573; margin-bottom: 1rem;"></i>
              <h3 style="margin-bottom: 0.5rem;">Mensagem Enviada!</h3>
              <p style="color: var(--text-light); margin-bottom: 1.5rem;">
                Recebemos sua mensagem e entraremos em contato em breve.
              </p>
              <button class="submit-btn" onclick="this.closest('.success-message').remove(); contactForm.reset();">
                Enviar Nova Mensagem
              </button>
            </div>
          `;
          
          this.style.display = 'none';
          this.parentNode.appendChild(successMessage);
        }, 2000);
      }
    });
  }
  
  // Reset form
  const resetBtn = document.querySelector('.reset-btn');
  
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      if (confirm('Tem certeza que deseja limpar o formulário?')) {
        const form = this.closest('form');
        form.reset();
        
        // Reset assunto buttons
        assuntoBtns.forEach(btn => btn.classList.remove('active'));
        assuntoBtns[0].classList.add('active');
        assuntoInput.value = 'suporte';
        
        // Reset file upload label
        if (fileLabel) {
          fileLabel.innerHTML = `
            <i class="fas fa-paperclip"></i>
            Anexar arquivos (opcional)
            <span>Máximo 5MB - JPG, PNG, PDF, DOC</span>
          `;
        }
        
        // Reset character counter
        if (charCount) {
          charCount.textContent = '0/1000 caracteres';
          charCount.style.color = '';
        }
        
        // Clear error messages
        document.querySelectorAll('.error-message').forEach(error => error.remove());
      }
    });
  }
});