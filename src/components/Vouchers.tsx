import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  Tag, 
  Gift, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Train, 
  MapPin, 
  Leaf, 
  BookOpen, 
  Coffee, 
  Shirt, 
  Clock, 
  CreditCard, 
  ShoppingBag, 
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';

interface VoucherOption {
  id: string;
  title: string;
  cost: number;
  description: string;
  provider: string;
  icon: string;
}

interface RedeemedVoucher {
  id: string;
  voucherId: string;
  title: string;
  cost: number;
  provider: string;
  code: string;
  redeemedAt: string;
  userEmail: string;
}

interface VouchersProps {
  currentUser: { name: string; email: string; role: string };
}

export default function Vouchers({ currentUser }: VouchersProps) {
  const [options, setOptions] = useState<VoucherOption[]>([]);
  const [redeemed, setRedeemed] = useState<RedeemedVoucher[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [spent, setSpent] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [successVoucher, setSuccessVoucher] = useState<RedeemedVoucher | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchVoucherData();
  }, [currentUser]);

  const fetchVoucherData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vouchers?email=${encodeURIComponent(currentUser.email)}`);
      if (!res.ok) {
        throw new Error("Could not fetch voucher data");
      }
      const data = await res.json();
      setOptions(data.availableVouchers || []);
      setRedeemed(data.redeemedVouchers || []);
      setBalance(data.pointsBalance || 0);
      setTotalEarned(data.totalPointsEarned || 0);
      setSpent(data.spentPoints || 0);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (voucherId: string) => {
    setRedeemingId(voucherId);
    setError(null);
    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: currentUser.email,
          voucherId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Redemption failed");
      }

      setSuccessVoucher(data.redeemedVoucher);
      await fetchVoucherData(); // Refresh points and records
    } catch (err: any) {
      setError(err.message || "Could not redeem voucher");
    } finally {
      setRedeemingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render icon component based on string label
  const renderVoucherIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Train': return <Train className={className} />;
      case 'SquarePark': return <MapPin className={className} />;
      case 'Leaf': return <Leaf className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Coffee': return <Coffee className={className} />;
      case 'Ticket': return <Ticket className={className} />;
      case 'Shirt': return <Shirt className={className} />;
      default: return <Gift className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-emerald-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/30">
              Civic Rewards Portal
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-white/10 px-2 py-0.5 rounded-md">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> 100% Tax-Free Civic Incentives
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Redeem Vouchers & Municipal Perks</h2>
          <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
            Every reported street pothole, municipal complaint, and peer validation earns you <strong>Civic Credits</strong>. Spend your hard-earned credits on real eco-friendly municipal perks, free parking waivers, metro rides, or community library passes!
          </p>
        </div>
      </div>

      {/* 2. Executive Point Balance Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900/40 dark:to-slate-950 border border-indigo-100/60 dark:border-slate-850 p-5 rounded-xl shadow-xs relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 block">Your Wallet Balance</span>
            <h4 className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{loading ? "..." : `${balance} pts`}</h4>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Available to spend instantly
            </p>
          </div>
          <div className="absolute right-3 bottom-3 text-indigo-100 dark:text-slate-900 pointer-events-none">
            <Gift className="w-16 h-16 stroke-1 opacity-20 dark:opacity-40" />
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-5 rounded-xl shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 block">Total Earned Credits</span>
            <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{loading ? "..." : `${totalEarned} pts`}</h4>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-400" /> Lifetime community contribution
            </p>
          </div>
        </div>

        {/* Spent Points */}
        <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-5 rounded-xl shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 block">Spent/Redeemed Points</span>
            <h4 className="text-2xl font-black text-slate-600 dark:text-slate-400">{loading ? "..." : `${spent} pts`}</h4>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" /> Redeemed in vouchers
            </p>
          </div>
        </div>

      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-rose-800 dark:text-rose-400">Transaction Failed</h5>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 3. Success Voucher Redemption Dialog Modal */}
      <AnimatePresence>
        {successVoucher && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-950 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl"
            >
              {/* Confetti-style header */}
              <div className="bg-emerald-600 text-white p-6 text-center space-y-2 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent)]"></div>
                <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center mx-auto border border-white/20">
                  <CheckCircle2 className="w-6 h-6 text-emerald-200 animate-bounce" />
                </div>
                <h3 className="text-base font-bold tracking-tight">Voucher Claimed Successfully!</h3>
                <p className="text-xs text-emerald-100">Congratulations! Your civic action made this possible.</p>
              </div>

              {/* Promo code detail card */}
              <div className="p-6 space-y-5">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl text-center space-y-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{successVoucher.provider}</span>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{successVoucher.title}</h4>
                  
                  {/* Real coupon code */}
                  <div className="py-2.5 px-4 bg-indigo-50 dark:bg-indigo-950/40 border border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-lg flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-extrabold text-indigo-700 dark:text-indigo-400 tracking-wider">
                      {successVoucher.code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(successVoucher.code, 'success')}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-1 focus:outline-hidden"
                    >
                      {copiedId === 'success' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Code
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-slate-400">
                    Redeemed on {new Date(successVoucher.redeemedAt).toLocaleDateString()} at {new Date(successVoucher.redeemedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>

                {/* Instructions */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">How to Redeem this reward:</span>
                  <ol className="list-decimal list-inside text-[11px] text-slate-500 leading-relaxed space-y-1 pl-1">
                    <li>Copy the unique promo voucher code above.</li>
                    <li>Present this code at any official counter or ticket kiosk of <strong className="text-slate-700 dark:text-slate-300">{successVoucher.provider}</strong>.</li>
                    <li>The attendant will verify the code and immediately issue your physical ticket/pass.</li>
                  </ol>
                </div>

                <button
                  onClick={() => setSuccessVoucher(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Done, Return to Portal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Voucher Offer Catalog */}
      <div className="space-y-4">
        <div className="border-b border-slate-150 dark:border-slate-850 pb-2">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Gift className="w-4.5 h-4.5 text-emerald-500" /> Available Civic Rewards Catalog
          </h3>
          <p className="text-[11px] text-slate-400">
            Redeem your points for official coupons. Points are debited from your balance immediately.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
            Loading municipal catalog data...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {options.map((option) => {
              const canAfford = balance >= option.cost;
              return (
                <div 
                  key={option.id}
                  id={`voucher-card-${option.id}`}
                  className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-xs hover:border-emerald-200 dark:hover:border-emerald-900/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header with Icon and Cost */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        {renderVoucherIcon(option.icon, 'w-5 h-5')}
                      </div>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-full">
                        {option.cost} points
                      </span>
                    </div>

                    {/* Meta info */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{option.provider}</span>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 mt-0.5">{option.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">{option.description}</p>
                    </div>
                  </div>

                  {/* Redeem Button */}
                  <button
                    id={`redeem-btn-${option.id}`}
                    onClick={() => handleRedeem(option.id)}
                    disabled={!canAfford || redeemingId !== null}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      canAfford 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {redeemingId === option.id ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : canAfford ? (
                      <>
                        Redeem Reward <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </>
                    ) : (
                      `Insufficient Points (Need ${option.cost - balance} more)`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Claimed/Redemption History Ledger */}
      <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Clock className="w-4.5 h-4.5 text-indigo-500" /> Your Redemption Ledger
          </h3>
          <p className="text-[11px] text-slate-400">
            A secure record of all coupon codes claimed by your citizen profile.
          </p>
        </div>

        {redeemed.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl space-y-2">
            <Tag className="w-7 h-7 mx-auto text-slate-300" />
            <h5 className="font-bold text-xs text-slate-700 dark:text-slate-350">No Claims Yet</h5>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
              You haven't redeemed any vouchers yet. Earn more score credits by reporting potholes and verifying complaints!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {redeemed.map((item) => (
              <div 
                key={item.id}
                id={`ledger-row-${item.id}`} 
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 px-2 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.provider}</span>
                    <span className="text-slate-200 dark:text-slate-800">•</span>
                    <span className="text-[10px] text-slate-400">
                      Redeemed {new Date(item.redeemedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{item.title}</h4>
                  <p className="text-[10px] text-slate-400">Cost: <strong className="text-slate-600 dark:text-slate-300">{item.cost} points</strong></p>
                </div>

                {/* Promo Code copy box */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-initial py-1.5 px-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between gap-3 min-w-[160px]">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                      {item.code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.code, item.id)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold focus:outline-hidden cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <span className="text-emerald-600 font-bold">Copied</span>
                      ) : (
                        "Copy"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
