import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="data" options={{ headerShown: false }} />
      <Stack.Screen
        name="data/history/[metricKey]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="labs/import" options={{ headerShown: false }} />
      <Stack.Screen
        name="labs/import/[jobId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="labs/import/[jobId]/result"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="account" options={{ headerShown: false }} />
      <Stack.Screen
        name="appointments/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="appointments/[appointmentId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="circle/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="circle/[supportPersonId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="circle/care-team/[careTeamPersonId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="check-in/index" options={{ headerShown: false }} />
      <Stack.Screen name="check-in/question" options={{ headerShown: false }} />
      <Stack.Screen
        name="check-in/anchor-done"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="check-in/go-deeper"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="check-in/saved" options={{ headerShown: false }} />
      <Stack.Screen name="check-in/history" options={{ headerShown: false }} />
      <Stack.Screen
        name="check-in/[checkinId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="conditions/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="conditions/[conditionId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="vitals/log" options={{ headerShown: false }} />
    </Stack>
  );
}
