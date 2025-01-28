import React, { Suspense } from 'react';
import { useUser } from '@/context/UserContext';
import { ProfileSkeleton } from '../atoms/ProfileSkeleton';

const ProfileDisplay = React.lazy(() => import('./ProfileDisplay'));

export function     LazyProfileDisplay() {
  const { userProfile } = useUser();

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      {userProfile ? <ProfileDisplay /> : <ProfileSkeleton />}
    </Suspense>
  );
}