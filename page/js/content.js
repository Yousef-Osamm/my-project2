window.TFP_DATA = Object.freeze({
  categories: Object.freeze({
    courses: Object.freeze({
      all: { ar: 'كل الدورات', en: 'All Courses' },
      programming: { ar: 'البرمجة', en: 'Programming' },
      web: { ar: 'تطوير الويب', en: 'Web Development' },
      ai: { ar: 'الذكاء الاصطناعي', en: 'AI' },
      uiux: { ar: 'UI/UX', en: 'UI/UX' },
      robotics: { ar: 'الروبوتات', en: 'Robotics' },
      other: { ar: 'تقنيات أخرى', en: 'Other Technologies' }
    }),
    projects: Object.freeze({
      all: { ar: 'كل المشاريع', en: 'All Projects' },
      education: { ar: 'التعليم', en: 'Education' },
      community: { ar: 'المجتمع', en: 'Community' },
      innovation: { ar: 'الابتكار', en: 'Innovation' },
      product: { ar: 'المنتجات الرقمية', en: 'Digital Products' }
    })
  }),
  stats: Object.freeze([
    { value: 24, suffix: '+', label: { ar: 'دورة تقنية', en: 'Technical Courses' } },
    { value: 18, suffix: '+', label: { ar: 'مشروعًا', en: 'Projects' } },
    { value: 640, suffix: '+', label: { ar: 'متدربًا', en: 'Trainees' } },
    { value: 1200, suffix: '+', label: { ar: 'عضوًا في المجتمع', en: 'Community Members' } }
  ]),
  courses: Object.freeze([
    {
      id: 'web-foundations',
      title: { ar: 'أساسيات تطوير الويب', en: 'Web Development Foundations' },
      description: { ar: 'ابنِ صفحات عملية من الصفر باستخدام HTML وCSS وJavaScript.', en: 'Build practical pages from scratch using HTML, CSS, and JavaScript.' },
      category: 'web',
      level: { ar: 'مبتدئ', en: 'Beginner' },
      duration: { ar: '6 أسابيع', en: '6 Weeks' }
    },
    {
      id: 'python-problem-solving',
      title: { ar: 'Python وحل المشكلات', en: 'Python & Problem Solving' },
      description: { ar: 'طوّر طريقة تفكيرك البرمجية عبر تمارين ومشاريع صغيرة متدرجة.', en: 'Develop your programming thinking through exercises and small graduated projects.' },
      category: 'programming',
      level: { ar: 'مبتدئ', en: 'Beginner' },
      duration: { ar: '5 أسابيع', en: '5 Weeks' }
    },
    {
      id: 'ai-for-everyone',
      title: { ar: 'الذكاء الاصطناعي للجميع', en: 'AI for Everyone' },
      description: { ar: 'افهم مفاهيم الذكاء الاصطناعي وتعلّم كيف تحوّلها إلى فكرة قابلة للتجربة.', en: 'Understand AI concepts and learn how to turn them into testable ideas.' },
      category: 'ai',
      level: { ar: 'متوسط', en: 'Intermediate' },
      duration: { ar: '4 أسابيع', en: '4 Weeks' }
    },
    {
      id: 'interface-design',
      title: { ar: 'تصميم المنتجات الرقمية', en: 'Digital Product Design' },
      description: { ar: 'صمّم تجربة واضحة تبدأ من فهم المستخدم وتنتهي بنموذج قابل للاختبار.', en: 'Design a clear experience that starts from understanding the user and ends with a testable prototype.' },
      category: 'uiux',
      level: { ar: 'متوسط', en: 'Intermediate' },
      duration: { ar: '5 أسابيع', en: '5 Weeks' }
    },
    {
      id: 'robotics-lab',
      title: { ar: 'مختبر الروبوتات', en: 'Robotics Lab' },
      description: { ar: 'تعرّف إلى المستشعرات والمنطق البرمجي من خلال نماذج تفاعلية.', en: 'Learn about sensors and programming logic through interactive models.' },
      category: 'robotics',
      level: { ar: 'متوسط', en: 'Intermediate' },
      duration: { ar: '7 أسابيع', en: '7 Weeks' }
    },
    {
      id: 'open-source',
      title: { ar: 'مدخل إلى المصادر المفتوحة', en: 'Introduction to Open Source' },
      description: { ar: 'تعلّم Git وGitHub وكيف تساهم في مشاريع تقنية مع فريق حقيقي.', en: 'Learn Git and GitHub and how to contribute to technical projects with a real team.' },
      category: 'other',
      level: { ar: 'مبتدئ', en: 'Beginner' },
      duration: { ar: '3 أسابيع', en: '3 Weeks' }
    }
  ]),
  projects: Object.freeze([
    {
      id: 'palestine-open-data',
      title: { ar: 'منصة البيانات المفتوحة', en: 'Open Data Platform' },
      category: 'innovation',
      technologies: ['JavaScript', 'Data UI'],
      description: { ar: 'واجهة تساعد المجتمع على استكشاف البيانات المحلية بطريقة أوضح.', en: 'An interface that helps the community explore local data more clearly.' }
    },
    {
      id: 'masar-learning',
      title: { ar: 'مسار للتعلّم العملي', en: 'Practical Learning Path' },
      category: 'education',
      technologies: ['UX Research', 'Web'],
      description: { ar: 'تجربة تعلّم تربط الدروس القصيرة بتحديات قابلة للتطبيق.', en: 'A learning experience that connects short lessons to applicable challenges.' }
    },
    {
      id: 'wasla-community',
      title: { ar: 'وصلة المجتمع', en: 'Community Link' },
      category: 'community',
      technologies: ['Mobile', 'Civic Tech'],
      description: { ar: 'مساحة رقمية لتبادل المهارات والفرص بين أعضاء المجتمع.', en: 'A digital space for exchanging skills and opportunities among community members.' }
    },
    {
      id: 'baytna-services',
      title: { ar: 'بيتنا للخدمات', en: 'Baytna Services' },
      category: 'product',
      technologies: ['Product Design', 'React'],
      description: { ar: 'نموذج أولي لخدمة رقمية تضع احتياجات المستخدم المحلي في المركز.', en: 'A prototype for a digital service that puts local user needs at the center.' }
    }
  ])
});
