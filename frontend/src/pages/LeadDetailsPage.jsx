import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../component/layout/AppLayout";
import {
    FiAlertCircle,
    FiArrowLeft,
    FiCalendar,
    FiClock,
    FiEdit,
    FiHome,
    FiMail,
    FiMapPin,
    FiMessageSquare,
    FiPhone,
    FiPlus,
    FiShare2,
    FiTarget,
    FiTrash2,
    FiUser
} from "react-icons/fi";
import { useLead, useUpdateLead, useDeleteLead } from "../hooks/useLeadHooks";
import { useAuth } from "../context/AuthContext";
import EditLeadModal from "../component/modal/EditLeadModal";
import FollowUpModal from "../component/modal/FollowUpModal";
import MarkLostModal from "../component/modal/MarkLostModal";
import SendWhatsAppModal from "../component/modal/SendWhatsAppModal";
import { CopyButton } from "../component/common/CopyButton";

const statusOptions = [
    "new",
    "contacted",
    "qualified",
    "follow_up",
    "site_visit",
    "negotiation",
    "booked",
    "converted",
    "closed",
    "lost",
    "wasted",
    "archived"
];

const statusStyles = {
    new: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    contacted: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
    qualified: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    follow_up: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    site_visit: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    negotiation: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    booked: "bg-emerald-300/10 text-emerald-300 border-emerald-400/20",
    converted: "bg-teal-500/10 text-teal-300 border-teal-500/20",
    closed: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    lost: "bg-red-500/10 text-red-300 border-red-500/20",
    wasted: "bg-zinc-700/30 text-zinc-400 border-zinc-700/40",
    archived: "bg-zinc-800 text-zinc-500 border-zinc-700"
};

const priorityStyles = {
    high: "text-red-300 bg-red-500/10 border-red-500/20",
    medium: "text-orange-300 bg-orange-500/10 border-orange-500/20",
    low: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
};

const labelize = (value) => String(value || "").replace(/_/g, " ");

