import { router } from 'expo-router';
import { CircleAvatar } from '@led/design-system';

import type { CircleCareTeamPerson } from '../api/account-queries';

import { PersonRow } from './PersonRow';

export function CareTeamPersonRow({
  person,
  isLast,
}: {
  person: CircleCareTeamPerson;
  isLast: boolean;
}) {
  return (
    <PersonRow
      onPress={() =>
        router.push({
          pathname: '/circle/care-team/[careTeamPersonId]',
          params: { careTeamPersonId: person.id },
        })
      }
      avatar={
        <CircleAvatar
          label={person.displayName}
          initials={person.initials}
          size={36}
          tone={person.stateTone === 'muted' ? 'muted' : 'care'}
        />
      }
      name={person.displayName}
      detail={formatCareTeamDetail(person)}
      stateLabel={person.stateLabel}
      stateTone={person.stateTone}
      isLast={isLast}
    />
  );
}

function formatCareTeamDetail(person: CircleCareTeamPerson) {
  return [person.specialty, person.organization].filter(Boolean).join(' · ') || person.detailLine;
}
