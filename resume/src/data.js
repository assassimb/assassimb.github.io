/* =====================================================================
   Bilingual resume data
   Every user-facing string is { fr, en }. FR is sourced from the resume;
   EN is translated. Detail-view prose (overview / highlights) is authored
   to enrich the original bullet points.
   ===================================================================== */
export const RESUME = {
  /* PRIVACY NOTE: this file is compiled into the public JS bundle and is
     readable by anyone who opens devtools. Surname and home city are
     deliberately withheld here rather than merely hidden by CSS, because
     hiding is not removing. Keep it that way. */
  person: {
    name: "Assim B.",
    title: { fr: "Développeur full-stack", en: "Full-stack developer" },
    initials: "AB",
    email: "assassimb@gmail.com",
    location: { fr: "Québec, Canada", en: "Québec, Canada" },
    tagline: {
      fr: "Développeur full-stack depuis près de 3 ans sur un DME SaaS utilisé par 250 établissements de santé et 7 700 utilisateurs : interfaces TypeScript (Angular, React), microservices Spring Boot et API REST, événements Kafka, CI/CD et développement assisté par l'IA (Claude Code).",
      en: "Full-stack developer with nearly 3 years on a SaaS EMR used by 250 healthcare institutions and 7,700 users: TypeScript front-ends (Angular, React), Spring Boot microservices and RESTful APIs, Kafka events, CI/CD, and AI-assisted development with Claude Code."
    }
  },

  ui: {
    sections: {
      experience: { fr: "Expériences professionnelles", en: "Professional experience" },
      university: { fr: "Implications universitaires", en: "University involvement" },
      education:  { fr: "Formation", en: "Education" },
      skills:     { fr: "Compétences", en: "Strengths" },
      knowledge:  { fr: "Connaissances", en: "Technical knowledge" },
      interests:  { fr: "Intérêts et loisirs", en: "Interests & hobbies" }
    },
    /* Short mono labels: the top bar and section eyebrows. Kept to one word
       so the nav never wraps. */
    short: {
      experience: { fr: "exp", en: "exp" },
      university: { fr: "projets", en: "projects" },
      education:  { fr: "formation", en: "education" },
      skills:     { fr: "forces", en: "strengths" },
      knowledge:  { fr: "stack", en: "stack" },
      interests:  { fr: "loisirs", en: "hobbies" }
    },
    counts: {
      experience: { fr: "postes", en: "roles" },
      university: { fr: "projets", en: "projects" },
      now:        { fr: "aujourd'hui", en: "today" },
      present:    { fr: "présent", en: "present" },
      year:       { fr: ["an", "ans"], en: ["yr", "yrs"] },
      month:      { fr: ["mois", "mois"], en: ["mo", "mos"] }
    },
    detail: {
      overview:       { fr: "Aperçu", en: "Overview" },
      responsibilities:{ fr: "Responsabilités clés", en: "Key responsibilities" },
      stack:          { fr: "Technologies", en: "Tech stack" },
      impact:         { fr: "Faits saillants", en: "Highlights & impact" },
      open:           { fr: "Voir le détail", en: "View details" },
      close:          { fr: "Fermer", en: "Close" },
      prev:           { fr: "Précédent", en: "Previous" },
      next:           { fr: "Suivant", en: "Next" }
    },
    langLabel: { fr: "FR", en: "EN" },
    languages: { fr: "Langages", en: "Languages" },
    tools: { fr: "Outils logiciels", en: "Software tools" },
    exportLabel: { fr: "PDF", en: "PDF" },
    exportHint: {
      fr: "Exporter un CV de deux pages : choisir « Enregistrer au format PDF » comme destination",
      en: "Export a two-page résumé: choose “Save as PDF” as the destination"
    }
  },

  education: [
    {
      period: "2020 – 2024",
      degree: { fr: "Baccalauréat en génie informatique", en: "Bachelor's in computer engineering" },
      school: { fr: "Université de Sherbrooke", en: "Université de Sherbrooke" }
    },
    {
      period: "2016 – 2019",
      degree: { fr: "Diplôme collégial en science de la nature", en: "College diploma in natural sciences" },
      school: { fr: "Collège Champlain", en: "Collège Champlain" }
    }
  ],

  experience: [
    {
      id: "omnimed",
      org: "Omnimed",
      orgInitial: "O",
      role: { fr: "Développeur full-stack", en: "Full-stack developer" },
      period: { fr: "01/2024 – Présent", en: "01/2024 – Present" },
      location: { fr: "Québec, Canada (Hybride)", en: "Québec, Canada (Hybrid)" },
      type: { fr: "Emploi", en: "Employment" },
      /* The PDF prints every responsibility, in authored order, and skips
         `impact`: the impact list restates the PAX and feature-flag bullets,
         and the scorer picked different subsets per language. The
         transaction-volume figure lives in the PAX bullet instead.
         See `printImpact` in condense.js. */
      printImpact: false,
      summary: {
        fr: "Facturation, paiements et préautorisation des rendez-vous d'un DME SaaS : microservices Spring Boot, API REST, événements Kafka, interfaces Angular/TypeScript et terminaux de paiement déployés dans 12+ cliniques, traitant des millions de dollars par année.",
        en: "Billing, payments and appointment pre-authorization in a SaaS EMR: Spring Boot microservices, REST APIs, Kafka events, Angular/TypeScript front-ends and payment terminals rolled out to 12+ clinics, processing millions of dollars a year."
      },
      stack: [
        "TypeScript",
        "Angular",
        "Java",
        "Spring Boot",
        { fr: "API REST", en: "REST APIs" },
        { fr: "Microservices", en: "Microservices" },
        "Kafka",
        "Kubernetes",
        "CI/CD",
        "Claude Code",
        { fr: "Terminaux PAX", en: "PAX terminals" },
        "Feature flags",
        { fr: "Tests unitaires & e2e", en: "Unit & e2e tests" }
      ],
      overview: {
        fr: "Au sein de l'équipe facturation d'Omnimed, j'ai travaillé sur l'écosystème de paiement d'un dossier médical électronique SaaS utilisé par des cliniques. Le travail couvre toute la chaîne, des microservices Java/Spring Boot et leurs API REST au front-end Angular/TypeScript, dans une architecture où les services communiquent par événements Kafka et sont déployés sur Kubernetes par des pipelines CI/CD. Le résultat : plus de 12 cliniques encaissent de façon fiable et conforme, avec des transactions qui totalisent plusieurs millions de dollars par année, le tout en faisant évoluer une logique de facturation héritée sans interrompre le service.",
        en: "Within Omnimed's billing team, I worked on the payment ecosystem of a SaaS electronic medical record used by clinics. The work spans the full chain, from Java/Spring Boot microservices and their REST APIs to the Angular/TypeScript front-end, in an architecture where services communicate through Kafka events and are deployed on Kubernetes through CI/CD pipelines. The result: 12+ clinics collect payments reliably and compliantly, with transactions adding up to millions of dollars a year, all while evolving legacy billing logic without disrupting service."
      },
      responsibilities: {
        fr: [
          "Développer des interfaces Angular et TypeScript réactives pour la facturation, les paiements et les préautorisations d'un DME SaaS utilisé par 250 établissements de santé et 7 700 utilisateurs.",
          "Concevoir et développer des points de terminaison d'API REST dans des microservices Spring Boot (transactions en ligne, intégrations de paiement, factures, rapports, webhooks du fournisseur de paiement), avec contrats OpenAPI.",
          "Développer les paiements liés à l'agenda (18 900 rendez-vous par jour) : capture des retenues de carte prises à la réservation en ligne, association au rendez-vous du patient, libération automatique si le rendez-vous est annulé.",
          "Développer des producteurs et consommateurs Kafka pour que la facturation réagisse en quasi temps réel aux événements de rendez-vous et de transaction entre microservices.",
          "Intégrer les terminaux de paiement PAX et les paiements en ligne Nuvei au DME, avec champs de carte conformes PCI et gestion des erreurs de la passerelle ; ces paiements totalisent des millions de dollars par année.",
          "Piloter le déploiement des terminaux dans 12+ cliniques depuis la première : configuration, installations sur site (jusqu'à 4 terminaux), coordination avec le fournisseur, documentation ; contact technique principal des incidents de paiement en production.",
          "Livrer par des pipelines CI/CD Jenkins (tests unitaires, d'intégration et e2e, analyse SonarQube) vers Kubernetes avec l'infrastructure as code de l'équipe (Kustomize, skaffold) ; stabiliser les tests e2e instables et ajouter de la couverture de tests.",
          "Aider à migrer l'API de facturation vers Spring Boot 3, refactoriser la logique de facturation héritée, implémenter un modèle de prépaiement par lots et des feature flags pour des déploiements progressifs.",
          "Créer des skills et plugins Claude Code utilisés par mon équipe (flux de développement, Jira et documentation, analyse de logs, vidéos QA) et former mes collègues au développement assisté par l'IA générative.",
          "Intégrer et accompagner un nouveau développeur, et réviser régulièrement les pull requests de l'équipe."
        ],
        en: [
          "Built responsive Angular and TypeScript interfaces for invoicing, payments and pre-authorizations in a SaaS EMR used by 250 healthcare institutions and 7,700 users.",
          "Designed and built RESTful API endpoints in Spring Boot microservices (online transactions, payment integrations, invoices, reports, payment-provider webhooks), with OpenAPI contracts.",
          "Built payments tied to appointment scheduling (18,900 appointments a day): capturing card holds taken at online booking, tying them to the patient's appointment, releasing them when it is cancelled.",
          "Built Kafka producers and consumers so billing reacts in near real time to appointment and transaction events across microservices.",
          "Integrated PAX payment terminals and Nuvei online payments into the EMR, with PCI-compliant card fields and gateway error handling; these payments now add up to millions of dollars a year.",
          "Led the terminal rollout in 12+ clinics from the very first one: setup, on-site installs of up to 4 terminals, provider coordination and support docs; main technical contact for production payment incidents.",
          "Shipped through Jenkins CI/CD pipelines (unit, integration and e2e tests, SonarQube gates) to Kubernetes using the team's infrastructure as code (Kustomize, skaffold); stabilized flaky e2e tests and added coverage.",
          "Helped migrate the billing API to Spring Boot 3, refactored legacy billing logic, and implemented a bundle prepayment model and feature flags for progressive rollouts.",
          "Built Claude Code skills and plugins my team uses (dev workflows, Jira and docs, log analysis, QA videos) and coached teammates on AI-assisted development with GenAI tools.",
          "Onboarded and mentored a new developer and regularly reviewed the team's pull requests."
        ]
      },
      impact: {
        fr: [
          "Paiement sans fil en cliniques rendu possible directement dans le DME via les terminaux PAX, avec des transactions totalisant plusieurs millions de dollars par année.",
          "Impliqué depuis la toute première intégration de clinique : plus d'une douzaine de cliniques onboardées sur les terminaux, dont des déploiements multi-terminaux sur site.",
          "Paiements en ligne conformes PCI livrés avec une gestion robuste des erreurs de passerelle.",
          "Déploiements progressifs maîtrisés grâce aux feature flags, limitant les risques pour les clients."
        ],
        en: [
          "Enabled wireless in-clinic payments directly inside the EMR through PAX terminals, processing transactions adding up to millions of dollars a year.",
          "Involved since the very first clinic integration: onboarded a dozen-plus clinics onto the terminals, including on-site multi-terminal deployments.",
          "Delivered PCI-compliant online payments with robust gateway-error handling.",
          "Controlled, progressive rollouts via feature flags, limiting risk for clients."
        ]
      }
    },
    {
      id: "goto",
      org: "GoTo",
      orgInitial: "G",
      role: { fr: "Développeur front-end", en: "Front-end developer" },
      period: "07/2022 – 08/2023",
      location: { fr: "Québec, Canada (Télétravail)", en: "Québec, Canada (Remote)" },
      type: { fr: "Stage", en: "Internship" },
      /* Front-end only: no back-end or AWS work, so neither is claimed here.
         The React + TypeScript bullet reads as a stack list to the scorer and
         loses; it is the keyword this role exists to show. */
      pinned: ["React et TypeScript", "React and TypeScript", "Robot Framework"],
      summary: {
        fr: "Interfaces React et TypeScript pour une entreprise SaaS, avec une forte culture de tests.",
        en: "React and TypeScript interfaces at a SaaS company, with a strong testing culture."
      },
      stack: ["React", "TypeScript", "JavaScript", { fr: "API REST", en: "REST APIs" }, "Jest", "Robot Framework", "JIRA"],
      overview: {
        fr: "Chez GoTo, entreprise SaaS au rythme soutenu, j'étais développeur front-end : je développais des interfaces conviviales en React et TypeScript, branchées sur les API REST du back-end, dans une culture de qualité forte où chaque fonctionnalité était couverte par des tests unitaires et de bout en bout.",
        en: "At GoTo, a fast-paced SaaS company, I was a front-end developer: I built user-friendly interfaces in React and TypeScript on top of the back-end's REST APIs, in a strong quality culture where every feature was covered by unit and end-to-end tests."
      },
      responsibilities: {
        fr: [
          "Développer des interfaces utilisateur réactives et évolutives avec React et TypeScript, qui consomment les API REST du back-end.",
          "Couvrir les fonctionnalités de tests unitaires et de bout en bout (Jest, Robot Framework).",
          "Livrer en sprints agiles avec suivi dans JIRA."
        ],
        en: [
          "Built responsive, scalable user interfaces with React and TypeScript, consuming the back-end's REST APIs.",
          "Covered features with unit and end-to-end tests (Jest, Robot Framework).",
          "Delivered in agile sprints tracked in JIRA."
        ]
      },
      impact: {
        fr: [
          "Fonctionnalités React livrées avec une couverture de tests unitaires et de bout en bout."
        ],
        en: [
          "React features delivered with unit and end-to-end test coverage."
        ]
      }
    },
    {
      id: "decathlon",
      org: "Décathlon Canada",
      orgInitial: "D",
      role: { fr: "Développeur web full stack et intelligence artificielle", en: "Full-stack web & artificial intelligence developer" },
      period: "01/2022 – 05/2022",
      location: { fr: "Québec, Canada", en: "Québec, Canada" },
      type: { fr: "Stage", en: "Internship" },
      summary: {
        fr: "Application web de recommandation de tailles de vêtements à partir de deux photos, par vision par ordinateur.",
        en: "Web app that recommends clothing sizes from two photos using computer vision."
      },
      pinned: ["VueJS", "modèle d'intelligence artificielle", "Applied an AI model", "4 mois", "4 months"],
      stack: ["VueJS", "Python", { fr: "Vision par ordinateur", en: "Computer vision" }, { fr: "Détection de pose", en: "Pose detection" }, "REST API", "Node.js"],
      overview: {
        fr: "Au sein de l'équipe d'intelligence artificielle de Décathlon Canada, j'ai conçu une application web permettant de recommander la bonne taille de vêtement à un client à partir de deux simples photos. Le défi : transformer des images prises à la maison en mesures corporelles fiables, sans matériel spécialisé, tout en gardant une expérience client claire et rapide.",
        en: "Within Décathlon Canada's AI team, I built a web app that recommends the right clothing size to a customer from just two photos. The challenge: turn images taken at home into reliable body measurements with no specialized equipment, while keeping the customer experience clear and fast."
      },
      responsibilities: {
        fr: [
          "Concevoir une application web qui recommande des tailles de vêtements à partir de deux photos soumises par le client.",
          "Programmer une interface web simple et guidée à l'aide de VueJS.",
          "Segmenter le corps détecté sur les photos soumises.",
          "Appliquer un modèle d'intelligence artificielle pour détecter les points clés du corps humain.",
          "Créer un lien interactif entre le front-end et le back-end pour mesurer la poitrine, les hanches et l'abdomen.",
          "Programmer un système d'estimation de la circonférence du corps humain en Python.",
          "Présenter la solution à l'équipe d'intelligence artificielle de Décathlon Canada."
        ],
        en: [
          "Designed a web app that recommends clothing sizes from two customer-submitted photos.",
          "Built a simple, guided web interface with VueJS.",
          "Segmented the detected body from the submitted photos.",
          "Applied an AI model to detect the key landmarks of the human body.",
          "Wired an interactive bridge between front-end and back-end to measure chest, hips and waist.",
          "Programmed a human-body circumference estimation system in Python.",
          "Presented the solution to Décathlon Canada's AI team."
        ]
      },
      impact: {
        fr: [
          "Pipeline complet photo → segmentation → points clés → mesure livré en moins de 4 mois.",
          "Démonstration finale présentée à l'équipe d'IA et retenue comme preuve de concept.",
          "Réduction du besoin de mesures manuelles pour l'achat en ligne."
        ],
        en: [
          "Complete photo → segmentation → landmarks → measurement pipeline delivered in under 4 months.",
          "Final demo presented to the AI team and kept as a proof of concept.",
          "Reduced the need for manual measurements when shopping online."
        ]
      }
    },
    {
      id: "onship",
      org: "Onship",
      orgInitial: "O",
      role: { fr: "Développeur PHP full stack", en: "Full-stack PHP developer" },
      period: "05/2021 – 08/2021",
      location: { fr: "Télétravail", en: "Remote" },
      type: { fr: "Stage", en: "Internship" },
      pinned: ["MVC", "Bulma", "Traiter les webhooks", "Processed webhooks"],
      summary: {
        fr: "Nouvelles fonctionnalités web pour une start-up de livraison, en PHP / CodeIgniter avec gestion de paiements par webhook.",
        en: "New web features for a delivery start-up in PHP / CodeIgniter, including webhook-driven payments."
      },
      stack: ["PHP", "CodeIgniter", "SQL", "JavaScript", "Bulma", "phpMyAdmin", "Webhooks"],
      overview: {
        fr: "Pour une jeune start-up de livraison, j'ai ajouté des fonctionnalités web de bout en bout : de la base de données jusqu'à l'interface. Le travail demandait de respecter une architecture MVC propre et les standards visuels de la compagnie, tout en intégrant des paiements d'abonnement gérés par un tiers via des webhooks.",
        en: "For a young delivery start-up, I added end-to-end web features, from the database to the interface. The work meant respecting a clean MVC architecture and the company's visual standards while integrating third-party subscription payments through webhooks."
      },
      responsibilities: {
        fr: [
          "Ajouter des fonctionnalités web pour une start-up de livraison.",
          "Programmer en PHP, SQL, HTML et JavaScript.",
          "Suivre un modèle de conception MVC avec CodeIgniter afin d'assurer un code de qualité reliant chaque sphère ensemble.",
          "Utiliser le framework CSS Bulma pour créer des pages esthétiquement agréables et conformes aux standards de la compagnie.",
          "Utiliser des fonctions API avec des callbacks pour gérer les différentes actions front-end.",
          "Traiter les webhooks envoyés par un tiers afin de gérer les différents cas de paiement d'abonnement.",
          "Vérifier l'exactitude des données sauvegardées et gérer les tables avec phpMyAdmin."
        ],
        en: [
          "Added web features for a delivery start-up.",
          "Programmed in PHP, SQL, HTML and JavaScript.",
          "Followed an MVC design pattern with CodeIgniter to keep quality code linking every layer together.",
          "Used the Bulma CSS framework to build clean pages matching the company's standards.",
          "Used API functions with callbacks to handle the various front-end actions.",
          "Processed webhooks sent by a third party to handle subscription payment cases.",
          "Verified saved-data accuracy and managed tables with phpMyAdmin."
        ]
      },
      impact: {
        fr: [
          "Intégration de paiements d'abonnement robuste face aux multiples cas de webhook.",
          "Pages conformes à la charte visuelle de la start-up dès la première itération.",
          "Code structuré en MVC, facilitant la reprise par l'équipe en place."
        ],
        en: [
          "Subscription-payment integration robust against the many webhook cases.",
          "Pages matched the start-up's visual identity from the first iteration.",
          "MVC-structured code, easy for the in-house team to pick up."
        ]
      }
    },
    {
      id: "veo",
      org: "Université de Sherbrooke",
      orgInitial: "U",
      role: { fr: "Développeur PHP (Projet Véo)", en: "PHP developer (Véo project)" },
      period: "08/2020 – 12/2020",
      location: { fr: "Québec, Canada", en: "Québec, Canada" },
      type: { fr: "Stage", en: "Internship" },
      /* This entry prints few bullets under the PDF presets; pin the
         one that describes the work rather than the toolchain. See condense.js. */
      pinned: ["comportement natif de SuiteCRM", "Modified SuiteCRM's native behaviour", "UX/UI", "dépôt GitLab", "GitLab repository"],
      summary: {
        fr: "Résolution d'irritants de navigation sur un progiciel CRM (SuiteCRM) pour l'administration des dossiers étudiants.",
        en: "Fixing navigation pain points on a CRM platform (SuiteCRM) for student-record administration."
      },
      stack: ["PHP", "Smarty", "SuiteCRM", "JavaScript", "CSS", "Docker", "GitLab", "JIRA"],
      overview: {
        fr: "Dans le cadre du projet Véo de l'Université de Sherbrooke, j'ai travaillé sur l'amélioration d'un progiciel CRM utilisé pour l'administration des dossiers étudiants. L'objectif était de réduire les irritants de navigation et d'adapter le comportement natif de SuiteCRM aux besoins réels du personnel, le tout en méthode agile avec suivi quotidien.",
        en: "As part of Université de Sherbrooke's Véo project, I worked on improving a CRM platform used to administer student records. The goal was to reduce navigation pain points and adapt SuiteCRM's native behaviour to the staff's real needs, all in an agile workflow with daily follow-ups."
      },
      responsibilities: {
        fr: [
          "Résoudre des irritants de navigation lors de l'utilisation d'un progiciel CRM en page web.",
          "Programmer en PHP, Smarty et JavaScript.",
          "Modifier le comportement natif de SuiteCRM pour favoriser l'administration des dossiers étudiants.",
          "Mettre en place une vue UX/UI adéquate aux exigences des sites de l'UdeS avec du CSS.",
          "Utiliser un environnement de développement sur Docker et un dépôt GitLab.",
          "Développer en méthode agile avec des rencontres quotidiennes et traçabilité sur JIRA."
        ],
        en: [
          "Resolved navigation pain points when using a web-based CRM platform.",
          "Programmed in PHP, Smarty and JavaScript.",
          "Modified SuiteCRM's native behaviour to better support student-record administration.",
          "Built a UX/UI view matching the requirements of UdeS websites with CSS.",
          "Used a Docker development environment and a GitLab repository.",
          "Worked in an agile method with daily stand-ups and JIRA traceability."
        ]
      },
      impact: {
        fr: [
          "Navigation simplifiée pour le personnel administratif gérant les dossiers étudiants.",
          "Personnalisations SuiteCRM alignées sur la charte des sites de l'UdeS.",
          "Livraisons régulières grâce à un cycle agile et un environnement Docker reproductible."
        ],
        en: [
          "Simpler navigation for the administrative staff managing student records.",
          "SuiteCRM customizations aligned with the UdeS website guidelines.",
          "Steady deliveries thanks to an agile cycle and a reproducible Docker environment."
        ]
      }
    },
    {
      id: "sherweb",
      org: "Sherweb",
      orgInitial: "S",
      role: { fr: "Support technique Office 365", en: "Office 365 technical support" },
      period: "02/2019 – 08/2019",
      location: { fr: "Québec, Canada", en: "Québec, Canada" },
      type: { fr: "Emploi", en: "Employment" },
      summary: {
        fr: "Assistance téléphonique bilingue et résolution de problèmes liés à la suite Office 365 et à la migration Cloud.",
        en: "Bilingual phone support and troubleshooting for the Office 365 suite and Cloud migration."
      },
      stack: ["Office 365", "OneDrive", "SharePoint", { fr: "Migration Cloud", en: "Cloud migration" }, { fr: "Support bilingue", en: "Bilingual support" }],
      overview: {
        fr: "Premier rôle en contact direct avec la clientèle d'affaires : j'ai offert une assistance téléphonique bilingue aux clients professionnels de Microsoft Office 365. Au-delà du dépannage, le rôle consistait à enseigner aux usagers comment tirer le meilleur des outils Cloud, et à accompagner les migrations de serveurs.",
        en: "My first role in direct contact with business clients: I provided bilingual phone support to professional Microsoft Office 365 customers. Beyond troubleshooting, the role meant teaching users how to get the most out of the Cloud tools and supporting server migrations."
      },
      responsibilities: {
        fr: [
          "Offrir une assistance téléphonique et résoudre les problèmes liés aux fonctionnalités de la suite Office 365.",
          "Aider plus de 5 clients par jour ayant un abonnement professionnel à Microsoft Office, incluant l'assistance à la migration des serveurs Cloud.",
          "Informer et enseigner aux usagers la meilleure utilisation de la suite, notamment OneDrive et SharePoint.",
          "Supporter des compagnies anglophones et francophones en offrant un service adapté à leurs besoins."
        ],
        en: [
          "Provided phone support and resolved issues with the Office 365 suite's features.",
          "Helped more than 5 clients per day on professional Microsoft Office subscriptions, including Cloud server migration support.",
          "Informed and taught users the best use of the suite, notably OneDrive and SharePoint.",
          "Supported English- and French-speaking companies with service tailored to their needs."
        ]
      },
      impact: {
        fr: [
          "Plus de 5 dossiers clients résolus par jour, en français comme en anglais.",
          "Accompagnement de migrations Cloud sans perte de service pour les clients d'affaires.",
          "Vulgarisation d'outils Cloud auprès d'usagers de tous niveaux."
        ],
        en: [
          "More than 5 client cases resolved per day, in both French and English.",
          "Guided Cloud migrations with no service loss for business clients.",
          "Made Cloud tools approachable for users of all skill levels."
        ]
      }
    },
    {
      id: "sykes",
      org: "SYKES",
      orgInitial: "S",
      role: { fr: "Support technique de télécommunication mobile", en: "Mobile telecom technical support" },
      period: "2017 – 2018",
      location: { fr: "Québec, Canada", en: "Québec, Canada" },
      type: { fr: "Emploi", en: "Employment" },
      summary: {
        fr: "Assistance téléphonique pour le service mobile Chatr : dépannage et configuration des données mobiles.",
        en: "Phone support for the Chatr mobile service: troubleshooting and mobile-data configuration."
      },
      stack: [{ fr: "Dépannage", en: "Troubleshooting" }, { fr: "Service client", en: "Customer service" }, { fr: "Réseaux mobiles", en: "Mobile networks" }, "Chatr"],
      overview: {
        fr: "Mon entrée dans le monde du support technique : j'assistais par téléphone les clients du service téléphonique Chatr. Le rôle consistait à diagnostiquer rapidement les problèmes de connexion et à guider les usagers, pas toujours techniques, vers une solution simple et fonctionnelle.",
        en: "My entry into technical support: I assisted Chatr phone-service customers over the phone. The role meant quickly diagnosing connection problems and guiding users, not always technical, toward a simple, working solution."
      },
      responsibilities: {
        fr: [
          "Offrir une assistance téléphonique et résoudre les problèmes liés au fonctionnement du service téléphonique Chatr.",
          "Offrir de l'assistance technique de base aux clients Chatr.",
          "Régler les paramètres de connexion aux données mobiles."
        ],
        en: [
          "Provided phone support and resolved issues with the Chatr phone service.",
          "Offered basic technical assistance to Chatr customers.",
          "Configured mobile-data connection settings."
        ]
      },
      impact: {
        fr: [
          "Premier rôle développant la patience et la communication client.",
          "Résolution autonome des cas de configuration de données mobiles.",
          "Base solide en diagnostic de problèmes posée tôt dans le parcours."
        ],
        en: [
          "First role building patience and client communication.",
          "Independent resolution of mobile-data configuration cases.",
          "A solid problem-diagnosis foundation laid early in the journey."
        ]
      }
    }
  ],

  university: [
    {
      id: "voicegame",
      org: "Université de Sherbrooke",
      orgInitial: "U",
      role: { fr: "Jeu vidéo à interface graphique commandé par la voix (C++)", en: "Voice-controlled video game with GUI (C++)" },
      period: "01/2020 – 04/2020",
      location: { fr: "Équipe de 8 étudiants", en: "Team of 8 students" },
      type: { fr: "Projet d'équipe", en: "Team project" },
      summary: {
        fr: "Jeu vidéo tour par tour manipulé par la voix humaine, avec détection de phonèmes et liaison à une carte FPGA.",
        en: "Turn-based video game controlled by the human voice, with phoneme detection and FPGA linkage."
      },
      pinned: ["phonèmes distincts", "distinct phonemes", "carte FPGA", "FPGA board"],
      stack: ["C++", "QT", "FPGA", { fr: "Traitement du signal", en: "Signal processing" }, { fr: "Détection de phonèmes", en: "Phoneme detection" }],
      overview: {
        fr: "Avec une équipe de huit étudiants, nous avons conçu un jeu vidéo entièrement manipulé par la voix. Le cœur du projet était le traitement du signal : concevoir des filtres capables de distinguer des phonèmes prononcés par le joueur, puis traduire ces commandes vocales en actions dans un jeu tour par tour.",
        en: "With a team of eight students, we built a video game controlled entirely by voice. The heart of the project was signal processing: designing filters able to tell apart phonemes spoken by the player, then turning those voice commands into actions in a turn-based game."
      },
      responsibilities: {
        fr: [
          "Concevoir, en équipe de 8 étudiants, un jeu vidéo manipulé avec la voix humaine.",
          "Concevoir des filtres permettant de détecter des phonèmes distincts.",
          "Créer un jeu vidéo de type tour par tour avec de multiples personnages en C++.",
          "Programmer une interface graphique avec images pour le jeu vidéo avec QT.",
          "Relier le code à une carte FPGA."
        ],
        en: [
          "Designed, in a team of 8 students, a video game controlled by the human voice.",
          "Built filters to detect distinct phonemes.",
          "Created a turn-based video game with multiple characters in C++.",
          "Programmed a graphical, image-based interface for the game with QT.",
          "Linked the code to an FPGA board."
        ]
      },
      impact: {
        fr: [
          "Reconnaissance vocale fonctionnelle pilotant un jeu jouable de bout en bout.",
          "Coordination réussie d'une équipe de 8 sur logiciel et matériel.",
          "Pont concret entre traitement du signal, FPGA et interface graphique."
        ],
        en: [
          "Working voice recognition driving a fully playable game.",
          "Successful coordination of a team of 8 across software and hardware.",
          "A concrete bridge between signal processing, FPGA and GUI."
        ]
      }
    },
    {
      id: "snowrobot",
      org: "Université de Sherbrooke",
      orgInitial: "U",
      role: { fr: "Robot déneigeur automatique", en: "Autonomous snow-clearing robot" },
      period: "08/2019 – 01/2020",
      location: { fr: "Équipe de 8 étudiants", en: "Team of 8 students" },
      type: { fr: "Projet d'équipe", en: "Team project" },
      summary: {
        fr: "Automobile miniature autonome de déneigement à capteurs de proximité, contrôle PID et pièces 3D conçues en SOLIDWORKS.",
        en: "Autonomous miniature snow-clearing car with proximity sensors, PID control and 3D parts designed in SOLIDWORKS."
      },
      pinned: ["PID pour", "PID controller for", "SOLIDWORKS."],
      stack: ["ArduinoX", "C", { fr: "Contrôle PID", en: "PID control" }, "SOLIDWORKS", { fr: "Capteurs", en: "Sensors" }],
      overview: {
        fr: "Projet mêlant logiciel, électronique et mécanique : une équipe de huit étudiants a conçu une automobile miniature capable de déneiger de façon autonome. Le robot lisait son environnement grâce à des capteurs de proximité et se déplaçait avec précision grâce à un contrôleur PID, le tout sur un châssis et une pelle modélisés en 3D.",
        en: "A project blending software, electronics and mechanics: a team of eight students built a miniature car able to clear snow autonomously. The robot read its surroundings with proximity sensors and moved precisely thanks to a PID controller, all on a chassis and plow modeled in 3D."
      },
      responsibilities: {
        fr: [
          "Concevoir, en équipe de 8 étudiants, un système de déneigement sur automobile miniature à capteurs de proximité.",
          "Programmer, avec une carte ArduinoX, des réactions face aux valeurs analogiques des capteurs de distance.",
          "Programmer le mouvement du robot avec un PID pour un déplacement de haute précision et autonome.",
          "Concevoir les composants physiques 3D de la pelle mécanique et du corps du robot avec SOLIDWORKS."
        ],
        en: [
          "Designed, in a team of 8 students, a snow-clearing system on a miniature car with proximity sensors.",
          "Programmed, with an ArduinoX board, reactions to the distance sensors' analog values.",
          "Programmed the robot's motion with a PID controller for precise, autonomous movement.",
          "Designed the 3D physical parts of the plow and the robot body with SOLIDWORKS."
        ]
      },
      impact: {
        fr: [
          "Déplacement autonome et précis grâce à un réglage PID soigné.",
          "Châssis et pelle entièrement modélisés en 3D, prêts pour la fabrication.",
          "Intégration réussie de l'électronique, du logiciel et de la mécanique."
        ],
        en: [
          "Autonomous, precise movement thanks to careful PID tuning.",
          "Fully 3D-modeled chassis and plow, ready for fabrication.",
          "Successful integration of electronics, software and mechanics."
        ]
      }
    }
  ],

  knowledge: {
    /* The PDF prints these grouped runs instead of the two flat lists below,
       which the site still uses. Grouped so a recruiter's keyword pass lands
       on the right line. */
    groups: [
      { label: { fr: "Langages", en: "Languages" }, items: ["Java", "TypeScript", "JavaScript", "SQL", "Python", "PHP", "C", "C#"] },
      { label: { fr: "Front-end", en: "Frontend" }, items: ["Angular", "React", "VueJS", "RxJS / NGXS", "HTML / CSS"] },
      { label: { fr: "Back-end et API", en: "Backend & APIs" }, items: ["Spring Boot", "REST / OpenAPI", "Kafka", "Hibernate", "PostgreSQL", "Node.js / npm", "Webhooks"] },
      { label: { fr: "Cloud et DevOps", en: "Cloud & DevOps" }, items: ["Kubernetes", "Docker", "Kustomize", "skaffold", "Jenkins CI/CD", "GitHub Actions", "SonarQube", "Datadog", "Nx", "Maven", "Git", "Linux"] },
      { label: { fr: "Tests", en: "Testing" }, items: ["JUnit / Mockito", "Jest", "Cucumber", "Robot Framework"] },
      { label: { fr: "Outils d'IA", en: "AI tools" }, items: ["Claude Code (skills, plugins)", { fr: "développement assisté par l'IA générative", en: "GenAI-assisted development" }] }
    ],
    languages: ["Java", "TypeScript", "JavaScript", "SQL", "Python", "C#", "C", "PHP", "Angular", "React", "VueJS", "MATLAB", "FPGA", "UML"],
    tools: ["Spring Boot", "REST / OpenAPI", "Kafka", "Kubernetes", "Kustomize", "skaffold", "Docker", "Claude Code", "Jenkins", "GitHub Actions", "SonarQube", "Node.js / npm", "Nx", "Maven", "Git", "Jest", "Robot Framework", "Datadog", "JIRA", "PostgreSQL / pgAdmin4", "Linux", "IntelliJ", "VS Code", "SOLIDWORKS", "Altium"]
  },

  skills: [
    {
      icon: "lightbulb",
      title: { fr: "Résolution de problèmes", en: "Problem solving" },
      body: { fr: "Capable d'assister des équipes en crise grâce à une trousse d'expérience vaste, au niveau scolaire comme professionnel.", en: "Able to support teams in crisis thanks to a broad toolkit built across both academic and professional settings." }
    },
    {
      icon: "bolt",
      title: { fr: "Adaptation rapide", en: "Fast adaptation" },
      body: { fr: "Capacité d'apprentissage efficace sur le long terme, nécessitant un temps minimal de mise à niveau.", en: "Effective long-term learning ability that needs minimal ramp-up time." }
    },
    {
      icon: "groups",
      title: { fr: "Joueur d'équipe", en: "Team player" },
      body: { fr: "Contribution active à l'avancement des projets et propositions de solutions efficaces.", en: "Active contributor to project progress who proposes effective solutions." }
    },
    {
      icon: "target",
      title: { fr: "Orientation résultats", en: "Results-driven" },
      body: { fr: "Définition de tâches pour atteindre des objectifs concrets, mesurables et vérifiables selon le progrès du projet.", en: "Defines tasks to reach concrete, measurable and verifiable goals tracked against project progress." }
    }
  ],

  interests: [
    {
      icon: "sports_esports",
      title: { fr: "Jeux vidéos", en: "Video games" },
      body: { fr: "J'aime les jeux vidéos compétitifs pour le sentiment de progression et d'apprentissage qu'ils simulent. Mon favori est League of Legends, mais j'apprécie tous les types de jeux.", en: "I love competitive video games for the feeling of progress and learning they simulate. My favourite is League of Legends, but I enjoy every kind of game." }
    },
    {
      icon: "menu_book",
      title: { fr: "Anime et mangas", en: "Anime & manga" },
      body: { fr: "Je lis des mangas de tous les genres dès que j'ai du temps libre, et regarder des animes avec mes amis est un de mes passe-temps préférés.", en: "I read manga of every genre whenever I have free time, and watching anime with friends is one of my favourite pastimes." }
    },
    {
      icon: "piano",
      title: { fr: "Musique", en: "Music" },
      body: { fr: "Jouer du piano est un de mes loisirs récents, un défi que je me suis donné en parallèle de mes apprentissages scolaires.", en: "Playing piano is a recent hobby, a challenge I set for myself alongside my studies." }
    }
  ]
};
