const Spinner = ({ color = "orange", size = 32 }) => {
    const borderColor = color === "blue" ? "border-orange-500" : "border-" + color + "-500";
    return (
        <div className="flex justify-center items-center">
            <div
                className={`w-[20px] h-[20px] border-[3px] ${borderColor} border-t-transparent rounded-full animate-spin`}
            />
        </div>
    );
};

export default Spinner;
