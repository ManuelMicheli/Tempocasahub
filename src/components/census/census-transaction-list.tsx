'use client';

import { ArrowLeftRight } from 'lucide-react';
import type { CensusTransaction } from '@/types/database';

interface CensusTransactionListProps {
  transactions: CensusTransaction[];
}

export function CensusTransactionList({ transactions }: CensusTransactionListProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        Nessuna compravendita registrata
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-start gap-3 rounded-lg border p-3 text-sm"
        >
          <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {tx.transaction_type || 'Compravendita'}
              </span>
              {tx.transaction_date && (
                <span className="text-xs text-muted-foreground">
                  {new Date(tx.transaction_date).toLocaleDateString('it-IT')}
                </span>
              )}
            </div>
            {tx.price && (
              <p className="font-medium text-primary">
                € {tx.price.toLocaleString('it-IT')}
              </p>
            )}
            <div className="text-xs text-muted-foreground">
              {tx.seller_name && <span>Da: {tx.seller_name}</span>}
              {tx.seller_name && tx.buyer_name && <span> → </span>}
              {tx.buyer_name && <span>A: {tx.buyer_name}</span>}
            </div>
            {tx.notary && (
              <p className="text-xs text-muted-foreground">
                Notaio: {tx.notary}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
