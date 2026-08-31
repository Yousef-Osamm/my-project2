window.TFP_DATA = Object.freeze({
  categories: Object.freeze({
    courses: Object.freeze({
      all: 'كل الدورات',
      programming: 'البرمجة',
      web: 'تطوير الويب',
      ai: 'الذكاء الاصطناعي',
      uiux: 'UI/UX',
      robotics: 'الروبوتات',
      other: 'تقنيات أخرى'
    }),
    projects: Object.freeze({
      all: 'كل المشاريع',
      education: 'التعليم',
      community: 'المجتمع',
      innovation: 'الابتكار',
      product: 'المنتجات الرقمية'
    })
  }),
  stats: Object.freeze([
    { value: 24, suffix: '+', label: 'دورة تقنية' },
    { value: 18, suffix: '+', label: 'مشروعًا' },
    { value: 640, suffix: '+', label: 'متدربًا' },
    { value: 1200, suffix: '+', label: 'عضوًا في المجتمع' }
  ]),
  courses: Object.freeze([
    {
      id: 'web-foundations',
      title: 'أساسيات تطوير الويب',
      description: 'ابنِ صفحات عملية من الصفر باستخدام HTML وCSS وJavaScript.',
      category: 'web',
      level: 'مبتدئ',
      duration: '6 أسابيع'
    },
    {
      id: 'python-problem-solving',
      title: 'Python وحل المشكلات',
      description: 'طوّر طريقة تفكيرك البرمجية عبر تمارين ومشاريع صغيرة متدرجة.',
      category: 'programming',
      level: 'مبتدئ',
      duration: '5 أسابيع'
    },
    {
      id: 'ai-for-everyone',
      title: 'الذكاء الاصطناعي للجميع',
      description: 'افهم مفاهيم الذكاء الاصطناعي وتعلّم كيف تحوّلها إلى فكرة قابلة للتجربة.',
      category: 'ai',
      level: 'متوسط',
      duration: '4 أسابيع'
    },
    {
      id: 'interface-design',
      title: 'تصميم المنتجات الرقمية',
      description: 'صمّم تجربة واضحة تبدأ من فهم المستخدم وتنتهي بنموذج قابل للاختبار.',
      category: 'uiux',
      level: 'متوسط',
      duration: '5 أسابيع'
    },
    {
      id: 'robotics-lab',
      title: 'مختبر الروبوتات',
      description: 'تعرّف إلى المستشعرات والمنطق البرمجي من خلال نماذج تفاعلية.',
      category: 'robotics',
      level: 'متوسط',
      duration: '7 أسابيع'
    },
    {
      id: 'open-source',
      title: 'مدخل إلى المصادر المفتوحة',
      description: 'تعلّم Git وGitHub وكيف تساهم في مشاريع تقنية مع فريق حقيقي.',
      category: 'other',
      level: 'مبتدئ',
      duration: '3 أسابيع'
    }
  ]),
  projects: Object.freeze([
    {
      id: 'palestine-open-data',
      title: 'منصة البيانات المفتوحة',
      category: 'innovation',
      technologies: ['JavaScript', 'Data UI'],
      description: 'واجهة تساعد المجتمع على استكشاف البيانات المحلية بطريقة أوضح.'
    },
    {
      id: 'masar-learning',
      title: 'مسار للتعلّم العملي',
      category: 'education',
      technologies: ['UX Research', 'Web'],
      description: 'تجربة تعلّم تربط الدروس القصيرة بتحديات قابلة للتطبيق.'
    },
    {
      id: 'wasla-community',
      title: 'وصلة المجتمع',
      category: 'community',
      technologies: ['Mobile', 'Civic Tech'],
      description: 'مساحة رقمية لتبادل المهارات والفرص بين أعضاء المجتمع.'
    },
    {
      id: 'baytna-services',
      title: 'بيتنا للخدمات',
      category: 'product',
      technologies: ['Product Design', 'React'],
      description: 'نموذج أولي لخدمة رقمية تضع احتياجات المستخدم المحلي في المركز.'
    }
  ])
});
