import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    // =============================
    // BASIC INFORMATION
    // =============================

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    shortDesc: {
      type: String,
      required: true,
    },

    longDesc: {
      type: String,
      required: true,
    },

    missionGoal: String,
    visionOutcome: String,

    category: {
      type: String,
      enum: [
        "Web Development",
        "Mobile App Development",
        "UI/UX & Design",
        "AI & Machine Learning",
        "Blockchain",
        "Cloud Computing",
        "DevOps",
        "SaaS Products",
        "Cyber Security",
        "AR/VR",
        "IoT",
        "Game Development",
        "Digital Marketing",
        "CRM / ERP",
        "Consulting",
        "Custom Software",
        "Automation & RPA",
        "Big Data",
        "QA & Testing",
        "Others",
      ],
    },

    tags: [String],
    keywords: [String],
    hashtags: [String],

    // =============================
    // MEDIA
    // =============================

    icon: String,
    image: String,
    bannerImage: String,
    coverImage: String,
    serviceImages: [String],
    gallery: [String],
    demoVideo: String,
    youtubeUrl: String,
    vimeoUrl: String,
    brochureUrl: String,
    documentationUrl: String,
    githubRepo: String,
    codeSampleUrl: String,

    // =============================
    // VALUE & POSITIONING
    // =============================

    featured: {
      type: Boolean,
      default: false,
    },

    priorityLevel: {
      type: String,
      enum: ["Low", "Mid", "High", "Critical"],
      default: "Mid",
    },

    cta: {
      type: String,
      default: "Request a Quote",
    },

    usp: [String], // Unique selling points
    competitiveAdvantages: [String],
    comparedWith: [String],

    // =============================
    // PRICING
    // =============================

    pricingModel: {
      type: String,
      enum: [
        "Fixed",
        "Hourly",
        "Subscription",
        "Retainer",
        "Usage-Based",
        "Freemium",
        "Enterprise",
        "Custom",
      ],
      default: "Custom",
    },

    startingPrice: Number,

    hourlyRate: {
      min: Number,
      max: Number,
    },

    subscriptionPlans: [
      {
        name: String,
        price: Number,
        currency: String,
        billingCycle: String,
        features: [String],
        limits: {
          users: Number,
          bandwidth: String,
          storage: String,
          apiCalls: Number,
        },
        recommended: Boolean,
      },
    ],

    enterprisePackage: {
      minUsers: Number,
      maxUsers: Number,
      customFeatures: [String],
      dedicatedTeam: Boolean,
    },

    addons: [
      {
        name: String,
        price: Number,
        description: String,
      },
    ],

    discountAvailable: {
      type: Boolean,
      default: false,
    },

    // =============================
    // EXECUTION DETAILS
    // =============================

    duration: String,
    estimatedLaunch: String,

    roadmap: [
      {
        month: String,
        goal: String,
      },
    ],

    milestones: [
      {
        name: String,
        deadline: String,
        deliverable: String,
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Completed"],
        },
      },
    ],

    modules: [
      {
        name: String,
        description: String,
        features: [String],
        dependencies: [String],
      },
    ],

    dependencies: [String],
    riskFactors: [String],
    assumptions: [String],

    // =============================
    // TECH STACK
    // =============================

    techStack: {
      frontend: [String],
      backend: [String],
      mobile: [String],
      database: [String],
      ai: [String],
      iot: [String],
      blockchain: [String],
      devops: [String],
      cloud: [String],
      cms: [String],
      crm: [String],
    },

    tools: [String],
    libraries: [String],
    frameworks: [String],

    apisUsed: [String],
    thirdPartyServices: [String],
    integrations: [String],

    // =============================
    // TEAM & SKILLS
    // =============================

    requiredSkills: [String],

    teamStructure: [
      {
        role: String, // e.g Project Manager
        count: Number,
      },
    ],

    experienceLevel: {
      type: String,
      enum: ["Junior", "Mid", "Senior", "Expert", "Hybrid"],
    },

    // =============================
    // TARGETING
    // =============================

    industries: [String],
    targetAudience: [String],
    idealCompanySize: [String], // Startup, SME, Enterprise
    userPersonas: [String],
    regions: [String],
    supportedLanguages: [String],

    useCases: [String],
    realWorldApplications: [String],

    // =============================
    // PERFORMANCE & KPI
    // =============================

    expectedResults: [String],
    performanceMetrics: [String],
    kpis: [
      {
        name: String,
        goal: String,
      },
    ],

    analyticsTools: [String],

    // =============================
    // SECURITY & COMPLIANCE
    // =============================

    compliance: [String],
    standards: [String],
    certificates: [String],
    dataProtection: [String],
    encryption: [String],
    authenticationMethods: [String],

    // =============================
    // SUPPORT & TRAINING
    // =============================

    supportLevel: {
      type: String,
      enum: ["Email", "Chat", "Phone", "Dedicated Manager", "24/7"],
    },

    supportHours: String,

    sla: {
      responseTime: String,
      resolutionTime: String,
      uptimeGuarantee: String,
    },

    onboardingProcess: [String],
    trainingFormat: [String], // video / docs / live

    documentationIncluded: Boolean,
    trainingIncluded: Boolean,

    // =============================
    // LEGAL & CONTRACT
    // =============================

    ndaRequired: Boolean,
    contractTemplateUrl: String,
    refundPolicy: String,
    paymentTerms: String,
    intellectualPropertyOwnership: String,

    // =============================
    // TRUST & AUTHORITY
    // =============================

    testimonials: [
      {
        name: String,
        company: String,
        image: String,
        message: String,
        rating: Number,
        country: String,
      },
    ],

    caseStudies: [
      {
        title: String,
        slug: String,
        industry: String,
        problem: String,
        solution: String,
        result: String,
        duration: String,
        tools: [String],
        image: String,
      },
    ],

    partners: [String],
    clients: [String],

    awards: [String],
    recognition: [String],

    // =============================
    // FAQ & CONTENT
    // =============================

    faqs: [
      {
        question: String,
        answer: String,
      },
    ],

    resources: [
      {
        title: String,
        url: String,
        type: String, // whitepaper, blog, pdf, video
      },
    ],

    blogs: [String],
    whitepapers: [String],

    // =============================
    // SEO
    // =============================

    seo: {
      metaTitle: String,
      metaDescription: String,
      canonicalUrl: String,
      ogTitle: String,
      ogDescription: String,
      ogImage: String,
      twitterCard: String,
    },

    // =============================
    // VERSIONING
    // =============================

    version: {
      type: String,
      default: "1.0",
    },

    lastUpdatedBy: String,
    changelog: [
      {
        version: String,
        changes: [String],
        date: Date,
      },
    ],

    // =============================
    // STATUS
    // =============================

    isActive: {
      type: Boolean,
      default: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);

export default Service;
