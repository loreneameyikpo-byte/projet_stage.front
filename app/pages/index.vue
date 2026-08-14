<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

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
    icone: 'FileText',
    titre: 'Soumission du projet',
    description: 'Déposez votre titre, votre description, votre rapport PDF et votre dépôt GitHub en quelques clics, où que vous soyez.',
  },
  {
    icone: 'ClipboardCheck',
    titre: 'Suivi de validation',
    description: "Suivez chaque version de votre projet, les observations de votre encadreur, et l'avancement de votre statut en temps réel.",
  },
  {
    icone: 'CreditCard',
    titre: 'Paiement des frais',
    description: "Réglez les frais d'encadrement directement via Mobile Money (Flooz, T-Money), en toute sécurité.",
  },
  {
    icone: 'Calendar',
    titre: 'Planification des soutenances',
    description: 'Consultez le calendrier des soutenances, recevez votre convocation et préparez-vous sereinement pour le jour J.',
  },
  {
    icone: 'Users',
    titre: 'Composition du jury',
    description: "L'administrateur affecte les membres du jury, internes ou externes, à chaque soutenance planifiée.",
  },
  {
    icone: 'Smartphone',
    titre: 'Notation & évaluation',
    description: 'Chaque membre du jury saisit sa note ; la note finale est calculée automatiquement une fois toutes les évaluations reçues.',
  },
]

const perspectives = [
  {
    icone: 'Users',
    couleur: 'bg-secondary/10 text-secondary',
    titre: 'Étudiants',
    description: 'Soumettez votre projet, suivez les retours de votre encadreur, réglez vos frais et consultez les infos de votre soutenance.',
  },
  {
    icone: 'Users',
    couleur: 'bg-accent/10 text-accent',
    titre: 'Encadreurs',
    description: 'Consultez vos étudiants affectés, validez ou demandez des corrections, et suivez votre calendrier de soutenances.',
  },
  {
    icone: 'CheckCircle',
    couleur: 'bg-warning/10 text-warning',
    titre: 'Administrateurs',
    description: 'Gérez les promotions, affectez les encadreurs, planifiez les soutenances et constituez les jurys de A à Z.',
  },
]

function scrollVersFonctionnalites() {
  document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' })
}

/* ---------- Animation d'entrée du hero ---------- */
const heroMonte = ref(false)

/* ---------- Bouton "remonter en haut" / "descendre" ---------- */
const aDefileLoin = ref(false)
function gererScrollBoutonHaut() {
  aDefileLoin.value = window.scrollY > 500
}
function remonterEnHaut() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function descendre() {
  window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' })
}

/* ---------- Révélation au scroll (cartes) ---------- */
let observateur: IntersectionObserver | null = null

function activerRevelation() {
  observateur = new IntersectionObserver(
    (entrees) => {
      entrees.forEach((entree) => {
        if (entree.isIntersecting) {
          entree.target.classList.add('est-visible')
          observateur?.unobserve(entree.target)
        }
      })
    },
    { threshold: 0.15 }
  )
  document.querySelectorAll('.reveal').forEach((el) => observateur?.observe(el))
}

/* ---------- Compteurs animés pour les statistiques ---------- */
const valeursAffichees = ref<string[]>(stats.map(() => '0'))
let statsAnimees = false

function extraireNombre(valeur: string) {
  const m = valeur.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : 0
}
function extraireSuffixe(valeur: string) {
  return valeur.replace(/[\d.]+/, '')
}

function animerStats() {
  if (statsAnimees) return
  statsAnimees = true
  stats.forEach((s, i) => {
    const cible = extraireNombre(s.valeur)
    const suffixe = extraireSuffixe(s.valeur)
    const duree = 1100
    const debut = performance.now()
    const jouerFrame = (t: number) => {
      const progres = Math.min((t - debut) / duree, 1)
      const ease = 1 - Math.pow(1 - progres, 3)
      const valeurCourante = Math.round(cible * ease)
      valeursAffichees.value[i] = `${valeurCourante}${suffixe}`
      if (progres < 1) requestAnimationFrame(jouerFrame)
    }
    setTimeout(() => requestAnimationFrame(jouerFrame), i * 100)
  })
}

function activerObservateurStats() {
  const section = document.getElementById('section-stats')
  if (!section) return
  const obs = new IntersectionObserver(
    (entrees) => {
      entrees.forEach((entree) => {
        if (entree.isIntersecting) {
          animerStats()
          obs.unobserve(entree.target)
        }
      })
    },
    { threshold: 0.3 }
  )
  obs.observe(section)
}

onMounted(() => {
  requestAnimationFrame(() => { heroMonte.value = true })
  activerRevelation()
  activerObservateurStats()
  window.addEventListener('scroll', gererScrollBoutonHaut)
})

