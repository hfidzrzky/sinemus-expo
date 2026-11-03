import React from 'react';
import type { TicketItem } from '../types';
import { RegularTicketCard } from './RegularTicketCard';
import { CinemaTicketCard } from './CinemaTicketCard';

export interface TicketCardProps {
  ticket: TicketItem;
}

/**
 * Orchestrator kartu tiket:
 * Mendistribusikan rendering ke CinemaTicketCard (khusus presale XXI/CGV)
 * atau RegularTicketCard (screening komunitas fisik).
 */
export const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  if (ticket.event_type === 'presale_cinema') {
    return <CinemaTicketCard ticket={ticket} />;
  }

  return <RegularTicketCard ticket={ticket} />;
};
