import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../lib/api';

/**
 * SendSwapModal
 * Allows a student to propose a direct skill exchange to another student.
 * Prefills suggested skills based on matching context.
 */
export default function SendSwapModal({ recipient, prefilledOffer = '', prefilledWant = '', onClose, onSuccess }) {
  const [offeredSkill, setOfferedSkill] = useState(prefilledOffer);
  const [wantedSkill, setWantedSkill] = useState(prefilledWant);
  const [message, setMessage] = useState(
    `Hi ${recipient?.full_name || recipient?.name || 'there'}, I saw your skills on HackSaath and would love to exchange skills and collaborate!`
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      await api.exchanges.proposeSwap({
        recipient_id: recipient.id,
        offered_skill: offeredSkill.trim(),
        wanted_skill: wantedSkill.trim(),
        message: message.trim(),
      });
      setSentSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to send swap request.');
      setBusy(false);
    }
  };

  const recipientName = recipient?.full_name || recipient?.name || 'Student';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#111420] border border-slate-800 p-6 shadow-2xl text-slate-100 animate-fade-in">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-[18px] font-semibold text-white">
              Send Swap Request
            </h3>
            <p className="text-[13px] text-slate-400 mt-0.5">
              Propose a skill exchange with {recipientName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-[16px] font-semibold text-white">Request Sent</h4>
            <p className="text-[14px] text-slate-400">
              Your swap request has been sent to {recipientName}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div role="alert" className="rounded-lg bg-red-950/40 border border-red-800/60 p-3 text-[13px] text-red-300">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="offered-skill" className="block text-[13px] font-medium text-slate-300 mb-1">
                Skill you can teach / offer:
              </label>
              <input
                id="offered-skill"
                type="text"
                value={offeredSkill}
                onChange={(e) => setOfferedSkill(e.target.value)}
                placeholder="e.g. React, Python, UI Design"
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3.5 py-2 text-[14px] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="wanted-skill" className="block text-[13px] font-medium text-slate-300 mb-1">
                Skill you want to learn from {recipientName}:
              </label>
              <input
                id="wanted-skill"
                type="text"
                value={wantedSkill}
                onChange={(e) => setWantedSkill(e.target.value)}
                placeholder="e.g. Figma, Docker, Machine Learning"
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3.5 py-2 text-[14px] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="swap-message" className="block text-[13px] font-medium text-slate-300 mb-1">
                Message / Collaboration note:
              </label>
              <textarea
                id="swap-message"
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Briefly introduce what you'd like to build or exchange..."
                className="w-full rounded-lg border border-slate-800 bg-[#0c0e16] px-3.5 py-2 text-[14px] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-[14px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-[14px] font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Sending...' : 'Send Swap Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
