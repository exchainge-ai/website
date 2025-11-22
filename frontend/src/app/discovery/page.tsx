'use client';

import { useState } from 'react';
import { Plus, Filter, Send, X } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { containsProhibitedLanguage } from '@/lib/safety/profanity';

interface StickyPost {
  id: string;
  title: string;
  description: string;
  category: 'robotics' | 'autonomous_vehicles' | 'drone' | 'manipulation' | 'other';
  hardwareType: string;
  dataSize: string;
  author: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple';
  rotation: number;
  createdAt: Date;
}

interface DataRequest {
  id: string;
  title: string;
  description: string;
  category: 'robotics' | 'autonomous_vehicles' | 'drone' | 'manipulation' | 'other';
  requiredHardware: string;
  estimatedBudget: string;
  author: string;
  createdAt: Date;
  interested: number;
}

const DEMO_POSTS: StickyPost[] = [
  {
    id: '1',
    title: 'Boston Dynamics Atlas Motion Data',
    description: '500K frames of bipedal walking and manipulation tasks. Perfect for RL training.',
    category: 'robotics',
    hardwareType: 'Humanoid Robot',
    dataSize: '45GB',
    author: 'Alex Chen',
    color: 'yellow',
    rotation: -2,
    createdAt: new Date('2025-10-18'),
  },
  {
    id: '2',
    title: 'Tesla Autopilot Camera Feeds',
    description: 'Highway and urban driving data with object detection labels. 10k miles.',
    category: 'autonomous_vehicles',
    hardwareType: 'Tesla Model 3',
    dataSize: '250GB',
    author: 'Sarah M.',
    color: 'pink',
    rotation: 1.5,
    createdAt: new Date('2025-10-17'),
  },
  {
    id: '3',
    title: 'DJI Drone Thermal Imaging',
    description: 'Thermal + RGB dual-sensor data from agricultural surveying. 1000 flights.',
    category: 'drone',
    hardwareType: 'DJI Matrice 300',
    dataSize: '180GB',
    author: 'Marcus L.',
    color: 'blue',
    rotation: -1,
    createdAt: new Date('2025-10-16'),
  },
  {
    id: '4',
    title: 'Robotic Arm Manipulation',
    description: 'UR5 picking and placing household items. 50k successful grasps.',
    category: 'manipulation',
    hardwareType: 'UR Cobot',
    dataSize: '120GB',
    author: 'Nina R.',
    color: 'green',
    rotation: 0.5,
    createdAt: new Date('2025-10-15'),
  },
  {
    id: '5',
    title: 'Waymo Lidar Point Clouds',
    description: 'Raw Lidar data from urban driving. Perfect for 3D object detection.',
    category: 'autonomous_vehicles',
    hardwareType: 'Waymo Driver',
    dataSize: '320GB',
    author: 'Jordan K.',
    color: 'purple',
    rotation: 1,
    createdAt: new Date('2025-10-14'),
  },
];

const DEMO_REQUESTS: DataRequest[] = [
  {
    id: 'r1',
    title: 'Need: Robot Hand Manipulation Data',
    description: 'Looking for high-resolution hand manipulation data for RL training. Budget: $5K-10K.',
    category: 'manipulation',
    requiredHardware: 'Robotic Hand',
    estimatedBudget: '$5K - $10K',
    author: 'DeepMind Research',
    createdAt: new Date('2025-10-18'),
    interested: 3,
  },
  {
    id: 'r2',
    title: 'Seeking: Urban Driving Dataset',
    description: 'Need diverse urban driving data with weather variations. Commercial use license required.',
    category: 'autonomous_vehicles',
    requiredHardware: 'Car Camera System',
    estimatedBudget: '$20K - $50K',
    author: 'Waymo Labs',
    createdAt: new Date('2025-10-17'),
    interested: 8,
  },
  {
    id: 'r3',
    title: 'Want: Agricultural Drone Imagery',
    description: 'Thermal + RGB drone data from agricultural fields. Crop segmentation labels preferred.',
    category: 'drone',
    requiredHardware: 'Thermal Drone',
    estimatedBudget: '$3K - $8K',
    author: 'AgriTech Startup',
    createdAt: new Date('2025-10-16'),
    interested: 5,
  },
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'robotics', label: 'Robotics' },
  { value: 'autonomous_vehicles', label: 'Autonomous Vehicles' },
  { value: 'drone', label: 'Drones' },
  { value: 'manipulation', label: 'Manipulation' },
  { value: 'other', label: 'Other' },
];

