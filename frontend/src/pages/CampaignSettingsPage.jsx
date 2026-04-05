import React, { useState, useEffect } from 'react';
import { useWhatsAppInit, useWhatsAppLogout, useWhatsAppRegenerate, useWhatsAppStatus, useEmailConfig, useUpdateEmailConfig } from '../hooks/useCampaignHooks';
import { useOutreach } from '../context/OutreachContext';
import { PremiumInput } from '../component/common/PremiumInput';
import AppLayout from '../component/layout/AppLayout';
import { FiMessageSquare, FiMail, FiCheckCircle, FiInfo, FiLogOut, FiZap, FiCheck, FiRefreshCw, FiTerminal, FiCopy, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

const CampaignSettingsPage = () => {
    const navigate = useNavigate();
    const { 
        qrCode: socketQrCode, 
        whatsappStatus: socketStatus, 
        isSocketConnected, 
        isSyncing, 
        syncStatus,
        logs // 🛡️ Diagnostic Logs from Context
    } = useOutreach();

    const { data: whatsappQueryData, isLoading: isStatusLoading } = useWhatsAppStatus();
    
    // Status Logic: Combine Query data with Socket data for maximum reliability
    const whatsappStatus = socketStatus || whatsappQueryData?.status || 'disconnected';
    const qrCode = socketQrCode || whatsappQueryData?.qrCode;
    
    const [activeTab, setActiveTab] = useState('whatsapp');
    const [showLogs, setShowLogs] = useState(false); // 🛡️ Log toggle
    
    // Status Logic
    const isWhatsAppConnected = whatsappStatus === 'connected';
    
    // The main status indicator should reflect the outreach readiness
    const isOutreachOnline = isWhatsAppConnected && isSocketConnected;
    const isOutreachDegraded = isWhatsAppConnected && !isSocketConnected;
    
    const whatsappInitMutation = useWhatsAppInit();
    const whatsappLogoutMutation = useWhatsAppLogout();
    const whatsappRegenerateMutation = useWhatsAppRegenerate();
    
    // 🛡️ [Senior Lazy Loading] Only fetch email config if the user is actually on the Email tab
    const { data: emailConfigData } = useEmailConfig(activeTab === 'email');
    
    const updateEmailConfigMutation = useUpdateEmailConfig();

    const [emailForm, setEmailForm] = useState({
        smtp: {
            host: '',
            port: 587,
            secure: false,
            auth: { user: '', pass: '' }
        },
        sender: {
            name: '',
            email: '',
            replyTo: ''
        },
        dailyLimit: 500
    });

    useEffect(() => {
        if (emailConfigData?.config) {
            setEmailForm(emailConfigData.config);
        }
    }, [emailConfigData]);

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        updateEmailConfigMutation.mutate(emailForm);
    };

    const tabs = [
        { id: 'whatsapp', label: 'WhatsApp', icon: <FiMessageSquare size={16} /> },
        { id: 'email', label: 'Email SMTP', icon: <FiMail size={16} /> }
    ];

    return (
        <AppLayout>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm hover:border border-zinc-800 rounded px-3 py-1">
                <IoArrowBackCircleOutline size={20} /> Back
            </button>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Outreach Settings</h1>
                    <p className="text-zinc-400">Configure your communication channels and sending limits</p>
                </div>
                
                <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm mb-8 w-fit items-center gap-4">
                    <div className="flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-2 px-6 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                                    activeTab === tab.id 
                                    ? 'bg-yellow-600 text-white shadow-[0_0_20px_rgba(202,138,4,0.3)]' 
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Main Connection Status */}
                    <div className="pr-4 flex items-center gap-2 border-l border-zinc-800 pl-4">
                        <div className={`w-2 h-2 rounded-full ${
                            isOutreachOnline ? 'bg-green-500 animate-pulse' : 
                            isSyncing ? 'bg-yellow-500 animate-pulse' :
                            isOutreachDegraded ? 'bg-orange-500' : 
                            'bg-red-500'
                        }`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            isOutreachOnline ? 'text-green-500' : 
                            isSyncing ? 'text-yellow-500' :
                            isOutreachDegraded ? 'text-orange-500' : 
                            'text-red-500'
                        }`}>
                            {isOutreachOnline ? 'WhatsApp Online' : 
                             isSyncing ? 'Syncing...' :
                             isOutreachDegraded ? 'Degraded Link' : 
                             'WhatsApp Offline'}
                        </span>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                    {activeTab === 'whatsapp' ? (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center p-12 bg-zinc-950 border border-zinc-800 rounded-lg text-center">
                                {whatsappStatus === 'connected' ? (
                                    <div className="max-w-sm">
                                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                                            <FiCheckCircle className="text-3xl text-green-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">WhatsApp Connected</h3>
                                        <div className="flex items-center justify-center gap-2 mb-8">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-green-500 text-xs font-bold uppercase tracking-widest">Active & Ready</span>
                                        </div>
                                        <button 
                                            onClick={() => whatsappLogoutMutation.mutate()}
                                            disabled={whatsappLogoutMutation.isPending}
                                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-900 text-red-400 border border-red-500/20 rounded text-sm font-medium hover:bg-red-500/5 transition-colors disabled:opacity-50"
                                        >
                                            <FiLogOut size={16} /> 
                                            {whatsappLogoutMutation.isPending ? 'Logging out...' : 'Disconnect Account'}
                                        </button>
                                    </div>
                                ) : (whatsappStatus === 'connecting' || whatsappStatus === 'qr_pending') && qrCode ? (
                                    <div className="max-w-sm text-center">
                                        <div className="bg-white p-4 rounded-lg mb-6 inline-block shadow-[0_0_30px_rgba(255,255,255,0.05)] border-4 border-zinc-900">
                                            <QRCodeSVG value={qrCode} size={200} />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">Scan QR Code</h3>
                                        {whatsappStatus === 'connecting' && (
                                            <div className="flex items-center justify-center gap-2 mb-4 text-yellow-500 animate-pulse">
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Refreshing Link...</span>
                                            </div>
                                        )}
                                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                                            Open WhatsApp on your phone <br/> 
                                            <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mt-2 block">Settings {'>'} Linked Devices {'>'} Link a Device</span>
                                        </p>
                                        <button 
                                            onClick={() => whatsappRegenerateMutation.mutate()}
                                            disabled={whatsappRegenerateMutation.isPending}
                                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded text-sm font-medium hover:text-white hover:border-zinc-700 transition-all active:transform active:scale-95 disabled:opacity-50"
                                        >
                                            <FiRefreshCw size={14} className={whatsappRegenerateMutation.isPending ? 'animate-spin' : ''} />
                                            {whatsappRegenerateMutation.isPending ? 'Regenerating...' : 'Regenerate QR Code'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="max-w-sm">
                                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                                            {whatsappStatus === 'connecting' ? (
                                                <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <FiMessageSquare className="text-3xl text-zinc-700" />
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            {whatsappStatus === 'connecting' ? 'Handshaking...' : 'No Active Session'}
                                        </h3>
                                        <p className="text-zinc-500 text-sm mb-8">
                                            {whatsappStatus === 'connecting' 
                                                ? 'Establishing a secure link. If this takes too long, manual sync or reset.'
                                                : 'Connect your WhatsApp to enable direct messaging to your leads.'}
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            <button 
                                                onClick={() => whatsappInitMutation.mutate()}
                                                disabled={whatsappInitMutation.isPending || whatsappStatus === 'connecting'}
                                                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-bold text-sm transition-all shadow-lg active:transform active:scale-95 disabled:opacity-50"
                                            >
                                                {whatsappInitMutation.isPending ? 'Queuing Link...' : 
                                                 whatsappStatus === 'connecting' ? 'Handshaking (Connecting)...' : 'Link WhatsApp Device'}
                                            </button>
                                            
                                            {(whatsappStatus === 'connecting' || whatsappStatus === 'disconnected' || whatsappStatus === 'qr_pending') && (
                                                <div className="pt-2 space-y-3">
                                                    <button 
                                                        onClick={() => syncStatus()}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-900/50 border border-zinc-800 rounded"
                                                    >
                                                        <FiRefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} /> 
                                                        {isSyncing ? 'Syncing...' : 'Sync Dashboard Status'}
                                                    </button>
                                                    
                                                    {whatsappStatus !== 'connected' && (
                                                        <button 
                                                            onClick={() => whatsappRegenerateMutation.mutate()}
                                                            disabled={whatsappRegenerateMutation.isPending}
                                                            className="w-full py-2 text-[10px] uppercase tracking-widest font-bold text-red-500/60 hover:text-red-500 transition-colors"
                                                        >
                                                            {whatsappRegenerateMutation.isPending ? 'Killing Session State...' : 'Force Reset & Start Fresh'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded flex gap-3">
                                    <FiInfo className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        <strong>Delivery Tip:</strong> Ensure your phone remains connected to the internet to maintain a stable session for outgoing campaigns.
                                    </p>
                                </div>
                                <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded flex gap-3">
                                    <FiZap className="text-yellow-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        <strong>Anti-Spam:</strong> Use AI variations and randomized delays (30-60s) to simulate human-like behavior and protect your account.
                                    </p>
                                </div>
                            </div>

                            {/* 🛡️ Senior Diagnostic Log Section */}
                            <div className="mt-8 border-t border-zinc-800 pt-6">
                                <button 
                                    onClick={() => setShowLogs(!showLogs)}
                                    className="flex items-center justify-between w-full text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <FiTerminal size={14} className="text-yellow-600" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Technical Connection Log</span>
                                        {logs?.length > 0 && (
                                            <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full text-[10px]">{logs.length}</span>
                                        )}
                                    </div>
                                    {showLogs ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                </button>

                                {showLogs && (
                                    <div className="mt-4 space-y-2">
                                        <div className="bg-zinc-950 rounded border border-zinc-800 p-4 font-mono text-[11px] max-h-60 overflow-y-auto scrollbar-hide">
                                            {logs?.length > 0 ? logs.map((log, i) => (
                                                <div key={i} className="flex gap-3 mb-1.5 last:mb-0">
                                                    <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                                                    <span className={log.message.includes('⚠️') ? 'text-red-400' : log.message.includes('📸') ? 'text-blue-400' : 'text-zinc-300'}>
                                                        {log.message}
                                                    </span>
                                                </div>
                                            )) : (
                                                <div className="text-zinc-600 italic">No activity logs recorded yet...</div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const diagInfo = {
                                                    timestamp: new Date().toISOString(),
                                                    status: whatsappStatus,
                                                    socketConnected: isSocketConnected,
                                                    logs: logs
                                                };
                                                navigator.clipboard.writeText(JSON.stringify(diagInfo, null, 2));
                                                toast.success('Diagnostic info copied to clipboard');
                                            }}
                                            className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors ml-auto uppercase tracking-tighter"
                                        >
                                            <FiCopy size={12} /> Copy Diagnostic Info
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleEmailSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">SMTP Server</h3>
                                    <PremiumInput 
                                        label="SMTP Host"
                                        placeholder="smtp.gmail.com"
                                        value={emailForm.smtp.host}
                                        onChange={(e) => setEmailForm({ ...emailForm, smtp: { ...emailForm.smtp, host: e.target.value } })}
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <PremiumInput 
                                            label="Port"
                                            type="number"
                                            placeholder="587"
                                            value={emailForm.smtp.port}
                                            onChange={(e) => setEmailForm({ ...emailForm, smtp: { ...emailForm.smtp, port: Number(e.target.value) } })}
                                            required
                                        />
                                        <div className="pt-8">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${emailForm.smtp.secure ? 'bg-yellow-600 border-yellow-600' : 'bg-zinc-950 border-zinc-700'}`}>
                                                    {emailForm.smtp.secure && <FiCheck size={10} className="text-white" />}
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    className="hidden"
                                                    checked={emailForm.smtp.secure}
                                                    onChange={(e) => setEmailForm({ ...emailForm, smtp: { ...emailForm.smtp, secure: e.target.checked } })}
                                                />
                                                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">SSL/TLS</span>
                                            </label>
                                        </div>
                                    </div>
                                    <PremiumInput 
                                        label="Username"
                                        placeholder="your@email.com"
                                        value={emailForm.smtp.auth.user}
                                        onChange={(e) => setEmailForm({ 
                                            ...emailForm, 
                                            smtp: { ...emailForm.smtp, auth: { ...emailForm.smtp.auth, user: e.target.value } } 
                                        })}
                                        required
                                    />
                                    <PremiumInput 
                                        label="App Password"
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        value={emailForm.smtp.auth.pass}
                                        onChange={(e) => setEmailForm({ 
                                            ...emailForm, 
                                            smtp: { ...emailForm.smtp, auth: { ...emailForm.smtp.auth, pass: e.target.value } } 
                                        })}
                                        required
                                    />
                                </div>

                                <div className="space-y-5">
                                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Sender Profile</h3>
                                    <PremiumInput 
                                        label="Display Name"
                                        placeholder="John Doe"
                                        value={emailForm.sender.name}
                                        onChange={(e) => setEmailForm({ ...emailForm, sender: { ...emailForm.sender, name: e.target.value } })}
                                        required
                                    />
                                    <PremiumInput 
                                        label="Sender Email"
                                        placeholder="john@company.com"
                                        value={emailForm.sender.email}
                                        onChange={(e) => setEmailForm({ ...emailForm, sender: { ...emailForm.sender, email: e.target.value } })}
                                        required
                                    />
                                    <PremiumInput 
                                        label="Reply-To"
                                        placeholder="support@company.com"
                                        value={emailForm.sender.replyTo}
                                        onChange={(e) => setEmailForm({ ...emailForm, sender: { ...emailForm.sender, replyTo: e.target.value } })}
                                    />
                                    <PremiumInput 
                                        label="Daily Limit"
                                        type="number"
                                        placeholder="500"
                                        value={emailForm.dailyLimit}
                                        onChange={(e) => setEmailForm({ ...emailForm, dailyLimit: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-zinc-800">
                                <button
                                    type="submit"
                                    disabled={updateEmailConfigMutation.isPending}
                                    className={`px-10 py-3 rounded font-bold text-sm shadow-lg transition-all active:transform active:scale-95 ${
                                        updateEmailConfigMutation.isPending 
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                                        : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                    }`}
                                >
                                    {updateEmailConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default CampaignSettingsPage;
