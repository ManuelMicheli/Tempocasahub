'use client';

import type { CensusBuilding, CensusUnit } from '@/types/database';

interface CensusMapPopupProps {
  building: CensusBuilding;
  units: CensusUnit[];
}

const STATUS_COLORS: Record<string, string> = {
  not_contacted: '#6b7280',
  contacted: '#3b82f6',
  interested: '#22c55e',
  not_interested: '#ef4444',
  callback: '#f97316',
  lead_created: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
  not_contacted: 'Non contattato',
  contacted: 'Contattato',
  interested: 'Interessato',
  not_interested: 'Non interessato',
  callback: 'Richiamare',
  lead_created: 'Lead creato',
};

export function CensusMapPopup({ building, units }: CensusMapPopupProps) {
  return (
    <div className="min-w-[200px]" style={{ color: '#e5e7eb', fontFamily: 'inherit' }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
        {building.address}, {building.civic_number}
      </div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
        {building.total_units} unità · {building.contacted_count} contattati ·{' '}
        {building.interested_count} interessati
      </div>

      {units.length > 0 && (
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {units.map((unit) => (
            <div
              key={unit.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 0',
                fontSize: '11px',
                borderBottom: '1px solid #374151',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: STATUS_COLORS[unit.contact_status] || '#6b7280',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>
                {unit.internal || `Sub. ${unit.sub}`}
                {unit.floor && ` · P.${unit.floor === 'T' ? 'T' : unit.floor}`}
              </span>
              <span style={{ color: '#9ca3af' }}>
                {STATUS_LABELS[unit.contact_status] || unit.contact_status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
