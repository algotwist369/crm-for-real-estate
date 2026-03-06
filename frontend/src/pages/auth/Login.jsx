import React, { useState } from "react";
import { PremiumInput } from "../../component/common/PremiumInput";
import { PremiumButton } from "../../component/common/PremiumButton";
import { PremiumCheckbox } from "../../component/common/PremiumCheckbox";

const Login = () => {
    const [remember, setRemember] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center px-6">

            {/* Card */}
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-8 space-y-6 shadow-lg">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-white">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Login to your account
                    </p>
                </div>

                {/* Form */}
                <div className="space-y-5">

                    <PremiumInput
                        label="Email or Phone"
                        type="email"
                        placeholder="Enter your email OR phone"
                    />

                    <PremiumInput
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                    />

                    {/* Remember */}
                    <PremiumCheckbox
                        label="Remember me"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                    />

                    {/* Buttons */}
                    <div className="flex flex-col gap-3">
                        <PremiumButton
                            text="Login"
                            variant="primary"
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="text-center text-sm text-zinc-400">
                    Forgot password?{" "}
                    <span className="text-zinc-200 cursor-pointer hover:underline">
                        Reset
                    </span>
                </div>

            </div>

        </div>
    );
};

export default Login;