const COLOR_MAP = {
  yellow: 'bg-yellow-100 shadow-md hover:shadow-lg',
  pink: 'bg-pink-100 shadow-md hover:shadow-lg',
  blue: 'bg-blue-100 shadow-md hover:shadow-lg',
  green: 'bg-green-100 shadow-md hover:shadow-lg',
  purple: 'bg-green-100 shadow-md hover:shadow-lg',
};

export default function DiscoveryHub() {
  const { authenticated, login } = usePrivy();
  const [posts, setPosts] = useState<StickyPost[]>(DEMO_POSTS);
  const [requests, setRequests] = useState<DataRequest[]>(DEMO_REQUESTS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'pinboard' | 'requests'>('pinboard');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  // Form state for new sticky post
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    category: 'robotics' as const,
    hardwareType: '',
    dataSize: '',
    author: 'Current User', // TODO: Get from auth context
  });

  // Form state for new data request
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: 'robotics' as const,
    requiredHardware: '',
    estimatedBudget: '',
    author: 'Current User', // TODO: Get from auth context
  });

  const filteredPosts =
    selectedCategory === 'all'
      ? posts
      : posts.filter((p) => p.category === selectedCategory);

  const openPostModal = () => {
    if (!authenticated) {
      login();
      return;
    }
    setShowNewPostModal(true);
  };

  const openRequestModal = () => {
    if (!authenticated) {
      login();
      return;
    }
    setShowNewRequestModal(true);
  };

  // Add new sticky post to pinboard
  const handlePostToBoard = () => {
    if (!newPost.title.trim() || !newPost.description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    if (
      [
        newPost.title,
        newPost.description,
        newPost.hardwareType,
        newPost.dataSize,
      ].some((value) => value && containsProhibitedLanguage(value))
    ) {
      alert('Please remove inappropriate language before posting.');
      return;
    }

    const colors: Array<'yellow' | 'pink' | 'blue' | 'green' | 'purple'> = ['yellow', 'pink', 'blue', 'green', 'purple'];
    const newStickyPost: StickyPost = {
      id: `user-${Date.now()}`,
      title: newPost.title,
      description: newPost.description,
      category: newPost.category,
      hardwareType: newPost.hardwareType || 'Not specified',
      dataSize: newPost.dataSize || 'TBD',
      author: newPost.author,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 4 - 2,
      createdAt: new Date(),
    };

    setPosts((prev) => [newStickyPost, ...prev]);
    setNewPost({
      title: '',
      description: '',
      category: 'robotics',
      hardwareType: '',
      dataSize: '',
      author: 'Current User',
    });
    setShowNewPostModal(false);
  };

  // Add new data request
  const handlePostRequest = () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    if (
      [
        newRequest.title,
        newRequest.description,
        newRequest.requiredHardware,
        newRequest.estimatedBudget,
      ].some((value) => value && containsProhibitedLanguage(value))
    ) {
      alert('Please remove inappropriate language before posting.');
      return;
    }

    const newDataRequest: DataRequest = {
      id: `req-${Date.now()}`,
      title: newRequest.title,
      description: newRequest.description,
      category: newRequest.category,
      requiredHardware: newRequest.requiredHardware || 'Not specified',
      estimatedBudget: newRequest.estimatedBudget || 'TBD',
      author: newRequest.author,
      createdAt: new Date(),
      interested: 0,
    };

    setRequests((prev) => [newDataRequest, ...prev]);
    setNewRequest({
      title: '',
      description: '',
      category: 'robotics',
      requiredHardware: '',
      estimatedBudget: '',
      author: 'Current User',
    });
    setShowNewRequestModal(false);
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-brand-green-light rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 sticky top-0 bg-gray-900/80 backdrop-blur-md border-b border-gray-700 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Discovery Hub
              </h1>
              <p className="text-gray-400 mt-2">
                Explore upcoming datasets and submit your data needs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openPostModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <Plus className="w-5 h-5" />
                {authenticated ? 'Signal Dataset' : 'Sign In to Signal'}
              </button>
              <button
                onClick={openRequestModal}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all border border-gray-700"
              >
                <Send className="w-5 h-5" />
                {authenticated ? 'Post Request' : 'Sign In to Request'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('pinboard')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'pinboard'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Pinboard ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'requests'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Data Requests ({requests.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="relative z-10 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Hardware Type</label>
                  <select className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm">
                    <option>All Hardware</option>
                    <option>Humanoid Robot</option>
                    <option>Autonomous Vehicle</option>
                    <option>Drone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Data Size</label>
                  <select className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm">
                    <option>Any Size</option>
                    <option>&lt; 50GB</option>
                    <option>50GB - 200GB</option>
                    <option>&gt; 200GB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Posted</label>
                  <select className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm">
                    <option>All Time</option>
                    <option>Last 7 Days</option>
                    <option>Last 24 Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Status</label>
                  <select className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm">
                    <option>All</option>
                    <option>Available</option>
                    <option>Coming Soon</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'pinboard' ? (
            <>
              {/* Pinboard View */}
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-12">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">{filteredPosts.length}</div>
                  <div className="text-sm text-gray-400">Datasets Posted</div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {(filteredPosts.reduce((acc, p) => acc + parseFloat(p.dataSize), 0)).toFixed(0)}
                    GB
                  </div>
                  <div className="text-sm text-gray-400">Data Available</div>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-brand-green-light">{filteredPosts.length * 50}</div>
                  <div className="text-sm text-gray-400">Community Members</div>
                </div>
              </div>

              {/* Pinboard - Masonry layout with sticky notes */}
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`break-inside-avoid ${COLOR_MAP[post.color]} rounded-lg p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl`}
                    style={{
                      transform: `rotate(${post.rotation}deg)`,
                    }}
                  >
                    {/* Pin indicator */}
                    <div className="flex justify-center -mt-12 mb-4">
                      <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg"></div>
                    </div>

                    <div className="space-y-3">
                      {/* Category badge */}
                      <div className="inline-block">
                        <span className="text-xs font-semibold bg-gray-700 text-gray-100 px-2 py-1 rounded">
                          {CATEGORIES.find((c) => c.value === post.category)?.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{post.title}</h3>

                      {/* Description */}
                      <p className="text-sm text-gray-800 line-clamp-3">{post.description}</p>

                      {/* Details */}
                      <div className="space-y-2 pt-2 border-t border-gray-300/50">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-700">
                            <strong>Hardware:</strong> {post.hardwareType}
                          </span>
                          <span className="text-gray-700">
                            <strong>Size:</strong> {post.dataSize}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs font-medium text-gray-700">— {post.author}</span>
                          <button className="text-xs bg-gray-700 text-gray-100 hover:bg-gray-800 px-3 py-1 rounded transition-colors">
                            Interested
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty state */}
              {filteredPosts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-lg">No datasets in this category yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Be the first to post!</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Requests View */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:border-gray-600 hover:shadow-lg transition-all"
                  >
                    {/* Category badge */}
                    <div className="inline-block mb-3">
                      <span className="text-xs font-semibold bg-amber-900 text-amber-200 px-2 py-1 rounded">
                        {CATEGORIES.find((c) => c.value === request.category)?.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2">{request.title}</h3>

                    {/* Description */}
                    <p className="text-sm text-gray-300 mb-4">{request.description}</p>

                    {/* Details */}
                    <div className="space-y-2 mb-4 py-3 border-t border-b border-gray-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Hardware:</span>
                        <span className="text-gray-200">{request.requiredHardware}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-green-400 font-semibold">{request.estimatedBudget}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">By {request.author}</span>
                        <span className="text-xs text-gray-500">{request.interested} interested</span>
                      </div>
                      <button
                        onClick={() => {
                          if (!authenticated) {
                            login();
                          } else {
                            alert('Interest submitted! You will be notified when this request is fulfilled.');
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        {authenticated ? 'Interested' : 'Sign In'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty state */}
              {requests.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-lg">No data requests at the moment.</p>
                  <p className="text-gray-500 text-sm mt-2">Check back later or post your own dataset!</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CTA Footer */}
      <div className="relative z-10 border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Share Your Data?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the community as an early contributor. Post your physical AI datasets and help shape the future of the marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={openPostModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
            >
              Signal a Dataset
            </button>
            <button
              onClick={openRequestModal}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-all border border-gray-600"
            >
              Post a Request
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            Early contributors get featured placement and priority support
          </p>
        </div>
      </div>
    </div>

    {showNewPostModal && (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
        <div className="w-full max-w-2xl bg-[#1a2332] border border-gray-700 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
            <div>
              <h3 className="text-xl font-semibold text-white">Signal an Upcoming Dataset</h3>
              <p className="text-sm text-gray-400 mt-1">
                Float an unverified dataset you may publish soon and see who&apos;s interested.
              </p>
            </div>
            <button
              onClick={() => setShowNewPostModal(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                value={newPost.title}
                onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Headline for your potential dataset drop"
                className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newPost.description}
                onChange={(e) => setNewPost((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the dataset you might release and what makes it valuable."
                rows={4}
                className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Category and Hardware Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newPost.category}
                  onChange={(e) =>
                    setNewPost((prev) => ({ ...prev, category: e.target.value as typeof prev.category }))
                  }
                  className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {CATEGORIES.filter((c) => c.value !== 'all').map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hardware Type
                </label>
                <input
                  value={newPost.hardwareType}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, hardwareType: e.target.value }))}
                  placeholder="e.g. Humanoid robot rig"
                  className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Data Size and Author/Org */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Approx. Data Size
                </label>
                <input
                  value={newPost.dataSize}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, dataSize: e.target.value }))}
                  placeholder="e.g. ~250GB"
                  className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name / Org
                </label>
                <input
                  value={newPost.author}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder="Visible to people browsing"
                  className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-[#0f1824]">
            <button
              onClick={() => setShowNewPostModal(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePostToBoard}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Signal Dataset Drop
            </button>
          </div>
        </div>
      </div>
    )}

    {showNewRequestModal && (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
        <div className="w-full max-w-2xl bg-[#1a2332] border border-gray-700 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
            <div>
              <h3 className="text-xl font-semibold text-white">Post a Data Request</h3>
              <p className="text-sm text-gray-400 mt-1">
                Let the community know what data you&apos;re searching for and your ideal budget.
              </p>
            </div>
            <button
              onClick={() => setShowNewRequestModal(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                value={newRequest.title}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Request title"
                className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the dataset you need"
                rows={4}
                className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Category and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={newRequest.category}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      category: e.target.value as typeof prev.category,
                    }))
                  }
                  className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {CATEGORIES.filter((c) => c.value !== 'all').map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estimated Budget
                </label>
                <input
                  value={newRequest.estimatedBudget}
                  onChange={(e) =>
                    setNewRequest((prev) => ({ ...prev, estimatedBudget: e.target.value }))
                  }
                  placeholder="e.g. $5K - $10K"
                  className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Hardware and Author/Org */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Required Hardware
                </label>
                <input
                  value={newRequest.requiredHardware}
                  onChange={(e) =>
                    setNewRequest((prev) => ({ ...prev, requiredHardware: e.target.value }))
                  }
                  placeholder="e.g. Robotic Hand"
                  className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name / Org
                </label>
                <input
                  value={newRequest.author}
                  onChange={(e) => setNewRequest((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder="Visible to people browsing"
                  className="w-full bg-[#0f1824] border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-[#0f1824]">
            <button
              onClick={() => setShowNewRequestModal(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePostRequest}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
