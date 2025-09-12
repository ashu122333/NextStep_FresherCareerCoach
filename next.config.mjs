/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        remotePatterns:[
            {
                protocol:"https",
                hostname:"randomuser.me"
            }
            ,{
                protocol:"https",
                hostname:"media.licdn.com"
            }
        ]
    }
};

export default nextConfig;
