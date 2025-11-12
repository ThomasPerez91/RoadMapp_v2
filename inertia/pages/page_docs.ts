export type PageDocKey = 'addresses' | 'travels'

export type PageDocumentation = {
  heading: string
  bullets: string[]
}

export const pageDocs: Record<PageDocKey, PageDocumentation> = {
  addresses: {
    heading: 'Comprendre le carnet d’adresses',
    bullets: [
      'Utilisez la barre de recherche pour filtrer instantanément les adresses actives ou archivées.',
      'Basculez entre les carnets actifs et archivés avec le bouton « Voir archivées / Voir actives » : chaque vue possède sa propre recherche.',
      'Les pastilles de statut indiquent si une adresse est active et si la dernière vérification est réussie.',
      'Ouvrez le menu d’actions d’une adresse pour la modifier, l’archiver/restaurer ou la supprimer définitivement.',
      'Cliquez sur « Ajouter une adresse » pour créer une fiche ; les mises à jour se rechargent automatiquement après validation.',
    ],
  },
  travels: {
    heading: 'Gérer vos trajets',
    bullets: [
      'Chaque ligne récapitule la date du déplacement et la distance totale déjà formatée.',
      'Cliquez sur l’en-tête « Date » pour trier les trajets du plus ancien au plus récent (et inversement).',
      'Le tableau se met à jour automatiquement lorsque vous changez de page via la pagination.',
      'La pagination en bas de page permet de naviguer rapidement entre les différentes périodes de trajet.',
    ],
  },
}
