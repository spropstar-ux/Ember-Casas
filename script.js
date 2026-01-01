document.getElementById('current-year').textContent = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', function () {
  const phoneRegex = /^\(?\d{3}\)?[-\.\s]?\d{3}[-\.\s]?\d{4}$/;

  // Helper functions moved out for clarity

  function validateRequiredFields(container) {
    const inputs = Array.from(container.querySelectorAll('input, select, textarea'));
    for (const inp of inputs) {
      if (inp.hasAttribute('required') && !inp.value.trim()) {
        inp.focus();
        return false;
      }
    }
    return true;
  }

  async function sendEmail(form) {
    if (form.dataset.sending === 'true') return;
    form.dataset.sending = 'true';

    const submitBtn = form.querySelector("button[type='submit'], input[type='submit']");
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending...';
    }

    const get = name => form.querySelector(`[name="${name}"]`);

    // PHONE VALIDATION
    const phoneEl = get('phone');
    if (phoneEl) {
      const phoneDigits = phoneEl.value.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        Swal.fire({ title: 'Invalid Phone', text: 'Please enter a valid 10-digit phone number.', icon: 'warning', confirmButtonColor: '#ae2535' });
        reset();
        return;
      }
      phoneEl.value = `(${phoneDigits.slice(0,3)}) ${phoneDigits.slice(3,6)}-${phoneDigits.slice(6)}`;
    }

    const data = {
      name: get('name') ? get('name').value.trim() : '',
      email: get('email') ? get('email').value.trim() : '',
      phone: get('phone') ? get('phone').value.trim() : '',
      street: get('street') ? get('street').value.trim() : '',
      city: get('city') ? get('city').value.trim() : '',
      state: get('state') ? get('state').value.trim() : '',
      zip: get('zip') ? get('zip').value.trim() : '',
      timeline: get('timeline') ? get('timeline').value : '',
      reason: get('reason') ? get('reason').value.trim() : ''
    };

    try {
      const res = await fetch('https://script.google.com/macros/s/AKfycbyD0wSH6Za8XQcseGgHlorq9USuMF6XmDTMgmamo-vkXWVmz3UMz4ImkWW0uLHbwY-M/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (result.status === 'success') {
        const userName = data.name.split(' ')[0] || 'Friend';
        Swal.fire({ title: `Thank you, ${userName}!`, html: `<p style="font-size:15px;">We’ve received your details.<br>Our team will contact you shortly.</p><p style="margin-top:18px;font-weight:bold;">– Ember Casas</p>`, icon: 'success', confirmButtonColor: '#ae2535' });
        form.reset();
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error', confirmButtonColor: '#ae2535' });
    } finally {
      reset();
    }

    function reset() {
      form.dataset.sending = 'false';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  }


  document.querySelectorAll('.lead-form').forEach(form => {
    const steps = Array.from(form.querySelectorAll('.form-step'));
    let current = 0;
    const submitBtn = form.querySelector("button[type='submit'], input[type='submit']");

    function showStep(index) {
      steps.forEach((s, i) => {
        const isActive = i === index;
        s.setAttribute('aria-hidden', !isActive);
        if (isActive) s.classList.add('active'); else s.classList.remove('active');
        // also reflect via display for older styles
        s.style.display = isActive ? 'block' : 'none';
      });
      current = index;
      // toggle submit button visibility: only show on last step
      if (submitBtn) {
        submitBtn.style.display = (current === steps.length - 1) ? '' : 'none';
      }
    }

    // initialize
    showStep(0);

    form.querySelectorAll('.btn-next').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const step = steps[current];
        if (!validateRequiredFields(step)) return;
        const phone = step.querySelector('input[type="tel"]');
        if (phone && phone.value.trim() && !phoneRegex.test(phone.value.trim())) {
          Swal.fire({ title: 'Invalid Phone', text: 'Please enter a valid US phone number (e.g. 555-555-5555).', icon: 'warning', confirmButtonColor: '#ae2535' });
          phone.focus();
          return;
        }
        if (current < steps.length - 1) showStep(current + 1);
      });
    });

    form.querySelectorAll('.btn-prev').forEach(btn => {
      btn.addEventListener('click', () => {
        if (current > 0) showStep(current - 1);
      });
    });

    // allow Enter to act like clicking next (unless on final step)
    steps.forEach((s, idx) => {
      s.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (idx === steps.length - 1) return; // allow submit on last step
          e.preventDefault();
          const next = form.querySelector('.btn-next');
          if (next) next.click();
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // validate final step
      const finalStep = steps[steps.length - 1];
      if (!validateRequiredFields(finalStep)) return;
      sendEmail(form);
    });
  });
});


