import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';
import { AuthHeading, AuthIconBadge, AuthStack } from './AuthParts';
import { authHref, portals, type Portal } from './portals';

/** W24 / KW07 · Sesi Berakhir */
export function SessionExpired({ portal }: { portal: Portal }) {
  const { body } = portals[portal].expired;

  return (
    <AuthStack>
      <AuthIconBadge portal={portal} icon="timer" tone="neutral" />
      <AuthHeading title="Sesi kamu berakhir">{body}</AuthHeading>
      <ButtonLink fullWidth href={authHref(portal, 'login')}>
        Masuk lagi
        <Image src="/icons/arrow-right-inverse.svg" alt="" width={20} height={20} unoptimized />
      </ButtonLink>
    </AuthStack>
  );
}
