const Footer = () => {
    return (
        <div className="w-full bg-white p-2 h-[50px] border-t">
            <p className="text-center text-xs ">
                This Solution has been developed by{" "}
                <a
                    className="text-primary font-semibold"
                    href="http://gbtsolutions.in/"
                    target="_blank"
                >
                    GBT Tech Solutions Private Limited
                </a>
                .
            </p>
            <p className="text-center text-xs">
                For any query please drop a mail to our softwere support team:
                <a
                    className="text-primary font-semibold"
                    href="mailto:softwere.support@gbtsolutions.in"
                >
                    {" "}
                    softwere.support@gbtsolutions.in
                </a>
            </p>
        </div>
    );
};

export default Footer;
