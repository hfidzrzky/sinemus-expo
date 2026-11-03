import React from 'react';
import type { TicketItem } from '../types';
import { RegularTicketCard } from './RegularTicketCard';

export interface TicketCardProps {
  ticket: TicketItem;
}

/**
 * Orchestrator kartu tiket:
 * Merender RegularTicketCard (screening fisik dengan QR Code mandiri Sinemus).
 */
export const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  return <RegularTicketCard ticket={ticket} />;
};
