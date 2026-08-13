import { Component } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from './themeConfig';

// Filet de sécurité au niveau racine : sans lui, une erreur de rendu
// n'importe où dans l'arbre (ClerkProvider, une dépendance native comme
// Reanimated, etc.) ne produit aucun affichage en production — juste un
// écran blanc muet, sans le "red screen" réservé au développement.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Erreur de rendu non interceptée :', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Un problème est survenu</Text>
          <Text style={styles.message}>
            Une erreur inattendue est survenue. Veuillez réessayer.
          </Text>
          {__DEV__ && (
            <Text style={styles.debug}>
              {String(this.state.error?.message || this.state.error)}
            </Text>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleRetry} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.gray1,
    textAlign: 'center',
    marginBottom: 20,
  },
  debug: {
    fontSize: 12,
    color: COLORS.red1,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
