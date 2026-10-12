import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  X,
  Send,
  AlertTriangle,
  CheckCircle,
  Inbox,
  Clock,
  User,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Message, UserRole } from '../../../types';
import { store } from '../../../services/store';

interface InternalMessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InternalMessagingModal: React.FC<InternalMessagingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const state = store.getState();
  const currentUser = store.getCurrentUser();

  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Compose State
  const [composeRecipientRole, setComposeRecipientRole] = useState<UserRole | 'all'>('all');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composePriority, setComposePriority] = useState<Message['priority']>('normal');

  // Messages visible to current user
  const visibleMessages = useMemo(() => {
    return state.messages.filter((m) => {
      const isRecipient = m.recipientRole === 'all' || m.recipientRole === currentUser.role;
      const isSender = m.senderId === currentUser.id;
      const matchesRole =
        selectedRoleFilter === 'all' ||
        m.senderRole === selectedRoleFilter ||
        m.recipientRole === selectedRoleFilter;
      return (isRecipient || isSender) && matchesRole;
    });
  }, [state.messages, currentUser, selectedRoleFilter]);

  // Fast templates
  const quickTemplates = [
    {
      title: 'Alerte Rupture Rayon',
      subject: 'Alerte Rupture en Rayon : [Nom du produit]',
      body: 'Bonjour, l article en rayon est en cours d épuisement rapide. Merci de vérifier la réserve ou de programmer un réapprovisionnement.',
      priority: 'stock_alert' as const,
      recipient: 'ravitailleur' as const,
    },
    {
      title: 'Confirmation Livraison',
      subject: 'Livraison Fournisseur Réceptionnée',
      body: 'La commande fournisseur a été déchargée, contrôlée conforme et intégrée dans le stock du magasin.',
      priority: 'normal' as const,
      recipient: 'comptable' as const,
    },
    {
      title: 'Demande Remise Exceptionnelle',
      subject: 'Demande d Accord Remise Client VIP',
      body: 'Un client fidèle sollicite une remise commerciale de [x]%. Merci de bien vouloir valider cette dérogation.',
      priority: 'validation_request' as const,
      recipient: 'superadmin' as const,
    },
    {
      title: 'Écart de Caisse Constaté',
      subject: 'Information Écart de Caisse à la Clôture',
      body: 'Un écart de caisse de [montant] FCFA a été constaté lors du comptage physique. Une note explicative a été jointe.',
      priority: 'urgent' as const,
      recipient: 'comptable' as const,
    },
  ];

  const handleApplyTemplate = (tpl: typeof quickTemplates[0]) => {
    setComposeSubject(tpl.subject);
    setComposeBody(tpl.body);
    setComposePriority(tpl.priority);
    setComposeRecipientRole(tpl.recipient);
    setActiveTab('compose');
  };

  const handleSendMessage = () => {
    if (!composeSubject.trim() || !composeBody.trim()) {
      alert('Veuillez renseigner un objet et un message.');
      return;
    }

    store.sendMessage({
      recipientRole: composeRecipientRole,
      subject: composeSubject,
      body: composeBody,
      priority: composePriority,
    });

    setComposeSubject('');
    setComposeBody('');
    setComposePriority('normal');
    setActiveTab('inbox');
  };

  const handleOpenMessage = (msg: Message) => {
    setSelectedMessage(msg);
    store.markMessageAsRead(msg.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full h-[620px] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-[#1e1b4b] border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Messagerie Interne des Acteurs (Service Django)
              </h3>
              <p className="text-[11px] text-slate-400">
                Canal direct temps réel entre Caissiers, Comptables, Ravitailleurs et Direction.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation & Controls Bar */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'inbox'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Boîte de Réception ({visibleMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Nouveau Message
            </button>
          </div>

          {activeTab === 'inbox' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Filtrer par rôle :</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
              >
                <option value="all">Tous les rôles</option>
                <option value="caissier">Caisse</option>
                <option value="comptable">Comptabilité</option>
                <option value="ravitailleur">Ravitaillement</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          )}
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-hidden flex">
          
          {/* TAB 1: INBOX */}
          {activeTab === 'inbox' && (
            <div className="flex-1 flex overflow-hidden">
              
              {/* Message List (Left 50%) */}
              <div className="w-1/2 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800 bg-slate-950/60">
                {visibleMessages.map((msg) => {
                  const isRead = msg.readBy.includes(currentUser.id);
                  const isSelected = selectedMessage?.id === msg.id;

                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleOpenMessage(msg)}
                      className={`p-3.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-l-2 border-amber-400 text-white'
                          : isRead
                          ? 'hover:bg-slate-900/60 text-slate-300'
                          : 'bg-indigo-950/30 hover:bg-indigo-950/50 font-bold text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="text-amber-300">{msg.senderName}</span>
                        <span className="font-mono text-[10px]">
                          {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h4 className="text-xs truncate">{msg.subject}</h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{msg.body}</p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                            msg.priority === 'urgent'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : msg.priority === 'stock_alert'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : msg.priority === 'validation_request'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {msg.priority.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          &rarr; {msg.recipientRole}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {visibleMessages.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun message dans cette boîte</p>
                  </div>
                )}
              </div>

              {/* Message Reader (Right 50%) */}
              <div className="w-1/2 p-5 overflow-y-auto bg-slate-900/90">
                {selectedMessage ? (
                  <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            selectedMessage.priority === 'urgent'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : selectedMessage.priority === 'stock_alert'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {selectedMessage.priority.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(selectedMessage.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-white mt-1">
                        {selectedMessage.subject}
                      </h3>
                      <div className="text-xs text-slate-300 mt-1">
                        De : <strong className="text-amber-300">{selectedMessage.senderName}</strong>
                      </div>
                      <div className="text-xs text-slate-400">
                        Destinataire : <strong className="capitalize text-slate-200">{selectedMessage.recipientRole}</strong>
                      </div>
                    </div>

                    <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                      {selectedMessage.body}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setComposeRecipientRole(selectedMessage.senderRole);
                          setComposeSubject(`Re: ${selectedMessage.subject}`);
                          setComposeBody(`\n\n--- En réponse à ${selectedMessage.senderName} ---\n${selectedMessage.body}`);
                          setActiveTab('compose');
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
                      >
                        Répondre à ce message
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                    <p>Sélectionnez un message dans la liste de gauche pour en lire le contenu complet.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: COMPOSE */}
          {activeTab === 'compose' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-900/90">
              
              {/* Quick Templates Bar */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Modèles de Messages Fréquents :
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-950 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 border border-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Destinataire (Rôle Ciblé) :</label>
                    <select
                      value={composeRecipientRole}
                      onChange={(e) => setComposeRecipientRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="all">Tous les Acteurs (Général)</option>
                      <option value="caissier">Caisse (Caissière)</option>
                      <option value="comptable">Comptabilité (Comptable)</option>
                      <option value="ravitailleur">Ravitaillement (Gestionnaire stock)</option>
                      <option value="superadmin">Direction (Super Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Niveau d'Urgence / Priorité :</label>
                    <select
                      value={composePriority}
                      onChange={(e) => setComposePriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="stock_alert">Alerte Stock Critique</option>
                      <option value="validation_request">Demande de Validation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Objet du Message :</label>
                  <input
                    type="text"
                    placeholder="Ex: Alerte rupture sur Riz Jasmin ou Arrivage conteneur..."
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-medium text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Corps du Message :</label>
                  <textarea
                    rows={6}
                    placeholder="Rédigez votre transmission aux autres départements..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => setActiveTab('inbox')}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendMessage}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer la Transmission</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
