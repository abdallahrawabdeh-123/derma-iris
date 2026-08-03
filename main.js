/* ==========================================================================
   DERMA IRIS - MAIN INTERACTION CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  setupNavbar();
  setupBeforeAfterSlider();
  setupFaqAccordion();
});

// Mobile Navbar Toggle & Header Scroll
function setupNavbar() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  // Header scroll shadow effect
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.boxShadow = 'var(--shadow-md)';
    } else {
      header.style.boxShadow = 'none';
    }
  });
}

// Before & After Drag Slider Engine
function setupBeforeAfterSlider() {
  const container = document.getElementById('ba-container');
  const afterImage = document.getElementById('ba-after');
  const handle = document.getElementById('ba-handle');

  if (!container || !afterImage || !handle) return;

  let isDragging = false;

  const updateSliderPosition = (x) => {
    const rect = container.getBoundingClientRect();
    let position = x - rect.left;

    // Clamp bounds
    if (position < 0) position = 0;
    if (position > rect.width) position = rect.width;

    const percentage = (position / rect.width) * 100;

    // Is RTL active?
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';

    if (isRtl) {
      afterImage.style.width = `${100 - percentage}%`;
      handle.style.left = `${percentage}%`;
    } else {
      afterImage.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
    }
  };

  // Mouse Events
  handle.addEventListener('mousedown', () => isDragging = true);
  window.addEventListener('mouseup', () => isDragging = false);
  container.addEventListener('mousemove', (e) => {
    if (isDragging) updateSliderPosition(e.clientX);
  });

  // Touch Events
  handle.addEventListener('touchstart', () => isDragging = true);
  window.addEventListener('touchend', () => isDragging = false);
  container.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches[0]) {
      updateSliderPosition(e.touches[0].clientX);
    }
  });
}

// FAQ Accordion Engine
function setupFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    const body = item.querySelector('.faq-body');

    if (header && body) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all items
        faqItems.forEach(i => {
          i.classList.remove('active');
          const b = i.querySelector('.faq-body');
          if (b) b.style.maxHeight = null;
        });

        // Open clicked item if wasn't active
        if (!isActive) {
          item.classList.add('active');
          body.style.maxHeight = body.scrollHeight + "px";
        }
      });
    }
  });
}
