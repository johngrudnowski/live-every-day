import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="conditions/index" options={{ headerShown: false }} />
      <Stack.Screen name="conditions/[conditionId]" options={{ headerShown: false }} />
    </Stack>
  );
}