const formatDate = (date, fallback = "Not set") => {
    if (!date) return fallback;
    return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const formatShortDate = (date, fallback = "Not set") => {
    if (!date) return fallback;
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
};

const formatMoney = (value, currency = "AED") => {
    if (value === undefined || value === null || value === "") return "Not specified";
    const amount = Number(value);
    const display = Number.isFinite(amount) ? amount.toLocaleString() : value;
    return `${currency || "AED"} ${display}`;
};

const Pill = ({ children, className = "" }) => (
    <span className={`inline-flex items-center rounded border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}>
        {children}
    </span>
);

const Section = ({ title, icon: Icon, children }) => (
    <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Icon size={14} className="text-zinc-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h3>
        </div>
        {children}
    </section>
);

const Field = ({ label, value, children }) => (
    <div className="min-w-0">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
        {children || <p className="truncate text-sm font-medium text-zinc-200">{value || "Not provided"}</p>}
    </div>
);

const ActionButton = ({ children, icon: Icon, className = "", ...props }) => (
    <button
        type="button"
        className={`inline-flex items-center justify-center gap-2 rounded border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
    >
        {Icon && <Icon size={14} />}
        {children}
    </button>
);

const LeadDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = React.useState(false);
    const [isMarkLostModalOpen, setIsMarkLostModalOpen] = React.useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = React.useState(false);

    const { user: authUser } = useAuth();
    const isAdmin = ["admin", "super_admin"].includes(authUser?.role);

    const { data: leadResponse, isLoading, isError, refetch } = useLead(id);
    const updateLeadMutation = useUpdateLead();
    const deleteLeadMutation = useDeleteLead();
    const lead = leadResponse?.data;

    const handleStatusChange = (newStatus) => {
        if (newStatus === "lost") {
            setIsMarkLostModalOpen(true);
            return;
        }
        updateLeadMutation.mutate({ id, data: { status: newStatus } }, {
            onSuccess: () => refetch()
        });
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
            deleteLeadMutation.mutate(id, {
                onSuccess: () => navigate("/leads")
            });
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex min-h-[60vh] items-center justify-center text-sm text-zinc-400">
                    Loading lead details...
                </div>
            </AppLayout>
        );
    }

    if (isError || !lead) {
        return (
            <AppLayout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                    <p className="text-sm text-red-400">Error loading lead details</p>
                    <button onClick={() => navigate("/leads")} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white">
                        <FiArrowLeft /> Back to Leads
                    </button>
                </div>
            </AppLayout>
        );
    }

    const status = lead.status || "new";
    const priority = lead.priority || "medium";
    const location = lead.location || lead.address || "Not set";
    const assignedTeam = Array.isArray(lead.assigned_to) ? lead.assigned_to : [];

    const quickFacts = [
        { label: "Client", value: labelize(lead.client_type || "buying") },
        { label: "Lead Type", value: labelize(lead.lead_type || "buyer") },
        { label: "Property", value: labelize(lead.property_type || "Any") },
        { label: "Budget", value: formatMoney(lead.budget, lead.currency) },
        { label: "Source", value: labelize(lead.source || "manual") },
        { label: "Created", value: formatShortDate(lead.createdAt) }
    ];

    return (
        <AppLayout>
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <button
                        onClick={() => navigate("/leads")}
                        className="inline-flex w-fit items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white"
                    >
                        <FiArrowLeft />
                        Back to Leads
                    </button>

                    <div className="flex flex-wrap gap-2">
                        <ActionButton
                            icon={FiMessageSquare}
                            onClick={() => setIsWhatsAppModalOpen(true)}
                            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                        >
                            WhatsApp
                        </ActionButton>
                        <ActionButton
                            icon={FiPlus}
                            onClick={() => setIsFollowUpModalOpen(true)}
                            className="border-yellow-500/20 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/15"
                        >
                            Follow-up
                        </ActionButton>
                        <ActionButton
                            icon={FiEdit}
                            onClick={() => setIsEditModalOpen(true)}
                            className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                        >
                            Edit
                        </ActionButton>
                        {isAdmin && (
                            <ActionButton
                                icon={FiTrash2}
                                onClick={handleDelete}
                                disabled={deleteLeadMutation.isPending}
                                className="border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/15"
                            >
                                {deleteLeadMutation.isPending ? "Deleting..." : "Delete"}
                            </ActionButton>
                        )}
                    </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20">
                                {lead.followed_by?.profile_pic ? (
                                    <img src={lead.followed_by.profile_pic} alt="" className="h-full w-full rounded object-cover" />
                                ) : (
                                    <FiUser size={22} />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-2xl font-semibold text-white">{lead.name}</h1>
                                    <Pill className={statusStyles[status] || statusStyles.new}>{labelize(status)}</Pill>
                                    <Pill className={priorityStyles[priority] || priorityStyles.medium}>{priority}</Pill>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                    <span className="inline-flex items-center gap-1.5">
                                        <FiMapPin size={12} /> {location}
                                    </span>
                                    <span>ID: {lead._id}</span>
                                    <span>Updated: {formatShortDate(lead.updatedAt)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full max-w-xs">
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pipeline Status</label>
                            <select
                                value={status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={updateLeadMutation.isPending}
                                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm capitalize text-zinc-100 outline-none transition-colors focus:border-yellow-500/50 disabled:opacity-60"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option} value={option} className="bg-zinc-950 text-zinc-200">
                                        {labelize(option)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800 md:grid-cols-3 xl:grid-cols-6">
                    {quickFacts.map((fact) => (
                        <div key={fact.label} className="min-w-0 bg-zinc-950 px-4 py-3">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">{fact.label}</p>
                            <p className="truncate text-sm font-medium capitalize text-zinc-200">{fact.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Section title="Contact" icon={FiPhone}>
                                <div className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:grid-cols-2">
                                    <Field label="Phone">
                                        <div className="text-sm font-medium text-zinc-100">
                                            {lead.phone ? <CopyButton text={lead.phone} /> : "Not provided"}
                                        </div>
                                    </Field>
                                    <Field label="WhatsApp">
                                        <div className="text-sm font-medium text-zinc-100">
                                            {lead.whatsapp_number ? <CopyButton text={lead.whatsapp_number} /> : "Not provided"}
                                        </div>
                                    </Field>
                                    <Field label="Alternate" value={lead.alternate_phone} />
                                    <Field label="Email">
                                        {lead.email ? (
                                            <a href={`mailto:${lead.email}`} className="truncate text-sm font-medium text-zinc-200 hover:text-yellow-300">
                                                <FiMail className="mr-1.5 inline" size={13} />
                                                {lead.email}
                                            </a>
                                        ) : (
                                            <p className="text-sm font-medium text-zinc-500">Not provided</p>
                                        )}
                                    </Field>
                                    <Field label="Location">
                                        <p className="text-sm font-medium text-zinc-200">{lead.location || "Not set"}</p>
                                        {lead.address && <p className="mt-1 text-xs text-zinc-500">{lead.address}</p>}
                                    </Field>
                                </div>
                            </Section>

                            <Section title="Requirement" icon={FiHome}>
                                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Bedrooms" value={lead.bedrooms || "Any"} />
                                        <Field label="Bathrooms" value={lead.bathrooms || "Any"} />
                                        <Field label="Maid Room" value={lead.maid_room ? "Yes" : "No"} />
                                        <Field label="Furnishing" value={labelize(lead.furnished_status || "Any")} />
                                        <Field label="Built-up Area" value={lead.built_up_area?.value ? `${lead.built_up_area.value} ${lead.built_up_area.unit || ""}` : "Not set"} />
                                        <Field label="Plot Size" value={lead.plot_size?.value ? `${lead.plot_size.value} ${lead.plot_size.unit || ""}` : "Not set"} />
                                    </div>
                                    <div className="mt-4 border-t border-zinc-800 pt-4">
                                        <Field label="Requirement / Inquiry">
                                            <p className="text-sm leading-6 text-zinc-300">{lead.requirement || lead.inquiry_for || "General inquiry"}</p>
                                        </Field>
                                    </div>
                                </div>
                            </Section>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Section title="Pricing" icon={FiTarget}>
                                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <Field label="Budget">
                                            <p className="text-lg font-semibold text-emerald-300">{formatMoney(lead.budget, lead.currency)}</p>
                                        </Field>
                                        <Field label="Asking / Target">
                                            <p className="text-lg font-semibold text-emerald-300">{formatMoney(lead.asking_price, lead.currency)}</p>
                                        </Field>
                                        <Field label="Negotiable" value={lead.price_negotiable ? "Yes" : "No"} />
                                        <Field label="Currency" value={lead.currency || "AED"} />
                                    </div>
                                </div>
                            </Section>

                            <Section title="Stakeholders" icon={FiShare2}>
                                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <Field label="Owner" value={lead.owner_name} />
                                        <Field label="Broker" value={lead.broker_name} />
                                        <Field label="Broker Phone" value={lead.broker_phone} />
                                        <Field label="Followed By" value={lead.followed_by?.user_name || "Unassigned"} />
                                    </div>
                                    {lead.shared_details && (
                                        <div className="mt-4 border-t border-zinc-800 pt-4">
                                            <Field label="Shared Details">
                                                <p className="text-sm leading-6 text-zinc-300">{lead.shared_details}</p>
                                            </Field>
                                        </div>
                                    )}
                                </div>
                            </Section>
                        </div>

                        {lead.status === "lost" && (
                            <Section title="Closure" icon={FiAlertCircle}>
                                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                                    <Field label="Lost Reason">
                                        <p className="text-sm leading-6 text-zinc-300">{lead.lost_reason || "No reason recorded."}</p>
                                    </Field>
                                </div>
                            </Section>
                        )}

                        <Section title="Interested Properties" icon={FiHome}>
                            {Array.isArray(lead.properties) && lead.properties.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {lead.properties.map((property) => (
                                        <button
                                            key={property._id}
                                            type="button"
                                            onClick={() => navigate(`/properties/${property._id}`)}
                                            className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-left transition-colors hover:border-yellow-500/30 hover:bg-zinc-900"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="truncate text-sm font-semibold text-white">{property.property_title || "Untitled property"}</p>
                                                <span className="shrink-0 rounded bg-zinc-900 px-2 py-0.5 text-[10px] capitalize text-zinc-500">
                                                    {property.property_status || "N/A"}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
                                                <span className="truncate">{property.property_location?.city || "Unknown city"} | {property.property_type || "Type N/A"}</span>
                                                <span className="shrink-0 font-semibold text-emerald-300">{formatMoney(property.asking_price, property.currency)}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center text-sm text-zinc-600">
                                    No properties linked yet.
                                </div>
                            )}
                        </Section>
                    </div>

                    <aside className="space-y-6">
                        <Section title="Timeline" icon={FiCalendar}>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                                <div className="space-y-4">
                                    <Field label="Next Follow-up">
                                        <p className="rounded border border-yellow-500/10 bg-yellow-500/5 px-3 py-2 text-sm font-semibold text-yellow-300">
                                            <FiClock className="mr-2 inline" size={14} />
                                            {formatDate(lead.next_follow_up_date, "Not scheduled")}
                                        </p>
                                    </Field>
                                    <Field label="Last Contacted" value={formatShortDate(lead.last_contacted_at, "Never")} />
                                    <Field label="Created" value={formatDate(lead.createdAt)} />
                                    <Field label="Updated" value={formatDate(lead.updatedAt)} />
                                </div>
                            </div>
                        </Section>

                        <Section title="Team" icon={FiUser}>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                                {assignedTeam.length > 0 ? (
                                    <div className="space-y-2">
                                        {assignedTeam.map((person) => (
                                            <div key={person._id || person.user_name} className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                                                {person.profile_pic ? (
                                                    <img src={person.profile_pic} className="h-7 w-7 rounded-full object-cover" alt="" />
                                                ) : (
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold uppercase text-zinc-500">
                                                        {person.user_name?.charAt(0) || "U"}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-zinc-200">{person.user_name || "Unnamed user"}</p>
                                                    {person.email && <p className="truncate text-xs text-zinc-600">{person.email}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-600">No team members assigned.</p>
                                )}
                            </div>
                        </Section>

                        <Section title="Remarks" icon={FiMessageSquare}>
                            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                                <p className="text-sm leading-6 text-zinc-300">{lead.remarks || "No remarks recorded."}</p>
                            </div>
                        </Section>

                        {Array.isArray(lead.tags) && lead.tags.length > 0 && (
                            <Section title="Tags" icon={FiShare2}>
                                <div className="flex flex-wrap gap-2">
                                    {lead.tags.map((tag) => (
                                        <span key={tag} className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-400">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </aside>
                </div>
            </div>

            {isEditModalOpen && (
                <EditLeadModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdate={() => {
                        setIsEditModalOpen(false);
                        refetch();
                    }}
                    lead={lead}
                />
            )}

            {isFollowUpModalOpen && (
                <FollowUpModal
                    isOpen={isFollowUpModalOpen}
                    onClose={() => setIsFollowUpModalOpen(false)}
                    onSave={() => {
                        setIsFollowUpModalOpen(false);
                        refetch();
                    }}
                    lead={lead}
                />
            )}

            {isMarkLostModalOpen && (
                <MarkLostModal
                    isOpen={isMarkLostModalOpen}
                    onClose={() => setIsMarkLostModalOpen(false)}
                    lead={lead}
                    onStatusUpdated={() => {
                        setIsMarkLostModalOpen(false);
                        refetch();
                    }}
                />
            )}

            {isWhatsAppModalOpen && (
                <SendWhatsAppModal
                    isOpen={isWhatsAppModalOpen}
                    onClose={() => setIsWhatsAppModalOpen(false)}
                    lead={lead}
                />
            )}
        </AppLayout>
    );
};

export default LeadDetailsPage;
