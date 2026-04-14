import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../Composants/themeConfig';

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}> Hello, la page Scan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: COLORS.gray2,
    paddingHorizontal: 20, 
  },
    text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary
  },
});