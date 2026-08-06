import { StyleSheet, Text, TextInput, View } from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { COLORS } from './themeConfig';

export default function PhoneCountryInput({
  countryCode,
  callingCode,
  phoneNumber,
  onCountryChange,
  onPhoneNumberChange,
  containerStyle,
}) {
  return (
    <View style={[styles.phoneInputContainer, containerStyle]}>
      <View style={styles.countryPickerSelector}>
        <CountryPicker
          countryCode={countryCode}
          withFilter withFlag withCallingCode withEmoji
          onSelect={(country) => {
            onCountryChange(country.cca2, country.callingCode[0]);
          }}
        />
        <Text style={styles.callingCodeText}>+{callingCode}</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Téléphone"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={onPhoneNumberChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  phoneInputContainer: { flexDirection: 'row', width: '100%', height: 60, borderWidth: 1, borderColor: COLORS.gray2, borderRadius: 15, alignItems: 'center', paddingHorizontal: 15, backgroundColor: COLORS.white },
  countryPickerSelector: { flexDirection: 'row', alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.gray2, paddingRight: 10, marginRight: 15 },
  callingCodeText: { fontSize: 16, fontWeight: '600', marginLeft: 5 },
  input: { flex: 1, fontSize: 16, color: 'black' },
});
