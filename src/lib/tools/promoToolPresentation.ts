import type { PromoEvaluation } from '@/types';
import type { ChatToolOutput } from './chatTools';

export interface PromoToolCard {
  id: string;
  title: string;
  code: string;
  terms: string;
  statusLabel: 'Eligible' | 'Not eligible';
  reason: string;
  estimatedSavingsLabel: string;
  applied: boolean;
}

export function getPromoToolCards(
  data: ChatToolOutput['output']['data']
): PromoToolCard[] | null {
  if (!Array.isArray(data)) return null;

  const cards: PromoToolCard[] = [];
  for (const evaluation of data) {
    const card = getPromoToolCard(evaluation);
    if (!card) return null;
    cards.push(card);
  }

  return cards;
}

function getPromoToolCard(evaluation: PromoEvaluation): PromoToolCard | null {
  if (!evaluation || typeof evaluation !== 'object') return null;

  const { promo, eligible, reason, estimatedSavings, applied } = evaluation;
  if (
    !promo ||
    typeof promo !== 'object' ||
    typeof promo.id !== 'string' ||
    typeof promo.title !== 'string' ||
    typeof promo.code !== 'string' ||
    typeof promo.terms !== 'string' ||
    typeof eligible !== 'boolean' ||
    typeof reason !== 'string' ||
    typeof estimatedSavings !== 'number' ||
    !Number.isFinite(estimatedSavings) ||
    typeof applied !== 'boolean'
  ) {
    return null;
  }

  return {
    id: promo.id,
    title: promo.title,
    code: promo.code,
    terms: promo.terms,
    statusLabel: eligible ? 'Eligible' : 'Not eligible',
    reason,
    estimatedSavingsLabel: `₱${estimatedSavings.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    applied,
  };
}
