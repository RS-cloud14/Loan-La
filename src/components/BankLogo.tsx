'use client';

import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

interface BankLogoProps {
  bankId?: string;
  bankName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Normalizes bank name or ID to match file base slug in public/banks/[slug]
 */
export function getBankSlug(bankId?: string, bankName?: string): string {
  const query = `${bankId || ''} ${bankName || ''}`.toLowerCase().trim();

  if (query.includes('tng') || query.includes('touch') || query.includes('gopinjam')) return 'tng_gopinjam';
  if (query.includes('spaylater') || query.includes('sloan') || query.includes('shopee') || query.includes('seamoney')) return 'spaylater';
  if (query.includes('gx') || query.includes('gxbank')) return 'gxbank';
  if (query.includes('boost')) return 'boost_bank';
  if (query.includes('aeon bank')) return 'aeon_bank';
  if (query.includes('aeon')) return 'aeon_credit';
  if (query.includes('maybank') || query.includes('malayan')) return 'maybank';
  if (query.includes('cimb biz') || query.includes('cimb_biz')) return 'cimb_biz';
  if (query.includes('cimb')) return 'cimb';
  if (query.includes('public')) return 'public_bank';
  if (query.includes('rhb sme') || query.includes('rhb_sme')) return 'rhb_sme';
  if (query.includes('rhb')) return 'rhb';
  if (query.includes('hong leong fin') || query.includes('hlf') || query.includes('hong_leong_finance')) return 'hong_leong_finance';
  if (query.includes('hong leong') || query.includes('hlb')) return 'hong_leong';
  if (query.includes('ambank hp') || query.includes('ambank_hp')) return 'ambank_hp';
  if (query.includes('ambank')) return 'ambank';
  if (query.includes('bank islam') || query.includes('islam')) return 'bank_islam';
  if (query.includes('rakyat')) return 'bank_rakyat';
  if (query.includes('bsn') || query.includes('simpanan')) return 'bsn';
  if (query.includes('alliance')) return 'alliance';
  if (query.includes('affin')) return 'affin';
  if (query.includes('muamalat')) return 'bank_muamalat';
  if (query.includes('rajhi')) return 'al_rajhi';
  if (query.includes('funding')) return 'funding_societies';
  if (query.includes('capbay')) return 'capbay';
  if (query.includes('modalku')) return 'modalku';
  if (query.includes('tekun')) return 'tekun';
  if (query.includes('agrobank') || query.includes('agro')) return 'agrobank';
  if (query.includes('aim') || query.includes('ikhtiar')) return 'aim';
  if (query.includes('sme bank') || query.includes('sme_bank') || query.includes('spum')) return 'sme_bank';
  if (query.includes('mara')) return 'mara';
  if (query.includes('punb')) return 'punb';
  if (query.includes('grab')) return 'grab_finance';

  return 'default';
}

const SUPPORTED_EXTENSIONS = ['.png', '.svg', '.webp', '.jpg', '.jpeg'];

export default function BankLogo({ bankId, bankName, size = 'md', className = '' }: BankLogoProps) {
  const slug = getBankSlug(bankId, bankName);
  const [extIndex, setExtIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  // Reset extension index when bank changes
  useEffect(() => {
    setExtIndex(0);
    setHasFailedAll(false);
  }, [slug]);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const handleImageError = () => {
    if (extIndex < SUPPORTED_EXTENSIONS.length - 1) {
      setExtIndex(prev => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  if (hasFailedAll) {
    return (
      <div className={`bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs ${sizeClasses[size]} ${className}`}>
        <Building2 className={`${iconSizes[size]} text-blue-900`} />
      </div>
    );
  }

  const currentSrc = `/banks/${slug}${SUPPORTED_EXTENSIONS[extIndex]}`;

  return (
    <div className={`overflow-hidden shrink-0 shadow-2xs border border-slate-100 bg-white flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={bankName || bankId || 'Bank Logo'}
        className="w-full h-full object-contain p-1"
        onError={handleImageError}
      />
    </div>
  );
}
