import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { CircleAvatar } from '@led/design-system';

import type { CircleSupportPerson } from '../api/account-queries';

import { PersonRow } from './PersonRow';

export function SupportPersonRow({
  person,
  isLast,
  avatarTone,
  nameAddon,
}: {
  person: CircleSupportPerson;
  isLast: boolean;
  avatarTone?: 'primary' | 'support' | 'muted';
  nameAddon?: ReactNode;
}) {
  return (
    <PersonRow
      onPress={() =>
        router.push({
          pathname: '/circle/[supportPersonId]',
          params: { supportPersonId: person.id },
        })
      }
      avatar={
        <CircleAvatar
          label={person.displayName}
          initials={person.initials}
          size={36}
          tone={avatarTone ?? getSupportAvatarTone(person)}
        />
      }
      name={person.displayName}
      nameAddon={nameAddon}
      detail={person.detailLine}
      stateLabel={person.stateLabel}
      stateTone={person.stateTone}
      isLast={isLast}
    />
  );
}

function getSupportAvatarTone(person: CircleSupportPerson): 'primary' | 'support' | 'muted' {
  if (person.role === 'my_number_one') {
    return 'primary';
  }

  return person.stateTone === 'muted' || person.inviteStatus === 'pending' ? 'muted' : 'support';
}
