export interface CareerSkillRequirement {
  name: string;
  category: 'programming' | 'technical' | 'soft';
  targetLevel: number; // 0-100
  importance: 'core' | 'important' | 'nice-to-have';
}

export interface CareerResource {
  title: string;
  provider: string;
  url: string;
  type: 'Course' | 'Documentation' | 'Interactive' | 'Guide';
}

export interface CareerProjectTemplate {
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  skillsPracticed: string[];
}

export interface CareerPath {
  id: string;
  title: string;
  tagline: string;
  description: string;
  demandLevel: string;
  avgTimelineMonths: number;
  requiredTechnicalSkills: CareerSkillRequirement[];
  softSkills: string[];
  recommendedProjects: CareerProjectTemplate[];
  learningResources: CareerResource[];
  requirements: string[];
}

export const CAREER_PATHS: CareerPath[] = [
  {
    id: 'full-stack-developer',
    title: 'Full Stack Developer',
    tagline: 'End-to-end web architecture from responsive interfaces to scalable APIs and databases.',
    description:
      'Design, build, and deploy complete web applications across frontend UI frameworks, backend REST/GraphQL services, relational and document databases, authentication, and cloud deployment.',
    demandLevel: 'High Demand',
    avgTimelineMonths: 6,
    requiredTechnicalSkills: [
      { name: 'HTML & CSS', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'JavaScript', category: 'programming', targetLevel: 90, importance: 'core' },
      { name: 'TypeScript', category: 'programming', targetLevel: 80, importance: 'core' },
      { name: 'React', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'Node.js & Express', category: 'technical', targetLevel: 80, importance: 'core' },
      { name: 'SQL & Databases', category: 'technical', targetLevel: 80, importance: 'core' },
      { name: 'Git & Version Control', category: 'technical', targetLevel: 75, importance: 'important' },
      { name: 'REST API Design & Auth', category: 'technical', targetLevel: 80, importance: 'core' },
      { name: 'Testing & Debugging', category: 'technical', targetLevel: 70, importance: 'important' },
    ],
    softSkills: ['System Thinking', 'Problem Solving', 'Technical Communication', 'Time Management'],
    recommendedProjects: [
      {
        title: 'Multi-User Task & Sprint Workspace',
        difficulty: 'Intermediate',
        description: 'Build a full-stack Kanban board with JWT authentication, role-based access, PostgreSQL/SQLite persistence, and optimistic UI updates.',
        skillsPracticed: ['React', 'TypeScript', 'Node.js & Express', 'SQL & Databases'],
      },
      {
        title: 'E-Commerce Checkout & Inventory Engine',
        difficulty: 'Advanced',
        description: 'Create an online store with product search, cart state, transactional order processing, and an admin inventory dashboard.',
        skillsPracticed: ['REST API Design & Auth', 'SQL & Databases', 'Testing & Debugging'],
      },
    ],
    learningResources: [
      { title: 'The Odin Project: Full Stack JavaScript', provider: 'The Odin Project', url: 'https://www.theodinproject.com/paths/full-stack-javascript', type: 'Course' },
      { title: 'MDN Web Docs: Web Development', provider: 'Mozilla', url: 'https://developer.mozilla.org/en-US/docs/Learn', type: 'Documentation' },
      { title: 'Full Stack Open', provider: 'University of Helsinki', url: 'https://fullstackopen.com/en/', type: 'Course' },
    ],
    requirements: [
      'Strong proficiency in JavaScript/TypeScript and modern frontend component architecture',
      'Ability to design normalized database schemas and write secure backend API endpoints',
      'Understanding of authentication, HTTP status semantics, and deployment workflows',
    ],
  },
  {
    id: 'frontend-developer',
    title: 'Frontend Developer',
    tagline: 'Crafting accessible, responsive, high-performance user interfaces and design systems.',
    description:
      'Specialize in turning complex product requirements and visual designs into crisp, accessible, interactive browser experiences with modern state management and web performance optimization.',
    demandLevel: 'High Demand',
    avgTimelineMonths: 4,
    requiredTechnicalSkills: [
      { name: 'HTML5 & Semantic Accessibility', category: 'technical', targetLevel: 90, importance: 'core' },
      { name: 'Modern CSS & Tailwind', category: 'technical', targetLevel: 90, importance: 'core' },
      { name: 'JavaScript (ES6+)', category: 'programming', targetLevel: 90, importance: 'core' },
      { name: 'TypeScript', category: 'programming', targetLevel: 80, importance: 'core' },
      { name: 'React & State Management', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'Web Performance & Core Vitals', category: 'technical', targetLevel: 75, importance: 'important' },
      { name: 'REST / Async Data Fetching', category: 'technical', targetLevel: 80, importance: 'core' },
      { name: 'Frontend Testing (Vitest/RTL)', category: 'technical', targetLevel: 70, importance: 'important' },
    ],
    softSkills: ['Visual Attention to Detail', 'UX Empathy', 'Cross-Functional Collaboration', 'Product Sense'],
    recommendedProjects: [
      {
        title: 'Accessible Design System & Component Library',
        difficulty: 'Intermediate',
        description: 'Build 15+ keyboard-navigable UI components with WCAG AA contrast, interactive docs, and unit tests.',
        skillsPracticed: ['HTML5 & Semantic Accessibility', 'Modern CSS & Tailwind', 'TypeScript'],
      },
      {
        title: 'Real-Time Analytics Dashboard',
        difficulty: 'Intermediate',
        description: 'Implement responsive data tables, dynamic filtering, dark/light theming, and interactive charts.',
        skillsPracticed: ['React & State Management', 'Web Performance & Core Vitals'],
      },
    ],
    learningResources: [
      { title: 'web.dev Learn Responsive Design', provider: 'Google web.dev', url: 'https://web.dev/learn/design', type: 'Guide' },
      { title: 'React Official Documentation', provider: 'React Team', url: 'https://react.dev/learn', type: 'Documentation' },
      { title: 'JavaScript.info Modern Tutorial', provider: 'JavaScript.info', url: 'https://javascript.info/', type: 'Interactive' },
    ],
    requirements: [
      'Deep command of CSS layout systems (Grid, Flexbox) and responsive design',
      'Fluency in React component lifecycles, hooks, and asynchronous state handling',
      'Commitment to WCAG accessibility standards and smooth browser rendering',
    ],
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    tagline: 'Engineering reliable APIs, data pipelines, security layers, and distributed services.',
    description:
      'Focus on server-side architecture, database modeling, query optimization, authentication, caching, background jobs, and resilient API contracts.',
    demandLevel: 'High Demand',
    avgTimelineMonths: 5,
    requiredTechnicalSkills: [
      { name: 'Node.js / Python / Go', category: 'programming', targetLevel: 88, importance: 'core' },
      { name: 'SQL & Relational Modeling', category: 'technical', targetLevel: 90, importance: 'core' },
      { name: 'REST & API Architecture', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'Authentication & Security', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'Caching & Queues (Redis)', category: 'technical', targetLevel: 75, importance: 'important' },
      { name: 'Docker & Containers', category: 'technical', targetLevel: 75, importance: 'important' },
      { name: 'Automated API Testing', category: 'technical', targetLevel: 75, importance: 'important' },
      { name: 'System Design & Scalability', category: 'technical', targetLevel: 75, importance: 'core' },
    ],
    softSkills: ['Analytical Debugging', 'Security Mindset', 'Documentation Clarity', 'Reliability Ownership'],
    recommendedProjects: [
      {
        title: 'Rate-Limited Webhook & Job Queue Service',
        difficulty: 'Intermediate',
        description: 'Develop an API server with token-bucket rate limiting, idempotency keys, retries, and structured audit logging.',
        skillsPracticed: ['REST & API Architecture', 'Authentication & Security', 'Caching & Queues (Redis)'],
      },
      {
        title: 'Multi-Tenant Ledger API',
        difficulty: 'Advanced',
        description: 'Build an ACID-compliant financial transaction API using PostgreSQL transactions and integration tests.',
        skillsPracticed: ['SQL & Relational Modeling', 'Automated API Testing'],
      },
    ],
    learningResources: [
      { title: 'Backend Developer Roadmap', provider: 'roadmap.sh', url: 'https://roadmap.sh/backend', type: 'Guide' },
      { title: 'PostgreSQL Tutorial', provider: 'PostgreSQL', url: 'https://www.postgresql.org/docs/current/tutorial.html', type: 'Documentation' },
      { title: 'OWASP API Security Top 10', provider: 'OWASP', url: 'https://owasp.org/API-Security/', type: 'Guide' },
    ],
    requirements: [
      'Solid grasp of relational database indexing, joins, and transaction isolation',
      'Strong understanding of OWASP security practices, hashing, and authorization',
      'Ability to profile bottlenecks and design fault-tolerant endpoints',
    ],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    tagline: 'Turning raw operational data into clear business metrics, dashboards, and decisions.',
    description:
      'Extract, clean, model, and visualize business datasets using SQL, Python/R, spreadsheets, and BI tools to uncover trends and guide strategic choices.',
    demandLevel: 'Strong Demand',
    avgTimelineMonths: 4,
    requiredTechnicalSkills: [
      { name: 'SQL Querying & Window Functions', category: 'programming', targetLevel: 90, importance: 'core' },
      { name: 'Python (Pandas & NumPy)', category: 'programming', targetLevel: 80, importance: 'core' },
      { name: 'Data Cleaning & Wrangling', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'Statistics & Hypothesis Testing', category: 'technical', targetLevel: 80, importance: 'core' },
      { name: 'Data Visualization & BI', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'Excel / Spreadsheets Modeling', category: 'technical', targetLevel: 85, importance: 'important' },
      { name: 'A/B Testing & Funnel Analysis', category: 'technical', targetLevel: 75, importance: 'important' },
    ],
    softSkills: ['Business Acumen', 'Data Storytelling', 'Stakeholder Presentation', 'Critical Skepticism'],
    recommendedProjects: [
      {
        title: 'SaaS Retention & Cohort Revenue Analysis',
        difficulty: 'Intermediate',
        description: 'Query user subscription logs with SQL CTEs and build an interactive cohort churn and LTV dashboard.',
        skillsPracticed: ['SQL Querying & Window Functions', 'Data Visualization & BI', 'A/B Testing & Funnel Analysis'],
      },
      {
        title: 'Retail Demand & Pricing EDA',
        difficulty: 'Beginner',
        description: 'Clean a messy multi-region sales dataset in Pandas and present actionable seasonality findings.',
        skillsPracticed: ['Python (Pandas & NumPy)', 'Data Cleaning & Wrangling', 'Statistics & Hypothesis Testing'],
      },
    ],
    learningResources: [
      { title: 'Mode SQL Tutorial', provider: 'Mode Analytics', url: 'https://mode.com/sql-tutorial/', type: 'Interactive' },
      { title: 'Kaggle Learn: Pandas & Data Visualization', provider: 'Kaggle', url: 'https://www.kaggle.com/learn', type: 'Course' },
      { title: 'StatQuest with Josh Starmer', provider: 'StatQuest', url: 'https://statquest.org/', type: 'Guide' },
    ],
    requirements: [
      'High fluency in SQL joins, aggregations, CTEs, and window functions',
      'Solid grounding in descriptive statistics, confidence intervals, and A/B test interpretation',
      'Ability to translate charts into clear executive recommendations',
    ],
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    tagline: 'Building predictive statistical models, experimentation frameworks, and ML insights.',
    description:
      'Combine advanced statistics, feature engineering, supervised/unsupervised machine learning, and experimental design to solve ambiguous forecasting and optimization problems.',
    demandLevel: 'High Demand',
    avgTimelineMonths: 7,
    requiredTechnicalSkills: [
      { name: 'Python Scientific Stack', category: 'programming', targetLevel: 90, importance: 'core' },
      { name: 'Probability & Statistical Inference', category: 'technical', targetLevel: 88, importance: 'core' },
      { name: 'SQL & Data Pipelines', category: 'programming', targetLevel: 85, importance: 'core' },
      { name: 'Feature Engineering', category: 'technical', targetLevel: 82, importance: 'core' },
      { name: 'Machine Learning (Scikit-Learn)', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'Experimentation & Causal Inference', category: 'technical', targetLevel: 78, importance: 'important' },
      { name: 'Model Evaluation & Cross-Validation', category: 'technical', targetLevel: 82, importance: 'core' },
    ],
    softSkills: ['Research Rigor', 'Hypothesis Framing', 'Executive Storytelling', 'Domain Curiosity'],
    recommendedProjects: [
      {
        title: 'Customer Churn Prediction with Calibration',
        difficulty: 'Intermediate',
        description: 'Train gradient-boosted classifiers with SHAP explainability, stratified CV, and business cost curves.',
        skillsPracticed: ['Machine Learning (Scikit-Learn)', 'Feature Engineering', 'Model Evaluation & Cross-Validation'],
      },
      {
        title: 'Dynamic Demand Forecasting Engine',
        difficulty: 'Advanced',
        description: 'Compare baseline ARIMA/Prophet and tree-based time-series models with rolling backtesting.',
        skillsPracticed: ['Python Scientific Stack', 'Probability & Statistical Inference'],
      },
    ],
    learningResources: [
      { title: 'Intro to Statistical Learning (ISLP)', provider: 'Stanford / Springer', url: 'https://www.statlearning.com/', type: 'Guide' },
      { title: 'Kaggle Machine Learning Courses', provider: 'Kaggle', url: 'https://www.kaggle.com/learn', type: 'Course' },
      { title: 'Scikit-Learn User Guide', provider: 'Scikit-Learn', url: 'https://scikit-learn.org/stable/user_guide.html', type: 'Documentation' },
    ],
    requirements: [
      'Strong mathematical intuition in linear algebra, probability, and statistical inference',
      'Hands-on skill preventing data leakage and designing proper validation splits',
      'Ability to connect model metrics (ROC-AUC, RMSE) to business impact',
    ],
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI/ML Engineer',
    tagline: 'Productionizing neural networks, LLM workflows, RAG systems, and scalable inference.',
    description:
      'Bridge research and production engineering by building, fine-tuning, evaluating, and deploying machine learning models, embeddings, retrieval pipelines, and agentic AI applications.',
    demandLevel: 'Fastest Growing',
    avgTimelineMonths: 7,
    requiredTechnicalSkills: [
      { name: 'Python & Async Backend', category: 'programming', targetLevel: 90, importance: 'core' },
      { name: 'PyTorch & Deep Learning', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'LLM & Prompt Engineering', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'Embeddings & Vector Search (RAG)', category: 'technical', targetLevel: 82, importance: 'core' },
      { name: 'Linear Algebra & Calculus', category: 'technical', targetLevel: 80, importance: 'important' },
      { name: 'MLOps & Model Serving APIs', category: 'technical', targetLevel: 78, importance: 'core' },
      { name: 'Evaluation & Guardrails', category: 'technical', targetLevel: 80, importance: 'core' },
    ],
    softSkills: ['Systems Engineering', 'Empirical Evaluation', 'Rapid Prototyping', 'AI Safety Awareness'],
    recommendedProjects: [
      {
        title: 'Evaluated RAG Knowledge Assistant',
        difficulty: 'Intermediate',
        description: 'Build a retrieval-augmented generation API with hybrid search, citation grounding, and automated eval benchmarks.',
        skillsPracticed: ['Embeddings & Vector Search (RAG)', 'LLM & Prompt Engineering', 'Evaluation & Guardrails'],
      },
      {
        title: 'Fine-Tuned Domain Classifier & Serving API',
        difficulty: 'Advanced',
        description: 'Fine-tune a transformer model in PyTorch, export quantized weights, and serve behind a FastAPI microservice.',
        skillsPracticed: ['PyTorch & Deep Learning', 'MLOps & Model Serving APIs'],
      },
    ],
    learningResources: [
      { title: 'Fast.ai Practical Deep Learning', provider: 'fast.ai', url: 'https://course.fast.ai/', type: 'Course' },
      { title: 'Google AI for Developers', provider: 'Google', url: 'https://ai.google.dev/gemini-api/docs', type: 'Documentation' },
      { title: 'Hugging Face NLP & LLM Course', provider: 'Hugging Face', url: 'https://huggingface.co/learn/nlp-course', type: 'Course' },
    ],
    requirements: [
      'Strong Python software engineering skills and API architecture understanding',
      'Working knowledge of neural network training, embeddings, and LLM evaluation',
      'Focus on latency, reliability, hallucination mitigation, and structured outputs',
    ],
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    tagline: 'Designing intuitive user flows, research-backed wireframes, and cohesive design systems.',
    description:
      'Research user needs, structure information architecture, craft interactive prototypes, and build scalable visual design systems that balance aesthetics with usability.',
    demandLevel: 'Strong Demand',
    avgTimelineMonths: 4,
    requiredTechnicalSkills: [
      { name: 'User Research & Usability Testing', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'Wireframing & Information Architecture', category: 'technical', targetLevel: 88, importance: 'core' },
      { name: 'Figma & Interactive Prototyping', category: 'technical', targetLevel: 90, importance: 'core' },
      { name: 'Visual Hierarchy & Typography', category: 'technical', targetLevel: 88, importance: 'core' },
      { name: 'Design Systems & Tokens', category: 'technical', targetLevel: 82, importance: 'core' },
      { name: 'Accessibility (WCAG AA/AAA)', category: 'technical', targetLevel: 80, importance: 'important' },
      { name: 'HTML/CSS Literacy', category: 'technical', targetLevel: 65, importance: 'nice-to-have' },
    ],
    softSkills: ['Empathy & Active Listening', 'Design Critique', 'Storytelling', 'Product Strategy'],
    recommendedProjects: [
      {
        title: 'Mobile FinTech Onboarding Redesign Case Study',
        difficulty: 'Beginner',
        description: 'Conduct 5 user interviews, map friction points, and design an interactive Figma prototype reducing drop-off.',
        skillsPracticed: ['User Research & Usability Testing', 'Figma & Interactive Prototyping'],
      },
      {
        title: 'Multi-Brand Tokenized Design System',
        difficulty: 'Intermediate',
        description: 'Create semantic color, spacing, and typography tokens with responsive component variants in Figma.',
        skillsPracticed: ['Design Systems & Tokens', 'Accessibility (WCAG AA/AAA)', 'Visual Hierarchy & Typography'],
      },
    ],
    learningResources: [
      { title: 'Nielsen Norman Group UX Articles', provider: 'NN/g', url: 'https://www.nngroup.com/articles/', type: 'Guide' },
      { title: 'Figma Learn Design Basics', provider: 'Figma', url: 'https://help.figma.com/hc/en-us/categories/360002051613', type: 'Documentation' },
      { title: 'Refactoring UI & Accessibility Checklist', provider: 'A11y Project', url: 'https://www.a11yproject.com/checklist/', type: 'Guide' },
    ],
    requirements: [
      'Portfolio showing end-to-end research, wireframes, iterations, and measurable outcomes',
      'Mastery of typography, spacing rhythm, contrast ratios, and responsive grids',
      'Fluency in Figma auto-layout, components, variables, and developer handoff',
    ],
  },
  {
    id: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    tagline: 'Defending systems through threat detection, vulnerability analysis, and incident response.',
    description:
      'Monitor networks and cloud workloads, assess application vulnerabilities, analyze security logs, enforce least-privilege controls, and respond rapidly to security incidents.',
    demandLevel: 'Critical Demand',
    avgTimelineMonths: 6,
    requiredTechnicalSkills: [
      { name: 'Networking & TCP/IP Fundamentals', category: 'technical', targetLevel: 88, importance: 'core' },
      { name: 'Linux & OS Internals', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'Web App Security (OWASP Top 10)', category: 'technical', targetLevel: 85, importance: 'core' },
      { name: 'SIEM & Log Analysis', category: 'technical', targetLevel: 80, importance: 'core' },
      { name: 'Python / Bash Scripting', category: 'programming', targetLevel: 75, importance: 'important' },
      { name: 'Identity, IAM & Cryptography', category: 'technical', targetLevel: 80, importance: 'core' },
      { name: 'Incident Response & Threat Hunting', category: 'technical', targetLevel: 78, importance: 'core' },
    ],
    softSkills: ['Calm Under Pressure', 'Adversarial Thinking', 'Clear Incident Reporting', 'Ethical Integrity'],
    recommendedProjects: [
      {
        title: 'Home Lab SIEM & Intrusion Detection Pipeline',
        difficulty: 'Intermediate',
        description: 'Deploy Wazuh/ELK logs on virtual machines, simulate brute-force/SQLi probes, and author custom alert rules.',
        skillsPracticed: ['SIEM & Log Analysis', 'Networking & TCP/IP Fundamentals', 'Linux & OS Internals'],
      },
      {
        title: 'Web Vulnerability Audit & Remediation Report',
        difficulty: 'Intermediate',
        description: 'Assess a deliberately vulnerable web app (OWASP Juice Shop) and document reproducible fixes.',
        skillsPracticed: ['Web App Security (OWASP Top 10)', 'Identity, IAM & Cryptography'],
      },
    ],
    learningResources: [
      { title: 'TryHackMe SOC Level 1 Path', provider: 'TryHackMe', url: 'https://tryhackme.com/path/outline/soclevel1', type: 'Interactive' },
      { title: 'PortSwigger Web Security Academy', provider: 'PortSwigger', url: 'https://portswigger.net/web-security', type: 'Course' },
      { title: 'NIST Cybersecurity Framework', provider: 'NIST', url: 'https://www.nist.gov/cyberframework', type: 'Guide' },
    ],
    requirements: [
      'Deep familiarity with HTTP, DNS, TLS, firewalls, and packet inspection',
      'Hands-on ability to read Linux/Windows security logs and recognize attack signatures',
      'Practical understanding of authentication flaws, injection attacks, and mitigation',
    ],
  },
];

export function getCareerByTitleOrId(query: string): CareerPath {
  const normalized = query.trim().toLowerCase();
  return (
    CAREER_PATHS.find(
      (c) => c.id === normalized || c.title.toLowerCase() === normalized || c.title.toLowerCase().includes(normalized)
    ) || CAREER_PATHS[0]
  );
}
