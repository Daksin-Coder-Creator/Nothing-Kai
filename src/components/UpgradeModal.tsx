import React, { useState } from 'react';
import { X, Coins, Check, ArrowRight, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { NOTHING_AI_TIERS, NothingAiTier } from '../core/modelsConfig';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTierId: string;
  onSelectTier: (tierId: string) => void;
  creditBalance?: number;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentTierId,
  onSelectTier,
  creditBalance = 15000,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'usd' | 'inr'>('usd');
  const [checkoutModalTier, setCheckoutModalTier] = useState<NothingAiTier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'gpay' | 'razorpay'>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTier = NOTHING_AI_TIERS.find((t) => t.id === currentTierId) || NOTHING_AI_TIERS[0];

  const handleStartCheckout = (tier: NothingAiTier) => {
    if (tier.id === currentTierId) return;
    if (tier.price_usd === 0) {
      onSelectTier(tier.id);
      onClose();
      return;
    }
    setCheckoutModalTier(tier);
  };

  const handleConfirmPayment = () => {
    if (!checkoutModalTier) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSelectTier(checkoutModalTier.id);
      setSuccessMessage(`Successfully upgraded to ${checkoutModalTier.name} Plan!`);
      setTimeout(() => {
        setSuccessMessage(null);
        setCheckoutModalTier(null);
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[92vh] bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Nothing-Ai Subscription Tiers & Credits
              </h2>
              <p className="text-xs text-gray-400">
                Choose from 9 subscription tiers (Free to Prime). Unlocks model context, priority & Vibe Coding.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency toggle */}
            <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10 text-xs font-mono">
              <button
                onClick={() => setSelectedCurrency('usd')}
                className={`px-2.5 py-1 rounded-lg transition ${selectedCurrency === 'usd' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setSelectedCurrency('inr')}
                className={`px-2.5 py-1 rounded-lg transition ${selectedCurrency === 'inr' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                INR (₹)
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Balance & Active Plan Banner */}
        <div className="p-4 bg-[#000000] border-b border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Available Monthly Credits</span>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {creditBalance.toLocaleString()} <span className="text-xs font-normal text-gray-400">credits</span>
              </div>
            </div>
            <Coins className="w-6 h-6 text-white shrink-0" />
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Your Current Active Plan</span>
              <div className="text-base font-bold text-white mt-0.5">
                {activeTier.name} Plan (${activeTier.price_usd}/mo)
              </div>
            </div>
            <ShieldCheck className="w-6 h-6 text-white shrink-0" />
          </div>
        </div>

        {/* 8 Tiers Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#000000]">
          {(NOTHING_AI_TIERS || []).map((tier: NothingAiTier) => {
            const isActive = tier.id === currentTierId;
            const priceDisplay = selectedCurrency === 'usd' 
              ? (tier.price_usd === 0 ? 'Free' : `$${tier.price_usd}/mo`)
              : (tier.price_inr === 0 ? 'Free' : `₹${tier.price_inr}/mo`);

            return (
              <div
                key={tier.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition relative ${
                  isActive
                    ? 'bg-white/10 border-white text-white shadow-xl ring-1 ring-white/30'
                    : 'bg-[#121212] border-white/10 hover:border-white/25 text-gray-300'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-white text-black text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    Current Plan
                  </div>
                )}
                {tier.is_custom_enterprise && !isActive && (
                  <div className="absolute top-0 right-0 bg-amber-400 text-black text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    Enterprise
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      {tier.name}
                      {tier.is_custom_enterprise && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded font-mono">
                          Prime
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{priceDisplay}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">{tier.description}</p>
                  
                  <div className="text-[10px] text-gray-300 font-mono bg-white/5 p-2 rounded border border-white/5">
                    Monthly Credits: <strong>{(tier.monthlyCredits || 0).toLocaleString()}{tier.is_custom_enterprise ? '+' : ''}</strong>
                  </div>

                  <ul className="text-[11px] space-y-1 text-gray-300 pt-1">
                    {(tier.features || []).map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-white shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleStartCheckout(tier)}
                  disabled={isActive}
                  className={`w-full mt-4 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    isActive
                      ? 'bg-white/10 text-gray-400 cursor-default border border-white/10'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isActive ? (
                    <span>Active Tier</span>
                  ) : (
                    <>
                      <span>Select {tier.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Integration Checkout Modal Stub */}
      {checkoutModalTier && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d0d0d] border border-white/20 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-white" />
                Checkout — {checkoutModalTier.name} Plan
              </h3>
              <button onClick={() => setCheckoutModalTier(null)} className="p-1 rounded text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {successMessage ? (
              <div className="p-4 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold text-center animate-fadeIn">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-white" />
                {successMessage}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-white">
                    <span>Plan Upgrade:</span>
                    <span>{checkoutModalTier.name} Tier</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 font-mono">
                    <span>Amount Due:</span>
                    <span className="text-white font-bold">
                      {selectedCurrency === 'usd' ? `$${checkoutModalTier.price_usd}` : `₹${checkoutModalTier.price_inr}`} / month
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300 block">Select Payment Gateway:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod('gpay')}
                      className={`p-3 rounded-xl border text-xs font-semibold transition text-center ${
                        paymentMethod === 'gpay'
                          ? 'bg-white/15 border-white text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      Google Pay
                    </button>
                    <button
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`p-3 rounded-xl border text-xs font-semibold transition text-center ${
                        paymentMethod === 'razorpay'
                          ? 'bg-white/15 border-white text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      Razorpay
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition shadow-lg flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Processing Payment...' : `Confirm & Pay with ${paymentMethod === 'gpay' ? 'Google Pay' : 'Razorpay'}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
