(() => {
  'use strict';

  const initSite = () => {
    const root = document.documentElement;
    const body = document.body;
    const currentPage = body.dataset.page || 'home';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.classList.remove('no-js');
    root.classList.add('js');

    document.querySelectorAll('[data-page-link]').forEach((link) => {
      const isCurrent = link.dataset.pageLink === currentPage;
      link.classList.toggle('is-active', isCurrent);
      if (isCurrent) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    const header = document.querySelector('[data-site-header]');
    const navToggle = document.querySelector('[data-nav-toggle]');
    const mobileNav = document.querySelector('#mobile-menu');

    const setMenuState = (isOpen, shouldFocus = false) => {
      if (!navToggle || !mobileNav) return;
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'إغلاق القائمة' : 'فتح القائمة');
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
      mobileNav.classList.toggle('is-open', isOpen);
      body.classList.toggle('is-menu-open', isOpen);
      const navLabel = navToggle.querySelector('[data-nav-label]');
      if (navLabel) navLabel.textContent = isOpen ? 'إغلاق القائمة' : 'فتح القائمة';
      if (shouldFocus) navToggle.focus();
    };

    setMenuState(false);

    navToggle?.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      setMenuState(!isOpen);
    });

    mobileNav?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuState(false));
    });

    document.addEventListener('click', (event) => {
      if (!mobileNav || !navToggle) return;
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen && !mobileNav.contains(event.target) && !navToggle.contains(event.target)) {
        setMenuState(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (navToggle?.getAttribute('aria-expanded') === 'true') {
        setMenuState(false, true);
      }
    });

    const updateHeader = () => {
      header?.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    const revealElements = document.querySelectorAll('[data-reveal]');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach((element) => element.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      revealElements.forEach((element) => revealObserver.observe(element));
    }

    const formatCount = (value) => new Intl.NumberFormat('en-US').format(value);

    const animateCounter = (element) => {
      if (element.dataset.counted === 'true') return;
      element.dataset.counted = 'true';
      const target = Number(element.dataset.count);
      if (!Number.isFinite(target) || reducedMotion) {
        element.textContent = formatCount(target);
        return;
      }

      const duration = 900;
      const startTime = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = formatCount(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      element.textContent = '0';
      requestAnimationFrame(tick);
    };

    const counters = document.querySelectorAll('[data-count]');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
    } else {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      counters.forEach((counter) => counterObserver.observe(counter));
    }

    const setupFilters = () => {
      document.querySelectorAll('[data-filter-group]').forEach((group) => {
        const buttons = Array.from(group.querySelectorAll('[data-filter]'));
        const targetSelector = group.dataset.filterTarget;
        const target = targetSelector ? document.querySelector(targetSelector) : null;
        if (!target) return;
        const items = Array.from(target.querySelectorAll('[data-filter-item]'));
        const count = group.querySelector('[data-result-count]') || document.querySelector('[data-result-count]');
        const emptyState = document.querySelector('[data-empty-state]');

        const applyFilter = (filter) => {
          let visibleCount = 0;
          buttons.forEach((button) => {
            const isActive = button.dataset.filter === filter;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
          });

          items.forEach((item) => {
            const matches = filter === 'all' || item.dataset.category === filter;
            item.hidden = !matches;
            if (matches) visibleCount += 1;
          });

          if (count) count.textContent = `${formatCount(visibleCount)} نتيجة`;
          emptyState?.classList.toggle('is-visible', visibleCount === 0);
        };

        buttons.forEach((button) => {
          button.addEventListener('click', () => applyFilter(button.dataset.filter || 'all'));
        });

        const activeButton = buttons.find((button) => button.getAttribute('aria-pressed') === 'true') || buttons[0];
        if (activeButton) applyFilter(activeButton.dataset.filter || 'all');
      });
    };
    setupFilters();

    const setupContactForm = () => {
      const form = document.querySelector('[data-contact-form]');
      if (!form) return;
      const status = form.querySelector('[data-form-status]');
      const fields = Array.from(form.querySelectorAll('[data-field]'));

      const getError = (field) => {
        const value = field.value.trim();
        if (field.required && !value) return field.dataset.requiredMessage || 'هذا الحقل مطلوب.';
        if (field.type === 'email' && value && !field.validity.valid) return 'يرجى إدخال بريد إلكتروني صحيح.';
        if (field.minLength > 0 && value.length < field.minLength) return `اكتب ${field.minLength} أحرف على الأقل.`;
        return '';
      };

      const validateField = (field) => {
        const group = field.closest('.form-group');
        const error = group?.querySelector('.field-error');
        const message = getError(field);
        group?.classList.toggle('is-invalid', Boolean(message));
        field.setAttribute('aria-invalid', String(Boolean(message)));
        if (error) error.textContent = message;
        return !message;
      };

      fields.forEach((field) => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
          if (field.closest('.form-group')?.classList.contains('is-invalid')) validateField(field);
        });
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const isValid = fields.map(validateField).every(Boolean);
        if (!isValid) {
          fields.find((field) => field.getAttribute('aria-invalid') === 'true')?.focus();
          if (status) status.textContent = 'تحقق من الحقول المميزة ثم حاول مرة أخرى.';
          return;
        }

        if (status) {
          status.classList.add('is-success');
          status.textContent = 'شكرًا لتواصلك معنا. سنعود إليك قريبًا.';
        }
        form.reset();
        fields.forEach((field) => {
          field.setAttribute('aria-invalid', 'false');
          field.closest('.form-group')?.classList.remove('is-invalid');
          const error = field.closest('.form-group')?.querySelector('.field-error');
          if (error) error.textContent = '';
        });
      });
    };
    setupContactForm();

    document.querySelectorAll('[data-current-year]').forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSite, { once: true });
  } else {
    initSite();
  }
})();