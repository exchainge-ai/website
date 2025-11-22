"use client";

const TeamSection = () => {
  const teamMembers = [
    {
      name: "Brandon Smith",
      title: "Co-Founder & CEO",
      subtitle:
        "A repeat founder with exits including a sale to Animoca Brands",
      description:
        "Leading research on LiDAR + stereo camera simulation for BICA 2025 (top AI conference). Built digital twins in Unreal Engine 5 using ROS, Velodyne LiDAR, and ZED 2i sensors. Created FinBot AI — a GenAI financial research assistant. 2.5+ years as a Data Analyst managing BI systems for 1000+ employees.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=BrandonSmith",
      color: "green",
    },
    {
      name: "Ricardo Tavarez",
      title: "Co-Founder & CTO",
      subtitle: "ex-NodeKit",
      description:
        "Blockchain x AI Developer",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=RicardoTavarez",
      color: "blue",
    },
    {
      name: "Luca Trevisani",
      title: "Co-Founder & CSO",
      subtitle: "Crypto-Native Strategist",
      description:
        "Made his first cold wallet Bitcoin transaction at age 13 • Conceived and co-developed ExchAInge's product vision and go-to-market strategy • Early contributor to FlipVault's strategic roadmap and product development.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=LucaTrevisani",
      color: "cyan",
    },
    {
      name: "Milind Choudhary",
      title: "Head of AI",
      subtitle:
        "AI & Robotics Researcher · MS in Data Science · Full-Stack GenAI Builder",
      description:
        "Leading research on LiDAR + stereo camera simulation for BICA 2025 (top AI conference). Built digital twins in Unreal Engine 5 using ROS, Velodyne LiDAR, and ZED 2i sensors. Created FinBot AI — a GenAI financial research assistant. 2.5+ years as a Data Analyst managing BI systems for 1000+ employees.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=MilindChoudhary",
      color: "green",
    },
  ];

  return (
    <div className="bg-gray-800 py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Meet Our Team
          </h2>
          <p className="text-xl text-gray-300">
            The experts behind the platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => {
            return (
              <div
                key={member.name}
                className={`bg-gray-700 rounded-2xl p-8 transition-all duration-500 transform hover:scale-105 text-center border border-gray-600 hover:border-${member.color}-500`}
              >
                <div className="w-32 h-32 mx-auto mb-6 relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover shadow-xl border-2 border-gray-500 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {member.name}
                </h3>
                <p className={`text-${member.color}-400 font-semibold mb-2`}>
                  {member.title}
                </p>
                <p className="text-gray-300 font-medium mb-4 text-sm">
                  {member.subtitle}
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {member.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeamSection;
