import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { getSecretParameter } from '../utils/urlParams';

/**
 * Hook that initializes access control with caffeineAdminToken for anonymous sessions.
 * This allows admin-token sessions to perform privileged operations without Internet Identity login.
 */
export function useAdminTokenInitialization() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const initializedActorRef = useRef<any>(null);

  useEffect(() => {
    // Only run if we have a new actor instance
    if (!actor || initializedActorRef.current === actor) {
      return;
    }

    const adminToken = getSecretParameter('caffeineAdminToken');
    if (!adminToken) {
      // No admin token, nothing to initialize
      initializedActorRef.current = actor;
      return;
    }

    // Initialize access control with the admin token
    (async () => {
      try {
        await actor._initializeAccessControlWithSecret(adminToken);
        initializedActorRef.current = actor;
        
        // Invalidate and refetch all note queries after initialization
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        queryClient.invalidateQueries({ queryKey: ['note'] });
      } catch (error) {
        console.error('Failed to initialize access control with admin token:', error);
      }
    })();
  }, [actor, queryClient]);
}
