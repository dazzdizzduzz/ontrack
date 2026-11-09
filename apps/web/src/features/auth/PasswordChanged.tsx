import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';
import { AuthHeading, AuthIconBadge, AuthStack } from './AuthParts';
import { authHref, portals, type Portal } from './portals';

/** W22 / KW06 · Kata Sandi Berhasil Diubah */
export function PasswordChanged({ portal }: { portal: Portal }) {
  const { body, cta } = portals[portal].changed;

  return (
    <AuthStack>
      <AuthIconBadge portal={portal} icon="check-badge" tone="accent" />
      <AuthHeading title="Kata sandi berhasil diubah">{body}</AuthHeading>
      <ButtonLink fullWidth href={authHref(portal, 'login')}>
        {cta}
        <Image src="/icons/arrow-right-inverse.svg" alt="" width={20} height={20} unoptimized />
      </ButtonLink>
    </AuthStack>
  );
}
