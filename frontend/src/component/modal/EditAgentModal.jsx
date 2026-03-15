import React, { useState, useEffect } from "react";
import { PremiumInput } from "../common/PremiumInput";
import { PremiumButton } from "../common/PremiumButton";
import { FiX, FiCamera, FiCheckSquare } from "react-icons/fi";
import { PremiumCheckbox } from "../common/PremiumCheckbox";

const PROPERTIES = [
    { id: "1bhk", label: "1BHK Apartment" },
    { id: "2bhk", label: "2BHK Apartment" },
    { id: "3bhk", label: "3BHK Apartment" },
    { id: "villa", label: "Luxury Villa" },
    { id: "office", label: "Commercial Office" },
    { id: "shop", label: "Retail Shop" },
    { id: "plot", label: "Industrial Plot" },
];

const EditAgentModal = ({ isOpen, onClose, onUpdate, agent }) => {
    const [formData, setFormData] = useState({
        name: "",
        role: "",
        phone: "",
        email: "",
        pin: "",
        image: null,
        assignedProperties: [],
    });

    const [preview, setPreview] = useState(null);

    // Sync formData with the agent being edited
    useEffect(() => {
        if (agent && isOpen) {
            queueMicrotask(() => {
                setFormData({
                    name: agent.name || "",
                    role: agent.role || "",
                    phone: agent.phone || "",
                    email: agent.email || "",
                    pin: agent.pin || "",
                    image: agent.image || null,
                    assignedProperties: agent.assignedProperties || [],
                });
                if (agent.image) {
                    setPreview(typeof agent.image === "string" ? agent.image : URL.createObjectURL(agent.image));
                } else {
                    setPreview(null);
                }
            });
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
            setFormData((prev) => ({ ...prev, image: file }));
            setPreview(URL.createObjectURL(file));
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

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate({ ...agent, ...formData });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-semibold text-white">Edit Agent Details</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                    <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        
                        {/* Image Upload */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-zinc-500 transition-colors">
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
                                <p className="text-xs text-zinc-500 mt-2 text-center">Update Photo</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <PremiumInput 
                                label="Full Name" 
                                placeholder="John Doe" 
                                value={formData.name} 
                                onChange={(e) => handleChange({ target: { name: 'name', value: e.target.value }})}
                            />
                            <PremiumInput 
                                label="Role" 
                                placeholder="Real Estate Agent" 
                                value={formData.role} 
                                onChange={(e) => handleChange({ target: { name: 'role', value: e.target.value }})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <PremiumInput 
                                label="Phone" 
                                placeholder="9876543210" 
                                value={formData.phone} 
                                onChange={(e) => handleChange({ target: { name: 'phone', value: e.target.value }})}
                            />
                            <PremiumInput 
                                label="Email" 
                                type="email"
                                placeholder="john@example.com" 
                                value={formData.email} 
                                onChange={(e) => handleChange({ target: { name: 'email', value: e.target.value }})}
                            />
                        </div>

                        <PremiumInput 
                            label="Security Pin" 
                            type="password"
                            placeholder="Set a 4-digit pin" 
                            value={formData.pin} 
                            onChange={(e) => handleChange({ target: { name: 'pin', value: e.target.value }})}
                        />

                        {/* Property Assignment Section */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <FiCheckSquare className="text-zinc-500" />
                                    Assigned Properties
                                </label>
                                <button 
                                    type="button"
                                    onClick={handleSelectAllProperties}
                                    className="text-[10px] uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors font-bold"
                                >
                                    {formData.assignedProperties.length === PROPERTIES.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 max-h-40 overflow-y-auto custom-scrollbar">
                                {PROPERTIES.map((prop) => (
                                    <PremiumCheckbox 
                                        key={prop.id}
                                        label={prop.label}
                                        checked={formData.assignedProperties.includes(prop.id)}
                                        onChange={() => handlePropertyChange(prop.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex gap-3">
                        <div className="flex-1">
                            <PremiumButton 
                                text="Cancel" 
                                variant="secondary" 
                                onClick={onClose}
                            />
                        </div>
                        <div className="flex-1">
                            <PremiumButton 
                                text="Save Changes" 
                                type="submit"
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAgentModal;
