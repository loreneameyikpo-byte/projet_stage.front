<script setup lang="ts">

declare const definePageMeta: (meta: Record<string, unknown>) => void
definePageMeta({ layout: 'public' })

const stats = [
  { valeur: '100+', label: 'Projets suivis' },
  { valeur: '45', label: 'Encadreurs actifs' },
  { valeur: '12', label: 'Spécialités couvertes' },
  { valeur: '98%', label: 'Taux de réussite' },
]

const fonctionnalites = [
  {
    icone: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    titre: 'Soumission du projet',
    description: 'Déposez votre titre, votre description, votre rapport PDF et votre dépôt GitHub en quelques clics, où que vous soyez.',
  },
  {
    icone: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    titre: 'Suivi de validation',
    description: "Suivez chaque version de votre projet, les observations de votre encadreur, et l'avancement de votre statut en temps réel.",
  },
  {
    icone: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    titre: 'Paiement des frais',
    description: "Réglez les frais d'encadrement directement via Mobile Money (Flooz, T-Money), en toute sécurité.",
  },
  {
    icone: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    titre: 'Planification des soutenances',
    description: 'Consultez le calendrier des soutenances, recevez votre convocation et préparez-vous sereinement pour le jour J.',
  },
  {
    icone: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4',
    titre: 'Composition du jury',
    description: "L'administrateur affecte les membres du jury, internes ou externes, à chaque soutenance planifiée.",
  },
  {
    icone: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    titre: 'Notation & évaluation',
    description: 'Chaque membre du jury saisit sa note ; la note finale est calculée automatiquement une fois toutes les évaluations reçues.',
  },
]

const perspectives = [
  {
    icone: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    couleur: 'bg-secondary/10 text-secondary',
    titre: 'Étudiants',
    description: 'Soumettez votre projet, suivez les retours de votre encadreur, réglez vos frais et consultez les infos de votre soutenance.',
  },
  {
    icone: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z',
    couleur: 'bg-accent/10 text-accent',
    titre: 'Encadreurs',
    description: 'Consultez vos étudiants affectés, validez ou demandez des corrections, et suivez votre calendrier de soutenances.',
  },
  {
    icone: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    couleur: 'bg-warning/10 text-warning',
    titre: 'Administrateurs',
    description: 'Gérez les promotions, affectez les encadreurs, planifiez les soutenances et constituez les jurys de A à Z.',
  },
]

function scrollVersFonctionnalites() {
  document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div>
    <!-- Hero -->
<section class="relative min-h-screen flex flex-col overflow-hidden">
  <!-- Photo plein écran -->
  <div
    class="absolute inset-0 bg-cover bg-center"
    style="background-image: url('/images/acceuil.jpg')"
  ></div>
  <!-- Overlay teal -->
  <div class="absolute inset-0 bg-primary/80"></div>
  <!-- motif de points -->
  <div class="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:26px_26px]"></div>
  <div class="absolute -top-32 -left-20 w-[520px] h-[520px] rounded-full bg-warning/20 blur-[110px]"></div>
  <div class="absolute top-10 right-0 w-[420px] h-[420px] rounded-full bg-secondary/30 blur-[100px]"></div>

  <!-- Contenu central -->
  <div class="relative z-10 flex-1 flex items-center">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <p class="text-secondary text-xs font-semibold tracking-widest uppercase mb-4">
        La plateforme de gestion des projets de fin de formation
      </p>
      <h1 class="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
        Bienvenue sur notre<br class="hidden sm:block" /> plateforme
      </h1>
      <p class="text-slate-200 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
        Projetis est une plateforme web dédiée à la gestion des projets de fin de formation. Elle permet aux étudiants,
        encadreurs et administrateurs de collaborer efficacement en centralisant la soumission, le suivi de
        l'avancement, le dépôt des documents et la planification des soutenances.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <NuxtLink
          to="/login"
          class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-6 py-3 rounded-md transition"
        >
          Accéder à la plateforme
          <span aria-hidden="true">→</span>
        </NuxtLink>
        <button
          type="button"
          @click="scrollVersFonctionnalites"
          class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-6 py-3 rounded-md border border-white/20 transition"
        >
          Découvrir les fonctionnalités
          <span aria-hidden="true">↓</span>
        </button>
      </div>
    </div>
  </div>

  <button
    type="button"
    @click="scrollVersFonctionnalites"
    aria-label="Défiler vers les fonctionnalités"
    class="relative z-10 mx-auto mb-8 block text-slate-300 hover:text-white transition"
  >
    <svg class="w-6 h-6 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>
</section>

    <!-- Fonctionnalités -->
    <section id="fonctionnalites" class="max-w-7xl mx-auto px-6 py-20">
      <div class="text-center max-w-2xl mx-auto mb-14">
        <p class="text-secondary text-xs font-semibold tracking-widest uppercase mb-3">Fonctionnalités</p>
        <h2 class="text-3xl font-bold text-ink mb-3">Tout ce dont vous avez besoin</h2>
        <p class="text-ink-light">
          Une suite complète d'outils pour gérer vos projets de fin de formation de bout en bout.
        </p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="f in fonctionnalites"
          :key="f.titre"
          class="bg-card border border-slate-200 rounded-lg p-6 hover:border-secondary/40 hover:shadow-sm transition"
        >
          <span class="inline-flex w-10 h-10 rounded-lg bg-secondary/10 text-secondary items-center justify-center mb-4">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" :d="f.icone" />
            </svg>
          </span>
          <h3 class="font-semibold text-ink mb-1.5">{{ f.titre }}</h3>
          <p class="text-sm text-ink-light leading-relaxed">{{ f.description }}</p>
        </div>
      </div>
    </section>

    <!-- Pour qui -->
    <section class="bg-slate-50 border-y border-slate-200 py-20">
      <div class="max-w-6xl mx-auto px-6">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <p class="text-secondary text-xs font-semibold tracking-widest uppercase mb-3">Pour qui ?</p>
          <h2 class="text-3xl font-bold text-ink mb-3">Une plateforme, trois perspectives</h2>
          <p class="text-ink-light">Projetis s'adapte aux besoins spécifiques de chaque acteur du processus.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="p in perspectives"
            :key="p.titre"
            class="bg-card border border-slate-200 rounded-lg p-8 text-center"
          >
            <span :class="['inline-flex w-12 h-12 rounded-lg items-center justify-center mb-4', p.couleur]">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" :d="p.icone" />
              </svg>
            </span>
            <h3 class="font-semibold text-ink mb-2">{{ p.titre }}</h3>
            <p class="text-sm text-ink-light leading-relaxed">{{ p.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="bg-primary py-14">
      <div class="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        <div v-for="s in stats" :key="s.label">
          <p class="text-3xl sm:text-4xl font-bold text-white mb-1">{{ s.valeur }}</p>
          <p class="text-sm text-secondary">{{ s.label }}</p>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="py-20 text-center px-6">
      <h2 class="text-2xl sm:text-3xl font-bold text-ink mb-3">Prêt à démarrer votre projet ?</h2>
      <p class="text-ink-light max-w-lg mx-auto mb-8">
        Rejoignez la plateforme Projetis et simplifiez la gestion de votre projet de fin de formation.
      </p>
      <NuxtLink
        to="/login"
        class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-6 py-3 rounded-md transition"
      >
        Accéder à la plateforme
        <span aria-hidden="true">→</span>
      </NuxtLink>
    </section>
  </div>
</template>