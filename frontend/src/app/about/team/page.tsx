export default function TeamPage() {
  const teamMembers = [
    {
      name: "Brandon Smith",
      role: "CEO",
      expertise: "20+ years experience at PwC & GE and repeat startup exits (Animoca Brands, Notion Capital)",
      image: "/photo_2025-10-25_15-34-15.jpg",
    },
    {
      name: "Luca Trevisani",
      role: "CSO",
      expertise: "AI and blockchain expert is the leading voices in physical AI in Brazil. Crypto since 2018",
      image: "/uploads/luca.png",
    },
    {
      name: "Ricardo Tavarez",
      role: "CTO",
      expertise: "Blockchain Engineer, co-founded NodeKit (a16z CSX '24), built shared block builder + MEV infrastructure to enable cross-chain composability and unify liquidity across rollups.",
      image: "/photo_2025-10-25_15-34-33.jpg",
    },
    {
      name: "Milind Choudhary",
      role: "Head of AI",
      expertise: "AI & Robotics Researcher · Master of Science in Data Science · Full-stack GenAI builder",
      image: "/uploads/c1faf9a1-9601-4821-8770-72b5c51e5eaf.png",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Team</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experienced builders in AI, robotics, and blockchain working to make data collection simple and profitable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 text-center border border-gray-700"
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-brand-green/20"
              />
              <h3 className="text-xl font-semibold text-white mb-2">
                {member.name}
              </h3>
              <p className="text-brand-green font-semibold mb-3">
                {member.role}
              </p>
              <p className="text-gray-300 text-xs leading-relaxed">
                {member.expertise}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
