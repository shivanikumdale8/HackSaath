import { randomUUID } from 'node:crypto';

/**
 * In-memory database with pre-seeded data for Hackathon Team Member Finder,
 * student portfolios, colleges, and team listings.
 */
const tables = new Map();

const rowsOf = (name) => {
  if (!tables.has(name)) tables.set(name, []);
  return tables.get(name);
};

const matches = (row, where = {}) =>
  Object.entries(where).every(([key, value]) => row[key] === value);

const compare = (a, b, key, ascending) => {
  const left = a[key] ?? '';
  const right = b[key] ?? '';
  if (left === right) return 0;
  const result = left < right ? -1 : 1;
  return ascending ? result : -result;
};

// Seed initial dataset
function seedInitialData() {
  const colleges = [
    { id: 'col-1', domain: 'coep.ac.in', name: 'COEP Technological University, Pune', city: 'Pune' },
    { id: 'col-2', domain: 'vjti.ac.in', name: 'Veermata Jijabai Technological Institute (VJTI), Mumbai', city: 'Mumbai' },
    { id: 'col-3', domain: 'pict.edu', name: 'Pune Institute of Computer Technology (PICT), Pune', city: 'Pune' },
    { id: 'col-4', domain: 'spit.ac.in', name: 'Sardar Patel Institute of Technology (SPIT), Mumbai', city: 'Mumbai' },
    { id: 'col-5', domain: 'cumminscollege.in', name: "MKSSS's Cummins College of Engineering for Women, Pune", city: 'Pune' },
    { id: 'col-6', domain: 'vnit.ac.in', name: 'Visvesvaraya National Institute of Technology (VNIT), Nagpur', city: 'Nagpur' },
    { id: 'col-7', domain: 'walchandsangli.ac.in', name: 'Walchand College of Engineering, Sangli', city: 'Sangli' },
    { id: 'col-8', domain: 'kkwagh.edu.in', name: 'K.K. Wagh Institute of Engineering, Nashik', city: 'Nashik' },
    { id: 'col-9', domain: 'vit.edu', name: 'Vishwakarma Institute of Technology (VIT), Pune', city: 'Pune' },
    { id: 'col-10', domain: 'geca.ac.in', name: 'Government College of Engineering, Chhatrapati Sambhajinagar', city: 'Chhatrapati Sambhajinagar' },
    { id: 'col-11', domain: 'iitb.ac.in', name: 'Indian Institute of Technology (IIT) Bombay', city: 'Mumbai' },
    { id: 'col-12', domain: 'iitd.ac.in', name: 'Indian Institute of Technology (IIT) Delhi', city: 'New Delhi' },
    { id: 'col-13', domain: 'bits-pilani.ac.in', name: 'BITS Pilani', city: 'Pilani' },
    { id: 'col-14', domain: 'nitt.edu', name: 'National Institute of Technology (NIT) Trichy', city: 'Tiruchirappalli' },
    { id: 'col-15', domain: 'iiit.ac.in', name: 'International Institute of Information Technology (IIIT) Hyderabad', city: 'Hyderabad' },
  ];
  tables.set('colleges', colleges.map(c => ({ ...c, created_at: new Date().toISOString() })));

  const users = [
    {
      id: 'usr-1',
      email: 'shivanikumdale8@gmail.com',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Gauri Kulkarni',
      bio: 'B.Tech Computer Engineering at COEP Technological University, Pune. Focused on computer vision, deep learning, multimodal LLMs, and real-time inference on edge devices. Winner of SIH 2024 regional round.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      primary_role: 'AI/ML Engineer',
      experience_level: 'Advanced',
      year_of_study: '3rd Year B.Tech',
      gender: 'female',
      availability: 'Actively Seeking Team',
      github_url: 'https://github.com/gaurikulkarni',
      portfolio_url: 'https://gaurikulkarni.dev',
      skills_offered: ['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'Computer Vision', 'OpenCV', 'Docker'],
      skills_wanted: ['Figma', 'UI/UX Design', 'React'],
      interests: ['AI / Machine Learning', 'Agritech & MedTech', 'Computer Vision'],
      college_id: 'col-1',
      college_name: 'COEP Technological University, Pune',
      city: 'Pune',
      rating_average: 4.95,
      rating_count: 14,
      projects: [
        {
          id: 'p1',
          title: 'MedAI Diagnostics & Pathology Classifier',
          description: 'Multimodal chest X-ray and CT scan disease classification pipeline with 94.2% ROC-AUC.',
          github_url: 'https://github.com/gaurikulkarni/medai-diagnostics',
          demo_url: 'https://medai-demo.vercel.app',
          tech_stack: ['Python', 'PyTorch', 'FastAPI', 'Docker'],
        },
        {
          id: 'p2',
          title: 'AgriVision Foliar Drone Pipeline',
          description: 'Multispectral drone imagery pipeline detecting foliar rust in Indian sugarcane and soybean fields.',
          github_url: 'https://github.com/gaurikulkarni/agrivision-drone',
          demo_url: '',
          tech_stack: ['Python', 'OpenCV', 'YOLOv8', 'PyTorch'],
        },
      ],
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'usr-2',
      email: 'aarav.patil@coep.ac.in',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Aarav Patil',
      bio: 'Full stack builder at COEP Pune. Core contributor to campus open source tools. Building high-throughput microservices, WebSocket channels, and clean React dashboards.',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      primary_role: 'Full Stack Developer',
      experience_level: 'Advanced',
      year_of_study: '3rd Year B.Tech',
      gender: 'male',
      availability: 'Actively Seeking Team',
      github_url: 'https://github.com/aaravpatil',
      portfolio_url: 'https://aaravpatil.dev',
      skills_offered: ['React', 'TypeScript', 'Node.js', 'Go', 'PostgreSQL', 'Docker', 'Tailwind CSS'],
      skills_wanted: ['Figma', 'UI/UX Design', 'IoT Specialist'],
      interests: ['AI / Machine Learning', 'Agritech', 'Smart Cities'],
      college_id: 'col-1',
      college_name: 'COEP Technological University, Pune',
      city: 'Pune',
      rating_average: 4.9,
      rating_count: 12,
      projects: [
        {
          id: 'p3',
          title: 'CampusBridge Portal',
          description: 'A modular student marketplace and collaboration tool utilized by 3,000+ COEP students.',
          github_url: 'https://github.com/aaravpatil/campusbridge',
          demo_url: '',
          tech_stack: ['React', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
        },
      ],
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    },
    {
      id: 'usr-3',
      email: 'tanvi.deshmukh@vjti.ac.in',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Tanvi Deshmukh',
      bio: 'B.Tech IT at VJTI Mumbai. Lead designer for Technovanza hackathon portal. Obsessed with WCAG AAA accessibility, typography, design systems, and converting micro-interactions.',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      primary_role: 'UI/UX Designer',
      experience_level: 'Advanced',
      year_of_study: '2nd Year B.Tech',
      gender: 'female',
      availability: 'Actively Seeking Team',
      github_url: 'https://github.com/tanvi-designs',
      portfolio_url: 'https://tanvidesign.me',
      skills_offered: ['Figma', 'Wireframing', 'Design Systems', 'User Research', 'Prototyping', 'Tailwind CSS', 'React'],
      skills_wanted: ['Frontend Animation', 'WebGL'],
      interests: ['Healthcare & MedTech', 'FinTech & Web3', 'Education & EdTech'],
      college_id: 'col-2',
      college_name: 'Veermata Jijabai Technological Institute (VJTI), Mumbai',
      city: 'Mumbai',
      rating_average: 5.0,
      rating_count: 15,
      projects: [
        {
          id: 'p4',
          title: 'TechnoDesign System',
          description: 'Modular design system and component kit built in Figma and Storybook for student engineering fests.',
          github_url: 'https://github.com/tanvi-designs/techno-ui',
          demo_url: 'https://tanvidesign.me',
          tech_stack: ['Figma', 'Storybook', 'Tailwind CSS'],
        },
      ],
      created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    },
    {
      id: 'usr-4',
      email: 'rohan.kulkarni@coep.ac.in',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Rohan Kulkarni',
      bio: 'Systems engineer & backend specialist at COEP Pune. I build fault-tolerant APIs, distributed event streams in Go, and low-latency database indexes.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      primary_role: 'Backend Developer',
      experience_level: 'Advanced',
      year_of_study: '4th Year B.Tech',
      gender: 'male',
      availability: 'Available (Weekend Sprint)',
      github_url: 'https://github.com/rohan-backend',
      portfolio_url: 'https://rohankulkarni.io',
      skills_offered: ['Node.js', 'PostgreSQL', 'Docker', 'Redis', 'Go', 'Express', 'Prisma', 'REST APIs'],
      skills_wanted: ['AI/ML Engineer', 'PyTorch'],
      interests: ['FinTech & Web3', 'Cybersecurity & Privacy', 'Distributed Systems'],
      college_id: 'col-1',
      college_name: 'COEP Technological University, Pune',
      city: 'Pune',
      rating_average: 4.88,
      rating_count: 16,
      projects: [
        {
          id: 'p5',
          title: 'TurboQueue Engine',
          description: 'Sub-millisecond persistent event stream queue handling 50k msgs/sec in Go and Redis.',
          github_url: 'https://github.com/rohan-backend/turboqueue',
          demo_url: '',
          tech_stack: ['Go', 'PostgreSQL', 'Redis', 'Docker'],
        },
      ],
      created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    },
    {
      id: 'usr-5',
      email: 'priya.patel@pict.edu',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Priya Patel',
      bio: 'Frontend enthusiast at PICT Pune crafting buttery-smooth web apps with React, Vite, and Motion. Credenz hackathon winner.',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      primary_role: 'Frontend Developer',
      experience_level: 'Advanced',
      year_of_study: '3rd Year B.E.',
      gender: 'female',
      availability: 'Actively Seeking Team',
      github_url: 'https://github.com/priyapatel-frontend',
      portfolio_url: 'https://priya.codes',
      skills_offered: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Vite', 'State Management'],
      skills_wanted: ['Backend Developer', 'PostgreSQL'],
      interests: ['AI / Machine Learning', 'Healthcare & MedTech', 'Open Innovation'],
      college_id: 'col-3',
      college_name: 'Pune Institute of Computer Technology (PICT), Pune',
      city: 'Pune',
      rating_average: 4.9,
      rating_count: 8,
      projects: [
        {
          id: 'p6',
          title: 'BentoCanvas UI',
          description: 'Interactive dashboard component suite featuring real-time charting and dark mode.',
          github_url: 'https://github.com/priyapatel-frontend/bentocanvas',
          demo_url: 'https://bentocanvas.dev',
          tech_stack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
        },
      ],
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'usr-6',
      email: 'aditya.shinde@spit.ac.in',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Aditya Shinde',
      bio: 'Computer Engineering at SPIT Mumbai. Building decentralized escrow protocols and zero-knowledge student micro-credit credentials.',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      primary_role: 'Blockchain & FinTech Specialist',
      experience_level: 'Intermediate',
      year_of_study: '3rd Year B.Tech',
      gender: 'male',
      availability: 'Available (15-20 hrs/wk)',
      github_url: 'https://github.com/adityashinde-dev',
      portfolio_url: 'https://adityashinde.me',
      skills_offered: ['Solidity', 'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Tailwind CSS'],
      skills_wanted: ['AI/ML Engineer'],
      interests: ['FinTech & Web3', 'Education & EdTech', 'Open Innovation'],
      college_id: 'col-4',
      college_name: 'Sardar Patel Institute of Technology (SPIT), Mumbai',
      city: 'Mumbai',
      rating_average: 4.8,
      rating_count: 7,
      projects: [],
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'usr-7',
      email: 'snehal.jadhav@cumminscollege.in',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Snehal Jadhav',
      bio: 'B.Tech at Cummins College Pune. Product strategist & pitch champion. Winner of 2 national collegiate hackathons including SIH Grand Finale.',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      primary_role: 'Product / Pitch Lead',
      experience_level: 'Advanced',
      year_of_study: '4th Year B.Tech',
      gender: 'female',
      availability: 'Actively Seeking Team',
      github_url: 'https://github.com/snehalj-pm',
      portfolio_url: 'https://snehaljadhav.com',
      skills_offered: ['Product Strategy', 'Figma', 'Pitch Deck Design', 'User Testing', 'Market Research', 'Agile'],
      skills_wanted: ['Full Stack Developer', 'AI/ML Engineer'],
      interests: ['Sustainability & CleanTech', 'Healthcare & MedTech', 'Open Innovation'],
      college_id: 'col-5',
      college_name: "MKSSS's Cummins College of Engineering for Women, Pune",
      city: 'Pune',
      rating_average: 5.0,
      rating_count: 14,
      projects: [],
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
      id: 'usr-8',
      email: 'siddharth.joshi@vnit.ac.in',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Siddharth Joshi',
      bio: 'Hardware prototyper at VNIT Nagpur connecting sensors with cloud dashboards via MQTT and REST APIs on ESP32 microcontrollers.',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      primary_role: 'IoT Specialist',
      experience_level: 'Advanced',
      year_of_study: '3rd Year B.Tech',
      gender: 'male',
      availability: 'Available (15-20 hrs/wk)',
      github_url: 'https://github.com/siddharth-iot',
      portfolio_url: 'https://siddharthjoshi.tech',
      skills_offered: ['C++', 'Python', 'ESP32', 'MQTT', 'ROS2', 'Raspberry Pi', 'FastAPI'],
      skills_wanted: ['Full Stack Developer', 'React'],
      interests: ['IoT & Embedded', 'Smart Cities', 'Automotive'],
      college_id: 'col-6',
      college_name: 'Visvesvaraya National Institute of Technology (VNIT), Nagpur',
      city: 'Nagpur',
      rating_average: 4.85,
      rating_count: 7,
      projects: [],
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    },
    {
      id: 'usr-9',
      email: 'neha.gaikwad@kkwagh.edu.in',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Neha Gaikwad',
      bio: 'B.Tech student at KK Wagh Nashik working on Marathi Indic NLP language models, dataset normalization, and analytics pipelines.',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      primary_role: 'Data Scientist',
      experience_level: 'Advanced',
      year_of_study: '3rd Year B.Tech',
      gender: 'female',
      availability: 'Actively Seeking Team',
      github_url: 'https://github.com/nehagaikwad-ai',
      portfolio_url: 'https://nehagaikwad.me',
      skills_offered: ['Python', 'FastAPI', 'Pandas', 'PyTorch', 'HuggingFace', 'PostgreSQL'],
      skills_wanted: ['Full Stack Developer', 'React'],
      interests: ['AI / Machine Learning', 'Agritech', 'Data Science'],
      college_id: 'col-8',
      college_name: 'K.K. Wagh Institute of Engineering, Nashik',
      city: 'Nashik',
      rating_average: 4.9,
      rating_count: 8,
      projects: [],
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'usr-10',
      email: 'pranav.kadam@walchandsangli.ac.in',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Pranav Kadam',
      bio: 'Cloud architecture & DevOps specialist at Walchand College of Engineering, Sangli. Specializing in Docker, Kubernetes clusters, and automated CI/CD pipelines.',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      primary_role: 'Cloud / DevOps Engineer',
      experience_level: 'Advanced',
      year_of_study: '3rd Year B.Tech',
      gender: 'male',
      availability: 'Actively Seeking Team',
      github_url: 'https://github.com/pranavkadam-dev',
      portfolio_url: 'https://pranavkadam.me',
      skills_offered: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'GitHub Actions', 'Linux', 'Python'],
      skills_wanted: ['AI/ML Engineer'],
      interests: ['Cloud Architecture', 'DevOps', 'Distributed Systems'],
      college_id: 'col-7',
      college_name: 'Walchand College of Engineering, Sangli',
      city: 'Sangli',
      rating_average: 4.85,
      rating_count: 9,
      projects: [],
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'usr-11',
      email: 'shweta.more@vit.edu',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Shweta More',
      bio: 'Mobile App developer at VIT Pune. Building cross-platform offline-first apps in Flutter and React Native for Indian agriculture and civic utilities.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      primary_role: 'Mobile Developer',
      experience_level: 'Advanced',
      year_of_study: '3rd Year B.Tech',
      gender: 'female',
      availability: 'Actively Seeking Team',
      github_url: 'https://github.com/shwetamore-dev',
      portfolio_url: 'https://shwetamore.dev',
      skills_offered: ['Flutter', 'Dart', 'React Native', 'Firebase', 'REST APIs', 'Kotlin'],
      skills_wanted: ['Backend Developer', 'PostgreSQL'],
      interests: ['Mobile & AR/VR', 'Agritech', 'Healthcare & MedTech'],
      college_id: 'col-9',
      college_name: 'Vishwakarma Institute of Technology (VIT), Pune',
      city: 'Pune',
      rating_average: 4.9,
      rating_count: 11,
      projects: [],
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'usr-12',
      email: 'omkar.deshpande@geca.ac.in',
      password_hash: '$2b$10$QA6wTaFW9IZ9JrLaeMJwTeId.UbjbYKBkva4sxMJkpG.7wuq3Q28i',
      full_name: 'Omkar Deshpande',
      bio: 'Cybersecurity researcher at Government College of Engineering, Chhatrapati Sambhajinagar. Focused on penetration testing, OWASP auditing, and crypto verification.',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      primary_role: 'Cybersecurity Analyst',
      experience_level: 'Intermediate',
      year_of_study: '4th Year B.Tech',
      gender: 'male',
      availability: 'Available (Weekend Sprint)',
      github_url: 'https://github.com/omkardeshpande-sec',
      portfolio_url: 'https://omkardeshpande.sec',
      skills_offered: ['Python', 'Wireshark', 'Cryptography', 'OAuth2', 'Linux', 'Go', 'OWASP'],
      skills_wanted: ['Full Stack Developer', 'React'],
      interests: ['Cybersecurity & Privacy', 'Distributed Systems'],
      college_id: 'col-10',
      college_name: 'Government College of Engineering, Chhatrapati Sambhajinagar',
      city: 'Chhatrapati Sambhajinagar',
      rating_average: 4.8,
      rating_count: 6,
      projects: [],
      created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    },
  ];
  tables.set('users', users);

  const hackathons = [
    {
      id: 'sih-2026',
      title: 'Smart India Hackathon 2026 (SIH)',
      organizer: "Ministry of Education's Innovation Cell & AICTE",
      edition: 'SIH 2026',
      category: 'National Govt Hackathon',
      reg_deadline: new Date(Date.now() + 35 * 86400000).toISOString(),
      team_formation_deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
      min_team_size: 6,
      max_team_size: 6,
      institution_policy: 'same_institution', // Strict: Same College Only
      required_gender_diversity: true, // Strict: At least one female teammate mandatory
      prize_pool: '₹1,50,000 per problem statement',
      mode: 'Hybrid',
      location: 'COEP Pune & Designated Nodal Centers',
      verification_status: 'verified',
      official_rules_url: 'https://www.sih.gov.in',
      official_reg_url: 'https://www.sih.gov.in/sih2026',
      description: 'The world biggest open innovation model. Form a 6-member squad from your college with mandatory gender inclusion to solve key challenges for central ministries.',
      problem_statements: [
        {
          code: 'SIH1420',
          title: 'Automated Crop Disease Detection & Localized Advisory System using Drone Imagery',
          ministry: 'Ministry of Agriculture & Farmers Welfare',
          category: 'Software / AI',
          description: 'Develop an AI-driven offline/low-bandwidth mobile app that processes multispectral drone feeds to diagnose crop foliar diseases and deliver real-time remedies in regional vernacular languages (including Marathi and Hindi).',
          recommended_roles: ['AI/ML Engineer', 'Frontend Developer', 'UI/UX Designer', 'Backend Developer'],
        },
        {
          code: 'SIH1421',
          title: 'Smart Adaptive Traffic Signal Optimization using Edge Vision Microcontrollers',
          ministry: 'Ministry of Road Transport & Highways',
          category: 'Hardware / IoT',
          description: 'Deploy embedded edge vision on ESP32/Raspberry Pi to dynamically reconfigure traffic signal green corridors based on emergency vehicle sirens and lane queue density across Pune and Mumbai arterial corridors.',
          recommended_roles: ['IoT Specialist', 'Embedded Systems', 'Backend Developer', 'AI/ML Engineer'],
        },
        {
          code: 'SIH1422',
          title: 'Unified Student Academic Credit & Micro-Scholarship Transfer Verification Protocol',
          ministry: 'Department of Higher Education',
          category: 'Software / Web3',
          description: 'Implement a tamper-proof verifiable credential ledger for National Academic Depository (NAD) and ABC credit portability across Indian universities with zero-knowledge proof validation.',
          recommended_roles: ['Full Stack Developer', 'Backend Developer', 'UI/UX Designer'],
        },
      ],
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'technovanza-2026',
      title: 'VJTI Technovanza HackSprint v8',
      organizer: 'VJTI Mumbai Student Tech Council',
      edition: 'v8',
      category: 'Inter-Collegiate Hackathon',
      reg_deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
      team_formation_deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      min_team_size: 2,
      max_team_size: 4,
      institution_policy: 'cross_institution', // Cross-College allowed
      required_gender_diversity: false,
      prize_pool: '₹1,00,000',
      mode: 'Offline',
      location: 'VJTI Mumbai Campus, Matunga',
      verification_status: 'verified',
      official_rules_url: 'https://technovanza.org',
      official_reg_url: 'https://technovanza.org/register',
      description: '36-hour intense engineering sprint focusing on high-concurrency systems, fintech micro-settlements, and edge computing across engineering colleges in India.',
      problem_statements: [
        {
          code: 'TECH-01',
          title: 'High-Throughput Decentralized Escrow Protocol for Campus Freelancing',
          ministry: 'Industry Track (FinTech)',
          category: 'Web3 & Distributed Systems',
          description: 'Build sub-second settlement escrow with instant dispute arbitration for student gig contracts.',
          recommended_roles: ['Backend Developer', 'Frontend Developer'],
        },
      ],
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'cleantech-2026',
      title: 'CleanTech Global Hackathon 2026',
      organizer: 'CleanTech Alliance & Climate Innovation Fund',
      edition: '2026',
      category: 'International Climate Hackathon',
      reg_deadline: new Date(Date.now() + 28 * 86400000).toISOString(),
      team_formation_deadline: new Date(Date.now() + 21 * 86400000).toISOString(),
      min_team_size: 3,
      max_team_size: 5,
      institution_policy: 'cross_institution',
      required_gender_diversity: false,
      prize_pool: '₹3,00,000 + Incubation Grant',
      mode: 'Online',
      location: 'Pune Tech Cluster Virtual Hub',
      verification_status: 'verified',
      official_rules_url: 'https://cleantech-hack.org',
      official_reg_url: 'https://cleantech-hack.org/join',
      description: 'Develop software and data models to calculate carbon emissions, solar roof potential, and waste diversion for university campuses.',
      problem_statements: [],
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'mindspark-2026',
      title: 'MindSpark AI Challenge 2026',
      organizer: 'COEP Technological University, Pune',
      edition: '2026',
      category: 'Collegiate AI Hackathon',
      reg_deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
      team_formation_deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
      min_team_size: 2,
      max_team_size: 4,
      institution_policy: 'cross_institution',
      required_gender_diversity: false,
      prize_pool: '₹75,000',
      mode: 'Online',
      location: 'COEP Pune Campus, Shivajinagar',
      verification_status: 'verified',
      official_rules_url: 'https://mindspark.coep.ac.in',
      official_reg_url: '',
      description: 'Flagship technical festival of COEP. Diagnostic vision and natural language processing track open for student teams seeking AI mentorship and rapid prototyping.',
      problem_statements: [],
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ];
  tables.set('hackathons', hackathons);

  const mentors = [
    {
      id: 'mentor-1',
      full_name: 'Dr. Rajesh Sharma',
      title: 'Associate Professor & AI Research Lead',
      organization: 'Ex-IIT Bombay / Center for AI',
      college_affiliation: 'COEP Technological University, Pune',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      expertise_areas: ['AI/ML', 'Computer Vision', 'PyTorch', 'Model Optimization', 'Research Papers'],
      bio: 'Published 35+ papers in CVPR and IEEE. Mentored 12 winning teams in Smart India Hackathon and ACM ICPC from Indian institutions.',
      rating: 4.95,
      total_mentored_teams: 18,
      is_verified: true,
      availability_status: 'available',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    },
    {
      id: 'mentor-2',
      full_name: 'Ananya Deshmukh',
      title: 'Principal Product Designer',
      organization: 'Fintech Studio Labs',
      college_affiliation: 'VJTI Mumbai Alum',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      expertise_areas: ['UI/UX Design', 'Design Systems', 'Figma', 'Pitch Deck Storytelling', 'Product Strategy'],
      bio: 'Design jury at national hackathons. Helps student teams convert raw code into venture-ready presentations.',
      rating: 5.0,
      total_mentored_teams: 24,
      is_verified: true,
      availability_status: 'available',
      created_at: new Date(Date.now() - 80 * 86400000).toISOString(),
    },
    {
      id: 'mentor-3',
      full_name: 'Vikramaditya Rao',
      title: 'Cloud Architect & AWS Community Hero',
      organization: 'DevScale Systems, Pune',
      college_affiliation: 'All India Technical Council',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      expertise_areas: ['Cloud Architecture', 'Distributed Systems', 'FastAPI', 'Docker & Kubernetes', 'PostgreSQL'],
      bio: 'Specialist in scaling architectures from prototype to production with zero downtime during hackathon demos.',
      rating: 4.9,
      total_mentored_teams: 15,
      is_verified: true,
      availability_status: 'available',
      created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
    },
    {
      id: 'mentor-4',
      full_name: 'Sneha Kulkarni',
      title: 'IoT & Edge Computing Specialist',
      organization: 'RoboTech Labs, Pune',
      college_affiliation: 'PICT Pune Alum',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      expertise_areas: ['IoT & Embedded', 'ESP32', 'ROS2', 'Hardware Prototyping', 'MQTT'],
      bio: 'Guiding hardware teams on sensor calibration, power budgeting, and edge microcontroller inference for SIH Hardware edition.',
      rating: 4.88,
      total_mentored_teams: 9,
      is_verified: true,
      availability_status: 'available',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
  ];
  tables.set('mentors', mentors);

  const listings = [
    {
      id: 'team-list-1',
      owner_id: 'usr-1', // Gauri Kulkarni (COEP Pune, AI/ML)
      mode: 'team',
      title: 'SIH 2026: AgriScan Automated Drone Crop Disease Detection Squad',
      description: 'Competing in Smart India Hackathon 2026 under Ministry of Agriculture (PS SIH1420)! Our computer vision model and telemetry pipeline are underway. We require 2 complementary same-college members from COEP Pune: a Backend Developer and an IoT specialist to complete our official 6-member squad.',
      tags: ['SIH 2026', 'Agriculture', 'PyTorch', 'FastAPI', 'React', 'Drone Vision'],
      college_id: 'col-1',
      college_name: 'COEP Technological University, Pune',
      people_required: 6,
      deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
      hackathon_id: 'sih-2026',
      hackathon_name: 'Smart India Hackathon 2026 (SIH)',
      hackathon_theme: 'Agriculture & Rural Innovation',
      problem_statement_code: 'SIH1420',
      institution_policy: 'same_institution',
      required_roles: ['AI/ML Engineer', 'Full Stack Developer', 'Backend Developer', 'UI/UX Designer', 'IoT Specialist', 'Product / Pitch Lead'],
      team_skills_needed: ['PyTorch', 'FastAPI', 'Figma', 'React', 'ESP32', 'Docker'],
      status: 'open',
      team_status: 'forming', // open | forming | ready | locked
      worker_status: 'todo',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'team-list-2',
      owner_id: 'usr-2', // Aarav Patil (COEP Pune, Full Stack)
      mode: 'team',
      title: 'CarbonLens: Automated Campus Energy Optimization & Carbon Accounting',
      description: 'Competing in the Sustainability Track! We are developing a deep learning model that predicts campus building energy surges from weather forecasts and occupancy sensors across universities in India. Cross-college collaborators welcome!',
      tags: ['CleanTech', 'Sustainability', 'Python', 'React', 'Node.js'],
      college_id: 'col-1',
      college_name: 'COEP Technological University, Pune',
      people_required: 4,
      deadline: new Date(Date.now() + 21 * 86400000).toISOString(),
      hackathon_id: 'cleantech-2026',
      hackathon_name: 'CleanTech Global Hackathon 2026',
      hackathon_theme: 'Sustainability & CleanTech',
      institution_policy: 'cross_institution',
      required_roles: ['Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'UI/UX Designer'],
      team_skills_needed: ['React', 'Node.js', 'Python', 'Tailwind CSS', 'Figma'],
      status: 'open',
      team_status: 'forming',
      worker_status: 'todo',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'team-list-3',
      owner_id: 'usr-3', // Tanvi Deshmukh (VJTI Mumbai, UI/UX)
      mode: 'team',
      title: 'TechnoEscrow: Instant Dispute Campus Micro-Settlement Engine',
      description: 'Building a decentralized campus gig escrow protocol for VJTI Technovanza 2026. Looking for 1 backend specialist and 1 UI/UX designer from any engineering college in India to assemble our dream hackathon squad.',
      tags: ['FinTech', 'Web3', 'React', 'TypeScript', 'Node.js'],
      college_id: 'col-2',
      college_name: 'Veermata Jijabai Technological Institute (VJTI), Mumbai',
      people_required: 3,
      deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
      hackathon_id: 'technovanza-2026',
      hackathon_name: 'VJTI Technovanza HackSprint v8',
      hackathon_theme: 'FinTech & Web3',
      problem_statement_code: 'TECH-01',
      institution_policy: 'cross_institution',
      required_roles: ['UI/UX Designer', 'Backend Developer', 'Blockchain & FinTech Specialist'],
      team_skills_needed: ['Node.js', 'PostgreSQL', 'TypeScript', 'Figma', 'Solidity'],
      status: 'open',
      team_status: 'open',
      worker_status: 'todo',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];
  tables.set('listings', listings);

  // Pre-seed accepted applications
  const applications = [
    {
      id: 'app-1',
      listing_id: 'team-list-1',
      applicant_id: 'usr-7', // Snehal Jadhav (Cummins College, female)
      message: 'Excited for SIH 2026! I will craft the pitch deck, presentation narrative, and test user acceptance.',
      status: 'accepted',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'app-2',
      listing_id: 'team-list-1',
      applicant_id: 'usr-2', // Aarav Patil (COEP, Full Stack, male)
      message: 'I can bridge the drone telemetry and OpenCV inference pipeline to our responsive React frontend.',
      status: 'accepted',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'app-3',
      listing_id: 'team-list-1',
      applicant_id: 'usr-4', // Rohan Kulkarni (COEP, Backend, male)
      message: 'I will handle our high-concurrency Go API and Postgres geospatial queries.',
      status: 'accepted',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];
  tables.set('team_applications', applications);

  // Pre-seed team invitations
  const teamInvitations = [
    {
      id: 'inv-1',
      listing_id: 'team-list-1',
      inviter_id: 'usr-1',
      invitee_id: 'usr-5', // Priya Patel (PICT Pune)
      role: 'Frontend Developer',
      message: 'Hey Priya, loved your BentoCanvas UI. We would love for you to join our SIH squad!',
      status: 'pending',
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ];
  tables.set('team_invitations', teamInvitations);

  // Pre-seed mentor requests
  const mentorRequests = [
    {
      id: 'mr-1',
      team_id: 'team-list-1',
      mentor_id: 'mentor-1', // Dr. Rajesh Sharma
      status: 'accepted',
      topic: 'SIH1420 Model Accuracy Optimization & Confusion Matrix Validation',
      meeting_details: 'Google Meet link provided in team portal · Friday 5:00 PM',
      session_notes: 'Reviewed preliminary dataset. Recommended data augmentation for Indian foliar crop lighting and quantizing models to ONNX for edge inference.',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
  ];
  tables.set('mentor_requests', mentorRequests);

  tables.set('team_merges', []);
}

seedInitialData();

export const memoryDb = {
  kind: 'memory',

  async insert(name, row) {
    const record = {
      id: randomUUID(),
      created_at: new Date().toISOString(),
      ...row,
    };
    rowsOf(name).push(record);
    return { ...record };
  },

  async findOne(name, where) {
    const row = rowsOf(name).find((candidate) => matches(candidate, where));
    return row ? { ...row } : null;
  },

  async findMany(name, where = {}, options = {}) {
    const { orderBy = 'created_at', ascending = false, limit = 50 } = options;
    return rowsOf(name)
      .filter((row) => matches(row, where))
      .sort((a, b) => compare(a, b, orderBy, ascending))
      .slice(0, limit)
      .map((row) => ({ ...row }));
  },

  async update(name, where, patch) {
    const row = rowsOf(name).find((candidate) => matches(candidate, where));
    if (!row) return null;
    Object.assign(row, patch, { updated_at: new Date().toISOString() });
    return { ...row };
  },

  async updateMany(name, where, patch) {
    const now = new Date().toISOString();
    const matched = rowsOf(name).filter((candidate) => matches(candidate, where));
    matched.forEach((row) => Object.assign(row, patch, { updated_at: now }));
    return matched.length;
  },

  async remove(name, where) {
    const rows = rowsOf(name);
    const index = rows.findIndex((candidate) => matches(candidate, where));
    if (index === -1) return false;
    rows.splice(index, 1);
    return true;
  },
};
