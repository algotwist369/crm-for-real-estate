import React, { useState } from 'react';
import AppLayout from '../component/layout/AppLayout';
import {
    FiBook, FiHome, FiPhone, FiCalendar, FiMapPin, FiSend,
    FiUsers, FiBarChart2, FiSettings, FiShield, FiSearch,
    FiChevronRight, FiCheckCircle, FiInfo, FiZap, FiTarget
} from 'react-icons/fi';
import { MdOutlineRealEstateAgent } from "react-icons/md";

const sections = [
    {
        id: 'dashboard',
        title: 'Dashboard Overview',
        icon: <FiHome />,
        overview: 'The Dashboard is your command center, providing a high-level view of your business performance at a glance.',
        howItWorks: 'It aggregates real-time data from your leads, properties, and campaigns to show key metrics like total leads, conversion rates, and pending follow-ups.',
        howToUse: [
            'Monitor your daily "Active Leads" to see who needs immediate attention.',
            'Track your "Conversion Funnel" to identify where leads are dropping off.',
            'Check the "Recent Activity" feed to stay updated on team actions.',
            'Use the date filters to view performance over specific periods (weekly, monthly, etc.).'
        ],
        benefits: [
            'Instant visibility into business health.',
            'Saves time by centralizing all critical data.',
            'Helps in making data-driven decisions quickly.'
        ],
        proTips: 'Set the dashboard as your browser startup page to start every morning with a clear picture of your priorities.'
    },
    {
        id: 'leads',
        title: 'Lead Management',
        icon: <FiPhone />,
        overview: 'The heart of your CRM. Manage every prospect from the first contact to the final closing.',
        howItWorks: 'Leads are organized by status (New, Contacted, Qualified, etc.) and priority. You can store detailed contact info, budget requirements, and property preferences.',
        howToUse: [
            'Add new leads manually or import them from external sources.',
            'Categorize leads by "Lead Type" (e.g., Buyer, Seller, Tenant).',
            'Assign leads to specific agents based on their expertise or territory.',
            'Update lead status regularly to move them through your sales pipeline.'
        ],
        benefits: [
            'Never lose a prospect again.',
            'Personalize communication based on detailed lead profiles.',
            'Increase conversion rates by focusing on high-priority leads.'
        ],
        proTips: 'Use "Tags" to further segment leads (e.g., "Hot Lead", "Investor", "First-time Buyer") for targeted follow-ups.'
    },
    {
        id: 'followups',
        title: 'Follow-Ups & Reminders',
        icon: <FiCalendar />,
        overview: 'Stay on top of every commitment with automated reminders and scheduled follow-ups.',
        howItWorks: 'The system tracks "Next Follow-Up" dates for every lead. When a follow-up is due, it triggers notifications for the assigned agent.',
        howToUse: [
            'Set a follow-up date every time you interact with a lead.',
            'Add "Remarks" to remember what was discussed in the last call.',
            'View all upcoming follow-ups in the "Reminders" section or on your dashboard.',
            'Mark follow-ups as "Completed" to keep your schedule clean.'
        ],
        benefits: [
            'Eliminates the risk of forgetting a client meeting or call.',
            'Builds trust with clients through consistent communication.',
            'Boosts productivity by organizing your daily schedule.'
        ],
        proTips: 'Always schedule the next follow-up before ending a call with a client to keep the momentum going.'
    },
    {
        id: 'properties',
        title: 'Property & Inventory',
        icon: <MdOutlineRealEstateAgent />,
        overview: 'Manage your entire property portfolio, including listings, photos, and legal documents.',
        howItWorks: 'Properties are linked to leads. When a lead expresses interest in a specific type of property, you can easily match them with your current inventory.',
        howToUse: [
            'Create detailed property listings with price, location, and area details.',
            'Upload high-quality photos and essential documents directly to the property profile.',
            'Assign "Managing Agents" to specific properties.',
            'Search and filter inventory to find the perfect match for a lead.'
        ],
        benefits: [
            'Centralized database for all your property assets.',
            'Quickly share property details with interested leads.',
            'Better inventory management and faster sales cycles.'
        ],
        proTips: 'Keep property status (Available, Sold, Reserved) up-to-date to avoid showing unavailable properties to clients.'
    },
    {
        id: 'outreach',
        title: 'Outreach Campaigns',
        icon: <FiSend />,
        overview: 'Scale your marketing with automated multi-channel campaigns via Email and WhatsApp.',
        howItWorks: 'The system uses background workers to send personalized messages to groups of leads based on your templates and schedules.',
        howToUse: [
            'Connect your SMTP (Email) or WhatsApp session in Settings.',
            'Create message templates with "Dynamic Fields" (e.g., {lead_name}) for personalization.',
            'Select a target audience and launch your campaign.',
            'Monitor real-time stats like "Sent", "Delivered", and "Failed".'
        ],
        benefits: [
            'Reach hundreds of leads in minutes.',
            'Maintains consistent brand messaging across all channels.',
            'Saves hours of manual typing and sending.'
        ],
        proTips: 'Test your campaign with a small group first to ensure formatting and links work perfectly on all devices.'
    },
    {
        id: 'roles',
        title: 'User & Agent Roles',
        icon: <FiUsers />,
        overview: 'Manage your team structure and control who can see and do what within the system.',
        howItWorks: 'Roles (Admin, Agent) determine access levels. Admins see everything, while Agents typically only see leads assigned to them.',
        howToUse: [
            'Add team members and assign them roles.',
            'Deactivate accounts for former employees to maintain security.',
            'Monitor agent performance through the Reports section.',
            'Transfer leads between agents as needed.'
        ],
        benefits: [
            'Protects sensitive business data.',
            'Provides a focused workspace for agents (only showing what they need).',
            'Easy team scaling as your business grows.'
        ],
        proTips: 'Regularly review agent permissions to ensure they align with their current responsibilities.'
    },
    {
        id: 'reports',
        title: 'Reports & Analytics',
        icon: <FiBarChart2 />,
        overview: 'Turn your data into insights with detailed performance reports and trends.',
        howItWorks: 'The system automatically generates reports on lead sources, agent productivity, and sales conversions.',
        howToUse: [
            'Filter reports by date, agent, or lead source.',
            'Identify which marketing channels (e.g., Facebook, Referrals) bring the best leads.',
            'Review agent performance metrics like "Leads Contacted" vs "Leads Closed".',
            'Export data for further analysis if needed.'
        ],
        benefits: [
            'Identifies bottlenecks in your sales process.',
            'Helps allocate marketing budget more effectively.',
            'Objective measurement of team performance.'
        ],
        proTips: 'Review the "Lead Source" report monthly to double down on what works and cut costs on what doesn\'t.'
    },
    {
        id: 'settings',
        title: 'Settings & Configuration',
        icon: <FiSettings />,
        overview: 'Customize the CRM to fit your unique business needs and workflow.',
        howItWorks: 'Configure global settings like currency, timezone, email templates, and integration credentials.',
        howToUse: [
            'Update your business profile and contact information.',
            'Set up "Lead Status" options that match your sales stages.',
            'Configure notification preferences (Browser, Email, WhatsApp).',
            'Manage API keys and external integrations.'
        ],
        benefits: [
            'Tailors the CRM to your specific industry (Real Estate, Spa, etc.).',
            'Ensures all automated communication matches your brand voice.',
            'Streamlines technical integrations.'
        ],
        proTips: 'Take 15 minutes to fully configure your "Email Templates" — it makes your automated outreach look premium and professional.'
    },
    {
        id: 'security',
        title: 'Security & Privacy',
        icon: <FiShield />,
        overview: 'Enterprise-grade protection for your client data and business intelligence.',
        howItWorks: 'The system uses encrypted tokens for authentication, sanitizes all inputs to prevent attacks, and maintains an audit log of key activities.',
        howToUse: [
            'Use strong, unique passwords for all user accounts.',
            'Enable multi-factor authentication if supported by your organization.',
            'Regularly review "Active Sessions" in your profile settings.',
            'Report any suspicious activity to your system administrator.'
        ],
        benefits: [
            'Builds client trust by protecting their personal information.',
            'Prevents unauthorized access to your proprietary data.',
            'Ensures compliance with data protection regulations.'
        ],
        proTips: 'Encourage your team to log out when using public computers and never share their login credentials.'
    }
];

