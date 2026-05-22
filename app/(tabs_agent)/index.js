import { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SignalerHomeScreen() {
  const mockIncidents = [
    {
      id: '1',
      titre: 'Wouloulodji dans sevare',
      zone: 'bankoroba',
      date: '12 juin 2026 - 12h00',
      statut: 'Déclaré',
      image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=150',
      badgeBg: '#F3F4F6',
      badgeText: '#6B7280',
    },
    {
      id: '2',
      titre: 'Route ravager',
      zone: 'Faladiè',
      date: '09 juil. 2026 - 05h00',
      statut: 'En traitement',
      image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=150',
      badgeBg: '#E0E7FF',
      badgeText: '#4F46E5',
    },
    {
      id: '3',
      titre: 'Groudron endommager',
      zone: 'Bakodjicoro',
      date: '09 juil. 2026 - 05h00',
      statut: 'Résolu',
      image: 'https://images.unsplash.com/photo-1599740483814-da2690a6e300?w=150',
      badgeBg: '#D1FAE5',
      badgeText: '#10B981',
    },
  ];

  const [activeFilter, setActiveFilter] = useState('Tout');

  const filteredData = activeFilter === 'Tout'
    ? mockIncidents
    : mockIncidents.filter(item => item.statut === activeFilter);

  const renderFilterButton = (label, count = null) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity
        key={label}
        style={[styles.filterButton, isActive && styles.activeFilterButton]}
        onPress={() => setActiveFilter(label)}
      >
        <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>
          {label}{count !== null ? ` (${count})` : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* BARRE DE FILTRES CORRIGÉE AVEC SCROLLVIEW */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
        >
          {renderFilterButton('Tout', mockIncidents.length)}
          {renderFilterButton('Déclaré')}
          {renderFilterButton('En traitement')}
          {renderFilterButton('Résolu')}
        </ScrollView>
      </View>

      {/* LISTE DES INCIDENTS */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <View style={styles.rowTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.titre}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.badgeBg }]}>
                  <Text style={[styles.statusText, { color: item.badgeText }]}>
                    {item.statut.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.rowBottom}>
                <Text style={styles.cardZone}>{item.zone}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // MODIFICATION ICI POUR RENDRE LES FILTRES DEBLOCKÉS ET FLUIDES
  filterWrapper: {
    height: 70, // Aligne proprement la hauteur de la zone de scroll
    justifyContent: 'center',
  },
  filterScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 8, // Gère l'espace horizontal entre tes boutons
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterButton: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  activeFilterButtonText: {
    color: 'white',
  },

  // LISTE ET CARDS
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  cardImage: {
    width: 65,
    height: 65,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  cardZone: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});