onBeforeUnmount(() => {
  observateur?.disconnect()
  window.removeEventListener('scroll', gererScrollBoutonHaut)
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative min-h-screen flex flex-col overflow-hidden">
      <!-- Photo plein écran -->
      <div
        class="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[1500ms]"
        :class="heroMonte ? 'scale-100' : 'scale-105'"
        style="background-image: url('/images/acceuil.jpg')"
      ></div>
      <!-- Overlay sombre fixe (toujours foncé, indépendant du thème clair/sombre) -->
      <div class="absolute inset-0 bg-[#04121e]/75"></div>

      <!-- Motif Cercles -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg">
        <circle cx="140" cy="160" r="90" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.5" />
        <circle cx="140" cy="160" r="140" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1.5" />
        <circle cx="1280" cy="120" r="60" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
        <circle cx="1310" cy="220" r="30" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.5" />
        <circle cx="200" cy="760" r="50" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
        <circle cx="1220" cy="760" r="110" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
        <circle cx="1220" cy="760" r="160" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
        <circle cx="720" cy="80" r="24" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
        <circle cx="60" cy="440" r="20" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
      </svg>

      <div class="absolute -top-32 -left-20 w-[520px] h-[520px] rounded-full bg-warning/20 blur-[110px]"></div>
      <div class="absolute top-10 right-0 w-[420px] h-[420px] rounded-full bg-secondary/30 blur-[100px]"></div>

      <!-- Contenu central -->
      <div class="relative z-10 flex-1 flex items-center">
        <div class="max-w-4xl mx-auto px-6 text-center">
          <p
            class="text-sky-300 text-xs font-semibold tracking-widest uppercase mb-4 opacity-0 transition-all duration-700"
            :class="heroMonte ? 'opacity-100 translate-y-0' : 'translate-y-3'"
          >
            La plateforme de gestion des projets de fin de formation
          </p>
          <h1
            class="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6 opacity-0 transition-all duration-700"
            :class="heroMonte ? 'opacity-100 translate-y-0' : 'translate-y-4'"
            style="transition-delay: 100ms"
          >
            Bienvenue sur notre<br class="hidden sm:block" /> plateforme
          </h1>
          <p
            class="text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10 opacity-0 transition-all duration-700"
            :class="heroMonte ? 'opacity-100 translate-y-0' : 'translate-y-4'"
            style="transition-delay: 200ms"
          >
            Projetis est une plateforme web dédiée à la gestion des projets de fin de formation. Elle permet aux étudiants,
            encadreurs et administrateurs de collaborer efficacement en centralisant la soumission, le suivi de
            l'avancement, le dépôt des documents et la planification des soutenances.
          </p>
          <div
            class="flex flex-col sm:flex-row items-center justify-center gap-3 opacity-0 transition-all duration-700"
            :class="heroMonte ? 'opacity-100 translate-y-0' : 'translate-y-4'"
            style="transition-delay: 300ms"
          >
            <NuxtLink
              to="/login"
              class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-6 py-3 rounded-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Accéder à la plateforme
              <span aria-hidden="true">→</span>
            </NuxtLink>
            <button
              type="button"
              @click="scrollVersFonctionnalites"
              class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-6 py-3 rounded-md border border-white/20 transition-all hover:-translate-y-0.5"
            >
              Découvrir les fonctionnalités
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        </div>
      </div>
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
          v-for="(f, i) in fonctionnalites"
          :key="f.titre"
          class="reveal bg-card border border-slate-200 rounded-lg p-6 hover:border-secondary/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          :style="{ transitionDelay: `${(i % 3) * 80}ms` }"
        >
          <span class="inline-flex w-10 h-10 rounded-lg bg-secondary/10 text-secondary items-center justify-center mb-4">
            <BaseIcon :name="f.icone" size="20" stroke-width="2" class="w-5 h-5" />
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
            v-for="(p, i) in perspectives"
            :key="p.titre"
            class="reveal bg-card border border-slate-200 rounded-lg p-8 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            :style="{ transitionDelay: `${i * 100}ms` }"
          >
            <span :class="['inline-flex w-12 h-12 rounded-lg items-center justify-center mb-4', p.couleur]">
              <BaseIcon :name="p.icone" size="22" stroke-width="2" class="w-6 h-6" />
            </span>
            <h3 class="font-semibold text-ink mb-2">{{ p.titre }}</h3>
            <p class="text-sm text-ink-light leading-relaxed">{{ p.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section id="section-stats" class="bg-primary py-14 relative overflow-hidden">
      <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-60" preserveAspectRatio="none" viewBox="0 0 1440 240" xmlns="http://www.w3.org/2000/svg">
        <circle cx="90" cy="40" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
        <circle cx="1360" cy="200" r="55" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
        <circle cx="1360" cy="200" r="85" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
      </svg>
      <div class="relative max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        <div v-for="(s, i) in stats" :key="s.label">
          <p class="text-3xl sm:text-4xl font-bold text-white mb-1 tabular-nums">{{ valeursAffichees[i] }}</p>
          <p class="text-sm text-secondary">{{ s.label }}</p>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="reveal py-20 text-center px-6">
      <h2 class="text-2xl sm:text-3xl font-bold text-ink mb-3">Prêt à démarrer votre projet ?</h2>
      <p class="text-ink-light max-w-lg mx-auto mb-8">
        Rejoignez la plateforme Projetis et simplifiez la gestion de votre projet de fin de formation.
      </p>
      <NuxtLink
        to="/login"
        class="inline-flex items-center gap-2 bg-secondary hover:bg-primary text-white text-sm font-medium px-6 py-3 rounded-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        Accéder à la plateforme
        <span aria-hidden="true">→</span>
      </NuxtLink>
    </section>

    <!-- Bouton remonter en haut / descendre -->
    <div class="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        @click="aDefileLoin ? remonterEnHaut() : descendre()"
        :aria-label="aDefileLoin ? 'Remonter en haut de la page' : 'Descendre dans la page'"
        class="w-11 h-11 rounded-full bg-secondary hover:bg-primary text-white shadow-lg flex items-center justify-center transition-all hover:-translate-y-0.5 active:scale-90 animate-bounce-doux"
      >
        <Transition name="icone-fleche" mode="out-in">
          <svg v-if="aDefileLoin" key="haut" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          <svg v-else key="bas" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </Transition>
      </button>
    </div>
  </div>
</template>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition-property: opacity, transform;
}

.reveal.est-visible {
  opacity: 1;
  transform: translateY(0);
}

.icone-fleche-enter-active,
.icone-fleche-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.icone-fleche-enter-from,
.icone-fleche-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

@keyframes bounce-doux {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-bounce-doux {
  animation: bounce-doux 1.8s ease-in-out infinite;
}
</style>