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
    const getCurrentLanguage = () => root.lang?.startsWith('en') ? 'en' : 'ar';

    const setMenuState = (isOpen, shouldFocus = false) => {
      if (!navToggle || !mobileNav) return;
      const isEnglish = getCurrentLanguage() === 'en';
      const menuLabel = isOpen
        ? (isEnglish ? 'Close menu' : 'إغلاق القائمة')
        : (isEnglish ? 'Open menu' : 'فتح القائمة');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', menuLabel);
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
      mobileNav.classList.toggle('is-open', isOpen);
      body.classList.toggle('is-menu-open', isOpen);
      const navLabel = navToggle.querySelector('[data-nav-label]');
      if (navLabel) navLabel.textContent = menuLabel;
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

    // ===== LANGUAGE SWITCHER =====
    const langSwitchers = document.querySelectorAll('[data-lang-switcher]');
    const savedLang = localStorage.getItem('tfp-lang') || 'ar';
    const currentLang = document.documentElement.lang?.startsWith('en') ? 'en' : savedLang;
    
    const translations = {
      'skip-link': { ar: 'تجاوز إلى المحتوى', en: 'Skip to content' },
      'nav-close': { ar: 'إغلاق القائمة', en: 'Close menu' },
      'nav-open': { ar: 'فتح القائمة', en: 'Open menu' },
      'hero-kicker': { ar: 'Tech From Palestine', en: 'Tech From Palestine' },
      'hero-tagline': { ar: 'Developing Software, Society & Palestine', en: 'Developing Software, Society & Palestine' },
      'hero-title': { ar: 'نبني <span>المستقبل</span><br>من فلسطين.', en: 'We build the <span>future</span><br>from Palestine.' },
      'hero-description': { ar: 'نُمكّن الشباب الفلسطيني من خلال التكنولوجيا والتعليم والابتكار، ونحوّل المعرفة إلى مهارات ومشاريع وفرص حقيقية.', en: 'We empower Palestinian youth through technology, education, and innovation, turning knowledge into real skills, projects, and opportunities.' },
      'hero-cta-courses': { ar: 'استكشف الدورات', en: 'Explore Courses' },
      'hero-cta-projects': { ar: 'شاهد المشاريع', en: 'View Projects' },
      'hero-meta-1': { ar: 'تعلّم تطبيقي', en: 'Hands-on learning' },
      'hero-meta-2': { ar: 'مشاريع حقيقية', en: 'Real projects' },
      'hero-meta-3': { ar: 'مجتمع متعاون', en: 'Collaborative community' },
      'hero-badge-1': { ar: 'مشاريع حقيقية', en: 'Real projects' },
      'hero-badge-2': { ar: '+1200 عضو', en: '+1200 members' },
      'section-about': { ar: 'من نحن', en: 'About Us' },
      'section-mission': { ar: 'التقنية أداة لبناء مجتمع أقوى.', en: 'Technology is a tool to build a stronger community.' },
      'section-mission-note': { ar: 'نصل بين التعلّم والعمل، ونمنح الأفكار الفلسطينية مساحة لتُختبر وتكبر.', en: 'We connect learning with work, and give Palestinian ideas space to be tested and grow.' },
      'section-mission-link': { ar: 'اكتشف قصتنا', en: 'Discover our story' },
      'pull-quote': { ar: 'نصنع فرصًا حقيقية للشباب الفلسطيني كي يتعلموا، يبتكروا، ويتركوا أثرًا مستدامًا.', en: 'We create real opportunities for Palestinian youth to learn, innovate, and leave a sustainable impact.' },
      'stats-title': { ar: 'أرقام تحكي عن مجتمع يتحرك.', en: 'Numbers that tell a moving community story.' },
      'stats-aside': { ar: 'كل رقم هو شخص تعلّم، فريق تعاون، أو فكرة وجدت طريقها إلى التطبيق.', en: 'Every number is a person who learned, a team that collaborated, or an idea that found its way to implementation.' },
      'courses-title': { ar: 'دورات تضعك أمام تحديات حقيقية.', en: 'Courses that put you face-to-face with real challenges.' },
      'courses-link': { ar: 'كل الدورات', en: 'All Courses' },
      'projects-title': { ar: 'مشاريع تنطلق من احتياجاتنا.', en: 'Projects that launch from our needs.' },
      'projects-link': { ar: 'شاهد ملف المشاريع', en: 'View project portfolio' },
      'why-title': { ar: 'نتعلم معًا، ونبني بشكل أفضل.', en: 'We learn together, and build better.' },
      'why-aside': { ar: 'منهجنا بسيط: معرفة قابلة للتطبيق، تعاون صادق، ومساحة آمنة للتجربة.', en: 'Our approach is simple: applicable knowledge, genuine collaboration, and a safe space for experimentation.' },
      'feature-1-title': { ar: 'تعليم عملي', en: 'Practical education' },
      'feature-1-text': { ar: 'نتعلّم من خلال التحديات والممارسة، لا من خلال الحفظ فقط.', en: 'We learn through challenges and practice, not just memorization.' },
      'feature-2-title': { ar: 'مشاريع حقيقية', en: 'Real projects' },
      'feature-2-text': { ar: 'نحوّل الأفكار إلى نماذج أولية يمكن مشاركتها وتحسينها.', en: 'We turn ideas into prototypes that can be shared and improved.' },
      'feature-3-title': { ar: 'تطوير المهارات', en: 'Skill development' },
      'feature-3-text': { ar: 'نركّز على الأدوات والمهارات التي يحتاجها العمل اليوم.', en: 'We focus on the tools and skills needed in today\'s work.' },
      'feature-4-title': { ar: 'مجتمع تقني', en: 'Tech community' },
      'feature-4-text': { ar: 'نفتح الأبواب للتعاون، الأسئلة، وتبادل الخبرات بين الأعضاء.', en: 'We open doors for collaboration, questions, and experience exchange among members.' },
      'feature-5-title': { ar: 'فرص وتعاون', en: 'Opportunities & collaboration' },
      'feature-5-text': { ar: 'نربط المتعلمين بالمساحات التي تساعدهم على اتخاذ الخطوة التالية.', en: 'We connect learners with spaces that help them take the next step.' },
      'feature-6-title': { ar: 'ابتكار وحل مشكلات', en: 'Innovation & problem solving' },
      'feature-6-text': { ar: 'نحتفي بالفضول ونصمم حلولًا تنطلق من واقعنا المحلي.', en: 'We celebrate curiosity and design solutions that stem from our local reality.' },
      'home-cta-title': { ar: 'فكرتك تستحق أن ترى النور.', en: 'Your idea deserves to see the light.' },
      'home-cta-text': { ar: 'انضم إلى مجتمع من الشباب الذين يتعلمون، يتعاونون، ويبنون مستقبلًا تقنيًا فلسطينيًا أكثر حضورًا.', en: 'Join a community of youth who learn, collaborate, and build a more present Palestinian tech future.' },
      'home-cta-btn': { ar: 'انضم إلى مجتمعنا', en: 'Join our community' },
      'footer-brand-copy': { ar: 'مؤسسة فلسطينية تبني مساحات للتعلم والتجربة والتعاون عبر التكنولوجيا.', en: 'A Palestinian institution building spaces for learning, experimentation, and collaboration through technology.' },
      'footer-quick-links': { ar: 'روابط سريعة', en: 'Quick Links' },
      'footer-explore': { ar: 'اكتشف', en: 'Explore' },
      'footer-contact': { ar: 'تواصل معنا', en: 'Contact Us' },
      'footer-email': { ar: 'البريد الإلكتروني', en: 'Email' },
      'footer-location': { ar: 'الموقع', en: 'Location' },
      'footer-response': { ar: 'نستجيب عادةً', en: 'We usually respond' },
      'footer-response-time': { ar: 'خلال يومي عمل', en: 'within 2 business days' },
      'footer-privacy': { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
      'footer-join': { ar: 'انضم إلى المجتمع', en: 'Join Community' },
      'footer-copyright': { ar: 'جميع الحقوق محفوظة.', en: 'All rights reserved.' },
      'about-title': { ar: 'من نحن', en: 'About Us' },
      'about-description': { ar: 'Tech From Palestine مؤسسة فلسطينية تعمل عند تقاطع التكنولوجيا والتعليم والمجتمع، وتفتح للشباب طريقًا عمليًا نحو بناء المهارات والمشاريع.', en: 'Tech From Palestine is a Palestinian institution working at the intersection of technology, education, and community, opening a practical path for youth to build skills and projects.' },
      'mission-vision-title': { ar: 'نحوّل الوصول إلى المعرفة إلى قدرة على الفعل.', en: 'We turn access to knowledge into the ability to act.' },
      'mission-vision-aside': { ar: 'نؤمن بأن المجتمع التقني يبدأ من مساحة يتشارك فيها الناس الأسئلة قبل الإجابات.', en: 'We believe a tech community starts from a space where people share questions before answers.' },
      'mission-index': { ar: '01 / MISSION', en: '01 / MISSION' },
      'mission-title': { ar: 'رسالتنا', en: 'Our Mission' },
      'mission-text': { ar: 'تمكين الشباب الفلسطيني من خلال تعليم تقني واضح، تجربة عملية، ومساحات تعاون تجعل التكنولوجيا أقرب إلى احتياجات الناس وفرصهم.', en: 'Empowering Palestinian youth through clear tech education, practical experience, and collaborative spaces that bring technology closer to people\'s needs and opportunities.' },
      'vision-index': { ar: '02 / VISION', en: '02 / VISION' },
      'vision-title': { ar: 'رؤيتنا', en: 'Our Vision' },
      'vision-text': { ar: 'بناء مجتمع فلسطيني قادر على الابتكار والمنافسة في المجال التقني، يطوّر أدواته ويصنع حلولًا تنطلق من سياقه المحلي.', en: 'Building a Palestinian community capable of innovation and competition in tech, developing its own tools and creating solutions from its local context.' },
      'goals-title': { ar: 'ستة اتجاهات، وغاية واحدة.', en: 'Six directions, one goal.' },
      'goals-aside': { ar: 'نقيس التقدم بمدى قدرة المتعلم على استخدام ما يعرفه لصناعة خطوة جديدة.', en: 'We measure progress by the learner\'s ability to use what they know to make a new move.' },
      'goal-1-title': { ar: 'تطوير المهارات التقنية', en: 'Technical skill development' },
      'goal-1-text': { ar: 'مسارات تعلم عملية تواكب الأدوات الأساسية في سوق اليوم.', en: 'Practical learning paths that keep pace with today\'s market tools.' },
      'goal-2-title': { ar: 'دعم الشباب', en: 'Youth support' },
      'goal-2-text': { ar: 'إرشاد ومساحات آمنة للتجربة وطرح الأسئلة بلا حواجز.', en: 'Mentorship and safe spaces for experimentation and asking questions without barriers.' },
      'goal-3-title': { ar: 'تشجيع الابتكار', en: 'Encouraging innovation' },
      'goal-3-text': { ar: 'نحوّل الفضول إلى أفكار يمكن اختبارها وتطويرها.', en: 'We turn curiosity into ideas that can be tested and developed.' },
      'goal-4-title': { ar: 'بناء مجتمع متعاون', en: 'Building a collaborative community' },
      'goal-4-text': { ar: 'نفتح الأبواب لتبادل الخبرات والفرص بين المتعلمين والمرشدين.', en: 'We open doors for exchanging experiences and opportunities between learners and mentors.' },
      'goal-5-title': { ar: 'ربط التعلم بالفرص', en: 'Connecting learning to opportunities' },
      'goal-5-text': { ar: 'نوفّر جسورًا بين المهارات والمسارات المهنية الحقيقية.', en: 'We provide bridges between skills and real career paths.' },
      'goal-6-title': { ar: 'تأثير مستدام', en: 'Sustainable impact' },
      'goal-6-text': { ar: 'نصمم مشاريع وبرامج تترك أثرًا يتجاوز فترة التدريب.', en: 'We design projects and programs that leave an impact beyond the training period.' },
      'offering-title': { ar: 'مساحات مختلفة لخطوتك التالية.', en: 'Different spaces for your next step.' },
      'offering-1-title': { ar: 'برامج تعليمية', en: 'Educational programs' },
      'offering-1-text': { ar: 'دورات ومسارات قصيرة تُبنى حول التطبيق والمشاريع.', en: 'Courses and short paths built around application and projects.' },
      'offering-2-title': { ar: 'مختبرات بناء', en: 'Build labs' },
      'offering-2-text': { ar: 'مساحات لتجربة الأفكار مع زملاء ومرشدين تقنيين.', en: 'Spaces to test ideas with peers and technical mentors.' },
      'offering-3-title': { ar: 'فعاليات المجتمع', en: 'Community events' },
      'offering-3-text': { ar: 'لقاءات ونقاشات تفتح باب التعارف والتعاون المستمر.', en: 'Meetings and discussions that open the door to networking and ongoing collaboration.' },
      'offering-4-title': { ar: 'مسار مهني', en: 'Career path' },
      'offering-4-text': { ar: 'إرشاد فردي يساعدك على تحويل المهارات إلى فرصة عمل حقيقية.', en: 'Individual mentorship to help you turn skills into real job opportunities.' },
      'timeline-title': { ar: 'تطور مستمر، بخطوات واضحة.', en: 'Continuous development, with clear steps.' },
      'timeline-aside': { ar: 'هذه المحطات إطار قابل للتحديث مع نمو المؤسسة وشراكاتها.', en: 'These milestones are a framework that can be updated as the institution and its partnerships grow.' },
      'timeline-1-label': { ar: 'البداية', en: 'The Beginning' },
      'timeline-1-title': { ar: 'فكرة من المجتمع', en: 'An idea from the community' },
      'timeline-1-text': { ar: 'بدأت الرغبة في إنشاء مساحة تجعل التعلم التقني أقرب وأكثر ارتباطًا بالواقع الفلسطيني.', en: 'The desire to create a space that makes tech learning closer and more connected to Palestinian reality began.' },
      'timeline-2-label': { ar: 'التعلّم', en: 'Learning' },
      'timeline-2-title': { ar: 'أول المسارات العملية', en: 'First practical paths' },
      'timeline-2-text': { ar: 'تطوير محتوى تدريبي يوازن بين أساسيات التقنية والتطبيق على تحديات ملموسة.', en: 'Developing training content that balances tech fundamentals with application to tangible challenges.' },
      'timeline-3-label': { ar: 'التوسع', en: 'Expansion' },
      'timeline-3-title': { ar: 'مشاريع تتعاون', en: 'Collaborating projects' },
      'timeline-3-text': { ar: 'انتقلت الأفكار من قاعات التعلم إلى فرق تبني نماذج أولية وتشارك نتائجها.', en: 'Ideas moved from classrooms to teams building prototypes and sharing their results.' },
      'timeline-4-label': { ar: 'الخطوة القادمة', en: 'Next Step' },
      'timeline-4-title': { ar: 'مجتمع أكبر وأثر أعمق', en: 'Larger community, deeper impact' },
      'timeline-4-text': { ar: 'نوسّع شبكة المتعلمين والمرشدين ونفتح مساحات جديدة للابتكار والتعاون.', en: 'We expand the network of learners and mentors and open new spaces for innovation and collaboration.' },
      'about-cta-title': { ar: 'التغيير يبدأ بخطوة صغيرة.', en: 'Change starts with a small step.' },
      'about-cta-text': { ar: 'تعرّف إلى الدورات والمشاريع والفعاليات التي يمكن أن تكون خطوتك القادمة.', en: 'Discover courses, projects, and events that could be your next step.' },
      'about-cta-btn': { ar: 'انضم إلى مجتمعنا', en: 'Join our community' },
      'courses-page-title': { ar: 'الدورات', en: 'Courses' },
      'courses-page-desc': { ar: 'مسارات عملية تساعدك على فهم التقنية، اختبار مهاراتك، وبناء مشروع يمكنك أن تريه للآخرين.', en: 'Practical paths that help you understand technology, test your skills, and build a project you can show others.' },
      'courses-page-aside': { ar: 'تخصصات<br>تفتح أبوابًا.', en: 'Specialties<br>that open doors.' },
      'courses-empty': { ar: 'لا توجد دورات بهذا التصنيف بعد.', en: 'No courses in this category yet.' },
      'courses-empty-text': { ar: 'جرّب تصنيفًا آخر أو استكشف كل المسارات المتاحة.', en: 'Try another category or explore all available paths.' },
      'courses-show-all': { ar: 'إظهار كل الدورات', en: 'Show all courses' },
      'projects-page-title': { ar: 'المشاريع', en: 'Projects' },
      'projects-page-desc': { ar: 'نماذج من أفكار وتجارب تنطلق من احتياجات المجتمع، وتستخدم التقنية لصناعة أثر قابل للقياس.', en: 'Models of ideas and experiences that launch from community needs, using technology to create measurable impact.' },
      'projects-page-aside': { ar: 'فكرة<br>في طريقها للنمو.', en: 'An idea<br>on its way to growing.' },
      'projects-empty': { ar: 'لا توجد مشاريع بهذا التصنيف بعد.', en: 'No projects in this category yet.' },
      'projects-empty-text': { ar: 'جرّب تصنيفًا آخر أو استكشف كل المشاريع المتاحة.', en: 'Try another category or explore all available projects.' },
      'projects-show-all': { ar: 'إظهار كل المشاريع', en: 'Show all projects' },
      'community-title': { ar: 'لا تتعلّم <span>وحدك.</span>', en: 'Don\'t learn <span>alone.</span>' },
      'community-desc': { ar: 'مجتمع تقني فلسطيني يجمع المتعلمين والمطورين والمصممين وأصحاب الأفكار حول مساحة واحدة للتعلم، المشاركة، وبناء المشاريع.', en: 'A Palestinian tech community bringing learners, developers, designers, and idea holders together in one space for learning, sharing, and building projects.' },
      'community-cta': { ar: 'انضم إلى المجتمع', en: 'Join the community' },
      'pillars-title': { ar: 'أربع طرق لتكون جزءًا من الحركة.', en: 'Four ways to be part of the movement.' },
      'pillars-aside': { ar: 'ليس مطلوبًا أن تعرف كل شيء؛ يكفي أن تأتي بسؤال ورغبة في مشاركة ما تتعلمه.', en: 'You don\'t need to know everything; just come with a question and a desire to share what you learn.' },
      'pillar-1-title': { ar: 'انضم إلى مجتمعنا', en: 'Join our community' },
      'pillar-1-text': { ar: 'تعرّف إلى أشخاص يشاركونك الفضول، وابدأ محادثة يمكن أن تصبح تعاونًا.', en: 'Meet people who share your curiosity, and start a conversation that could become collaboration.' },
      'pillar-2-title': { ar: 'تعلّم مع الآخرين', en: 'Learn with others' },
      'pillar-2-text': { ar: 'اسأل، ناقش، واحصل على دعم من متعلمين ومرشدين يفهمون رحلتك.', en: 'Ask, discuss, and get support from learners and mentors who understand your journey.' },
      'pillar-3-title': { ar: 'ابنِ مشاريعك', en: 'Build your projects' },
      'pillar-3-text': { ar: 'حوّل فكرتك إلى نموذج أولي، واختبرها مع فريق ومجتمع يهتم بالنتيجة.', en: 'Turn your idea into a prototype, and test it with a team and community that care about the result.' },
      'pillar-4-title': { ar: 'شارك معرفتك', en: 'Share your knowledge' },
      'pillar-4-text': { ar: 'خبرتك الصغيرة قد تكون الدفعة التي يحتاجها شخص في بداية الطريق.', en: 'Your small experience might be the boost someone at the beginning of the road needs.' },
      'events-title': { ar: 'مساحات تلتقي فيها الأفكار.', en: 'Spaces where ideas meet.' },
      'events-aside': { ar: 'فعاليات دورية قابلة للتحديث بحسب برنامج المجتمع وشراكاته.', en: 'Periodic events that can be updated according to the community program and partnerships.' },
      'event-1-type': { ar: 'جلسة مفتوحة', en: 'Open session' },
      'event-1-title': { ar: 'كيف نبدأ مشروعًا تقنيًا من مشكلة محلية؟', en: 'How do we start a tech project from a local problem?' },
      'event-1-meta': { ar: 'نقاش مجتمعي · عن بُعد', en: 'Community discussion · Remote' },
      'event-2-type': { ar: 'مختبر بناء', en: 'Build lab' },
      'event-2-title': { ar: 'ساعة عمل مشتركة للأفكار الناشئة', en: 'Shared work hour for emerging ideas' },
      'event-2-meta': { ar: 'تطبيق عملي · مساحة المجتمع', en: 'Practical application · Community space' },
      'event-3-type': { ar: 'لقاء مرشدين', en: 'Mentors meetup' },
      'event-3-title': { ar: 'أسئلة مفتوحة حول أول خطوة مهنية', en: 'Open questions about the first career step' },
      'event-3-meta': { ar: 'إرشاد وتعارف · قريبًا', en: 'Mentorship & networking · Soon' },
      'impact-title': { ar: 'أثر يتكوّن من مشاركات صغيرة.', en: 'Impact formed from small contributions.' },
      'impact-aside': { ar: 'البيانات التالية أمثلة أولية قابلة للتحديث مع نمو المجتمع.', en: 'The following data are initial examples that can be updated as the community grows.' },
      'impact-intro': { ar: 'نحن أكبر عندما نشارك.', en: 'We are bigger when we share.' },
      'impact-text': { ar: 'كل عضو يضيف سؤالًا أو مهارة أو فرصة جديدة.', en: 'Every member adds a new question, skill, or opportunity.' },
      'impact-stat-1': { ar: 'عضو في المجتمع', en: 'Community members' },
      'impact-stat-2': { ar: 'لقاء وفعالية', en: 'Meetings & events' },
      'impact-stat-3': { ar: 'مشروعًا تعاونيًا', en: 'Collaborative projects' },
      'community-people': { ar: 'ومئات القصص التي لم تُكتب بعد.', en: 'And hundreds of stories yet to be written.' },
      'community-cta-title': { ar: 'أحضر فضولك، واترك الباقي للمجتمع.', en: 'Bring your curiosity, and leave the rest to the community.' },
      'community-cta-text': { ar: 'انضم إلى مساحة تتيح لك أن تتعلم، تجرّب، وتجد أشخاصًا يشاركونك الرغبة في البناء.', en: 'Join a space where you can learn, experiment, and find people who share your desire to build.' },
      'community-cta-btn': { ar: 'انضم إلى المجتمع', en: 'Join the community' },
      'contact-title': { ar: 'تواصل معنا', en: 'Contact Us' },
      'contact-desc': { ar: 'لديك سؤال عن الدورات؟ فكرة مشروع؟ أو رغبة في التعاون؟ اكتب لنا وسنبدأ من هناك.', en: 'Have a question about courses? A project idea? Or a desire to collaborate? Write to us and we\'ll start from there.' },
      'contact-aside': { ar: 'فكرة واحدة<br>قد تبدأ تعاونًا.', en: 'One idea<br>may start a collaboration.' },
      'contact-panel-title': { ar: 'لنصنع شيئًا مفيدًا معًا.', en: 'Let\'s build something useful together.' },
      'contact-panel-text': { ar: 'نرحب برسائلك حول التعليم، المشاريع، الشراكات، أو أي فكرة يمكن أن تخدم المجتمع التقني الفلسطيني.', en: 'We welcome your messages about education, projects, partnerships, or any idea that can serve the Palestinian tech community.' },
      'contact-detail-email': { ar: 'البريد الإلكتروني', en: 'Email' },
      'contact-detail-location': { ar: 'الموقع', en: 'Location' },
      'contact-detail-response': { ar: 'نستجيب عادةً', en: 'We usually respond' },
      'contact-detail-response-time': { ar: 'خلال يومي عمل', en: 'within 2 business days' },
      'contact-form-title': { ar: 'كيف يمكننا مساعدتك؟', en: 'How can we help you?' },
      'contact-form-required': { ar: 'الحقول التي تحمل علامة <span style="color: var(--color-accent);">*</span> مطلوبة.', en: 'Fields marked with <span style="color: var(--color-accent);">*</span> are required.' },
      'contact-form-name': { ar: 'الاسم', en: 'Name' },
      'contact-form-email': { ar: 'البريد الإلكتروني', en: 'Email' },
      'contact-form-subject': { ar: 'الموضوع', en: 'Subject' },
      'contact-form-message': { ar: 'الرسالة', en: 'Message' },
      'contact-form-submit': { ar: 'إرسال الرسالة', en: 'Send message' },
      'contact-form-success': { ar: 'شكرًا لتواصلك معنا. سنعود إليك قريبًا.', en: 'Thank you for reaching out. We\'ll get back to you soon.' },
      'contact-form-error': { ar: 'تحقق من الحقول المميزة ثم حاول مرة أخرى.', en: 'Check the highlighted fields and try again.' },
      'contact-form-name-required': { ar: 'يرجى إدخال الاسم.', en: 'Please enter your name.' },
      'contact-form-email-required': { ar: 'يرجى إدخال البريد الإلكتروني.', en: 'Please enter your email.' },
      'contact-form-email-invalid': { ar: 'يرجى إدخال بريد إلكتروني صحيح.', en: 'Please enter a valid email.' },
      'contact-form-subject-required': { ar: 'يرجى إدخال الموضوع.', en: 'Please enter the subject.' },
      'contact-form-message-required': { ar: 'يرجى كتابة رسالتك.', en: 'Please write your message.' },
      'contact-form-message-minlength': { ar: 'اكتب 20 حرفًا على الأقل.', en: 'Write at least 20 characters.' },
      'filter-results': { ar: 'نتيجة', en: 'results' },
      'empty-state-title': { ar: 'لا توجد نتائج بهذا التصنيف بعد.', en: 'No results in this category yet.' },
      'empty-state-text': { ar: 'جرّب تصنيفًا آخر أو استكشف كل المسارات المتاحة.', en: 'Try another category or explore all available paths.' },
      'empty-state-btn': { ar: 'إظهار الكل', en: 'Show all' },
      'brand-name': { ar: 'Tech From Palestine', en: 'Tech From Palestine' },
      'brand-tagline': { ar: 'Developing Software, Society & Palestine', en: 'Developing Software, Society & Palestine' },
      'nav-home': { ar: 'الرئيسية', en: 'Home' },
      'nav-about': { ar: 'من نحن', en: 'About' },
      'nav-courses': { ar: 'الدورات', en: 'Courses' },
      'nav-projects': { ar: 'المشاريع', en: 'Projects' },
      'nav-community': { ar: 'المجتمع', en: 'Community' },
      'nav-contact': { ar: 'تواصل معنا', en: 'Contact' },
      'nav-join': { ar: 'انضم إلينا', en: 'Join Us' },
      'footer-home': { ar: 'الرئيسية', en: 'Home' },
      'footer-about': { ar: 'من نحن', en: 'About' },
      'footer-courses': { ar: 'الدورات', en: 'Courses' },
      'footer-projects': { ar: 'المشاريع', en: 'Projects' },
      'footer-community': { ar: 'المجتمع', en: 'Community' },
      'footer-contact-link': { ar: 'تواصل معنا', en: 'Contact Us' },
      'stats-eyebrow': { ar: 'أثر يتسع', en: 'Impact expands' },
      'stat-1-label': { ar: 'دورة تقنية', en: 'Technical Courses' },
      'stat-2-label': { ar: 'مشروعًا', en: 'Projects' },
      'stat-3-label': { ar: 'متدربًا', en: 'Trainees' },
      'stat-4-label': { ar: 'عضوًا في المجتمع', en: 'Community Members' },
      'courses-eyebrow': { ar: 'تعلّم بالممارسة', en: 'Learn by doing' },
      'projects-eyebrow': { ar: 'من الفكرة إلى الأثر', en: 'From idea to impact' },
      'why-eyebrow': { ar: 'لماذا نحن؟', en: 'Why us?' },
      'cta-eyebrow': { ar: 'مساحتك القادمة', en: 'Your next space' },
      'about-eyebrow': { ar: 'عن المؤسسة', en: 'About the institution' },
      'about-aside': { ar: 'نبني من واقعنا<br>ونتعلّم معًا.', en: 'We build from our reality<br>and learn together.' },
      'mission-vision-eyebrow': { ar: 'رسالتنا ورؤيتنا', en: 'Our mission and vision' },
      'goals-eyebrow': { ar: 'أهدافنا', en: 'Our goals' },
      'timeline-eyebrow': { ar: 'محطاتنا', en: 'Our milestones' },
      'about-cta-eyebrow': { ar: 'كن جزءًا من المسار', en: 'Be part of the journey' },
      'community-eyebrow': { ar: 'المجتمع', en: 'Community' },
      'pillars-eyebrow': { ar: 'كيف نشارك؟', en: 'How do we share?' },
      'events-eyebrow': { ar: 'الفعاليات والأنشطة', en: 'Events and activities' },
      'impact-eyebrow': { ar: 'تأثير المجتمع', en: 'Community impact' },
      'community-cta-eyebrow': { ar: 'الخطوة الأولى', en: 'The first step' },
      'contact-eyebrow': { ar: 'نحن هنا للاستماع', en: 'We are here to listen' },
      'contact-panel-eyebrow': { ar: 'ابقَ على تواصل', en: 'Stay connected' },
      'form-eyebrow': { ar: 'رسالتك', en: 'Your message' },
      'course-1-title': { ar: 'أساسيات تطوير الويب', en: 'Web Development Foundations' },
      'course-1-desc': { ar: 'ابنِ صفحات عملية من الصفر باستخدام HTML وCSS وJavaScript.', en: 'Build practical pages from scratch using HTML, CSS, and JavaScript.' },
      'course-1-tag-1': { ar: 'تطوير الويب', en: 'Web Development' },
      'course-1-tag-2': { ar: 'مبتدئ', en: 'Beginner' },
      'course-1-duration': { ar: '6 أسابيع', en: '6 Weeks' },
      'course-1-type': { ar: 'تطبيقي', en: 'Practical' },
      'course-1-link': { ar: 'عرض الدورة', en: 'View Course' },
      'course-2-title': { ar: 'Python وحل المشكلات', en: 'Python & Problem Solving' },
      'course-2-desc': { ar: 'طوّر طريقة تفكيرك البرمجية عبر تمارين ومشاريع صغيرة متدرجة.', en: 'Develop your programming thinking through exercises and small graduated projects.' },
      'course-2-tag-1': { ar: 'البرمجة', en: 'Programming' },
      'course-2-tag-2': { ar: 'مبتدئ', en: 'Beginner' },
      'course-2-duration': { ar: '5 أسابيع', en: '5 Weeks' },
      'course-2-type': { ar: 'تطبيقي', en: 'Practical' },
      'course-2-link': { ar: 'عرض الدورة', en: 'View Course' },
      'course-3-title': { ar: 'الذكاء الاصطناعي للجميع', en: 'AI for Everyone' },
      'course-3-desc': { ar: 'افهم المفاهيم الأساسية وحوّل فكرة تقنية إلى تجربة قابلة للاختبار.', en: 'Understand the basic concepts and turn a technical idea into a testable experience.' },
      'course-3-tag-1': { ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' },
      'course-3-tag-2': { ar: 'متوسط', en: 'Intermediate' },
      'course-3-duration': { ar: '4 أسابيع', en: '4 Weeks' },
      'course-3-type': { ar: 'تطبيقي', en: 'Practical' },
      'course-3-link': { ar: 'عرض الدورة', en: 'View Course' },
      'project-1-category': { ar: 'الابتكار', en: 'Innovation' },
      'project-1-title': { ar: 'منصة البيانات المفتوحة', en: 'Open Data Platform' },
      'project-1-desc': { ar: 'واجهة تساعد المجتمع على استكشاف البيانات المحلية بطريقة أوضح واتخاذ قرارات أفضل.', en: 'An interface that helps the community explore local data more clearly and make better decisions.' },
      'project-1-link': { ar: 'شاهد التفاصيل', en: 'View Details' },
      'project-2-category': { ar: 'التعليم', en: 'Education' },
      'project-2-title': { ar: 'مسار للتعلّم العملي', en: 'Practical Learning Path' },
      'project-2-desc': { ar: 'تجربة تعلم تربط الدروس القصيرة بتحديات قابلة للتطبيق.', en: 'A learning experience that connects short lessons to applicable challenges.' },
      'project-2-link': { ar: 'شاهد التفاصيل', en: 'View Details' },
      'project-3-category': { ar: 'المجتمع', en: 'Community' },
      'project-3-title': { ar: 'وصلة المجتمع', en: 'Community Link' },
      'project-3-link': { ar: 'شاهد التفاصيل', en: 'View Details' },
      'filter-all': { ar: 'كل الدورات', en: 'All Courses' },
      'filter-programming': { ar: 'البرمجة', en: 'Programming' },
      'filter-web': { ar: 'تطوير الويب', en: 'Web Development' },
      'filter-ai': { ar: 'الذكاء الاصطناعي', en: 'AI' },
      'filter-uiux': { ar: 'UI/UX', en: 'UI/UX' },
      'filter-robotics': { ar: 'الروبوتات', en: 'Robotics' },
      'filter-other': { ar: 'تقنيات أخرى', en: 'Other Technologies' },
      'projects-filter-all': { ar: 'كل المشاريع', en: 'All Projects' },
      'projects-filter-education': { ar: 'التعليم', en: 'Education' },
      'projects-filter-community': { ar: 'المجتمع', en: 'Community' },
      'projects-filter-innovation': { ar: 'الابتكار', en: 'Innovation' },
      'projects-filter-product': { ar: 'المنتجات الرقمية', en: 'Digital Products' },
      'course-list-title': { ar: 'قائمة الدورات', en: 'Course list' },
      'project-list-title': { ar: 'قائمة المشاريع', en: 'Project list' },
      'course-web-title': { ar: 'أساسيات تطوير الويب', en: 'Web Development Foundations' },
      'course-web-desc': { ar: 'ابنِ صفحات عملية من الصفر باستخدام HTML وCSS وJavaScript.', en: 'Build practical pages from scratch using HTML, CSS, and JavaScript.' },
      'course-web-tag': { ar: 'تطوير الويب', en: 'Web Development' },
      'course-web-level': { ar: 'مبتدئ', en: 'Beginner' },
      'course-web-duration': { ar: '6 أسابيع', en: '6 Weeks' },
      'course-web-link': { ar: 'عرض الدورة', en: 'View Course' },
      'course-python-title': { ar: 'Python وحل المشكلات', en: 'Python & Problem Solving' },
      'course-python-desc': { ar: 'طوّر طريقة تفكيرك البرمجية عبر تمارين ومشاريع صغيرة متدرجة.', en: 'Develop your programming thinking through exercises and small graduated projects.' },
      'course-python-tag': { ar: 'البرمجة', en: 'Programming' },
      'course-python-level': { ar: 'مبتدئ', en: 'Beginner' },
      'course-python-duration': { ar: '5 أسابيع', en: '5 Weeks' },
      'course-python-link': { ar: 'عرض الدورة', en: 'View Course' },
      'course-ai-title': { ar: 'الذكاء الاصطناعي للجميع', en: 'AI for Everyone' },
      'course-ai-desc': { ar: 'افهم مفاهيم الذكاء الاصطناعي وحوّل فكرة إلى تجربة قابلة للاختبار.', en: 'Understand AI concepts and turn an idea into a testable experience.' },
      'course-ai-tag': { ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' },
      'course-ai-level': { ar: 'متوسط', en: 'Intermediate' },
      'course-ai-duration': { ar: '4 أسابيع', en: '4 Weeks' },
      'course-ai-link': { ar: 'عرض الدورة', en: 'View Course' },
      'course-design-title': { ar: 'تصميم المنتجات الرقمية', en: 'Digital Product Design' },
      'course-design-desc': { ar: 'صمّم تجربة واضحة تبدأ من فهم المستخدم وتنتهي بنموذج قابل للاختبار.', en: 'Design a clear experience that starts from understanding the user and ends with a testable prototype.' },
      'course-design-tag': { ar: 'UI/UX', en: 'UI/UX' },
      'course-design-level': { ar: 'متوسط', en: 'Intermediate' },
      'course-design-duration': { ar: '5 أسابيع', en: '5 Weeks' },
      'course-design-link': { ar: 'عرض الدورة', en: 'View Course' },
      'course-robotics-title': { ar: 'مختبر الروبوتات', en: 'Robotics Lab' },
      'course-robotics-desc': { ar: 'تعرّف إلى المستشعرات والمنطق البرمجي عبر نماذج تفاعلية.', en: 'Learn about sensors and programming logic through interactive models.' },
      'course-robotics-tag': { ar: 'الروبوتات', en: 'Robotics' },
      'course-robotics-level': { ar: 'متوسط', en: 'Intermediate' },
      'course-robotics-duration': { ar: '7 أسابيع', en: '7 Weeks' },
      'course-robotics-link': { ar: 'عرض الدورة', en: 'View Course' },
      'course-open-title': { ar: 'مدخل إلى المصادر المفتوحة', en: 'Introduction to Open Source' },
      'course-open-desc': { ar: 'تعلّم Git وGitHub وكيف تساهم في مشاريع تقنية مع فريق حقيقي.', en: 'Learn Git and GitHub and how to contribute to technical projects with a real team.' },
      'course-open-tag': { ar: 'تقنيات أخرى', en: 'Other Technologies' },
      'course-open-level': { ar: 'مبتدئ', en: 'Beginner' },
      'course-open-duration': { ar: '3 أسابيع', en: '3 Weeks' },
      'course-open-link': { ar: 'عرض الدورة', en: 'View Course' },
      'project-4-category': { ar: 'منتج رقمي', en: 'Digital Product' },
      'project-4-title': { ar: 'بيتنا للخدمات', en: 'Baytna Services' },
      'project-4-link': { ar: 'شاهد التفاصيل', en: 'View Details' },
      'project-5-category': { ar: 'الابتكار', en: 'Innovation' },
      'project-5-title': { ar: 'مختبر المدن', en: 'City Lab' },
      'project-5-link': { ar: 'شاهد التفاصيل', en: 'View Details' },
      'project-6-category': { ar: 'المجتمع', en: 'Community' },
      'project-6-title': { ar: 'بوابة المتطوعين', en: 'Volunteer Gateway' },
      'project-6-link': { ar: 'شاهد التفاصيل', en: 'View Details' }
    };
    
    const getTranslatedText = (key, lang) => {
      const translation = translations[key];
      if (!translation) return key;
      return translation[lang] || translation.ar || key;
    };
    
    const updatePageTranslations = (lang) => {
      const isRTL = lang === 'ar';
      
      // Update all elements with data-i18n attribute
      document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.dataset.i18n;
        const translation = translations[key];
        if (translation) {
          const text = translation[lang] || translation.ar;
          if (text && element.textContent !== text) {
            element.innerHTML = text;
          }
        }
      });
      
      // Update filter buttons
      document.querySelectorAll('[data-filter]').forEach((button) => {
        const filter = button.dataset.filter;
        const key = button.dataset.i18n;
        if (key) {
          const translation = translations[key];
          if (translation) {
            button.textContent = translation[lang] || translation.ar;
          }
        }
      });
      
      // Update result counts
      const resultCounts = document.querySelectorAll('[data-result-count]');
      resultCounts.forEach((count) => {
        const currentText = count.textContent;
        const number = currentText.match(/\d+/)?.[0] || '0';
        const suffix = lang === 'ar' ? ' نتيجة' : ' results';
        count.textContent = `${number}${suffix}`;
      });
      
      // Update form labels and placeholders
      document.querySelectorAll('[data-field]').forEach((field) => {
        const label = field.closest('.form-group')?.querySelector('.form-label');
        if (label) {
          const labelText = label.textContent.replace('*', '').trim();
          const labelKey = `contact-form-${field.id}`;
          const translation = translations[labelKey];
          if (translation) {
            const required = label.innerHTML.includes('*') || label.innerHTML.includes('*');
            const asterisk = required ? ' *' : '';
            label.innerHTML = `${translation[lang] || translation.ar}<abbr title="${getTranslatedText('required', lang)}">*</abbr>`;
          }
        }
      });
      
      // Update submit button
      const submitBtn = document.querySelector('[data-contact-form] .button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = `${getTranslatedText('contact-form-submit', lang)} <i class="ti ti-send icon" aria-hidden="true"></i>`;
      }
    };

    const setLanguage = (lang) => {
      const isRTL = lang === 'ar';
      document.documentElement.lang = isRTL ? 'ar' : 'en';
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      localStorage.setItem('tfp-lang', lang);
      
      // Update all switcher UIs
      langSwitchers.forEach((switcher) => {
        const label = switcher.querySelector('.lang-switcher__label');
        if (label) label.textContent = isRTL ? 'EN' : 'عربي';
      });
      
      // Update page title
      const titleEl = document.querySelector('title');
      if (titleEl) {
        const pageName = document.body.dataset.page || 'home';
        const titles = {
          home: { ar: 'Tech From Palestine | التكنولوجيا من فلسطين', en: 'Tech From Palestine | Technology from Palestine' },
          about: { ar: 'من نحن | Tech From Palestine', en: 'About Us | Tech From Palestine' },
          courses: { ar: 'الدورات التقنية | Tech From Palestine', en: 'Technical Courses | Tech From Palestine' },
          projects: { ar: 'المشاريع | Tech From Palestine', en: 'Projects | Tech From Palestine' },
          community: { ar: 'المجتمع التقني | Tech From Palestine', en: 'Tech Community | Tech From Palestine' },
          contact: { ar: 'تواصل معنا | Tech From Palestine', en: 'Contact Us | Tech From Palestine' }
        };
        if (titles[pageName]) {
          titleEl.textContent = titles[pageName][lang];
        }
      }
      
      // Update all page translations
      updatePageTranslations(lang);
    };

    setLanguage(currentLang);

    langSwitchers.forEach((langSwitcher) => {
      langSwitcher.addEventListener('click', () => {
        const current = document.documentElement.lang?.startsWith('en') ? 'en' : 'ar';
        const next = current === 'ar' ? 'en' : 'ar';
        setLanguage(next);
        
        // Close mobile menu if open
        const navToggle = document.querySelector('[data-nav-toggle]');
        const mobileNav = document.querySelector('#mobile-menu');
        if (navToggle && mobileNav && navToggle.getAttribute('aria-expanded') === 'true') {
          setMenuState(false);
        }
        
        // Refresh animations
        setTimeout(() => {
          initGSAPAnimations();
        }, 100);
      });
    });

    // ===== THEME SWITCHER (Dark / Light) =====
    const themeSwitchers = document.querySelectorAll('[data-theme-switcher]');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('tfp-theme') || (prefersDark ? 'dark' : 'dark');

    const setTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('tfp-theme', theme);

      const isEnglish = (document.documentElement.lang || '').startsWith('en');
      const label = theme === 'dark'
        ? (isEnglish ? 'Switch to light mode' : 'تفعيل الوضع الفاتح')
        : (isEnglish ? 'Switch to dark mode' : 'تفعيل الوضع الداكن');

      themeSwitchers.forEach((btn) => {
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
      });
    };

    setTheme(savedTheme);

    themeSwitchers.forEach((switcher) => {
      switcher.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
      });
    });

    // ===== GSAP ANIMATIONS =====
    const initGSAPAnimations = () => {
      if (typeof gsap === 'undefined' || reducedMotion) return;

      gsap.registerPlugin(ScrollTrigger);

      // Hero entrance
      const heroCopy = document.querySelector('.hero-copy');
      if (heroCopy) {
        gsap.fromTo(heroCopy.children, 
          { opacity: 0, y: 30, filter: 'blur(4px)' },
          { 
            opacity: 1, 
            y: 0, 
            filter: 'blur(0px)',
            duration: 0.9, 
            stagger: 0.12,
            ease: 'power3.out',
            delay: 0.3
          }
        );
      }

      // Hero media parallax
      const heroMedia = document.querySelector('.hero-media');
      if (heroMedia) {
        gsap.fromTo(heroMedia,
          { opacity: 0, scale: 0.95, y: 40 },
          { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            duration: 1.2, 
            ease: 'power3.out',
            delay: 0.5
          }
        );

        // Parallax on scroll
        gsap.to(heroMedia, {
          y: -60,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          }
        });
      }

      // Course cards stagger
      const courseCards = document.querySelectorAll('.course-card');
      if (courseCards.length > 0) {
        gsap.fromTo(courseCards,
          { opacity: 0, y: 50, rotateX: 8 },
          { 
            opacity: 1, 
            y: 0, 
            rotateX: 0,
            duration: 0.8, 
            stagger: 0.1,
            ease: 'back.out(1.2)',
            scrollTrigger: {
              trigger: '.course-rail, .course-grid',
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      }

      // Project cards
      const projectCards = document.querySelectorAll('.project-card');
      if (projectCards.length > 0) {
        gsap.fromTo(projectCards,
          { opacity: 0, y: 40, scale: 0.95 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            duration: 0.7, 
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.project-bento, .project-wall',
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      }

      // Feature ladder items
      const featureItems = document.querySelectorAll('.feature-ladder__item');
      if (featureItems.length > 0) {
        gsap.fromTo(featureItems,
          { opacity: 0, x: -30 },
          { 
            opacity: 1, 
            x: 0,
            duration: 0.7, 
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.feature-ladder',
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        );
      }

      // Stats counter animation enhancement
      const statValues = document.querySelectorAll('.stat__value span[data-count]');
      statValues.forEach((stat) => {
        if (stat.dataset.counted !== 'true') {
          gsap.fromTo(stat,
            { scale: 0.8, opacity: 0 },
            { 
              scale: 1, 
              opacity: 1,
              duration: 0.6, 
              ease: 'back.out(1.5)',
              scrollTrigger: {
                trigger: stat,
                start: 'top 90%',
                onEnter: () => animateCounter(stat),
                toggleActions: 'play none none none'
              }
            }
          );
        }
      });

      // Section headings
      const sectionHeadings = document.querySelectorAll('.section-heading');
      sectionHeadings.forEach((heading) => {
        gsap.fromTo(heading,
          { opacity: 0, y: 30 },
          { 
            opacity: 1, 
            y: 0,
            duration: 0.7, 
            ease: 'power2.out',
            scrollTrigger: {
              trigger: heading,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // CTA buttons pulse
      const ctaButtons = document.querySelectorAll('.community-cta .button, .hero .button-group .button');
      ctaButtons.forEach((btn) => {
        gsap.to(btn, {
          scale: 1.03,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: Math.random() * 2
        });
      });

      // Floating elements
      const floatingElements = document.querySelectorAll('.floating-badge');
      floatingElements.forEach((el, i) => {
        gsap.to(el, {
          y: '+=10',
          duration: 2 + i * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });
    };

    // Initialize GSAP after DOM ready
    if (typeof gsap !== 'undefined') {
      initGSAPAnimations();
    }

    // Refresh on page load
    window.addEventListener('load', () => {
      if (typeof gsap !== 'undefined') {
        initGSAPAnimations();
      }
      
      // Hide page loader
      const loader = document.querySelector('.page-loader');
      if (loader) {
        setTimeout(() => loader.classList.add('is-loaded'), 300);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSite, { once: true });
  } else {
    initSite();
  }
})();