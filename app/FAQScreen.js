import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../Composants/themeConfig';
import ScreenHeader from '../Composants/ScreenHeader';

const faqData = [
  { q: "Qu'est-ce que Map Action ?", a: "Map Action est une application mobile citoyenne et gratuite qui permet de signaler des incidents environnementaux et d’assainissement en y associant des photos, des vidéos, des notes vocales et une position géographique." },
  { q: "Dois-je créer un compte ?", a: "Non. Vous pouvez effectuer un signalement sans créer de compte. Cependant, la création d’un compte est recommandée si vous souhaitez suivre l’évolution de vos signalements, recevoir des mises à jour ou accéder à certaines fonctionnalités personnalisées." },
  { 
    q: "Quels types d'incidents puis-je signaler ?", 
    a: "Vous pouvez signaler différents types d’incidents environnementaux ou sanitaires, notamment :",
    list: [
      "Les dépôts sauvages d’ordures ;",
      "La pollution de l’eau ou de l’air ;",
      "Les caniveaux bouchés ou zones insalubres ;",
      "Les eaux stagnantes ;",
      "Les dégradations issues d’activités minières et/ou industrielles ;",
      "La dégradation d’espaces verts ou forestiers ;",
      "Toute nuisance pouvant affecter l’environnement, la santé publique ou le cadre de vie."
    ]
  },
  { q: "Que deviennent les informations que j’envoie ?", a: "Les informations transmises à travers l’application peuvent être utilisées pour documenter l’incident, analyser son impact potentiel et faciliter son partage avec les structures ou autorités compétentes. Ces données peuvent également être utilisées par Kaicedra Consulting SAS, de manière agrégée ou anonymisée, à des fins d’étude, de sensibilisation, d’amélioration de la plateforme ou de communication sur les enjeux environnementaux." },
  { q: "Mes données personnelles sont-elles protégées ?", a: "Oui. Map Action accorde une importance particulière à la protection des données personnelles des utilisateurs. Les données collectées sont traitées conformément à la réglementation applicable au Mali en matière de protection des données à caractère personnel. Vous pouvez demander l’accès, la modification ou la suppression de vos informations personnelles en écrivant à : contact@map-action.com." },
  { q: "Est-ce que mon signalement sera automatiquement résolu ?", a: "Non. Map Action facilite la remontée, l’organisation et le partage des informations avec les acteurs compétents, mais l’intervention sur le terrain dépend des autorités, services techniques, collectivités ou organisations concernées. L’application ne garantit donc pas une résolution immédiate de chaque incident signalé." },
  { q: "Map Action est-elle un service d’urgence ?", a: "Non. Map Action n’est pas un service d’urgence. En cas de danger immédiat pour des personnes, de risque grave pour la santé ou de situation nécessitant une intervention urgente, contactez directement les services d’urgence ou les autorités compétentes." },
  { q: "Puis-je modifier ou supprimer mon compte ?", a: "Oui, vous pouvez à tout moment procéder à la modification ou la suppression de votre compte. Pour toute demande spécifique concernant vos données personnelles, vous pouvez écrire à : contact@map-action.com." },
  { q: "L’application est-elle gratuite ?", a: "Oui. L’application Map Action est gratuite pour les citoyens." },
];

export default function FaqScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Foire aux questions" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {faqData.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.question}>{item.q}</Text>
            <Text style={styles.answer}>{item.a}</Text>
            {item.list && item.list.map((listItem, i) => (
              <Text key={i} style={styles.bulletPoint}>• {listItem}</Text>
            ))}
          </View>
        ))}
        <Text style={styles.contact}>Besoin d'aide ? contact@map-action.com</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  scrollContent: { padding: 20 },
  faqItem: { marginBottom: 20, padding: 15, backgroundColor: COLORS.white, borderRadius: 12 },
  question: { fontWeight: 'bold', fontSize: 16, color: COLORS.primary },
  answer: { marginTop: 5, color: '#333', lineHeight: 22 },
  bulletPoint: { marginTop: 5, color: '#555', fontSize: 15, marginLeft: 10, lineHeight: 20 },
  contact: { marginTop: 10, textAlign: 'center', color: '#888' }
});