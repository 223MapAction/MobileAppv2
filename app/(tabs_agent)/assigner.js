import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AssignerScreen() {
  // 1. Simulation des données calquées exactement sur ta nouvelle maquette
  const mockMissions = [
    {
      id: '1',
      titre: 'Route ravagée',
      zone: 'Faladiè',
      urgence: 'Urgent',
      dateDebut: '01 juin 26',
      restant: '-2 jours',
      dateFin: '02 juin 26',
      image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=150',
      badgeBg: '#FEE2E2',
      badgeText: '#EF4444',
    },
    {
      id: '2',
      titre: 'Route ravagée',
      zone: 'Faladiè',
      urgence: 'Moyen',
      dateDebut: '01 juin 26',
      restant: '-5 jours',
      dateFin: '06 juin 26',
      image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=150',
      badgeBg: '#FEF3C7',
      badgeText: '#F59E0B',
    },
    {
      id: '3',
      titre: 'Route ravagée',
      zone: 'Faladiè',
      urgence: 'Faible',
      dateDebut: '01 juin 26',
      restant: '-15 jours',
      dateFin: '20 juin 26',
      image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=150',
      badgeBg: '#D1FAE5',
      badgeText: '#10B981',
    },
  ];

  const [activeFilter, setActiveFilter] = useState('Tout');

  // Filtrage dynamique
  const filteredMissions = activeFilter === 'Tout'
    ? mockMissions
    : mockMissions.filter(item => item.urgence === activeFilter);

  const renderFilterButton = (label, count = null) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity
        key={label}
        style={[styles.filterButton, isActive && styles.activeFilterButton]}
        onPress={() => setActiveFilter(label)}
      >
        <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>
          {label}{count !== null ? `(${count})` : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* BARRE DE FILTRES HORIZONTALE DÉBLOQUÉE */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
        >
          {renderFilterButton('Tout', mockMissions.length)}
          {renderFilterButton('Urgent')}
          {renderFilterButton('Moyen')}
          {renderFilterButton('Faible')}
        </ScrollView>
      </View>

      {/* LISTE DES CARTES ASSIGNÉES */}
      <FlatList
        data={filteredMissions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            
            {/* SECTION HAUT DE LA CARTE */}
            <View style={styles.cardTopSection}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              
              <View style={styles.cardHeaderContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{item.titre}</Text>
                  <View style={[styles.urgencyBadge, { backgroundColor: item.badgeBg }]}>
                    <Text style={[styles.urgencyText, { color: item.badgeText }]}>
                      {item.urgence.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardZone}>{item.zone}</Text>
              </View>
            </View>

            {/* LIGNE POINTILLÉE DE SÉPARATION */}
            <View style={styles.dottedDivider} />

            {/* SECTION BAS DE LA CARTE (DATES & TIMER) */}
            <View style={styles.cardBottomSection}>
              
              {/* Date Début */}
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#4B5563" />
                <Text style={styles.metaText}>Du {item.dateDebut}</Text>
              </View>

              {/* Temps restant */}
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#4B5563" />
                <Text style={styles.metaText}>{item.restant}</Text>
              </View>

              {/* Date Fin */}
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="calendar-check-outline" size={18} color="#4B5563" />
                <Text style={styles.metaText}>au {item.dateFin}</Text>
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
  
  // BARRE DE FILTRES
  filterWrapper: {
    height: 70,
    justifyContent: 'center',
  },
  filterScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 18,
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

  // LISTE ET CARTES
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    gap: 14,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  cardTopSection: {
    flexDirection: 'row',
    padding: 12,
  },
  cardImage: {
    width: 65,
    height: 65,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  cardHeaderContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardZone: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // SÉPARATEUR POINTILLÉ SIMULÉ
  dottedDivider: {
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginHorizontal: 12,
  },

  // SECTION BAS (DATES)
  cardBottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
});