const DocumentationPage = () => {
    const [activeSection, setActiveSection] = useState(sections[0].id);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const filteredSections = sections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.overview.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeData = sections.find(s => s.id === activeSection) || sections[0];

    return (
        <AppLayout>
            <div className="flex h-[calc(100vh-160px)] bg-zinc-950 text-zinc-300 overflow-hidden rounded-2xl border border-zinc-800 relative">
                {/* Mobile Sidebar Toggle */}
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-yellow-500 shadow-lg"
                >
                    <FiSearch />
                </button>

                {/* Sidebar Navigation */}
                <div className={`
                    w-full lg:w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/50 
                    absolute lg:relative inset-0 z-40 lg:z-auto transition-transform duration-300
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-6 border-b border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                                    <FiBook className="text-xl" />
                                </div>
                                <h1 className="text-xl font-bold text-white tracking-tight">User Guide</h1>
                            </div>
                            <button 
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-2 text-zinc-500"
                            >
                                <FiChevronRight className="rotate-180" />
                            </button>
                        </div>
                        
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input 
                                type="text" 
                                placeholder="Search help articles..."
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-500/50 transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                        {filteredSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => {
                                    setActiveSection(section.id);
                                    setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors duration-200 group ${activeSection === section.id
                                        ? 'bg-zinc-900 border border-zinc-800 text-yellow-400 font-medium'
                                        : 'text-zinc-500'
                                    }`}
                            >
                                <span className={`text-lg ${activeSection === section.id ? 'text-yellow-400' : 'text-zinc-500'}`}>
                                    {section.icon}
                                </span>
                                <span className="flex-1 text-left">{section.title}</span>
                                <FiChevronRight className={`transition-transform duration-200 ${activeSection === section.id ? 'rotate-90 text-yellow-400' : 'opacity-0'}`} />
                            </button>
                        ))}
                        
                        {filteredSections.length === 0 && (
                            <div className="text-center py-10 px-4">
                                <p className="text-zinc-600 text-sm">No articles found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-zinc-800 bg-zinc-950">
                        <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                            <p className="text-xs text-zinc-500 mb-2">Need more help?</p>
                            <button 
                                onClick={() => window.open('https://wa.me/917388480128?text=Hello, I need support with AlgoTwist CRM.', '_blank')}
                                className="w-full py-2 bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-zinc-950 custom-scrollbar">
                    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12 animate-in fade-in duration-300" key={activeSection}>
                        {/* Header */}
                        <div className="mb-12">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-4">
                                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-yellow-500">
                                    {React.cloneElement(activeData.icon, { size: 32 })}
                                </div>
                                <div>
                                    <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{activeData.title}</h2>
                                    <p className="text-zinc-500 mt-1">Comprehensive guide to mastering {activeData.title.toLowerCase()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Sections */}
                        <div className="space-y-12">
                            {/* Overview */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <FiInfo className="text-yellow-500" />
                                    <h3 className="text-lg font-semibold text-white">Feature Overview</h3>
                                </div>
                                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                                    <p className="text-zinc-400 leading-relaxed text-base lg:text-lg">
                                        {activeData.overview}
                                    </p>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* How It Works */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <FiZap className="text-blue-500" />
                                        <h3 className="text-lg font-semibold text-white">How It Works</h3>
                                    </div>
                                    <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl h-full">
                                        <p className="text-zinc-400 leading-relaxed">
                                            {activeData.howItWorks}
                                        </p>
                                    </div>
                                </section>

                                {/* Business Benefits */}
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <FiTarget className="text-green-500" />
                                        <h3 className="text-lg font-semibold text-white">Business Benefits</h3>
                                    </div>
                                    <div className="p-6 bg-green-500/5 border border-green-500/10 rounded-2xl h-full">
                                        <ul className="space-y-3">
                                            {activeData.benefits.map((benefit, i) => (
                                                <li key={i} className="flex items-start gap-3 text-zinc-400">
                                                    <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                                                    <span className="text-sm">{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </section>
                            </div>

                            {/* Step-by-Step Guide */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <FiBook className="text-purple-500" />
                                    <h3 className="text-lg font-semibold text-white">How to Use (Step-by-Step)</h3>
                                </div>
                                <div className="space-y-4">
                                    {activeData.howToUse.map((step, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                                                {i + 1}
                                            </div>
                                            <p className="text-zinc-300 text-sm">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Pro Tips */}
                            <section>
                                <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <FiZap size={80} className="text-yellow-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold uppercase tracking-wider rounded">Pro Tip</span>
                                            <h3 className="text-lg font-bold text-white">Expert Strategy</h3>
                                        </div>
                                        <p className="text-yellow-200/70 italic leading-relaxed">
                                            "{activeData.proTips}"
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Real-world Use Case */}
                            <section className="pt-12 border-t border-zinc-800">
                                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Real-World Application</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-zinc-900/20 border border-zinc-800 rounded-2xl">
                                        <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                            Real Estate Agency
                                        </h5>
                                        <p className="text-xs text-zinc-500 leading-relaxed">
                                            Agents use Lead Management to track high-value investors and the Property module to showcase premium listings with documents and photos, closing deals 30% faster.
                                        </p>
                                    </div>
                                    <div className="p-6 bg-zinc-900/20 border border-zinc-800 rounded-2xl">
                                        <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            Service Business
                                        </h5>
                                        <p className="text-xs text-zinc-500 leading-relaxed">
                                            Managers use Outreach Campaigns to send maintenance reminders via WhatsApp, increasing repeat customer bookings by keeping the brand top-of-mind.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Footer navigation */}
                        <div className="mt-20 pt-8 border-t border-zinc-800 flex flex-col lg:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
                            <p>© {new Date().getFullYear()} AlgoTwist CRM Documentation</p>
                            <div className="flex gap-4">
                                <a href="#" className="transition-colors">Privacy Policy</a>
                                <a href="#" className="transition-colors">Terms of Service</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default DocumentationPage;
