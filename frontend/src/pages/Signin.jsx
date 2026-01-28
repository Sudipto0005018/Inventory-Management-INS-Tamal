import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PasswordInput } from "../components/ui/password-input";

import apiService from "../utils/apiService";

import { Context } from "../utils/Context";
import toaster from "../utils/toaster";

const Signin = () => {
    const { user, setUser } = useContext(Context);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate(user?.role === "superadmin" ? "/departments" : "/dashboard");
        }
    }, [user]);

    const [inputs, setInputs] = useState({
        username: "",
        password: "",
        tenantId: "",
    });

    const handleChange = (e) => {
        setInputs({ ...inputs, [e.target.id]: e.target.value });
    };

    const handleSignin = async () => {
        const today = Date.now();
        // if (today > 1764441000000) {
        //     toaster("error", "License expired");
        //     return;
        // }
        try {
            const response = await apiService.post("/users/signin", inputs);
            if (response.success) {
                localStorage.setItem("token", response.data.user.token);
                const user = { ...response.data.user };
                delete user.token;
                setUser(user);
                localStorage.setItem("user", JSON.stringify(user));
            }
        } catch (error) {
            if (error.response && error.response.data) {
                toaster(
                    "error",
                    error.response.data.message || "An error occurred during sign-in."
                );
            }
            console.log(error);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 ">
            <div className="flex flex-col p-4 bg-white rounded-md shadow-md w-[350px]">
                <h1 className="text-xl font-semibold mb-4 text-center">Sign In</h1>
                <div className="flex flex-col gap-6">
                    <div className="grid gap-1">
                        <Label htmlFor="username" className="text-sm ms-2">
                            Username<span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="text"
                            id="username"
                            required
                            placeholder="Enter your username"
                            value={inputs.username}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="password" className="text-sm ms-2">
                            Password<span className="text-red-500">*</span>
                        </Label>
                        <PasswordInput
                            type="password"
                            id="password"
                            required
                            placeholder="Enter your password"
                            value={inputs.password}
                            onChange={handleChange}
                        />
                    </div>
                    <Button onClick={handleSignin} className="cursor-pointer mt-2">
                        Sign In
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Signin;
