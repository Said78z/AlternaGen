import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const agriTemplate = {
  nicheKey: 'agri-tpe-pme',
  title: 'Audit Express Agricole',
  description: 'Audit de maturité numérique et opérationnelle pour exploitations agricoles TPE/PME.',
  calendlyUrl: process.env.CALENDLY_URL || 'https://calendly.com/audit-express/30min',
  questions: [
    // Digital (40 pts) - questions 1-5
    { id: 'q1', category: 'digital', text: 'Utilisez-vous un logiciel de gestion agricole (ERP/CRM dédié) ?', weight: 8, options: [{ value: 0, label: 'Non' }, { value: 4, label: 'Partiellement (Excel/tableaux)' }, { value: 8, label: 'Oui, logiciel dédié' }] },
    { id: 'q2', category: 'digital', text: 'Avez-vous un site web ou une présence en ligne active ?', weight: 8, options: [{ value: 0, label: 'Non' }, { value: 4, label: 'Site vitrine basique' }, { value: 8, label: 'Site avec vente en ligne / réseaux actifs' }] },
    { id: 'q3', category: 'digital', text: 'Utilisez-vous des outils numériques pour le suivi des cultures/élevages ?', weight: 8, options: [{ value: 0, label: 'Non, tout sur papier' }, { value: 4, label: 'Tableurs / applications mobiles basiques' }, { value: 8, label: 'Logiciel spécialisé / capteurs IoT' }] },
    { id: 'q4', category: 'digital', text: 'Disposez-vous d\'une connexion internet fiable sur l\'exploitation ?', weight: 8, options: [{ value: 0, label: 'Non / très limitée' }, { value: 4, label: 'Oui mais lente' }, { value: 8, label: 'Oui, haut débit' }] },
    { id: 'q5', category: 'digital', text: 'Utilisez-vous des outils de facturation / comptabilité numérique ?', weight: 8, options: [{ value: 0, label: 'Non, tout papier' }, { value: 4, label: 'Tableur / outil basique' }, { value: 8, label: 'Logiciel comptable professionnel' }] },
    // Operations (30 pts) - questions 6-9
    { id: 'q6', category: 'ops', text: 'Avez-vous des processus documentés pour les opérations clés de l\'exploitation ?', weight: 8, options: [{ value: 0, label: 'Non' }, { value: 4, label: 'Partiellement' }, { value: 8, label: 'Oui, procédures écrites' }] },
    { id: 'q7', category: 'ops', text: 'Comment gérez-vous vos stocks et approvisionnements ?', weight: 7, options: [{ value: 0, label: 'De mémoire / intuitif' }, { value: 3, label: 'Tableur basique' }, { value: 7, label: 'Logiciel de gestion des stocks' }] },
    { id: 'q8', category: 'ops', text: 'Disposez-vous d\'indicateurs de performance (KPIs) pour votre exploitation ?', weight: 8, options: [{ value: 0, label: 'Non' }, { value: 4, label: 'Quelques indicateurs informels' }, { value: 8, label: 'Tableau de bord structuré' }] },
    { id: 'q9', category: 'ops', text: 'Comment évaluez-vous votre niveau de mécanisation / automatisation ?', weight: 7, options: [{ value: 0, label: 'Très manuel' }, { value: 3, label: 'Partiellement mécanisé' }, { value: 7, label: 'Fortement mécanisé / automatisé' }] },
    // Sales (30 pts) - questions 10-12
    { id: 'q10', category: 'sales', text: 'Comment commercialisez-vous vos produits ?', weight: 10, options: [{ value: 0, label: 'Un seul canal (ex: coopérative uniquement)' }, { value: 5, label: '2 canaux de vente' }, { value: 10, label: '3+ canaux (direct, vente en ligne, marchés...)' }] },
    { id: 'q11', category: 'sales', text: 'Disposez-vous d\'un fichier client et d\'un suivi des ventes structuré ?', weight: 10, options: [{ value: 0, label: 'Non' }, { value: 5, label: 'Liste basique (Excel/papier)' }, { value: 10, label: 'CRM ou outil dédié' }] },
    { id: 'q12', category: 'sales', text: 'Avez-vous une stratégie de fidélisation de vos clients / acheteurs ?', weight: 10, options: [{ value: 0, label: 'Non' }, { value: 5, label: 'Informelle (relationnel uniquement)' }, { value: 10, label: 'Programme structuré (newsletter, offres...)' }] },
  ],
  recoRules: [
    { id: 'reco1', condition: { category: 'digital', maxScore: 20 }, priority: 1, title: 'Digitaliser votre gestion agricole', description: 'Votre niveau digital est faible. Adoptez un logiciel de gestion agricole adapté (ex: Isagri, Weenat) pour gagner en efficacité et traçabilité.', action: 'Évaluer les logiciels agricoles disponibles et former votre équipe' },
    { id: 'reco2', condition: { category: 'digital', minScore: 21, maxScore: 32 }, priority: 2, title: 'Optimiser votre présence numérique', description: 'Vous avez une base digitale. Renforcez votre présence en ligne et connectez vos outils pour une meilleure synchronisation des données.', action: 'Créer ou améliorer votre site web et vos réseaux sociaux' },
    { id: 'reco3', condition: { category: 'ops', maxScore: 15 }, priority: 1, title: 'Structurer vos processus opérationnels', description: 'Vos opérations manquent de structuration. Documenter vos processus clés réduira les erreurs et facilitera la croissance.', action: 'Rédiger des procédures opérationnelles pour les 3 tâches clés de l\'exploitation' },
    { id: 'reco4', condition: { category: 'ops', minScore: 16, maxScore: 23 }, priority: 2, title: 'Mettre en place des indicateurs de pilotage', description: 'Vos opérations sont partiellement structurées. Des KPIs clairs vous permettront de piloter l\'exploitation plus efficacement.', action: 'Définir 5 KPIs essentiels et les suivre mensuellement' },
    { id: 'reco5', condition: { category: 'sales', maxScore: 15 }, priority: 1, title: 'Diversifier vos canaux de vente', description: 'Votre commercialisation est peu développée. La diversification des canaux (vente directe, circuits courts, digital) augmentera vos revenus et réduira les risques.', action: 'Identifier 2 nouveaux canaux de commercialisation adaptés à votre production' },
    { id: 'reco6', condition: { category: 'sales', minScore: 16, maxScore: 23 }, priority: 2, title: 'Développer votre relation client', description: 'Vous avez des canaux de vente mais manquez d\'un suivi client structuré. Un CRM simple vous aidera à fidéliser et développer votre clientèle.', action: 'Implémenter un CRM simple (ex: HubSpot gratuit) pour suivre vos clients' },
    { id: 'reco7', condition: { scoreTotal: { max: 40 } }, priority: 1, title: 'Accompagnement transformation digitale', description: 'Score global faible : votre exploitation a un fort potentiel d\'amélioration. Un accompagnement personnalisé vous permettra de prioriser les actions à fort impact.', action: 'Prendre RDV pour un audit approfondi gratuit' },
    { id: 'reco8', condition: { scoreTotal: { min: 41, max: 70 } }, priority: 2, title: 'Plan d\'action ciblé', description: 'Bonne base mais des axes d\'amélioration importants existent. Priorisez les 3 actions identifiées pour un impact maximal dans les 90 prochains jours.', action: 'Planifier la mise en œuvre des recommandations prioritaires' },
    { id: 'reco9', condition: { scoreTotal: { min: 71 } }, priority: 3, title: 'Optimisation avancée', description: 'Vous avez un excellent niveau de maturité. Focus sur l\'optimisation fine et l\'innovation pour maintenir votre avantage compétitif.', action: 'Explorer les solutions d\'IA et d\'automatisation avancée pour votre secteur' },
  ],
};

async function main() {
  console.log('🌱 Seeding Audit Express templates...');
  
  await prisma.auditTemplate.upsert({
    where: { nicheKey: 'agri-tpe-pme' },
    update: {
      title: agriTemplate.title,
      description: agriTemplate.description,
      questions: agriTemplate.questions,
      recoRules: agriTemplate.recoRules,
      calendlyUrl: agriTemplate.calendlyUrl,
    },
    create: agriTemplate,
  });
  
  console.log('✅ Template agri-tpe-pme created/updated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
