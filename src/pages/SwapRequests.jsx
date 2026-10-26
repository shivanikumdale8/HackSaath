import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Check, X, Clock } from 'lucide-react';

/**
 * Swap Requests Page
 * Functional, persistent swap requests manager with 3 tabs:
 * - Received Requests (with real Accept and Decline actions)
 * - Sent Requests (with pending/accepted/declined status)
 * - Accepted Requests (active exchanges with collaborator info)
 */
export default function SwapRequests() {
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent' | 'accepted'
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusyId, setActionBusyId] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.exchanges.mine();
      setReceived(data.received || []);
      setSent(data.sent || []);
      setAccepted(data.accepted || []);
    } catch (err) {
      setError(err.message || 'Failed to load swap requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAccept = async (id) => {
    setError('');
    setActionBusyId(id);
    try {
      await api.exchanges.accept(id);
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Failed to accept swap request.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDecline = async (id) => {
    setError('');
    setActionBusyId(id);
    try {
      await api.exchanges.decline(id);
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Failed to decline swap request.');
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-[26px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
            Swap Requests
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-400 mt-1 leading-normal">
            Manage your incoming and outgoing student skill exchange proposals.
          </p>
        </div>

        <Link
          to="/matches"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-[14px] font-medium text-white transition-colors shrink-0"
        >
          Find More Matches →
        </Link>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-950/40 border border-red-800/60 p-4 text-[14px] text-red-300">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#111420] border border-slate-800 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'received'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Received Requests ({received.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'sent'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sent Requests ({sent.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('accepted')}
          className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'accepted'
              ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Accepted Requests ({accepted.length})
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-[14px]">
          Loading requests...
        </div>
      ) : activeTab === 'received' ? (
        <div className="space-y-4">
          {received.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#111420] p-8 text-center space-y-2">
              <p className="text-[15px] font-medium text-slate-300">No received swap requests yet.</p>
              <p className="text-[13px] text-slate-400">
                When fellow students discover your profile and propose skill swaps, they will appear here.
              </p>
            </div>
          ) : (
            received.map((req) => {
              const sender = req.proposer;
              const senderName = sender?.full_name || 'Student';
              const senderInitials = senderName.split(' ').map((w) => w[0]).join('').slice(0, 2) || '?';

              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-800 bg-[#111420] p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                        {sender?.avatar_url ? (
                          <img
                            src={sender.avatar_url}
                            alt={senderName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span>{senderInitials}</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[16px] font-semibold text-white">
                            {senderName}
                          </h3>
                          {sender?.college_name && (
                            <span className="text-[13px] text-slate-400">
                              · {sender.college_name}
                            </span>
                          )}
                        </div>

                        {sender?.primary_role && (
                          <p className="text-[13px] text-indigo-400 mt-0.5">
                            {sender.primary_role}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[12px] font-medium px-2.5 py-1 rounded-md border capitalize ${
                          req.status === 'accepted'
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : req.status === 'declined'
                            ? 'bg-red-950/50 border-red-800/40 text-red-300'
                            : 'bg-amber-950/50 border-amber-600/30 text-amber-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>

                  {/* Skills Exchanged */}
                  {(req.offered_skill || req.wanted_skill) && (
                    <div className="rounded-lg bg-[#0c0e16] border border-slate-800/80 p-3 text-[13px] flex flex-wrap items-center gap-x-4 gap-y-1">
                      {req.offered_skill && (
                        <div>
                          <span className="text-emerald-400 font-medium">They offer to teach: </span>
                          <span className="text-slate-200">{req.offered_skill}</span>
                        </div>
                      )}
                      {req.wanted_skill && (
                        <div>
                          <span className="text-indigo-400 font-medium">They want to learn: </span>
                          <span className="text-slate-200">{req.wanted_skill}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message */}
                  <div className="text-[14px] text-slate-300 bg-[#0c0e16]/60 p-3.5 rounded-lg border border-slate-800/60">
                    <p className="leading-relaxed whitespace-pre-wrap">{req.message}</p>
                  </div>

                  {/* Action buttons if pending */}
                  <div className="pt-2 flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-slate-500">
                      Received {new Date(req.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {req.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDecline(req.id)}
                            disabled={actionBusyId === req.id}
                            className="rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccept(req.id)}
                            disabled={actionBusyId === req.id}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {actionBusyId === req.id ? 'Processing...' : 'Accept Swap'}
                          </button>
                        </>
                      )}
                      {sender?.id && (
                        <Link
                          to={`/users/${sender.id}`}
                          className="text-indigo-400 hover:text-indigo-300 font-medium ml-2"
                        >
                          View Profile
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === 'sent' ? (
        <div className="space-y-4">
          {sent.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#111420] p-8 text-center space-y-2">
              <p className="text-[15px] font-medium text-slate-300">No sent swap requests.</p>
              <p className="text-[13px] text-slate-400">
                You haven't proposed any skill swaps yet. Check your matches to discover peers!
              </p>
              <div className="pt-2">
                <Link
                  to="/matches"
                  className="inline-block text-[14px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Browse Matches →
                </Link>
              </div>
            </div>
          ) : (
            sent.map((req) => {
              const recipient = req.recipient;
              const recipientName = recipient?.full_name || 'Student';
              const recipientInitials = recipientName.split(' ').map((w) => w[0]).join('').slice(0, 2) || '?';

              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-800 bg-[#111420] p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                        {recipient?.avatar_url ? (
                          <img
                            src={recipient.avatar_url}
                            alt={recipientName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span>{recipientInitials}</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[16px] font-semibold text-white">
                            Proposal to {recipientName}
                          </h3>
                          {recipient?.college_name && (
                            <span className="text-[13px] text-slate-400">
                              · {recipient.college_name}
                            </span>
                          )}
                        </div>
                        {recipient?.primary_role && (
                          <p className="text-[13px] text-indigo-400 mt-0.5">
                            {recipient.primary_role}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[12px] font-medium px-2.5 py-1 rounded-md border capitalize shrink-0 ${
                        req.status === 'accepted'
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                          : req.status === 'declined'
                          ? 'bg-red-950/50 border-red-800/40 text-red-300'
                          : 'bg-amber-950/50 border-amber-600/30 text-amber-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Skills Exchanged */}
                  {(req.offered_skill || req.wanted_skill) && (
                    <div className="rounded-lg bg-[#0c0e16] border border-slate-800/80 p-3 text-[13px] flex flex-wrap items-center gap-x-4 gap-y-1">
                      {req.offered_skill && (
                        <div>
                          <span className="text-emerald-400 font-medium">You offered to teach: </span>
                          <span className="text-slate-200">{req.offered_skill}</span>
                        </div>
                      )}
                      {req.wanted_skill && (
                        <div>
                          <span className="text-indigo-400 font-medium">You want to learn: </span>
                          <span className="text-slate-200">{req.wanted_skill}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Note */}
                  <div className="text-[14px] text-slate-300 bg-[#0c0e16]/60 p-3.5 rounded-lg border border-slate-800/60">
                    <p className="leading-relaxed whitespace-pre-wrap">{req.message}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[13px] text-slate-500">
                    <span>Sent on {new Date(req.created_at).toLocaleDateString()}</span>
                    {recipient?.id && (
                      <Link
                        to={`/users/${recipient.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View Profile
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Accepted Tab */
        <div className="space-y-4">
          {accepted.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#111420] p-8 text-center space-y-2">
              <p className="text-[15px] font-medium text-slate-300">No accepted swaps yet.</p>
              <p className="text-[13px] text-slate-400">
                Once a swap request is accepted by either you or your peer, it will appear here as an active collaboration.
              </p>
            </div>
          ) : (
            accepted.map((req) => {
              const partner = req.proposer?.id === req.recipient_id ? req.recipient : req.proposer;
              const partnerName = partner?.full_name || 'Collaboration Partner';

              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-emerald-900/40 bg-[#111420] p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 font-semibold text-sm flex items-center justify-center shrink-0">
                        {partnerName.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[16px] font-semibold text-white">
                            Active Swap with {partnerName}
                          </h3>
                          <span className="text-[12px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded">
                            Accepted
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-400 mt-0.5">
                          {partner?.college_name || 'Student Collaborator'}
                        </p>
                      </div>
                    </div>

                    {partner?.id && (
                      <Link
                        to={`/users/${partner.id}`}
                        className="text-[13px] text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        View Profile
                      </Link>
                    )}
                  </div>

                  {(req.offered_skill || req.wanted_skill) && (
                    <div className="rounded-lg bg-[#0c0e16] border border-slate-800/80 p-3 text-[13px] flex flex-wrap items-center gap-x-4 gap-y-1">
                      {req.offered_skill && (
                        <div>
                          <span className="text-emerald-400 font-medium">Offered skill: </span>
                          <span className="text-slate-200">{req.offered_skill}</span>
                        </div>
                      )}
                      {req.wanted_skill && (
                        <div>
                          <span className="text-indigo-400 font-medium">Learned skill: </span>
                          <span className="text-slate-200">{req.wanted_skill}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[14px] text-slate-300 bg-[#0c0e16]/60 p-3 rounded-lg border border-slate-800/60">
                    <p className="leading-relaxed">{req.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
