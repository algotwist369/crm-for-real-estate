import React, { useState } from "react";
import { PremiumInput } from "../../component/common/PremiumInput";
import { PremiumButton } from "../../component/common/PremiumButton";
import { PremiumCheckbox } from "../../component/common/PremiumCheckbox";

const Register = () => {
    const [acceptTerms, setAcceptTerms] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center px-6">

            {/* Card */}
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-8 space-y-6 shadow-lg">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-white">
                        Create Account
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Register to get started
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-5">

                    <PremiumInput
                        label="Full Name"
                        placeholder="Enter your name"
                    />

                    <PremiumInput
                        label="Email"
                        type="email"
                        placeholder="Enter your email"
                    />

                    <PremiumInput
                        label="Phone Number"
                        type="text"
                        placeholder="Enter your phone"
                    />

                    <PremiumInput
                        label="Password"
                        type="password"
                        placeholder="password"
                    />

                    <PremiumCheckbox
                        label="I agree to the Terms & Conditions"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                    />

                    {/* Buttons */}
                    <div className="flex flex-col gap-3">
                        <PremiumButton
                            text="Create Account"
                            variant="primary"
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="text-center text-sm text-zinc-400">
                    Already have an account?{" "}
                    <span className="text-zinc-200 cursor-pointer hover:underline">
                        Login
                    </span>
                </div>

            </div>

        </div>
    );
};

export default Register;