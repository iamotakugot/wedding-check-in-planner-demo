import { useState, useEffect } from 'react';
import { AuditLogService } from '@/services/firebase/AuditLogService';
import { AuditLog } from '@/types';
import { logger } from '@/utils/logger';

export const useAuditLogs = (limit: number = 100) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const auditLogService = AuditLogService.getInstance();
        let unsubscribe: (() => void) | null = null;

        try {
            unsubscribe = auditLogService.subscribeRecent((newLogs) => {
                setLogs(newLogs);
                setIsLoading(false);
            }, limit);
        } catch (err) {
            logger.error('Error subscribing to audit logs:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setIsLoading(false);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [limit]);

    return { logs, isLoading, error };
};
