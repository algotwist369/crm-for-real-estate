import React, { useState } from "react";
import { PremiumInput } from "../common/PremiumInput";
import { PremiumButton } from "../common/PremiumButton";
import { FiX, FiCamera, FiCheckSquare, FiKey, FiCopy, FiCheck, FiUser, FiInfo } from "react-icons/fi";
import { PremiumCheckbox } from "../common/PremiumCheckbox";
import { useCreateAgent } from "../../hooks/useAgentHooks";
import { CopyButton } from "../common/CopyButton";

const PROPERTIES = [
    { id: "1bhk", label: "1BHK Apartment" },
    { id: "2bhk", label: "2BHK Apartment" },
    { id: "3bhk", label: "3BHK Apartment" },
    { id: "villa", label: "Luxury Villa" },
    { id: "office", label: "Commercial Office" },
    { id: "shop", label: "Retail Shop" },
    { id: "plot", label: "Industrial Plot" },
];

const AddAgentModal = ({ isOpen, onClose }) => {
    const { mutateAsync: createAgent, isPending } = useCreateAgent();
    
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
    const [credentials, setCredentials] = useState(null); // To store and show generated credentials

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
            const res = await createAgent({
                user_name: formData.name,
                agent_role: formData.role,
                email: formData.email,
                phone_number: formData.phone,
                agent_pin: formData.pin,
                profile_pic: formData.image
            });

            if (res.success && res.credentials) {
                setCredentials(res.credentials);
            } else {
                handleClose();
            }
        } catch (err) {
            console.error("Agent creation error:", err);
        }
    };

    const handleClose = () => {
        setFormData({ name: "", role: "", phone: "", email: "", pin: "", image: "", assignedProperties: [] });
        setPreview(null);
        setCredentials(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-semibold text-white">
                        {credentials ? "Agent Credentials" : "Add New Agent"}
                    </h2>
                    <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                {!credentials ? (
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
                                <p className="text-xs text-zinc-500 mt-2 text-center font-bold uppercase tracking-tighter">Profile Photo</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <PremiumInput 
                                label="Full Name" 
                                placeholder="Ankit Pathak" 
                                value={formData.name} 
                                onChange={(e) => handleChange({ target: { name: 'name', value: e.target.value }})}
                                required
                            />
                            <PremiumInput 
                                label="Agent Role" 
                                placeholder="Sales Executive" 
                                value={formData.role} 
                                onChange={(e) => handleChange({ target: { name: 'role', value: e.target.value }})}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <PremiumInput 
                                label="Phone Number" 
                                placeholder="7388480126" 
                                value={formData.phone} 
                                onChange={(e) => handleChange({ target: { name: 'phone', value: e.target.value }})}
                                required
                            />
                            <PremiumInput 
                                label="Email Address" 
                                type="email"
                                placeholder="ankit@example.com" 
                                value={formData.email} 
                                onChange={(e) => handleChange({ target: { name: 'email', value: e.target.value }})}
                                required
                            />
                        </div>

                        <PremiumInput 
                            label="Security Pin (4-6 digits)" 
                            type="text"
                            placeholder="1234" 
                            value={formData.pin} 
                            onChange={(e) => handleChange({ target: { name: 'pin', value: e.target.value }})}
                            required
                        />

                        {/* Property Assignment Section */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <FiCheckSquare className="text-zinc-500" />
                                    Assign Properties
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
                                onClick={handleClose}
                            />
                        </div>
                        <div className="flex-1">
                            <PremiumButton 
                                text={isPending ? "Creating..." : "Create Agent"} 
                                type="submit"
                                disabled={isPending}
                            />
                        </div>
                    </div>
                </form>
                ) : (
                    /* Credentials View */
                    <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-2">
                                <FiCheck size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Agent Created Successfully!</h3>
                            <p className="text-sm text-zinc-500 italic">Please share these credentials with the agent securely.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Login Identifier</p>
                                        <p className="text-sm font-bold text-white tracking-wide">{credentials.email}</p>
                                    </div>
                                    <CopyButton text={credentials.email} />
                                </div>
                                <div className="h-px bg-zinc-800/50 w-full" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Generated Password</p>
                                        <p className="text-sm font-mono font-bold text-blue-400">{credentials.password}</p>
                                    </div>
                                    <CopyButton text={credentials.password} />
                                </div>
                            </div>

                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3">
                                <FiInfo className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                                <p className="text-xs text-zinc-400 leading-relaxed italic">
                                    The agent can use their <span className="text-blue-400 font-bold">Email</span> or <span className="text-blue-400 font-bold">Phone Number</span> with this password or their <span className="text-blue-400 font-bold">Security PIN</span> to log in.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <PremiumButton 
                                text="Close and Finish" 
                                variant="primary" 
                                onClick={handleClose}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddAgentModal;
