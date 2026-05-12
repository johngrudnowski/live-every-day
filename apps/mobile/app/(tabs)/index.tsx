import type { HealthResponseDto } from '@led/api-client';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  const healthExample: HealthResponseDto = {
    ok: true,
    service: 'mobile',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Every Day</Text>
      <Text style={styles.subtitle}>Today is ready when you are.</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text style={styles.caption}>Shared API type check: {healthExample.service}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
  },
  caption: {
    fontSize: 13,
    opacity: 0.7,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
