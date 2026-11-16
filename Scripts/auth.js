// Password toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  // Toggle password visibility
  const passwordToggles = document.querySelectorAll('.password-toggle');
  
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const passwordInput = this.previousElementSibling;
      const icon = this.querySelector('i');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
  
  // Indicar la seguridad de la contraseña
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  
  passwordInputs.forEach(input => {
    input.addEventListener('input', function() {
      const strengthBar = this.closest('.form-group').querySelector('.strength-bar');
      const strengthValue = this.closest('.form-group').querySelector('.strength-value');
      
      if (strengthBar && strengthValue) {
        const password = this.value;
        let strength = 0;
        
        // comprobar la fuerza
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        // Actualizar barra de fuerza
        const percentage = (strength / 4) * 100;
        strengthBar.style.setProperty('--strength-width', `${percentage}%`);
        
        // Actualizar colores de texto
        let color = '#ff4757'; // vermelho
        let text = 'Fraca';
        
        if (strength >= 2) {
          color = '#ffa502'; // laranja
          text = 'Média';
        }
        if (strength >= 3) {
          color = '#2ed573'; // verde
          text = 'Forte';
        }
        if (strength === 4) {
          color = '#1e90ff'; // azul
          text = 'Excelente';
        }
        
        strengthBar.style.backgroundColor = color;
        strengthValue.textContent = text;
        strengthValue.style.color = color;
      }
    });
  });
// ===== FUNÇÕES PARA PÁGINA DE REGISTRO =====
  if (window.location.pathname.includes('Register')) {
    
    // Máscara para CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
      cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        // Limita a 11 caracteres
        if (value.length > 11) {
          value = value.substring(0, 11);
        }      
        // Valida CPF
        validateCPF(value);
      });
      
      // Função de validação de CPF
      function validateCPF(cpf) {
        const cpfClean = cpf.replace(/\D/g, '');
        const validationDiv = document.querySelector('.cpf-validation');
        
        if (!validationDiv) return;
        
        // Verifica se tem 11 dígitos
        if (cpfClean.length !== 11) {
          validationDiv.textContent = 'CPF deve ter 11 dígitos';
          validationDiv.className = 'cpf-validation invalid';
          return false;
        }
        
        // Verifica CPFs inválidos conhecidos
        if (/^(\d)\1+$/.test(cpfClean)) {
          validationDiv.textContent = 'CPF inválido';
          validationDiv.className = 'cpf-validation invalid';
          return false;
        }
        
        // Valida 1º dígito verificador
        let soma = 0;
        for (let i = 0; i < 9; i++) {
          soma += parseInt(cpfClean.charAt(i)) * (10 - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpfClean.charAt(9))) {
          validationDiv.textContent = 'CPF inválido';
          validationDiv.className = 'cpf-validation invalid';
          return false;
        }
        
        // Valida 2º dígito verificador
        soma = 0;
        for (let i = 0; i < 10; i++) {
          soma += parseInt(cpfClean.charAt(i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpfClean.charAt(10))) {
          validationDiv.textContent = 'CPF inválido';
          validationDiv.className = 'cpf-validation invalid';
          return false;
        }
        
        validationDiv.textContent = '✓ CPF válido';
        validationDiv.className = 'cpf-validation valid';
        return true;
      }
    }
  }
  // Form validation
  const forms = document.querySelectorAll('.auth-form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      // Simple validation
      let isValid = true;
      const requiredFields = this.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = '#ff4757';
        } else {
          field.style.borderColor = '';
        }
      });
      
      if (isValid) {
        // Show loading state
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processando...</span>';
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
          // Reset button
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          
          // Show success message
          if (this.closest('.auth-card')) {
            const authCard = this.closest('.auth-card');
            authCard.innerHTML = `
              <div class="auth-header">
                <div class="auth-icon" style="background: #2ed573;">
                  <i class="fas fa-check"></i>
                </div>
                <h1>Conta Criada!</h1>
                <p class="auth-subtitle">Sua conta foi criada com sucesso</p>
              </div>
              <div class="success-message">
                <p>Enviamos um email de confirmação para <strong>${data.email}</strong></p>
                <p>Por favor, verifique sua caixa de entrada.</p>
                <button class="submit-btn" onclick="window.location.href='Login.html'">
                  <span>Fazer Login</span>
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            `;
          }
        }, 1500);
      }
    });
  });
  
  // Social login buttons
  const socialBtns = document.querySelectorAll('.social-btn');
  
  socialBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const provider = this.classList.contains('google') ? 'Google' : 'Apple';
      
      // Show loading
      const originalHTML = this.innerHTML;
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Conectando...</span>';
      this.disabled = true;
    });
  });
});