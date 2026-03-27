import React, { useState, useEffect } from "react";
import { FiX, FiCamera, FiCheckSquare, FiCheck } from "react-icons/fi";
import { useUpdateAgentProfile } from "../../hooks/useAgentHooks";

const PROPERTIES = [
    { id: "1bhk", label: "1BHK Apartment" },
    { id: "2bhk", label: "2BHK Apartment" },
    { id: "3bhk", label: "3BHK Apartment" },
    { id: "villa", label: "Luxury Villa" },
    { id: "office", label: "Commercial Office" },
    { id: "shop", label: "Retail Shop" },
    { id: "plot", label: "Industrial Plot" },
];

const EditAgentModal = ({ isOpen, onClose, agent }) => {
    const { mutateAsync: updateAgent, isPending } = useUpdateAgentProfile();

    const [formData, setFormData] = useState({
        name: "",
        role: "",
        phone: "",
        email: "",
        pin: "",
        image: "",
        assignedProperties: [],
    });

    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (agent && isOpen) {
            const details = agent.agent_details || {};
            setFormData({
                name: details.user_name || "",
                role: agent.agent_role || "",
                phone: details.phone_number || "",
                email: details.email || "",
                pin: agent.agent_pin || "",
                image: details.profile_pic || "",
                assignedProperties: agent.assignedProperties || [],
            });
            setPreview(details.profile_pic || null);
        }
    }, [agent, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, image: reader.result }));
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePropertyChange = (propertyId) => {
        setFormData((prev) => {
            const isSelected = prev.assignedProperties.includes(propertyId);
            const newSelection = isSelected
                ? prev.assignedProperties.filter((id) => id !== propertyId)
                : [...prev.assignedProperties, propertyId];
            return { ...prev, assignedProperties: newSelection };
        });
    };

    const handleSelectAllProperties = () => {
        setFormData((prev) => {
            const allSelected = prev.assignedProperties.length === PROPERTIES.length;
            return {
                ...prev,
                assignedProperties: allSelected ? [] : PROPERTIES.map((p) => p.id),
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateAgent({
                id: agent._id,
                data: {
                    user_name: formData.name,
                    agent_role: formData.role,
                    email: formData.email,
                    phone_number: formData.phone,
                    agent_pin: formData.pin,
                    profile_pic: formData.image
                }
            });
            onClose();
        } catch (err) {
            console.error("Update agent error:", err);
        }
    };

    const inputClasses = "w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-zinc-700";
    const labelClasses = "text-xs font-semibold text-zinc-500 uppercase tracking-widest block mb-1.5";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-medium text-white">Edit Agent Details</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800">
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                    <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-zinc-950 border border-dashed border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-zinc-500 transition-colors">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <FiCamera className="text-zinc-500 group-hover:text-zinc-300 transition-colors" size={24} />
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-2 text-center font-bold uppercase tracking-tighter">Update Photo</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClasses} placeholder="Ankit Pathak" />
                            </div>
                            <div>
                                <label className={labelClasses}>Agent Role</label>
                                <input type="text" name="role" value={formData.role} onChange={handleChange} required className={inputClasses} placeholder="Sales Executive" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Phone Number</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className={inputClasses} placeholder="7388480126" />
                            </div>
                            <div>
                                <label className={labelClasses}>Email Address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClasses} placeholder="ankit@example.com" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Security Pin (4-6 digits)</label>
                            <input type="text" name="pin" value={formData.pin} onChange={handleChange} required className={inputClasses} placeholder="1234" />
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <FiCheckSquare className="text-zinc-500" /> Assigned Properties
                                </label>
                                <button type="button" onClick={handleSelectAllProperties} className="text-[10px] uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors font-bold">
                                    {formData.assignedProperties.length === PROPERTIES.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-4 rounded border border-zinc-800 max-h-40 overflow-y-auto custom-scrollbar">
                                {PROPERTIES.map((prop) => (
                                    <label key={prop.id} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border ${formData.assignedProperties.includes(prop.id) ? 'bg-blue-600 border-blue-600' : 'bg-zinc-900 border-zinc-700 group-hover:border-zinc-500'} flex items-center justify-center transition-colors`}>
                                            {formData.assignedProperties.includes(prop.id) && <FiCheck className="text-white relative z-10" size={12} strokeWidth={3} />}
                                        </div>
                                        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{prop.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-4 py-2 rounded bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                            {isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAgentModal;
